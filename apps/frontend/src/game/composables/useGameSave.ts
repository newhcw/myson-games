import { storageManager, type GameSaveData } from '@/game/storage/StorageManager'
import { useGameStore } from '@/stores/game'
import { useWeaponStore } from '@/stores/weapon'
import * as THREE from 'three'

export function useGameSave(
  playerPosition: THREE.Vector3,
  getYaw: () => number,
  setYaw: (v: number) => void,
  getPitch: () => number,
  setPitch: (v: number) => void,
  camera: { value: THREE.PerspectiveCamera | null }
) {
  const gameStore = useGameStore()
  const weaponStore = useWeaponStore()

  const saveCurrentGame = () => {
    if (!gameStore.isPlaying && !gameStore.isPaused) return

    const saveData: GameSaveData = {
      timestamp: Date.now(),
      player: {
        health: gameStore.health,
        position: { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z },
        rotation: { yaw: getYaw(), pitch: getPitch() },
      },
      game: {
        score: gameStore.score,
        kills: gameStore.kills,
        gameTime: gameStore.gameTime,
        state: (gameStore.gameState === 'ended' ? 'playing' : gameStore.gameState) as 'idle' | 'playing' | 'paused',
      },
      weapon: {
        currentIndex: weaponStore.currentWeaponIndex,
        ammo: Object.fromEntries(weaponStore.ammo) as Record<string, { current: number; reserve: number }>,
      },
    }

    storageManager.saveGame(saveData).then((success) => {
      if (success) {
        console.log('游戏已自动存档')
      }
    })
  }

  const manualSave = () => {
    saveCurrentGame()
    alert('游戏已存档！')
  }

  const loadSavedGame = (): boolean => {
    const saveData = storageManager.loadGame()
    if (!saveData) {
      console.warn('没有找到存档')
      return false
    }

    console.log('正在从存档恢复游戏...', saveData)

    // 恢复玩家状态
    gameStore.health = saveData.player.health
    playerPosition.set(
      saveData.player.position.x,
      saveData.player.position.y,
      saveData.player.position.z
    )
    setYaw(saveData.player.rotation.yaw)
    setPitch(saveData.player.rotation.pitch)

    // 恢复相机位置和旋转
    if (camera.value) {
      camera.value.position.copy(playerPosition)
      camera.value.rotation.order = 'YXZ'
      camera.value.rotation.y = getYaw()
      camera.value.rotation.x = getPitch()
    }

    // 恢复游戏状态
    gameStore.score = saveData.game.score
    gameStore.kills = saveData.game.kills
    gameStore.gameTime = saveData.game.gameTime

    // 恢复游戏状态
    if (saveData.game.state === 'paused') {
      gameStore.gameState = 'paused'
    } else if (saveData.game.state === 'playing') {
      gameStore.gameState = 'playing'
    }

    // 恢复武器状态
    weaponStore.switchWeapon(saveData.weapon.currentIndex)

    // 恢复弹药状态
    if (saveData.weapon.ammo) {
      Object.entries(saveData.weapon.ammo).forEach(([key, value]) => {
        const ammoData = weaponStore.ammo.get(key)
        if (ammoData && value) {
          ammoData.current = value.current
          ammoData.reserve = value.reserve
        }
      })
    }

    console.log('游戏已从存档恢复')
    return true
  }

  return { saveCurrentGame, manualSave, loadSavedGame }
}
