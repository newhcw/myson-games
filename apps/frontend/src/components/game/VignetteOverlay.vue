<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  intensity: number
}>(), {
  visible: false,
  intensity: 0.7,
})

const vignetteStyle = computed(() => ({
  opacity: props.visible ? 1 : 0,
  background: `radial-gradient(circle at center, transparent ${50 - props.intensity * 20}%, rgba(0, 0, 0, ${props.intensity}) 100%)`,
}))
</script>

<template>
  <div class="vignette-overlay" :style="vignetteStyle">
    <div class="vignette-edge top"></div>
    <div class="vignette-edge bottom"></div>
    <div class="vignette-edge left"></div>
    <div class="vignette-edge right"></div>
  </div>
</template>

<style scoped>
.vignette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  transition: opacity 0.2s ease-in-out;
}

.vignette-edge {
  position: absolute;
  background: inherit;
}

.vignette-edge.top {
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
}

.vignette-edge.bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.vignette-edge.left {
  top: 0;
  bottom: 0;
  left: 0;
  width: 30%;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.6), transparent);
}

.vignette-edge.right {
  top: 0;
  bottom: 0;
  right: 0;
  width: 30%;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.6), transparent);
}
</style>