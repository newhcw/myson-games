<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, provide, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'
import EnemyManager from '@/components/game/EnemyManager.vue'
import { createObstacles } from '@/game/utils/createObstacles'
import { EnvironmentManager } from '@/game/environment/EnvironmentManager'
import { GAME_CONTEXT_KEY, type GameContext, type ViewAngles } from '@/game/composables/useGameContext'
import { useGameSave } from '@/game/composables/useGameSave'
import { usePlayerMovement } from '@/game/composables/usePlayerMovement'
import { usePlayerInput } from '@/game/composables/usePlayerInput'
import { useCameraEffects } from '@/game/composables/useCameraEffects'
import { useScopeMagnification } from '@/game/composables/useScopeMagnification'
import { useShooting } from '@/game/composables/useShooting'
import { useWaveSystem } from '@/game/composables/useWaveSystem'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { soundManager } from '@/game/sound/SoundManager'
import { damageFeedback } from '@/game/ui/DamageFeedback'
import { dropHint } from '@/game/ui/DropHint'
import DeathScreen from '@/game/ui/DeathScreen.vue'
import VictoryScreen from '@/game/ui/VictoryScreen.vue'
import { installTestApi } from '@/game/test/testApi'
import GameHUD from '@/components/game/GameHUD.vue'
import PauseMenu from '@/components/game/PauseMenu.vue'
import TouchControls from '@/components/game/TouchControls.vue'
import VignetteOverlay from '@/components/game/VignetteOverlay.vue'
import ScopeCrosshair from '@/components/game/ScopeCrosshair.vue'

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const containerRef = ref<HTMLDivElement | null>(null)

// Stores
const weaponStore = useWeaponStore()
const gameStore = useGameStore()

// Three.js objects (shallowRef — no deep reactivity needed)
const scene = shallowRef<THREE.Scene | null>(null)
const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
let animationId: number = 0

// Player state
const playerPosition = new THREE.Vector3(0, 1.6, 0)

// Provide GameContext for child components
provide<GameContext>(GAME_CONTEXT_KEY, {
  scene,
  camera,
  renderer,
  playerPosition,
})

// View angles (shared between composables)
const viewAngles: ViewAngles = { yaw: 0, pitch: 0 }

// 敌人管理器引用（在 composable 使用前声明）
const enemyManagerRef = ref<any>(null)

// 环境装饰管理器
const environmentManager = new EnvironmentManager()

// Composable: Wave System (declared early because waveState is needed by usePlayerInput)
const waveSystem = useWaveSystem()
const {
  currentWave,
  waveState,
  intermissionCountdown,
  showVictoryScreen,
  waveProgressText,
  isBossWave,
  activeBuffs,
} = waveSystem

// Composable: Player Movement
const playerMovement = usePlayerMovement(camera, playerPosition)
const { keys, isRunning } = playerMovement

// Composable: Player Input
const inputCallbacks: any = {}
const playerInput = usePlayerInput(
  containerRef,
  camera,
  viewAngles,
  keys,
  isRunning,
  waveState,
  inputCallbacks,
)

// Composable: Camera Effects
const cameraEffects = useCameraEffects(
  camera,
  viewAngles,
  () => scopeMagnification.isScopeActive.value,
  () => playerMovement.keys.w || playerMovement.keys.a || playerMovement.keys.s || playerMovement.keys.d
)
const {
  isHoldingBreath,
  breathStamina,
  maxBreathStamina,
  currentSpread,
  applyRecoil,
  startCameraShake,
} = cameraEffects

// Composable: Scope Magnification
const scopeMagnification = useScopeMagnification(camera)

// Composable: Shooting
const shooting = useShooting({
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
  isScopeActive: scopeMagnification.isScopeActive,
})

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

const healthPercent = computed(() => (gameStore.health / 100) * 100)

const isReloading = computed(() => weaponStore.isReloading)
const currentWeaponIndex = computed(() => weaponStore.currentWeaponIndex)

// Game save / load — uses viewAngles now
const {
  saveCurrentGame,
  manualSave,
  loadSavedGame,
} = useGameSave(
  playerPosition,
  () => viewAngles.yaw,
  (v) => { viewAngles.yaw = v },
  () => viewAngles.pitch,
  (v) => { viewAngles.pitch = v },
  camera,
)

// 暂停游戏并退出指针锁定（需在 inputCallbacks 之前声明）
const pauseGameAndUnlock = () => {
  gameStore.pauseGame()
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  soundManager.playScope()
}

