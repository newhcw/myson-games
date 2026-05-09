import { ref, type Ref, type ShallowRef } from 'vue'
import * as THREE from 'three'
import type { ViewAngles } from './useGameContext'
import { useWeaponStore } from '@/stores/weapon'
import { useBuffsStore } from '@/stores/buffs'
import { soundManager } from '@/game/sound/SoundManager'
import { PlayerRocketManager } from '@/game/player-rocket/PlayerRocketManager'
import { RpgExplosion } from '@/game/player-rocket/RpgExplosion'

export interface ShootingDeps {
  camera: ShallowRef<THREE.PerspectiveCamera | null>
  scene: ShallowRef<THREE.Scene | null>
  playerPosition: THREE.Vector3
  viewAngles: ViewAngles
  enemyManagerRef: Ref<any>
  isHoldingBreath: Ref<boolean>
  breathStamina: Ref<number>
  currentSpread: Ref<number>
  applyRecoil: (weapon: any) => void
  startCameraShake: (duration?: number, intensity?: number) => void
}

export function useShooting(deps: ShootingDeps) {
  const {
    camera,
    scene,
    playerPosition,
    viewAngles,
    enemyManagerRef,
    isHoldingBreath,
    breathStamina,
    currentSpread,
    applyRecoil,
    startCameraShake,
  } = deps

  const weaponStore = useWeaponStore()
  const buffsStore = useBuffsStore()

  const lastFireTime = ref(0)
  const isFiring = ref(false)
  let rocketManager: PlayerRocketManager | null = null

  // RPG explosion diagnostics
  let lastRpgExplosion: { x: number; z: number; enemiesInRange: number; totalEnemies: number } | null = null

  const fire = () => {
    const weapon = weaponStore.currentWeapon
    if (!weapon) return

    const now = Date.now()
    const fireInterval = 1000 / weapon.fireRate
    if (now - lastFireTime.value < fireInterval) return
    lastFireTime.value = now

    const ammo = weaponStore.currentAmmo

    if (ammo.current <= 0 || weaponStore.isReloading) {
      soundManager.playEmpty()
      return
    }

    const fired = weaponStore.fire()
    if (fired) {
      applyRecoil(weapon)

      if (weapon.type === 'rpg') {
        fireRocket()
        startCameraShake(0.1, 0.03)
      } else {
        performRaycast()
      }
      soundManager.playShoot()
    } else {
      soundManager.playEmpty()
    }
  }

  const startFiring = () => {
    isFiring.value = true
    fire()
  }

  const stopFiring = () => {
    isFiring.value = false
  }

  const fireRocket = () => {
    if (!camera.value) return

    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.value.quaternion)
    const origin = camera.value.position.clone()
    origin.y -= 0.1

    rocketManager?.spawn({
      origin,
      direction,
      speed: 650,
    })
  }

  const performRaycast = () => {
    if (!camera.value || !scene.value) return

    let spread = currentSpread.value
    if (isHoldingBreath.value && breathStamina.value > 0) {
      spread *= 0.2
    }
    const spreadRad = (spread * Math.PI) / 180
    const randomAngle = Math.random() * Math.PI * 2
    const randomRadius = Math.random() * spreadRad
    const offsetX = Math.cos(randomAngle) * randomRadius
    const offsetY = Math.sin(randomAngle) * randomRadius

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(offsetX, offsetY), camera.value)

    const enemyGroup = scene.value.getObjectByName('enemies')
    if (enemyGroup && enemyManagerRef.value) {
      const intersects = raycaster.intersectObjects(enemyGroup.children, true)

      for (const intersect of intersects) {
        let object: THREE.Object3D | null = intersect.object
        while (object && object.parent !== enemyGroup) {
          object = object.parent
        }

        if (object && object.userData) {
          const enemy = enemyManagerRef.value?.getActiveEnemies().find((e: any) => e.mesh === object)
          if (enemy && !enemy.isDead) {
            let damage = weaponStore.currentWeapon?.damage || 10
            if (buffsStore.hasBuff('doubleDamage')) {
              damage *= 2
            }
            enemyManagerRef.value?.onEnemyHit(enemy.id, damage)

            createHitEffect(intersect.point)
            break
          }
        }
      }
    }
  }

  const createHitEffect = (position: THREE.Vector3) => {
    if (!scene.value) return

    const particles = new THREE.Group()
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })

    for (let i = 0; i < 10; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone())
      particle.position.copy(position)

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      )

      particles.add(particle)

      const animate = () => {
        particle.position.add(velocity.clone().multiplyScalar(0.05))
        velocity.multiplyScalar(0.95)

        if (velocity.length() > 0.01) {
          requestAnimationFrame(animate)
        } else {
          particles.remove(particle)
          particle.geometry.dispose()
          ;(particle.material as THREE.Material).dispose()
        }
      }

      animate()
    }

    scene.value.add(particles)

    setTimeout(() => {
      scene.value?.remove(particles)
      particles.clear()
    }, 1000)
  }

  const handleRocketExplosion = (position: THREE.Vector3) => {
    if (!enemyManagerRef.value || !scene.value) {
      console.warn('handleRocketExplosion: enemyManagerRef or scene is null', !!enemyManagerRef.value, !!scene.value)
      return
    }

    showRpgBoomEffect(position)

    const radius = 20
    const maxDamage = 150
    const minDamage = 50

    const enemies = enemyManagerRef.value.getActiveEnemies() || []
    let enemiesInRange = 0

    for (const enemy of enemies) {
      if (enemy.isDead) continue

      const dx = enemy.position.x - position.x
      const dz = enemy.position.z - position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist <= radius) {
        enemiesInRange++
        const damage = Math.round(maxDamage - (dist / radius) * (maxDamage - minDamage))
        const finalDamage = Math.max(minDamage, Math.min(maxDamage, damage))

        enemyManagerRef.value?.onEnemyHit(enemy.id, finalDamage)

        if (enemy.mesh) {
          setTimeout(() => {
            if (enemy.mesh) {
              RpgExplosion.createKnockback(enemy.mesh, enemy.isDead)
            }
          }, 50)
        }
      } else if (enemy.mesh) {
        const knockDist = radius + 1
        if (dist <= knockDist && !enemy.isDead) {
          setTimeout(() => {
            if (enemy.mesh) {
              RpgExplosion.createKnockback(enemy.mesh, false)
            }
          }, 80)
        }
      }
    }

    lastRpgExplosion = {
      x: position.x,
      z: position.z,
      enemiesInRange,
      totalEnemies: enemies.length,
    }
  }

  const showRpgBoomEffect = (position: THREE.Vector3) => {
    if (!camera.value) return

    const vector = position.clone().project(camera.value)
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight

    const boom = document.createElement('div')
    boom.textContent = 'BOOM!'
    boom.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #FF4444;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 30px rgba(255,68,68,0.8);
      z-index: 1002;
      pointer-events: none;
      font-family: Arial, sans-serif;
      animation: boomEffect 1s ease-out forwards;
    `

    if (!document.getElementById('boom-animation')) {
      const style = document.createElement('style')
      style.id = 'boom-animation'
      style.textContent = `
        @keyframes boomEffect {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.5) rotate(5deg); }
          40% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) translateY(-50px); }
        }
      `
      document.head.appendChild(style)
    }

    const container = document.getElementById('game-ui') || document.body
    container.appendChild(boom)

    setTimeout(() => boom.remove(), 1000)
  }

  const initRocketManager = (sceneObj: THREE.Scene) => {
    rocketManager = new PlayerRocketManager()
    rocketManager.setScene(sceneObj)
    rocketManager.setOnExplosion((pos) => {
      handleRocketExplosion(pos)
    })
    rocketManager.setEnemyProvider(() => {
      if (!enemyManagerRef.value) return []
      const enemies = enemyManagerRef.value.getActiveEnemies() || []
      return enemies.map((e: any) => ({ position: e.position, isDead: e.isDead }))
    })
  }

  const updateAutoFire = (delta: number) => {
    if (!isFiring.value) return

    const weapon = weaponStore.currentWeapon
    if (!weapon || !weapon.isAuto) return

    void delta

    const now = Date.now()
    const fireInterval = 1000 / weapon.fireRate
    if (now - lastFireTime.value >= fireInterval) {
      fire()
    }
  }

  const update = (delta: number) => {
    updateAutoFire(delta)

    if (rocketManager) {
      rocketManager.update(delta, playerPosition)
    }
  }

  const reset = () => {
    isFiring.value = false
    lastFireTime.value = 0
    rocketManager?.clear()
  }

  const dispose = () => {
    rocketManager?.clear()
    rocketManager = null
    lastRpgExplosion = null
  }

  return {
    isFiring,
    fire,
    startFiring,
    stopFiring,
    fireRocket,
    rocketManager: { get: () => rocketManager },
    update,
    updateAutoFire,
    initRocketManager,
    handleRocketExplosion,
    reset,
    dispose,
  }
}
