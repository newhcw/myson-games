<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, provide, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'
import EnemyManager from '@/components/game/EnemyManager.vue'
import { createObstacles } from '@/game/utils/createObstacles'
import { GAME_CONTEXT_KEY, type GameContext, type ViewAngles } from '@/game/composables/useGameContext'
import { useGameSave } from '@/game/composables/useGameSave'
import { usePlayerMovement } from '@/game/composables/usePlayerMovement'
import { usePlayerInput } from '@/game/composables/usePlayerInput'
import { useCameraEffects } from '@/game/composables/useCameraEffects'
import { useShooting } from '@/game/composables/useShooting'
import { useWaveSystem } from '@/game/composables/useWaveSystem'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { DEFAULT_WEAPONS } from '@/game/weapons/types'
import { soundManager } from '@/game/sound/SoundManager'
import { damageFeedback } from '@/game/ui/DamageFeedback'
import DeathScreen from '@/game/ui/DeathScreen.vue'
import VictoryScreen from '@/game/ui/VictoryScreen.vue'
import VirtualJoystick from '@/components/game/VirtualJoystick.vue'
import VirtualButton from '@/components/game/VirtualButton.vue'
import { installTestApi } from '@/game/test/testApi'

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
const {
  keys,
  isRunning,
  isCrouching,
  isJumping,
  jumpVelocity,
  playerHeight,
} = playerMovement

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
const cameraEffects = useCameraEffects(camera, viewAngles)
const {
  isHoldingBreath,
  breathStamina,
  maxBreathStamina,
  currentSpread,
  applyRecoil,
  startCameraShake,
} = cameraEffects

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

