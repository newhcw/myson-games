<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'
import EnemyManager from '@/components/game/EnemyManager.vue'
import { collisionDetector } from '@/game/utils/Collision'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { DEFAULT_WEAPONS } from '@/game/weapons/types'
import { soundManager } from '@/game/sound/SoundManager'
import { damageFeedback } from '@/game/ui/DamageFeedback'
import DeathScreen from '@/game/ui/DeathScreen.vue'
import { PlayerRocketManager } from '@/game/player-rocket/PlayerRocketManager'
import { RpgExplosion } from '@/game/player-rocket/RpgExplosion'

const router = useRouter()
const isLoading = ref(true)
const containerRef = ref<HTMLDivElement | null>(null)

// Stores
const weaponStore = useWeaponStore()
const gameStore = useGameStore()

// Three.js objects
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationId: number = 0

// Player state
const playerPosition = new THREE.Vector3(0, 1.6, 0)
const moveSpeed = 5
const keys = { w: false, a: false, s: false, d: false }

// Shooting state
const lastFireTime = ref(0)
const isFiring = ref(false)

// Rocket manager
let rocketManager: PlayerRocketManager | null = null

// Camera shake for RPG effect
const cameraShake = ref({
  active: false,
  startTime: 0,
  duration: 0.1,
  intensity: 0.03,
  originalPositions: [] as number[],
})

// Mouse look
let yaw = 0
let pitch = 0

// Computed
const currentWeaponName = computed(() => {
  const weapon = weaponStore.currentWeapon
  return weapon?.name || '未知武器'
})

const ammoDisplay = computed(() => {
  const ammo = weaponStore.currentAmmo
  const weapon = weaponStore.currentWeapon
  if (!weapon) return '0 / 0'
  return `${ammo.current} / ${ammo.reserve}`
})

const healthPercent = computed(() => {
  return (gameStore.health / 100) * 100 // 最大血量是100
})

const isReloading = computed(() => weaponStore.isReloading)
const currentWeaponIndex = computed(() => weaponStore.currentWeaponIndex)

const onSceneReady = (
  sceneObj: THREE.Scene,
  cameraObj: THREE.PerspectiveCamera,
  rendererObj: THREE.WebGLRenderer
) => {
  scene = sceneObj
  camera = cameraObj
  renderer = rendererObj

  // 初始化火箭管理器
  rocketManager = new PlayerRocketManager()
  rocketManager.setScene(sceneObj)
  rocketManager.setOnExplosion((pos) => {
    handleRocketExplosion(pos)
  })
  // 设置敌人位置提供器：火箭飞行时检测敌人接近
  rocketManager.setEnemyProvider(() => {
    if (!enemyManagerRef.value) return []
    const enemies = enemyManagerRef.value.getActiveEnemies() || []
    return enemies.map((e: any) => ({ position: e.position, isDead: e.isDead }))
  })

  // Add some obstacles
  createObstacles()

  isLoading.value = false
}

// 敌人管理器引用（使用 ref 以便模板 ref 自动绑定）
const enemyManagerRef = ref<any>(null)

// 处理玩家被击中
const onPlayerHit = (damage: number) => {
  gameStore.takeDamage(damage)
  soundManager.playHit()
  // 显示伤害反馈
  damageFeedback.showDamageEffect(damage)
  damageFeedback.showDamageNumber(damage)
}

// 处理敌人被击杀
const onEnemyKilled = (_enemyId: string, score: number) => {
  gameStore.addKill()
  gameStore.addScore(score)
  // 暂时使用击中音效代替击杀音效
  soundManager.playHit()
}

