<template>
  <div
    class="virtual-joystick"
    :class="{ active: isActive }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="joystick-base" ref="baseRef">
      <div
        class="joystick-thumb"
        :style="thumbStyle"
      ></div>
    </div>
    <div v-if="!isActive" class="joystick-hint">移动</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'move', direction: { x: number; y: number }): void
  (e: 'stop'): void
}>()

const isActive = ref(false)
const baseRef = ref<HTMLDivElement | null>(null)
const thumbPosition = ref({ x: 0, y: 0 })
const basePosition = ref({ x: 0, y: 0, radius: 50 })

const thumbStyle = computed(() => ({
  transform: `translate(${thumbPosition.value.x}px, ${thumbPosition.value.y}px)`,
}))

const onTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  isActive.value = true

  const touch = e.touches[0]
  const rect = baseRef.value?.getBoundingClientRect()
  if (rect) {
    basePosition.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: rect.width / 2,
    }
  }

  updateThumb(touch)
}

const onTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  if (!isActive.value) return

  const touch = e.touches[0]
  updateThumb(touch)
}

const onTouchEnd = (e: TouchEvent) => {
  e.preventDefault()
  isActive.value = false
  thumbPosition.value = { x: 0, y: 0 }
  emit('stop')
}

const updateThumb = (touch: Touch) => {
  const dx = touch.clientX - basePosition.value.x
  const dy = touch.clientY - basePosition.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxDistance = basePosition.value.radius

  if (distance <= maxDistance) {
    thumbPosition.value = { x: dx, y: dy }
  } else {
    // 限制在大圆内
    const scale = maxDistance / distance
    thumbPosition.value = { x: dx * scale, y: dy * scale }
  }

  // 计算方向（-1 到 1）
  const direction = {
    x: thumbPosition.value.x / maxDistance,
    y: -thumbPosition.value.y / maxDistance, // 反转Y轴（屏幕坐标 vs 游戏坐标）
  }

  emit('move', direction)
}
</script>

<style scoped>
.virtual-joystick {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
}

.joystick-base {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  position: relative;
  transition: background 0.2s;
}

.virtual-joystick.active .joystick-base {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.joystick-thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  transform: translate(-50%, -50%);
  transition: transform 0.05s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.joystick-hint {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  white-space: nowrap;
}
</style>