const breathBarStyle = computed(() => ({
  width: breathStamina.value + '%',
}))

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
  onJump: () => playerMovement.jump(),
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
  virtualMove: virtualMove,
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

  isLoading.value = false
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

    // Update enemy manager
    if (enemyManagerRef.value) {
      enemyManagerRef.value?.update(delta)
    }

    // Update scope FOV
    if (camera.value && weaponStore.currentScope.isActive) {
      const targetFov = weaponStore.currentScope.originalFov / weaponStore.currentScope.magnification
      camera.value.fov = THREE.MathUtils.lerp(camera.value.fov, targetFov, 0.1)
      camera.value.updateProjectionMatrix()
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
          <div class="health-frame">
            <div class="health-icon">❤️</div>
            <div class="bar">
              <div
                class="fill"
                :class="{
                  warning: healthPercent <= 50 && healthPercent > 20,
                  danger: healthPercent <= 20
                }"
                :style="{ width: healthPercent + '%' }"
              ></div>
              <div class="bar-shimmer"></div>
            </div>
          </div>
        </div>
        <div class="score-panel">
          <div class="score-item">
            <span class="score-icon">⭐</span>
            <span class="score-value">{{ gameStore.score }}</span>
          </div>
          <div class="score-item kills-item">
            <span class="score-icon">⚔️</span>
            <span class="score-value">{{ gameStore.kills }}</span>
          </div>
        </div>
        <!-- 屏息体力条 -->
        <div v-if="breathStamina < maxBreathStamina" class="breath-bar">
          <div class="breath-fill" :style="breathBarStyle" :class="{ low: breathStamina < 20 }"></div>
          <span class="breath-label" v-if="isHoldingBreath">屏息中...</span>
        </div>
      </div>

      <!-- 波次显示 -->
      <div class="wave-display" :class="{ 'boss-wave': isBossWave }">
        <span class="wave-icon">{{ isBossWave ? '👑' : '⚔️' }}</span>
        <span class="wave-text">{{ waveProgressText }}</span>
      </div>

      <!-- Buff 状态图标 -->
      <div v-if="activeBuffs.length > 0" class="buff-bar">
        <div
          v-for="buff in activeBuffs"
          :key="buff.type"
          class="buff-icon"
          :data-buff-type="buff.type"
        >
          <span class="buff-emoji">{{ buff.type === 'doubleDamage' ? '⚡' : '✨' }}</span>
          <span class="buff-timer">{{ buffsStore.getBuffRemaining(buff.type) }}s</span>
        </div>
      </div>

      <!-- 波次间歇倒计时 -->
      <transition name="wave-countdown">
        <div v-if="waveState === 'intermission'" class="wave-intermission">
          <div class="intermission-content">
            <div class="intermission-label">第 {{ currentWave + 1 }} 波即将开始</div>
            <div class="intermission-countdown">{{ Math.ceil(intermissionCountdown) }}</div>
            <div class="intermission-hint">按 空格键 跳过</div>
          </div>
        </div>
      </transition>

      <!-- Crosshair -->
      <div class="crosshair" :class="{ 'scope-active': weaponStore.currentScope.isActive }">
        <span v-if="!weaponStore.currentScope.isActive" class="crosshair-clover"></span>
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

    <!-- 触摸屏虚拟控制（仅在触摸设备显示） -->
    <template v-if="isTouchDevice">
      <!-- 左侧虚拟摇杆（移动） -->
      <VirtualJoystick
        @move="onVirtualMove"
        @stop="onVirtualStop"
      />

      <!-- 右侧虚拟按钮 -->
      <div class="virtual-buttons-right">
        <VirtualButton label="射击" type="shoot" @press="onVirtualButtonPress" @release="onVirtualButtonRelease" />
        <VirtualButton label="跳跃" type="jump" @press="onVirtualButtonPress" />
        <VirtualButton label="下蹲" type="crouch" @press="onVirtualButtonPress" />
        <VirtualButton label="换弹" type="reload" @press="onVirtualButtonPress" />
        <VirtualButton label="倍镜" type="scope" @press="onVirtualButtonPress" />
      </div>

      <!-- 右侧触摸区域（视角控制） -->
      <div
        class="touch-look-area"
        @touchstart="onTouchLookStart"
        @touchmove="onTouchLookMove"
        @touchend="onTouchLookEnd"
      ></div>
    </template>

    <button class="exit-btn" @click.stop="exitGame">退出游戏</button>
    <!-- 暂停菜单 -->
    <transition name="pause-menu">
      <div v-if="gameStore.isPaused" class="pause-overlay">
        <div class="pause-menu">
          <h2 class="pause-title">游戏暂停</h2>
          <div class="pause-buttons">
            <button class="pause-btn resume-btn" @click="resumeGameAndLock">
              <span>继续游戏</span>
            </button>
            <button class="pause-btn restart-btn" @click="onRestart">
              <span>重新开始</span>
            </button>
            <button class="pause-btn exit-btn" @click="exitGame">
              <span>退出游戏</span>
            </button>
          </div>
          <p class="pause-hint">按 ESC 继续游戏</p>
        </div>
      </div>
    </transition>

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
/* ===== 基础容器 ===== */
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
  filter: drop-shadow(0 0 verso12px rgba(255, 193, 7, 0.5));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-24px); }
}

/* ===== HUD 主容器 ===== */
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 16px;
}

/* ===== 顶部 HUD ===== */
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

/* 血量条 - 木质框 + 液体 */
.health-bar {
  flex: 0 0 auto;
  max-width: 240px;
}

.health-frame {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 20px;
  padding: 4px 12px 4px 6px;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.health-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.health-bar .bar {
  flex: 1;
  height: 18px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 9px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(139, 195, 74, 0.保税2);
}

.health-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #66BB6A, #43A047);
  border-radius: 9px;
  transition: width 0.3s ease-out, background 0.3s ease-out;
  position: relative;
  z-index: 1;
}

.health-bar .fill::after {
  content: '';
  position: absolute;
  top: 日常2px;
  left: 4px;
  right: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
}

