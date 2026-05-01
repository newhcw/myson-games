<template>
  <button
    class="virtual-button"
    :class="[type, { active: isActive }]"
    @touchstart.prevent="onTouchStart"
    @touchend.prevent="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <span class="button-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label: string
  type: 'shoot' | 'jump' | 'crouch' | 'reload' | 'scope'
}>()

const emit = defineEmits<{
  (e: 'press', type: string): void
  (e: 'release', type: string): void
}>()

const isActive = ref(false)

const onTouchStart = () => {
  isActive.value = true
  emit('press', props.type)
}

const onTouchEnd = () => {
  isActive.value = false
  emit('release', props.type)
}
</script>

<style scoped>
.virtual-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.virtual-button.active {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
  border-color: rgba(255, 255, 255, 0.8);
}

.button-label {
  pointer-events: none;
}

/* 不同按钮样式 */
.shoot {
  background: rgba(255, 59, 48, 0.4);
  border-color: rgba(255, 59, 48, 0.6);
}

.shoot.active {
  background: rgba(255, 59, 48, 0.6);
}

.jump {
  background: rgba(52, 199, 89, 0.4);
  border-color: rgba(52, 199, 89, 0.6);
}

.jump.active {
  background: rgba(52, 199, 89, 0.6);
}

.crouch {
  background: rgba(0, 122, 255, 0.4);
  border-color: rgba(0, 122, 255, 0.6);
}

.reload {
  background: rgba(255, 149, 0, 0.4);
  border-color: rgba(255, 149, 0, 0.6);
}

.scope {
  background: rgba(175, 82, 222, 0.4);
  border-color: rgba(175, 82, 222, 0.6);
}
</style>
