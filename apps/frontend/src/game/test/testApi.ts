import * as THREE from 'three'
import { useGameStore } from '@/stores/game'
import { useWeaponStore } from '@/stores/weapon'
import { useBuffsStore } from '@/stores/buffs'

interface TestApiContext {
  playerPosition: THREE.Vector3
  yaw: { get: () => number; set: (v: number) => void }
  pitch: { get: () => number; set: (v: number) => void }
  camera: { value: THREE.PerspectiveCamera | null }
  scene: { value: THREE.Scene | null }
  enemyManagerRef: { value: any }
  rocketManager: { get: () => any }
  waveManager: { get: () => any }
  powerUpManager: { get: () => any }
  onRestart: () => void
  handleRocketExplosion: (pos: THREE.Vector3) => void
  fireRocket: () => void
  fire: () => void
}

export function installTestApi(ctx: TestApiContext) {
  const gameStore = useGameStore()
  const weaponStore = useWeaponStore()
  const buffsStore = useBuffsStore()

  // @ts-ignore
  window.__testApi = {
    // 获取所有活跃敌人
    getEnemies: () => {
      if (!ctx.enemyManagerRef.value) return []
      return ctx.enemyManagerRef.value.getActiveEnemies() || []
    },

    // 射击指定索引敌人
    shootEnemy: (index: number) => {
      if (!ctx.enemyManagerRef.value) return false
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false
      ctx.enemyManagerRef.value.onEnemyHit(enemy.id, 999)
      return true
    },

    // 手动触发敌人受伤效果
    hitEnemy: (index: number, damage: number = 10) => {
      if (!ctx.enemyManagerRef.value) return false
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false
      ctx.enemyManagerRef.value.onEnemyHit(enemy.id, damage)
      return true
    },

    // 获取血条数量
    getHealthBars: () => {
      if (!ctx.enemyManagerRef.value) return []
      const count = ctx.enemyManagerRef.value.getHealthBarCount()
      return Array.from({ length: count }, (_, i) => ({ index: i }))
    },

    // 将玩家传送到指定敌人前方
    movePlayerToEnemy: (index: number) => {
      if (!ctx.enemyManagerRef.value) return false
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        ctx.playerPosition.set(
          enemy.position.x - forward.x * 3,
          ctx.playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      } else {
        ctx.playerPosition.set(enemy.position.x + 3, ctx.playerPosition.y, enemy.position.z)
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
      ctx.onRestart()
    },

    // 获取活跃子弹数量
    getActiveProjectileCount: () => {
      if (!ctx.enemyManagerRef.value) return 0
      return ctx.enemyManagerRef.value.getActiveProjectileCount?.() || 0
    },

    // 获取敌人蓄力状态
    getEnemyChargeState: (index: number) => {
      if (!ctx.enemyManagerRef.value) return null
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return null
      return {
        isCharging: enemy.isCharging,
        hasChargeLine: enemy.chargeLine !== null,
      }
    },

    // 将玩家移动到指定索引敌人正面
    movePlayerToEnemyFront: (index: number) => {
      if (!ctx.enemyManagerRef.value) return false
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        ctx.playerPosition.set(
          enemy.position.x - forward.x * 3,
          ctx.playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      }
      return true
    },

    // 获取敌人类型
    getEnemyType: (index: number) => {
      if (!ctx.enemyManagerRef.value) return null
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.config) return null
      return enemy.config.type
    },

    // 强制所有敌人面向玩家
    forceEnemiesToFacePlayer: () => {
      if (!ctx.enemyManagerRef.value) return false
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      enemies.forEach((enemy: any) => {
        if (enemy.mesh && !enemy.isDead) {
          enemy.mesh.lookAt(ctx.playerPosition.x, enemy.mesh.position.y, ctx.playerPosition.z)
          if (enemy.state === 'patrol' || enemy.state === 'wait') {
            enemy.state = 'chase'
          }
        }
      })
      return true
    },

    // 生成测试敌人
    spawnTestEnemy: (type: string) => {
      if (!ctx.enemyManagerRef.value) return -1
      const pos = ctx.playerPosition.clone().add(new THREE.Vector3(5, 0, 0))
      const enemy = ctx.enemyManagerRef.value.spawnTestEnemy(type, pos)
      if (enemy && enemy.mesh) {
        enemy.mesh.lookAt(ctx.playerPosition.x, enemy.mesh.position.y, ctx.playerPosition.z)
        enemy.state = 'chase'
      }
      const enemies = ctx.enemyManagerRef.value.getActiveEnemies()
      return enemies.findIndex((e: any) => e.id === enemy.id)
    },

    // 切换到 RPG 武器
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
      return ctx.rocketManager.get()?.getActiveRockets?.()?.length ?? 0
    },

    // 获取血条屏幕坐标
    getHealthBarPositions: () => {
      const bars: { id: string; x: number; y: number }[] = []
      const container = document.getElementById('game-ui')
      if (!container) return bars
      const children = container.querySelectorAll('div[style*="position: absolute"]')
      children.forEach((child) => {
        const div = child as HTMLDivElement
        if (div.style.display === 'none') return
        const left = parseFloat(div.style.left)
        const top = parseFloat(div.style.top)
        if (!isNaN(left) && !isNaN(top)) {
          bars.push({ id: div.textContent || '', x: left, y: top })
        }
      })
      return bars
    },

    // 手动触发火箭爆炸
    triggerRpgExplosion: (x: number, z: number) => {
      if (!ctx.scene.value) return false
      ctx.handleRocketExplosion(new THREE.Vector3(x, 0, z))
      return true
    },

    // 实际发射 RPG 火箭
    fireRpgMissile: () => {
      if (!ctx.camera.value || !ctx.rocketManager.get()) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      ctx.fireRocket()
      return true
    },

    // 朝指定目标坐标发射火箭
    fireRpgToward: (x: number, z: number) => {
      if (!ctx.camera.value || !ctx.rocketManager.get()) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      const origin = ctx.camera.value.position.clone()
      origin.y -= 0.1
      const dx = x - origin.x
      const dz = z - origin.z
      const direction = new THREE.Vector3(dx, 0, dz).normalize()
      ctx.rocketManager.get().spawn({ origin, direction, speed: 650 })
      return true
    },

    // 设置相机朝向
    lookAtTarget: (x: number, z: number) => {
      if (!ctx.camera.value) return false
      const dx = x - ctx.camera.value.position.x
      const dz = z - ctx.camera.value.position.z
      const targetDir = new THREE.Vector3(dx, 0, dz).normalize()
      const defaultForward = new THREE.Vector3(0, 0, -1)
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultForward, targetDir)
      ctx.camera.value.quaternion.copy(quat)
      ctx.yaw.set = Math.atan2(targetDir.x, -targetDir.z)
      return true
    },

    // 获取玩家位置
    getPlayerPosition: () => {
      return { x: ctx.playerPosition.x, y: ctx.playerPosition.y, z: ctx.playerPosition.z }
    },

    // 等待火箭爆炸完成
    waitForRocketExplosion: (timeoutMs: number = 5000) => {
      return new Promise((resolve) => {
        const startTime = Date.now()
        const check = () => {
          const rockets = ctx.rocketManager.get()?.getActiveRockets() || []
          if (rockets.length === 0 || Date.now() - startTime >= timeoutMs) {
            const enemies = ctx.enemyManagerRef.value?.getActiveEnemies() || []
            resolve({
              exploded: rockets.length === 0,
              remainingEnemies: enemies.length,
              elapsed: Date.now() - startTime,
              explosion: null,
            })
            return
          }
          requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })
    },

    // 获取当前波次
    getCurrentWave: () => {
      return ctx.waveManager.get()?.getCurrentWave() ?? 1
    },

    // 获取波次状态
    getWaveState: () => {
      return ctx.waveManager.get()?.getState() ?? 'waving'
    },

    // 跳过间歇
    skipIntermission: () => {
      ctx.waveManager.get()?.skipIntermission()
    },

    // 获取活跃道具数量
    getPowerUpCount: () => {
      return ctx.powerUpManager.get()?.getActiveCount() ?? 0
    },

    // 获取 Buff 状态
    hasBuff: (type: string) => {
      return buffsStore.hasBuff(type)
    },

    // 获取武器信息
    getWeaponInfo: () => {
      const weapon = weaponStore.currentWeapon
      if (!weapon) return null
      const ammoData = weaponStore.ammo.get(weapon.id)
      return {
        type: weapon.type,
        ammo: ammoData?.current ?? 0,
        maxAmmo: weapon.magazineSize,
        isAuto: weapon.isAuto,
        fireRate: weapon.fireRate,
      }
    },

    // 切换武器
    switchWeapon: (index: number) => {
      weaponStore.switchWeapon(index)
      return true
    },

    // 生成道具到玩家位置并自动拾取
    spawnAndPickupPowerUp: (type: string) => {
      const powerUpManager = ctx.powerUpManager.get()
      if (!powerUpManager) return false
      const pos = ctx.playerPosition.clone().add(new THREE.Vector3(0.5, 0, 0))
      powerUpManager.spawn({ type, position: pos })
      // 强制更新以触发拾取检测
      powerUpManager.update(0.016, Date.now())
      return true
    },

    // 直接触发一次射击
    triggerFire: () => {
      if (ctx.fire) {
        ctx.fire()
      }
      return true
    },

    // 注册射击函数供测试调用
    _setShootingFire: (fireFn: () => void) => {
      const testApi = (window as any).__testApi
      if (testApi) {
        testApi._shootingFire = fireFn
      }
      return true
    },

    // 生成道具到玩家位置
    spawnPowerUp: (type: string) => {
      const powerUpManager = ctx.powerUpManager.get()
      if (!powerUpManager) return false
      const pos = ctx.playerPosition.clone().add(new THREE.Vector3(2, 0, 0))
      powerUpManager.spawn({ type, position: pos })
      return true
    },
  }
}
