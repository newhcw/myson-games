<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  resume: []
  restart: []
  exit: []
}>()
</script>

<template>
  <transition name="pause-menu">
    <div v-if="visible" class="pause-overlay">
      <div class="pause-menu">
        <h2 class="pause-title">游戏暂停</h2>
        <div class="pause-buttons">
          <button class="pause-btn resume-btn" @click="emit('resume')">
            <span>继续游戏</span>
          </button>
          <button class="pause-btn restart-btn" @click="emit('restart')">
            <span>重新开始</span>
          </button>
          <button class="pause-btn exit-btn" @click="emit('exit')">
            <span>退出游戏</span>
          </button>
        </div>
        <p class="pause-hint">按 ESC 继续游戏</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
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
  text-shadow: 2px 3px 0 rgba(62, 39, 35, 0.5);
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
  box-shadow: 0 6px 0 rgba(62, 39, 35, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
}

.pause-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 1px 0 rgba(62, 39, 35, 0.3);
}

.resume-btn {
  background: linear-gradient(135deg, #66BB6A, #43A047);
}

.restart-btn {
  background: linear-gradient(135deg, #7E57C2, #5C6BC0);
}

.exit-btn {
  background: linear-gradient(135deg, #EF5350, #E53935);
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
</style>