const createObstacles = () => {
  if (!scene) return

  // Create some boxes as obstacles
  const boxGeometry = new THREE.BoxGeometry(2, 2, 2)
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })

  const positions = [
    { x: -5, z: -5 },
    { x: 5, z: -8 },
    { x: -8, z: 3 },
    { x: 8, z: 5 },
    { x: 0, z: -12 },
  ]

  positions.forEach((pos) => {
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.position.set(pos.x, 1, pos.z)
    box.castShadow = true
    box.receiveShadow = true
    scene!.add(box)
    // 添加碰撞体
    collisionDetector.addCollider(box)
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Ignore if not in game
  if (document.pointerLockElement !== containerRef.value) return

  switch (e.key.toLowerCase()) {
    // Movement
    case 'w': keys.w = true; break
    case 'a': keys.a = true; break
    case 's': keys.s = true; break
    case 'd': keys.d = true; break
    // Weapon switching (1-6)
    case '1': weaponStore.switchWeapon(0); break
    case '2': weaponStore.switchWeapon(1); break
    case '3': weaponStore.switchWeapon(2); break
    case '4': weaponStore.switchWeapon(3); break
    case '5': weaponStore.switchWeapon(4); break
    case '6': weaponStore.switchWeapon(5); break
    // Cycle weapon (Q)
    case 'q': weaponStore.cycleWeapon(); break
    // Reload (R)
    case 'r': weaponStore.reload(); break
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = false; break
    case 'a': keys.a = false; break
    case 's': keys.s = false; break
    case 'd': keys.d = false; break
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (document.pointerLockElement !== containerRef.value) return

  const sensitivity = 0.002
  yaw -= e.movementX * sensitivity
  pitch -= e.movementY * sensitivity
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))

  if (camera) {
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }
}

const handleClick = async () => {
  if (!containerRef.value) return

  // First click: lock pointer
  if (document.pointerLockElement !== containerRef.value) {
    try {
      await containerRef.value.requestPointerLock()
      // Initialize audio context on user interaction
      soundManager.resume()
    } catch (err) {
      console.error('Failed to lock pointer:', err)
    }
  }
}

// Handle mouse down for shooting
const handleMouseDown = (e: MouseEvent) => {
  if (document.pointerLockElement !== containerRef.value) return

  if (e.button === 0) {
    // Left click: fire
    isFiring.value = true
    fire()
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (e.button === 0) {
    isFiring.value = false
  }
}

// Handle right click for scope
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  if (document.pointerLockElement !== containerRef.value) return
  weaponStore.toggleScope()
}

// Fire weapon
const fire = () => {
  const weapon = weaponStore.currentWeapon
  if (!weapon) return

  const now = Date.now()
  // Check fire rate
  const fireInterval = 1000 / weapon.fireRate
  if (now - lastFireTime.value < fireInterval) return
  lastFireTime.value = now

  const ammo = weaponStore.currentAmmo

  // Check if has ammo
  if (ammo.current <= 0 || weaponStore.isReloading) {
    // Play empty click sound
    soundManager.playEmpty()
    return
  }

  // Attempt to fire (checks ammo and reload state)
  const fired = weaponStore.fire()
  if (fired) {
    // RPG 武器：发射火箭弹道
    if (weapon.type === 'rpg') {
      fireRocket()
      // 屏幕震动效果
      startCameraShake(0.1, 0.03)
    } else {
      // Perform raycast to check for enemy hits
      performRaycast()
    }
    // Play fire sound
    soundManager.playShoot()
  } else {
    // Play empty click if no ammo
    soundManager.playEmpty()
  }
}

// RPG 火箭发射
const fireRocket = () => {
  if (!camera || !scene || !rocketManager) return

  // 获取发射方向（相机朝向）
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const origin = camera.position.clone()

  // 略微抬高发射起点（火箭从胸口位置发射）
  origin.y -= 0.1

  rocketManager.spawn({
    origin,
    direction,
    speed: 650,
  })
}

// 屏幕震动效果
const startCameraShake = (duration = 0.1, intensity = 0.03) => {
  if (!camera) return
  cameraShake.value = {
    active: true,
    startTime: Date.now(),
    duration,
    intensity,
    originalPositions: [camera.position.x, camera.position.y, camera.position.z],
  }
}

