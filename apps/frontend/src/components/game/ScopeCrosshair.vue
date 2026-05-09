<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  active: boolean
  size?: number
  color?: string
}>(), {
  active: false,
  size: 60,
  color: '#C8E6C9',
})

const crosshairStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
}))
</script>

<template>
  <svg
    v-if="active"
    class="scope-crosshair"
    :style="crosshairStyle"
    viewBox="0 0 100 100"
  >
    <!-- 外圈 -->
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      :stroke="color"
      stroke-width="0.5"
      opacity="0.5"
    />
    <!-- 内圈 -->
    <circle
      cx="50"
      cy="50"
      r="30"
      fill="none"
      :stroke="color"
      stroke-width="0.5"
      opacity="0.3"
    />

    <!-- 中心点 -->
    <circle
      cx="50"
      cy="50"
      r="1.5"
      :fill="color"
    />

    <!-- 水平线 - 左 -->
    <line
      x1="5"
      y1="50"
      x2="42"
      y2="50"
      :stroke="color"
      stroke-width="0.8"
      opacity="0.9"
    />
    <!-- 水平线 - 右 -->
    <line
      x1="58"
      y1="50"
      x2="95"
      y2="50"
      :stroke="color"
      stroke-width="0.8"
      opacity="0.9"
    />

    <!-- 垂直线 - 上 -->
    <line
      x1="50"
      y1="5"
      x2="50"
      y2="42"
      :stroke="color"
      stroke-width="0.8"
      opacity="0.9"
    />
    <!-- 垂直线 - 下 -->
    <line
      x1="50"
      y1="58"
      x2="50"
      y2="95"
      :stroke="color"
      stroke-width="0.8"
      opacity="0.9"
    />

    <!-- 刻度线 - 上 -->
    <line
      x1="50"
      y1="15"
      x2="50"
      y2="25"
      :stroke="color"
      stroke-width="1"
    />
    <!-- 刻度线 - 下 -->
    <line
      x1="50"
      y1="75"
      x2="50"
      y2="85"
      :stroke="color"
      stroke-width="1"
    />
    <!-- 刻度线 - 左 -->
    <line
      x1="15"
      y1="50"
      x2="25"
      y2="50"
      :stroke="color"
      stroke-width="1"
    />
    <!-- 刻度线 - 右 -->
    <line
      x1="75"
      y1="50"
      x2="85"
      y2="50"
      :stroke="color"
      stroke-width="1"
    />

    <!-- 数字指示 (MIL-DOT 风格) -->
    <circle cx="50" cy="35" r="0.8" :fill="color" opacity="0.7" />
    <circle cx="50" cy="65" r="0.8" :fill="color" opacity="0.7" />
    <circle cx="35" cy="50" r="0.8" :fill="color" opacity="0.7" />
    <circle cx="65" cy="50" r="0.8" :fill="color" opacity="0.7" />
  </svg>
</template>

<style scoped>
.scope-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  animation: scope-fade-in 0.2s ease-out;
}

@keyframes scope-fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>