// 恢复游戏并重新锁定指针
const resumeGameAndLock = async () => {
  gameStore.resumeGame()
  if (containerRef.value) {
    try {
      await containerRef.value.requestPointerLock()
    } catch (err) {
      console.error('Failed to lock pointer:', err)
    }
  }
  soundManager.playScope()
}

// Fill input callbacks (now all composable refs are available)
Object.assign(inputCallbacks, {
  onShoot: () => shooting.fire(),
  onShootStart: () => shooting.startFiring(),
  onShootStop: () => shooting.stopFiring(),
  onJump: () => playerMovement.jump(),
  onJumpStart: () => playerMovement.startJumpCharge(),
  onJumpRelease: () => playerMovement.cancelJumpCharge(),
  onToggleCrouch: () => playerMovement.toggleCrouch(),
  onReload: () => weaponStore.reload(),
  onToggleScope: () => weaponStore.toggleScope(),
  onPause: pauseGameAndUnlock,
  onResume: resumeGameAndLock,
  onManualSave: manualSave,
  onSkipIntermission: () => waveSystem.skipIntermission(),
})

// Destructure input helpers for template
const {
  isTouchDevice,
  onVirtualMove,
  onVirtualStop,
  onVirtualButtonPress,
  onVirtualButtonRelease,
  onTouchLookStart,
  onTouchLookMove,
  onTouchLookEnd,
  handleClick,
} = playerInput

const onSceneReady = (
  sceneObj: THREE.Scene,
  cameraObj: THREE.PerspectiveCamera,
  rendererObj: THREE.WebGLRenderer
) => {
  scene.value = sceneObj
  camera.value = cameraObj
  renderer.value = rendererObj

  // Init rocket manager via shooting composable
  shooting.initRocketManager(sceneObj)

  // Init environment decorations
  environmentManager.init(sceneObj)

  // Add obstacles
  createObstacles(scene.value!)

  // Init wave system
  waveSystem.init(sceneObj, enemyManagerRef, () => {
    if (route.query.continue === 'true') {
      const loaded = loadSavedGame()
      if (loaded) {
        console.log('已从存档恢复游戏')
      } else {
        console.warn('存档恢复失败，开始新游戏')
      }
      return loaded
    }
    return false
  })

  // Unblock EnemyManager mount so the watch inside waveSystem.init()
  // can pick up enemyManagerRef and start the game.
  isLoading.value = false

  // 显示游戏开始提示
  dropHint.showGameStartHint()
}

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

let lastTime = performance.now()

const gameLoop = () => {
  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  if (!gameStore.isDead && !gameStore.isPaused) {
    // Process input buffer
    playerInput.processInputBuffer()

    // Update composables
    playerMovement.update(delta)
    shooting.update(delta)
    cameraEffects.update(delta)
    waveSystem.update(delta)
    environmentManager.update(delta, playerPosition)

    // Update enemy manager
    if (enemyManagerRef.value) {
      enemyManagerRef.value?.update(delta)
    }
  }

  if (renderer.value && scene.value && camera.value) {
    renderer.value.render(scene.value, camera.value)
  }

  animationId = requestAnimationFrame(gameLoop)
}

const exitGame = () => {
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  // 自动存档
  saveCurrentGame()
  router.push({ name: 'Home' })
}

// 死亡界面相关
const showDeathScreen = computed(() => gameStore.isDead)

const onRestart = () => {
  gameStore.fullReset()
  playerPosition.set(0, 1.6, 0)
  viewAngles.yaw = 0
  viewAngles.pitch = 0
  if (camera.value) {
    camera.value.rotation.set(0, 0, 0)
  }
  shooting.dispose()
  enemyManagerRef.value?.reset()
  weaponStore.resetAmmo()
  waveSystem.reset()
  playerMovement.reset()
  cameraEffects.reset()
  scopeMagnification.reset()
  lastTime = performance.now()
}

const onGoHome = () => {
  exitGame()
}

// 通关界面按钮
const onVictoryRestart = () => {
  showVictoryScreen.value = false
  // 确保退出暂停状态
  if (gameStore.isPaused) {
    gameStore.resumeGame()
  }
  onRestart()
  // 重新锁定指针
  if (containerRef.value) {
    containerRef.value.requestPointerLock().catch(() => {})
  }
}