// 游戏循环中更新相机震动位置
const updateCameraForShake = () => {
  if (!camera || !cameraShake.value.active) return false

  const now = Date.now()
  const shake = cameraShake.value
  const elapsed = (now - shake.startTime) / 1000

  if (elapsed >= shake.duration) {
    cameraShake.value.active = false
    camera.position.set(
      shake.originalPositions[0],
      shake.originalPositions[1],
      shake.originalPositions[2]
    )
    return false
  }

  const progress = elapsed / shake.duration
  // 震动强度随时间减弱
  const currentIntensity = shake.intensity * (1 - progress)
  // 生成随机偏移
  const offsetX = (Math.random() - 0.5) * 2 * currentIntensity
  const offsetY = (Math.random() - 0.5) * 2 * currentIntensity * 0.5 // 垂直偏移较小

  camera.position.set(
    shake.originalPositions[0] + offsetX,
    shake.originalPositions[1] + offsetY,
    shake.originalPositions[2]
  )

  return true
}

// RPG 爆炸特效文字（BOOM!）
const showRpgBoomEffect = (position: THREE.Vector3) => {
  if (!camera) return

  const vector = position.clone().project(camera)
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

// 诊断：最近一次 RPG 爆炸信息
let lastRpgExplosion: { x: number; z: number; enemiesInRange: number; totalEnemies: number } | null = null

// RPG 火箭爆炸处理（AOE 伤害 + 弹飞效果）
const handleRocketExplosion = (position: THREE.Vector3) => {
  if (!enemyManagerRef.value || !scene) {
    console.warn('handleRocketExplosion: enemyManagerRef or scene is null', !!enemyManagerRef.value, !!scene)
    return
  }

  // 显示RPG爆炸特效
  showRpgBoomEffect(position)

  const radius = 20
  const maxDamage = 150
  const minDamage = 50

  // 获取所有活跃敌人
  const enemies = enemyManagerRef.value.getActiveEnemies() || []
  let enemiesInRange = 0

  for (const enemy of enemies) {
    if (enemy.isDead) continue

    // 计算敌人与爆炸中心的距离（xz 平面）
    const dx = enemy.position.x - position.x
    const dz = enemy.position.z - position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist <= radius) {
      enemiesInRange++
      // 线性衰减伤害
      const damage = Math.round(maxDamage - (dist / radius) * (maxDamage - minDamage))
      const finalDamage = Math.max(minDamage, Math.min(maxDamage, damage))

      // 应用伤害
      enemyManagerRef.value?.onEnemyHit(enemy.id, finalDamage)

      // 弹飞效果
      if (enemy.mesh) {
        // 爆炸后稍延迟弹飞（让爆炸特效先出现）
        setTimeout(() => {
          if (enemy.mesh) {
            RpgExplosion.createKnockback(enemy.mesh, enemy.isDead)
          }
        }, 50)
      }
    } else if (enemy.mesh) {
      // 范围外但靠近的敌人也轻微弹飞（纯视觉效果）
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

  // 记录诊断信息
  lastRpgExplosion = {
    x: position.x,
    z: position.z,
    enemiesInRange,
    totalEnemies: enemies.length,
  }
}

// 射击检测
const performRaycast = () => {
  if (!camera || !scene) return

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

  // 检测场景中的敌人
  const enemyGroup = scene.getObjectByName('enemies')
  if (enemyGroup && enemyManagerRef.value) {
    const intersects = raycaster.intersectObjects(enemyGroup.children, true)

    // 找到第一个命中的敌人
    for (const intersect of intersects) {
      // 找到敌人的根对象
      let object: THREE.Object3D | null = intersect.object
      while (object && object.parent !== enemyGroup) {
        object = object.parent
      }

      if (object && object.userData) {
        // 检查是否是敌人
        const enemy = enemyManagerRef.value?.getActiveEnemies().find((e: any) => e.mesh === object)
        if (enemy && !enemy.isDead) {
          const damage = weaponStore.currentWeapon?.damage || 10
          enemyManagerRef.value?.onEnemyHit(enemy.id, damage)

          // 播放击中特效
          createHitEffect(intersect.point)
          break
        }
      }
    }
  }
}

// 创建击中特效
const createHitEffect = (position: THREE.Vector3) => {
  if (!scene) return

  // 创建粒子效果
  const particles = new THREE.Group()
  const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })

  for (let i = 0; i < 10; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone())
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    )

    particles.add(particle)

    // 动画
    const animate = () => {
      particle.position.add(velocity.clone().multiplyScalar(0.05))
      velocity.multiplyScalar(0.95) // 减速

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

  scene.add(particles)

  // 1秒后自动清理
  setTimeout(() => {
    scene?.remove(particles)
    particles.clear()
  }, 1000)
}

