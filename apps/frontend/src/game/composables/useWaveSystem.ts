import { ref, computed, watch, type Ref } from 'vue'
import * as THREE from 'three'
import { WaveManager, WAVE_CONFIGS, SPAWN_POINTS, INTERMISSION_DURATION, TOTAL_WAVES } from '@/game/wave/WaveManager'
import { PowerUpManager } from '@/game/powerups/PowerUpManager'
import type { WaveState, EnemyTypeKeyword } from '@/game/wave/types'
import { useGameStore } from '@/stores/game'
import { useWeaponStore } from '@/stores/weapon'
import { useBuffsStore } from '@/stores/buffs'
import { dropHint } from '@/game/ui/DropHint'

export function useWaveSystem() {
  const gameStore = useGameStore()
  const weaponStore = useWeaponStore()
  const buffsStore = useBuffsStore()

  let waveManager: WaveManager | null = null
  let powerUpManager: PowerUpManager | null = null
  let enemyManagerRef: Ref<any>

  const currentWave = ref(1)
  const waveState = ref<WaveState>('waving')
  const intermissionCountdown = ref(0)
  const showVictoryScreen = ref(false)

  const waveProgressText = ref(`第 1 / ${TOTAL_WAVES} 波`)
  const isBossWave = ref(false)

  const activeBuffs = computed(() => buffsStore.getActiveBuffs)

  // ====== Wave enemy spawning ======
  const spawnWaveEnemies = (waveNumber: number): void => {
    if (!enemyManagerRef.value) return
    const config = WAVE_CONFIGS[waveNumber - 1]
    if (!config) return

    const shuffled = [...SPAWN_POINTS].sort(() => Math.random() - 0.5)
    const pointCount = 2 + Math.floor(Math.random() * 2)
    const selectedPoints = shuffled.slice(0, pointCount).map(
      (p) => new THREE.Vector3(p.x, 0, p.z),
    )

    const configs: { type: EnemyTypeKeyword; count: number }[] = []
    config.enemies.forEach((e) => {
      configs.push({ type: e.type, count: e.count })
    })

    const spawnedIds = enemyManagerRef.value.spawnEnemies(configs, selectedPoints)
    if (waveManager) {
      waveManager.registerEnemies(spawnedIds)
    }
  }

  // ====== Init wave system ======
  const init = (
    sceneObj: THREE.Scene,
    enemyManager: Ref<any>,
    loadFromSave: () => boolean,
  ) => {
    enemyManagerRef = enemyManager

    waveManager = new WaveManager()
    waveManager.setCallbacks({
      onWaveStart: (waveNumber: number) => {
        currentWave.value = waveNumber
        waveState.value = 'waving'
        intermissionCountdown.value = 0
        waveProgressText.value = `第 ${waveNumber} / ${TOTAL_WAVES} 波`
        isBossWave.value = WAVE_CONFIGS[waveNumber - 1]?.isBossWave === true

        console.log(`第 ${waveNumber} 波开始`)
        spawnWaveEnemies(waveNumber)
      },
      onWaveClear: (_waveNumber: number) => {
        waveState.value = 'intermission'
        intermissionCountdown.value = INTERMISSION_DURATION
        console.log(`波次完成，进入间歇`)
      },
      onAllWavesComplete: () => {
        waveState.value = 'victory'
        showVictoryScreen.value = true
        if (gameStore.isPaused) {
          gameStore.resumeGame()
        }
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        console.log('通关！')
      },
    })

    powerUpManager = new PowerUpManager()
    powerUpManager.setScene(sceneObj)
    powerUpManager.setCallbacks({
      onHealthPickup: (amount: number) => {
        const newHealth = Math.min(gameStore.maxHealth, gameStore.health + amount)
        gameStore.health = newHealth
        dropHint.showHealthPickup()
      },
      onAmmoPickup: () => {
        const weapon = weaponStore.currentWeapon
        if (!weapon) return
        const ammoData = weaponStore.ammo.get(weapon.id)
        if (ammoData) {
          ammoData.current = weapon.magazineSize
          weaponStore.ammo.set(weapon.id, { ...ammoData })
        }
        dropHint.showAmmoPickup()
      },
      onDoubleDamagePickup: (duration: number) => {
        buffsStore.addBuff('doubleDamage', duration)
        dropHint.showDoubleDamage()
      },
    })

    // Watch for EnemyManager mount — no immediate:true since ref is
    // null at init() time (EnemyManager mounts after isLoading=false).
    const stopWatch = watch(enemyManagerRef, (mgr) => {
      if (mgr && waveManager) {
        mgr.setOnEnemyKilled((enemyId: string) => {
          waveManager?.onEnemyKilled(enemyId)
        })
        mgr.setPowerUpManager(powerUpManager)
        waveManager.startGame()
        stopWatch()
      }
    })

    // Fallback for hot-reload / EnemyManager already mounted
    if (enemyManagerRef.value && waveManager) {
      enemyManagerRef.value.setOnEnemyKilled((enemyId: string) => {
        waveManager?.onEnemyKilled(enemyId)
      })
      enemyManagerRef.value.setPowerUpManager(powerUpManager)
      waveManager.startGame()
    }

    // Restore from save
    if (loadFromSave()) {
      console.log('已从存档恢复游戏')
      if (gameStore.isPaused && document.pointerLockElement) {
        document.exitPointerLock()
      }
    }
  }

  // ====== Update ======
  const update = (delta: number) => {
    if (powerUpManager) {
      powerUpManager.update(delta, performance.now() / 1000)
    }
    if (waveManager) {
      waveManager.update(delta)
      if (waveState.value === 'intermission') {
        intermissionCountdown.value = waveManager.getIntermissionRemaining()
      }
    }
  }

  // ====== Actions ======
  const skipIntermission = () => {
    if (waveState.value === 'intermission' && waveManager) {
      waveManager.skipIntermission()
    }
  }

  const reset = () => {
    waveManager?.reset()
    powerUpManager?.dispose()
    buffsStore.clearAll()
    showVictoryScreen.value = false
  }

  const dispose = () => {
    waveManager?.dispose()
    powerUpManager?.dispose()
  }

  const getWaveManager = () => waveManager
  const getPowerUpManager = () => powerUpManager

  return {
    currentWave,
    waveState,
    intermissionCountdown,
    showVictoryScreen,
    waveProgressText,
    isBossWave,
    activeBuffs,
    init,
    update,
    skipIntermission,
    reset,
    dispose,
    getWaveManager,
    getPowerUpManager,
  }
}