const onVictoryGoHome = () => {
  showVictoryScreen.value = false
  // 保存得分
  saveCurrentGame()
  // 退出到主页
  router.push({ name: 'Home' })
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

// 4.2 玩家死亡时倍镜自动关闭，释放指针锁定
watch(() => gameStore.isDead, (isDead) => {
  if (isDead) {
    scopeMagnification.deactivateScope()
    weaponStore.currentScope.isActive = false
    // 释放指针锁定，让玩家可以点击死亡界面的按钮
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    // 死亡时恢复光标，让玩家能看到鼠标
    if (containerRef.value) {
      containerRef.value.style.cursor = 'pointer'
    }
  } else {
    // 复活时恢复 cursor none
    if (containerRef.value) {
      containerRef.value.style.cursor = ''
    }
  }
})

onMounted(() => {
  // Mount input events
  playerInput.mount()

  // Install test API in DEV mode
  if (import.meta.env.DEV) {
    installTestApi({
      playerPosition,
      yaw: { get: () => viewAngles.yaw, set: (v: number) => { viewAngles.yaw = v } },
      pitch: { get: () => viewAngles.pitch, set: (v: number) => { viewAngles.pitch = v } },
      camera,
      scene,
      enemyManagerRef,
      rocketManager: { get: () => shooting.rocketManager.get() },
      waveManager: { get: () => waveSystem.getWaveManager() },
      powerUpManager: { get: () => waveSystem.getPowerUpManager() },
      onRestart,
      handleRocketExplosion: (pos: THREE.Vector3) => shooting.handleRocketExplosion(pos),
      fireRocket: () => shooting.fireRocket(),
      fire: () => shooting.fire(),
      jump: () => playerMovement.jump(),
    })
  }

  setTimeout(() => {
    lastTime = performance.now()
    gameLoop()
  }, 500)
})

onUnmounted(() => {
  playerInput.unmount()

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer.value) {
    renderer.value.dispose()
  }

  shooting.dispose()
  waveSystem.dispose()
  environmentManager.dispose()
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

    <!-- 暗角效果 -->
    <VignetteOverlay
      :visible="weaponStore.currentScope.isActive"
      :intensity="0.7"
    />

    <!-- 瞄准镜准星 -->
    <ScopeCrosshair
      :active="weaponStore.currentScope.isActive"
      :size="80"
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
    <GameHUD
      v-if="!isLoading"
      :health-percent="healthPercent"
      :score="gameStore.score"
      :kills="gameStore.kills"
      :current-wave="currentWave"
      :wave-progress-text="waveProgressText"
      :is-boss-wave="isBossWave"
      :wave-state="waveState"
      :intermission-countdown="intermissionCountdown"
      :active-buffs="activeBuffs"
      :current-weapon-index="currentWeaponIndex"
      :current-weapon-name="currentWeaponName"
      :ammo-display="ammoDisplay"
      :is-reloading="isReloading"
      :is-holding-breath="isHoldingBreath"
      :breath-stamina="breathStamina"
      :max-breath-stamina="maxBreathStamina"
      :is-scope-active="weaponStore.currentScope.isActive"
      @exit="exitGame"
    />

    <!-- 触摸屏虚拟控制 -->
    <TouchControls
      :is-touch-device="isTouchDevice"
      @virtual-move="onVirtualMove"
      @virtual-stop="onVirtualStop"
      @virtual-button-press="onVirtualButtonPress"
      @virtual-button-release="onVirtualButtonRelease"
      @touch-look-start="onTouchLookStart"
      @touch-look-move="onTouchLookMove"
      @touch-look-end="onTouchLookEnd"
    />

    <!-- 暂停菜单 -->
    <PauseMenu
      :visible="gameStore.isPaused"
      @resume="resumeGameAndLock"
      @restart="onRestart"
      @exit="exitGame"
    />

    <!-- 死亡界面 -->
    <DeathScreen
      :visible="showDeathScreen"
      :survival-time="gameStore.gameTime"
      @restart="onRestart"
      @go-home="onGoHome"
    />

    <!-- 通关界面 -->
    <VictoryScreen
      :visible="showVictoryScreen"
      :survival-time="gameStore.gameTime"
      @restart="onVictoryRestart"
      @go-home="onVictoryGoHome"
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
  cursor: none;
  background: #1a2e0a;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #C8E6C9;
  font-family: var(--font-display);
  font-size: var(--font-size-lg);
  gap: 16px;
  background: radial-gradient(ellipse at center, #2E5A1A, #1a2e0a);
}

.loading-spinner {
  font-size: 72px;
  animation: bounce 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 12px rgba(255, 193, 7, 0.5));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-24px); }
}
</style>