// Auto fire while holding
const updateAutoFire = (delta: number) => {
  if (!isFiring.value) return

  const weapon = weaponStore.currentWeapon
  if (!weapon || !weapon.isAuto) return

  // Keep TypeScript happy
  void delta

  const now = Date.now()
  const fireInterval = 1000 / weapon.fireRate
  if (now - lastFireTime.value >= fireInterval) {
    fire()
  }
}

const updateMovement = (delta: number) => {
  if (!camera) return

  const direction = new THREE.Vector3()

  if (keys.w) direction.z -= 1
  if (keys.s) direction.z += 1
  if (keys.a) direction.x -= 1
  if (keys.d) direction.x += 1

  if (direction.length() > 0) {
    direction.normalize()
    direction.applyQuaternion(camera.quaternion)
    direction.y = 0
    direction.normalize()

    // 在移动前保存当前位置
    const newPosition = playerPosition.clone()
    newPosition.x += direction.x * moveSpeed * delta
    newPosition.z += direction.z * moveSpeed * delta

    // 检查移动后的新位置是否与障碍物发生碰撞
    if (!collisionDetector.checkCollision(newPosition)) {
      playerPosition.copy(newPosition)
    }
  }

  camera.position.copy(playerPosition)
}

let lastTime = performance.now()

const gameLoop = () => {
  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  updateMovement(delta)
  updateAutoFire(delta)

  // 更新敌人管理器
  if (enemyManagerRef.value) {
    enemyManagerRef.value?.update(delta)
  }

  // 更新火箭管理器
  if (rocketManager) {
    rocketManager.update(delta, playerPosition)
  }

  // 更新屏幕震动
  if (cameraShake.value.active) {
    updateCameraForShake()
  }

  // Update scope FOV
  if (camera && weaponStore.currentScope.isActive) {
    const targetFov = weaponStore.currentScope.originalFov / weaponStore.currentScope.magnification
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1)
    camera.updateProjectionMatrix()
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }

  animationId = requestAnimationFrame(gameLoop)
}

const exitGame = () => {
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  router.push({ name: 'Home' })
}

// 死亡界面相关
const showDeathScreen = computed(() => gameStore.isDead)

const onRestart = () => {
  // 重置游戏状态
  gameStore.fullReset()
  // 重置玩家位置
  playerPosition.set(0, 1.6, 0)
  // 重置视角
  yaw = 0
  pitch = 0
  if (camera) {
    camera.rotation.set(0, 0, 0)
  }
}

const onGoHome = () => {
  exitGame()
}

// Track previous states for sound effects
let previousReloadState = false
let previousScopeActive = false

// Watch reload state to play sound
watch(isReloading, (newVal) => {
  if (newVal === true && previousReloadState === false) {
    // Started reloading
    soundManager.playReload()
  }
  previousReloadState = newVal
})

