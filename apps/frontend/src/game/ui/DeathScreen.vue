<template>
  <div v-if="visible" class="death-screen">
    <div class="overlay"></div>
    <div class="forest-particles">
      <span v-for="i in 8" :key="'leaf-'+i" class="particle leaf" :style="{ left: (i * 12 + Math.random() * 8) + '%', animationDelay: (i * 0.4) + 's' }">🍂</span>
    </div>
    <div class="content">
      <div class="wreath">🌿 💀 🌿</div>
      <h1 class="title">勇者倒下了...</h1>
      <p class="subtitle">但森林会记住你的勇气</p>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⏱️</span>
          </div>
          <span class="stat-label">存活时间</span>
          <span class="stat-value">{{ formatTime(survivalTime) }}</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⚔️</span>
          </div>
          <span class="stat-label">击败敌人</span>
          <span class="stat-value">{{ kills }}</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⭐</span>
          </div>
          <span class="stat-label">获得星星</span>
          <span class="stat-value">{{ score }}</span>
        </div>
      </div>

      <div class="buttons">
        <button class="btn btn-primary" @click="onRestart">
          <span class="btn-icon">🌱</span>
          <span>再次挑战</span>
        </button>
        <button class="btn btn-secondary" @click="onGoHome">
          <span class="btn-icon">🏕️</span>
          <span>返回营地</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

interface Props {
  visible: boolean
  survivalTime: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'restart'): void
  (e: 'go-home'): void
}>()

const gameStore = useGameStore()

const kills = computed(() => gameStore.kills)
const score = computed(() => gameStore.score)

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const onRestart = () => {
  emit('restart')
}

const onGoHome = () => {
  emit('go-home')
}
</script>

<style scoped>
.death-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(27, 94, 32, 0.92);
  backdrop-filter: blur(6px);
}

/* 飘落粒子 */
.forest-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle {
  position: absolute;
  top: -30px;
  font-size: 20px;
  animation: particle-fall 6s ease-in infinite;
  opacity: 0.7;
}

@keyframes particle-fall {
  0% { transform: translateY(-5vh) rotate(0deg); opacity: 0.7; }
  10% { opacity: 1; }
  90% { opacity: 0.6; }
  100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.wreath {
  font-size: 28px;
  margin-bottom: 8px;
  letter-spacing: 8px;
}

.title {
  font-family: var(--font-display);
  font-size: 56px;
  color: #FF5252;
  margin-bottom: 4px;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
  animation: death-title-pulse 2.5s ease-in-out infinite;
}

@keyframes death-title-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.03); opacity: 1; }
}

.subtitle {
  color: rgba(200, 230, 201, 0.8);
  font-size: 18px;
  margin-bottom: 36px;
  font-weight: 500;
}

.stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 44px;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255, 248, 225, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 130px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(139, 195, 74, 0.3);
  transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 179, 0, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 179, 0, 0.15);
  border-radius: 50%;
  margin-bottom: 4px;
}

.stat-icon {
  font-size: 24px;
}

.stat-label {
  font-size: 13px;
  color: rgba(200, 230, 201, 0.7);
  font-weight: 600;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #FFD54F;
  font-family: var(--font-mono);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-body);
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;
}

.btn:hover {
  transform: scale(1.05) translateY(-2px);
}

.btn:active {
  transform: scale(0.97);
}

.btn .btn-icon {
  font-size: 22px;
}

.btn-primary {
  background: linear-gradient(135deg, #66BB6A, #43A047);
  color: #FFF8E1;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
}

.btn-secondary {
  background: rgba(255, 248, 225, 0.1);
  color: #C8E6C9;
  border: 2px solid rgba(139, 195, 74, 0.35);
}

.btn-secondary:hover {
  background: rgba(255, 248, 225, 0.18);
  border-color: rgba(139, 195, 74, 0.6);
}

@media (max-width: 768px) {
  .title { font-size: 40px; }
  .stats { gap: 12px; }
  .stat-card { padding: 16px 20px; min-width: 100px; }
  .stat-value { font-size: 24px; }
}
</style>
