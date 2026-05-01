<template>
  <div v-if="visible" class="victory-screen">
    <div class="overlay"></div>
    <div class="content">
      <h1 class="title">🎉 通关！</h1>

      <div class="wave-badge">第 10 / 10 波完成</div>

      <div class="stats">
        <div class="stat-card">
          <span class="stat-icon">⏱️</span>
          <span class="stat-label">存活时间</span>
          <span class="stat-value">{{ formatTime(survivalTime) }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-icon">💀</span>
          <span class="stat-label">击杀数</span>
          <span class="stat-value">{{ kills }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-icon">⭐</span>
          <span class="stat-label">得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
      </div>

      <div class="buttons">
        <button class="btn btn-primary" @click="onRestart">
          🔄 重新开始
        </button>
        <button class="btn btn-secondary" @click="onGoHome">
          🏠 返回主页
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
.victory-screen {
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
  background: rgba(0, 0, 0, 0.85);
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.title {
  font-size: 64px;
  color: #FFD700;
  margin-bottom: 12px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}

.wave-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
  font-size: 18px;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 20px;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
}

.stats {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 48px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.4);
}

.stat-icon {
  font-size: 36px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;
}

.btn:hover {
  transform: scale(1.05);
}

.btn-primary {
  background: linear-gradient(135deg, #34C759, #30D158);
  color: #fff;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 16px rgba(52, 199, 89, 0.6);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