// Watch scope state to play sound
watch(() => weaponStore.currentScope.isActive, (newVal) => {
  if (newVal !== previousScopeActive) {
    soundManager.playScope()
    previousScopeActive = newVal
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  containerRef.value?.addEventListener('contextmenu', handleContextMenu)

  // Start game loop after a brief delay to ensure scene is loaded
  setTimeout(() => {
    lastTime = performance.now() // 重置时间基准，避免首帧 delta 过大
    gameLoop()
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  containerRef.value?.removeEventListener('contextmenu', handleContextMenu)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.dispose()
  }

  // 清理火箭管理器
  rocketManager?.clear()
})


// ==============================================
// 👇 👇 👇 从这里开始复制，全部粘贴进去 👇 👇 👇
// ==============================================
// ==============================================
// 修复版：无 process.env，直接兼容你的项目
// ==============================================
onMounted(() => {
  // @ts-ignore 挂载全局测试 API
  window.__testApi = {
    // 获取所有活跃敌人
    getEnemies: () => {
      if (!enemyManagerRef.value) return []
      return enemyManagerRef.value.getActiveEnemies() || []
    },

    // 射击指定索引敌人
    shootEnemy: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false

      // 造成大量伤害，直接击杀
      enemyManagerRef.value.onEnemyHit(enemy.id, 999)
      return true
    },

    // 手动触发敌人受伤效果
    hitEnemy: (index: number, damage: number = 10) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false

      enemyManagerRef.value.onEnemyHit(enemy.id, damage)
      return true
    },

    // 获取血条数量（通过 EnemyAI）
    getHealthBars: () => {
      if (!enemyManagerRef.value) return []
      const count = enemyManagerRef.value.getHealthBarCount()
      // 返回虚拟数组以兼容现有测试
      return Array.from({ length: count }, (_, i) => ({ index: i }))
    },

    // 将玩家传送到指定敌人前方（确保敌人能看到玩家）
    movePlayerToEnemy: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false

      // 计算敌人朝向的反方向（即玩家应该站的位置）
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        playerPosition.set(
          enemy.position.x - forward.x * 3,
          playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      } else {
        playerPosition.set(enemy.position.x + 3, playerPosition.y, enemy.position.z)
      }
      return true
    },

    // 对玩家造成伤害
    takePlayerDamage: (amount: number) => {
      gameStore.takeDamage(amount)
    },

    // 获取玩家血量
    getPlayerHealth: () => {
      return gameStore.health
    },

    // 获取游戏状态
    getGameState: () => {
      return gameStore.gameState
    },

    // 重新开始游戏
    restartGame: () => {
      onRestart()
    },

    // ===== 弹道投射物系统测试 API =====

    // 获取活跃子弹数量
    getActiveProjectileCount: () => {
      if (!enemyManagerRef.value) return 0
      return enemyManagerRef.value.getActiveProjectileCount?.() || 0
    },

    // 获取敌人蓄力状态
    getEnemyChargeState: (index: number) => {
      if (!enemyManagerRef.value) return null
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return null
      return {
        isCharging: enemy.isCharging,
        hasChargeLine: enemy.chargeLine !== null,
      }
    },

    // 将玩家移动到指定索引敌人正面（别名，兼容旧调用）
    movePlayerToEnemyFront: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        playerPosition.set(
          enemy.position.x - forward.x * 3,
          playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      }
      return true
    },

    // 获取敌人类型
    getEnemyType: (index: number) => {
      if (!enemyManagerRef.value) return null
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.config) return null
      return enemy.config.type
    },

    // 强制所有敌人面向玩家（用于测试，确保敌人能发现并攻击玩家）
    forceEnemiesToFacePlayer: () => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      enemies.forEach((enemy: any) => {
        if (enemy.mesh && !enemy.isDead) {
          enemy.mesh.lookAt(playerPosition.x, enemy.mesh.position.y, playerPosition.z)
          // 强制进入攻击状态
          if (enemy.state === 'patrol' || enemy.state === 'wait') {
            enemy.state = 'chase'
          }
        }
      })
      return true
    },

    // ===== RPG 武器测试 API =====

    // 切换到 RPG 武器（索引 5）
    switchToRpg: () => {
      weaponStore.switchWeapon(5)
      return true
    },

    // 获取当前武器类型
    getCurrentWeaponType: () => {
      return weaponStore.currentWeapon?.type || null
    },

    // 获取 RPG 弹药状态
    getRpgAmmo: () => {
      const ammoData = weaponStore.ammo.get('rpg')
      if (!ammoData) return null
      return { current: ammoData.current, reserve: ammoData.reserve }
    },

    // 获取活跃火箭数量
    getActiveRocketCount: () => {
      return rocketManager?.getActiveRockets().length || 0
    },

    // 手动触发火箭爆炸（用于测试 AOE 效果）
    triggerRpgExplosion: (x: number, z: number) => {
      if (!scene) return false
      handleRocketExplosion(new THREE.Vector3(x, 0, z))
      return true
    },

    // 实际发射 RPG 火箭（消耗弹药并调用 fireRocket）
    fireRpgMissile: () => {
      if (!camera || !rocketManager) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      fireRocket()
      return true
    },

    // 朝指定目标坐标发射火箭（直接计算方向，不依赖相机朝向）
    fireRpgToward: (x: number, z: number) => {
      if (!camera || !rocketManager) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      const origin = camera.position.clone()
      origin.y -= 0.1
      const dx = x - origin.x
      const dz = z - origin.z
      const direction = new THREE.Vector3(dx, 0, dz).normalize()
      rocketManager.spawn({ origin, direction, speed: 650 })
      return true
    },

    // 设置相机朝向（让相机看向指定世界坐标）
    lookAtTarget: (x: number, z: number) => {
      if (!camera) return false
      const dx = x - camera.position.x
      const dz = z - camera.position.z
      // 使用 setFromUnitVectors 从默认前方向量(0,0,-1)旋转到目标方向
      const targetDir = new THREE.Vector3(dx, 0, dz).normalize()
      const defaultForward = new THREE.Vector3(0, 0, -1)
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultForward, targetDir)
      camera.quaternion.copy(quat)
      // 同步 yaw
      yaw = Math.atan2(targetDir.x, -targetDir.z)
      return true
    },

    // 获取玩家位置
    getPlayerPosition: () => {
      return { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z }
    },

    // 等待火箭爆炸完成（轮询直到所有火箭消失或超时）
    waitForRocketExplosion: (timeoutMs: number = 5000) => {
      return new Promise((resolve) => {
        const startTime = Date.now()
        const check = () => {
          const rockets = rocketManager?.getActiveRockets() || []
          if (rockets.length === 0 || Date.now() - startTime >= timeoutMs) {
            const enemies = enemyManagerRef.value?.getActiveEnemies() || []
            resolve({
              exploded: rockets.length === 0,
              remainingEnemies: enemies.length,
              elapsed: Date.now() - startTime,
              // 包含爆炸诊断信息
              explosion: lastRpgExplosion ? { ...lastRpgExplosion } : null,
            })
            return
          }
          requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })
    },
  }
})


