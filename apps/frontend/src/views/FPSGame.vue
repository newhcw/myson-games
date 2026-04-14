<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'

const router = useRouter()
const isLoading = ref(true)
const containerRef = ref<HTMLDivElement | null>(null)

// Three.js objects
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationId: number = 0

// Player state
const playerPosition = new THREE.Vector3(0, 1.6, 0)
const moveSpeed = 5
const keys = { w: false, a: false, s: false, d: false }

// Mouse look
let yaw = 0
let pitch = 0

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
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = true; break
    case 'a': keys.a = true; break
    case 's': keys.s = true; break
    case 'd': keys.d = true; break
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

  if (document.pointerLockElement !== containerRef.value) {
    try {
      await containerRef.value.requestPointerLock()
    } catch (err) {
      console.error('Failed to lock pointer:', err)
    }
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

    playerPosition.x += direction.x * moveSpeed * delta
    playerPosition.z += direction.z * moveSpeed * delta
  }

  camera.position.copy(playerPosition)
}

let lastTime = performance.now()

const gameLoop = () => {
  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  updateMovement(delta)

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

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  document.addEventListener('mousemove', handleMouseMove)

  // Start game loop after a brief delay to ensure scene is loaded
  setTimeout(() => {
    gameLoop()
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', handleMouseMove)

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
            <div class="fill" style="width: 100%"></div>
          </div>
        </div>
        <div class="score">
          <span>得分: 0</span>
        </div>
      </div>

      <div class="crosshair">+</div>

      <div class="hud-bottom">
        <div class="weapon-info">
          <span class="weapon-name">手枪</span>
          <span class="ammo">12 / ∞</span>
        </div>
      </div>

      <div class="controls-hint">
        <p>WASD 移动 | 鼠标控制视角 | 点击画面锁定鼠标</p>
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
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 24px;
  font-weight: 300;
}

.hud-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
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