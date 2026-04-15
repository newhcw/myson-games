<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'
import { collisionDetector } from '@/game/utils/Collision'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { DEFAULT_WEAPONS } from '@/game/weapons/types'
import { soundManager } from '@/game/sound/SoundManager'

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
  return gameStore.health
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

  // Add some obstacles
  createObstacles()

  isLoading.value = false
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
    // Weapon switching (1-5)
    case '1': weaponStore.switchWeapon(0); break
    case '2': weaponStore.switchWeapon(1); break
    case '3': weaponStore.switchWeapon(2); break
    case '4': weaponStore.switchWeapon(3); break
    case '5': weaponStore.switchWeapon(4); break
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
    // Play fire sound
    soundManager.playShoot()
  } else {
    // Play empty click if no ammo
    soundManager.playEmpty()
  }
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

    <!-- HUD -->
    <div v-if="!isLoading" class="hud">
      <div class="hud-top">
        <div class="health-bar">
          <span class="label">生命值</span>
          <div class="bar">
            <div class="fill" :style="{ width: healthPercent + '%' }"></div>
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
        <p>WASD 移动 | 鼠标控制视角 | 1-5/Q 切换武器 | R 换弹 | 右键倍镜</p>
      </div>
    </div>

    <button class="exit-btn" @click.stop="exitGame">退出游戏</button>
  </div>
</template>

<style scoped>
.game-room {
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
  position: relative;
  cursor: pointer;
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
  transition: width 0.3s;
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