</script>

<template>
  <div
    ref="containerRef"
    class="game-room"
    @click="handleClick"
  >
    <!-- Loading 界面 -->
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner">🎮</div>
      <p>游戏加载中...</p>
    </div>

    <!-- 3D 游戏场景 -->
    <SceneView
      v-show="!isLoading"
      @scene-ready="onSceneReady"
    />

    <!-- 敌人管理器 -->
    <EnemyManager
      v-if="!isLoading && scene && camera"
      :scene="scene"
      :camera="camera"
      :player-position="playerPosition"
      :player-health="gameStore.health"
      ref="enemyManagerRef"
      @player-hit="onPlayerHit"
      @enemy-killed="onEnemyKilled"
    />

    <!-- HUD -->
    <div v-if="!isLoading" class="hud">
      <div class="hud-top">
        <div class="health-bar">
          <span class="label">生命值</span>
          <div class="bar">
            <div
              class="fill"
              :class="{
                warning: healthPercent <= 50 && healthPercent > 20,
                danger: healthPercent <= 20
              }"
              :style="{ width: healthPercent + '%' }"
            ></div>
          </div>
        </div>
        <div class="score">
          <span>得分: {{ gameStore.score }}</span>
          <span class="kills">击杀: {{ gameStore.kills }}</span>
        </div>
      </div>

      <!-- Crosshair -->
      <div class="crosshair" :class="{ 'scope-active': weaponStore.currentScope.isActive }">
        <span v-if="!weaponStore.currentScope.isActive" class="crosshair-dot"></span>
        <span v-if="weaponStore.currentScope.isActive" class="scope-cross">
          <span class="scope-line horizontal"></span>
          <span class="scope-line vertical"></span>
        </span>
      </div>

      <div class="hud-bottom">
        <!-- Weapon indicator -->
        <div class="weapon-indicator">
          <div
            v-for="(weapon, index) in DEFAULT_WEAPONS"
            :key="weapon.id"
            class="weapon-slot"
            :class="{ active: currentWeaponIndex === index }"
          >
            {{ index + 1 }}
          </div>
        </div>

        <div class="weapon-info">
          <span class="weapon-name">{{ currentWeaponName }}</span>
          <span class="ammo" :class="{ 'low-ammo': weaponStore.currentAmmo.current <= 5, 'reloading': isReloading }">
            <template v-if="isReloading">换弹中...</template>
            <template v-else>{{ ammoDisplay }}</template>
          </span>
        </div>
      </div>

      <div class="controls-hint">
        <p>WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜</p>
      </div>
    </div>

    <button class="exit-btn" @click.stop="exitGame">退出游戏</button>

    <!-- 死亡界面 -->
    <DeathScreen
      :visible="showDeathScreen"
      :survival-time="gameStore.gameTime"
      @restart="onRestart"
      @go-home="onGoHome"
    />
  </div>
