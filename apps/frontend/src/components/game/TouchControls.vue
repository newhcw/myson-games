<script setup lang="ts">
import VirtualJoystick from '@/components/game/VirtualJoystick.vue'
import VirtualButton from '@/components/game/VirtualButton.vue'

defineProps<{
  isTouchDevice: boolean
}>()

const emit = defineEmits<{
  'virtual-move': [delta: { x: number; y: number }]
  'virtual-stop': []
  'virtual-button-press': [type: string]
  'virtual-button-release': [type: string]
  'touch-look-start': [e: TouchEvent]
  'touch-look-move': [e: TouchEvent]
  'touch-look-end': [e: TouchEvent]
}>()

const onVirtualMove = (delta: { x: number; y: number }) => {
  emit('virtual-move', delta)
}

const onVirtualStop = () => {
  emit('virtual-stop')
}

const onVirtualButtonPress = (type: string) => {
  emit('virtual-button-press', type)
}

const onVirtualButtonRelease = (type: string) => {
  emit('virtual-button-release', type)
}

const onTouchLookStart = (e: TouchEvent) => {
  emit('touch-look-start', e)
}

const onTouchLookMove = (e: TouchEvent) => {
  emit('touch-look-move', e)
}

const onTouchLookEnd = (e: TouchEvent) => {
  emit('touch-look-end', e)
}
</script>

<template>
  <template v-if="isTouchDevice">
    <!-- 左侧虚拟摇杆（移动） -->
    <VirtualJoystick
      @move="onVirtualMove"
      @stop="onVirtualStop"
    />

    <!-- 右侧虚拟按钮 -->
    <div class="virtual-buttons-right">
      <VirtualButton label="射击" type="shoot" @press="onVirtualButtonPress" @release="onVirtualButtonRelease" />
      <VirtualButton label="跳跃" type="jump" @press="onVirtualButtonPress" @release="onVirtualButtonRelease" />
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
</template>

<style scoped>
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

.virtual-buttons-right :deep(.virtual-button) {
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