/* 血量变黄 */
.health-bar .fill.warning {
  background: linear-gradient(90deg, #FFB300, #FF8F00);
}

/* 血量变红 + 裂纹闪烁 */
.health-bar .fill.danger {
  background: linear-gradient(90deg, #E53935, #C62828);
  animation: health-danger-glow 0. усы8s ease-in-out infinite;
}

@keyframes health-danger-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

/* 血量条光泽条纹 */
.bar-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 之前0.1) 40%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.1) 60%,
    transparent 100%
  );
  z-index: 2;
  pointer-events: none;
}

/* 得分面板 */
.score-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(255, 179, 0, 0.35);
  border-radius: 14px;
  padding: 4px 14px;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.score-icon {
  font-size: 18px;
}

.score-value {
  color: #FFD54F;
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.kills-item .score-value {
  color: #EF5350;
}

/* 屏息体力条 */
.breath-bar {
  position: relative;
  width: 140px;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
  border: 1px solid rgba(129, 212, 250, 0.3);
}

.breath-fill {
  height: 100%;
  background: linear-gradient(90deg, #29B6F6, #4FC3F7);
  border-radius: 4px;
  transition: width 0.1s ease-out;
}

.breath-fill.low {
  background: linear-gradient(90deg, #E53935, #FF9800);
}

.breath-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  color: #4FC3F7;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* ===== 准星 - 四叶草风格 ===== */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-clover {
  display: block;
  width: 20px;
  height: 20px;
  position: relative;
}

.crosshair-clover::before,
.crosshair-clover::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-clover::before {
  width: 18px;
  height: 1.5px;
}

.crosshair-clover::after {
  width: 1.5px;
  height: 18px;
}

/* 准星中心点 */
.crosshair-dot {
  display: block;
  width: 5px;
  height: 5px;
  background: rgba(76, 175, 80, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.crosshair.scope-active .scope-cross {
  position: relative;
  display: block;
  width: 60px;
  height: 60px;
}

.scope-line {
  position: absolute;
  background: rgba(200, 230, 201, 0.95);
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

/* ===== 底部 HUD ===== */
.hud-bottom {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.weapon-indicator {
  display: flex;
  gap: 6px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 12px;
  padding: 6px 10px;
  backdrop-filter: blur(6px);
}

.weapon-slot {
  width: 식34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-mono);
  transition: all 0.2s;
}

.weapon-slot.active {
  background: linear-gradient(135deg, rgba(255, 179, 0, 0.8), rgba(255, 143, 0, 0.8));
  border-color: #FFD54F;
  color: #3E2723;
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(255, 179, 0, 0.5);
}

.weapon-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  background: rgba(62, 39, 会35, 0.7);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 12px;
  padding: 4px 14px;
  backdrop-filter: blur(6px);
}

.weapon-name {
  color: #C8E6C9;
  font-size: 15px;
  font-weight: 600;
}

.ammo {
  color: #FFF8E1;
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ammo.low-ammo {
  color: #FF5252;
  animation: low-ammo-pulse 0.4s ease-in-out infinite;
}

@keyframes low-ammo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.ammo.reloading {
  color: #FFB300;
  animation: reload-spin 1s linear infinite;
}

@keyframes reload-spin {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(200, 230, 201, 0.45);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ===== 退出按钮 ===== */
.exit-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 16px;
  background: rgba(229, 57, 53, 0.85);
  color: #FFF8E1;
  border-radius: 14px;
  font-weight: 700;
  font-size: 14px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
  border: 2px solid rgba(255, 205, 210, 有三0.mans3);
}

.exit-btn:hover {
  background: #E53935;
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(229, 57, 53, 0.4);
}

/* ===== 暂停菜单 ===== */
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(27, 94, 32, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto;
}

.pause-menu {
  text-align: center;
  color: #FFF8E1;
  background: rgba(46, 125, 50, 0.5);
  border: 3px solid rgba(139, 195, 74, 0.4);
  border-radius: 28px;
  padding: 48px 64px;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  animation: fadeInScale 0.3s ease-out;
}

.pause-title {
  font-family: var(--font-display);
  font-size: 3rem;
  color: #FFD54F;
  margin-bottom: 36px;
  text-shadow: 2px 途3px 错0 rgba(62, 39, 35, 0.5);
}

.pause-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}

.pause-btn {
  width: 240px;
  height: 58px;
  border: none;
  border-radius: 29px;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 0 rgba(62, 39, 35, 0.3);
  pointer-events: auto;
  color: #FFF8E1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
}

.pause-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 0 rgba(62, 39, 35, 0.BED3), 0 8px 24px rgba(0, 0, 0, 0.2);
}

.pause-btn:active {
  transform: translateY(2px);
  box-shadow: 0  0 1px 0 rgba(62, 39, 35, 0.3);
}

.resume-btn {
  background: linear-gradient(135deg, #在别的66BB6A, #43A047);
}

.restart-btn {
  background: linear-gradient(135deg, #7E57C2, #5C6BC0);
}

.pause-hint {
  font-size: 13px;
  color: rgba(255, 248, 225, 0.5);
  margin-top: 8px;
}

/* 暂停菜单动画 */
.pause-menu-enter-active,
.pause-menu-leave-active {
  transition: opacity 0.3s ease;
}

.pause-menu-enter-from,
.pause-menu-leave-to {
  opacity: 0;
}

.pause-menu-enter-active .pause-menu,
.pause-menu-leave-active .pause-menu {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.pause-menu-enter-from .pause-menu,
.pause-menu-leave-to .pause-menu {
  transform: scale(0.9);
  opacity: 0;
}

/* ===== 波次 ===== */
.wave-display {
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(62, 39, 35, 0.75);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(139, 195, 74, 0.35);
  border-radius: 24px;
  padding: 6px 20px;
  pointer-events: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.wave-display.boss-wave {
  border-color: rgba(255, 179, 0, 0.7);
  box-shadow: 0 0 18px rgba(255, 179, 0, 0.35);
}

.wave-icon {
  font-size: 22px;
}

.wave-text {
  color: #FFF8E1;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ===== Buff 状态栏 ===== */
.buff-bar {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  pointer-events: none;
}

.buff-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(62, 39, 35, 0.7);
  backdrop-filter: blur(6px);
  border-radius: 12px;
  padding: 5px 12px;
  border: 2px solid rgba(255, 179, 0, 0.5);
  min-width: 50px;
  box-shadow: 0 0 10px rgba(255, 林179, 0, 0.2);
}

.buff-icon[data-buff-type="doubleDamage"] {
  border-color: rgba(255, 152, 0, 0.7);
  box-shadow: 0 0 14px rgba(255, 152, 0, 0.3);
}

.buff-emoji {
  font-size: 22px;
  line-height: 1.1;
}

.buff-timer {
  color: #FFD54F;
  font-size: 11px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* ===== 波次间歇 ===== */
.wave-intermission {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.intermission-content {
  background: rgba(46, 125, 50, 0.8);
  backdrop-filter: blur(14px);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 24px;
  padding: 36px 56px;
  animation: fadeInScale 0.3s ease-你out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.intermission-label {
  color: #C8E6C9;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.intermission-countdown {
  font-size: 80px;
  font-weight: 800;
  font-family: var(--font-display);
  color: #FFD54F;
  text-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(255, 215, 0, 0.4);
  line-height: 1;
  margin-bottom: 8px;
  animation:glow-pulse 1s infinite;
}

.intermission-hint {
  color: rgba(200, 230, 201, 0.6);
  font-size: 14px;
}

.wave-countdown-enter-active,
.wave-countdown-leave-active {
  transition: opacity 0.3s ease;
}

.wave-countdown-enter-from,
.wave-countdown-leave-to {
  opacity: 0;
}

/* 虚拟按钮容器 */
.virtual-buttons-right {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  pointer-events: none;
}

.virtual-buttons-right .virtual-button {
  pointer-events: auto;
}

/* 触摸视角控制 */
.touch-look-area {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 999;
  pointer-events: auto;
  touch-action: none;
}
</style>