<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import * as THREE from 'three'

const props = withDefaults(defineProps<{
  antialias?: boolean
  alpha?: boolean
}>(), {
  antialias: true,
  alpha: false,
})

const emit = defineEmits<{
  (e: 'scene-ready', scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

// Use shallowRef for Three.js objects to avoid reactivity overhead
const scene = shallowRef<THREE.Scene | null>(null)
const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
const frameId = ref<number>(0)

const initScene = () => {
  if (!containerRef.value) return

  // Scene
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0x87CEEB) // Sky blue

  // Camera
  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.value = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.value.position.set(0, 2, 10)
  camera.value.lookAt(0, 0, 0)


  // Renderer
  renderer.value = new THREE.WebGLRenderer({
    antialias: props.antialias,
    alpha: props.alpha,
  })
  renderer.value.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.value.shadowMap.enabled = true
  renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(renderer.value.domElement)

  // 统一尺寸更新
  const updateSize = () => {
    if (!containerRef.value || !camera.value || !renderer.value) return
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    renderer.value.setSize(w, h)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.value.aspect = w / h
    camera.value.updateProjectionMatrix()
  }
  // 初始化立即正确尺寸
  updateSize()


  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.value.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.value.add(directionalLight)

  // Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4CAF50,
    roughness: 0.8,
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.value.add(ground)

  // Emit ready event
  emit('scene-ready', scene.value, camera.value, renderer.value)

  // 刚进页面强制再刷一次尺寸
  setTimeout(updateSize, 100)
}

const animate = () => {
  frameId.value = requestAnimationFrame(animate)

  if (renderer.value && scene.value && camera.value) {
    renderer.value.render(scene.value, camera.value)
  }
}

const handleResize = () => {
  if (!containerRef.value || !camera.value || !renderer.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.value.aspect = width / height
  camera.value.updateProjectionMatrix()
  renderer.value.setSize(width, height)
}

onMounted(() => {
  initScene()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (frameId.value) {
    cancelAnimationFrame(frameId.value)
  }
  if (renderer.value) {
    renderer.value.dispose()
  }
})

// Expose scene objects for external access
defineExpose({
  scene,
  camera,
  renderer,
})
</script>

<template>
  <div ref="containerRef" class="scene-container"></div>
</template>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>