</template>

<style scoped>
.game-room {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #fff;
}

.loading-spinner {
  font-size: 64px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 20px;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.health-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 200px;
}

.health-bar .label {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.health-bar .bar {
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.health-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #34C759, #30D158);
  border-radius: 10px;
  transition: width 0.3s ease-out, background 0.3s ease-out;
}

/* 血量低于50%变黄 */
.health-bar .fill.warning {
  background: linear-gradient(90deg, #FF9500, #FF6B00);
}

/* 血量低于20%变红 */
.health-bar .fill.danger {
  background: linear-gradient(90deg, #FF3B30, #FF2D55);
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.kills {
  font-size: 16px;
  color: #FF6B6B;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-dot {
  display: block;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.crosshair.scope-active .scope-cross {
  position: relative;
  display: block;
  width: 60px;
  height: 60px;
}

.scope-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
}

.scope-line.horizontal {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.scope-line.vertical {
  width: 1px;
  height: 100%;
  left: 50%;
  top: 0;
}

.hud-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.weapon-indicator {
  display: flex;
  gap: 8px;
}

.weapon-slot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.weapon-slot.active {
  background: rgba(255, 193, 7, 0.9);
  border-color: #FFC107;
  color: #000;
  transform: scale(1.1);
}

.weapon-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #fff;
}

.weapon-name {
  font-size: 18px;
  font-weight: 600;
}

.ammo {
  font-size: 32px;
  font-weight: 700;
}

.ammo.low-ammo {
  color: #FF3B30;
  animation: pulse 0.5s infinite;
}

.ammo.reloading {
  color: #FFC107;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.exit-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(255, 59, 48, 0.9);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
}

.exit-btn:hover {
  background: #FF3B30;
  transform: scale(1.05);
}
</style>