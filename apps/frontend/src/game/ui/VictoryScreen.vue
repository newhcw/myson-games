<template>
  <div v-if="visible" class="victory-screen">
    <div class="overlay"></div>

    <!-- 庆祝粒子 -->
    <div class="celebration-particles">
      <span v-for="i in 15" :key="i" class="confetti" :style="{
        left: (i * 6 + Math.random() * 10) + '%',
        animationDelay: (i * 0.25) + 's',
        animationDuration: (3 + Math.random() * 3) + 's',
        fontSize: (14 + Math.random() * 20) + 'px',
      }">{{ confettiEmojis[i % confettiEmojis.length] }}</span>
    </div>

    <div class="content">
      <div class="crown-glow">👑</div>
      <h1 class="title">森林之光！</h1>
      <p class="subtitle">你成功守护了魔法森林</p>

      <div class="wave-badge">
        <span>🌟</span>
        <span>第 10 / 10 波完成</span>
        <span>🌟</span>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⏱️</span>
          </div>
          <span class="stat-label">冒险时长</span>
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
          <span>再来一次</span>
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

const confettiEmojis = ['🌟', '✨', '🍀', '🌸', '🌼', '💫', '🎉', '🏆']

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
  background: radial-gradient(ellipse at center, rgba(27, 94, 32, 0.85), rgba(0, 0, 0, 0.95));
  backdrop-filter: blur(4px);
}

/* 庆祝粒子 */
.celebration-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -30px;
  animation: confetti-fall ease-out infinite;
  opacity: 0.85;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-5vh) rotate(0deg) scale(0.5);
    opacity: 0;
  }
  10% { opacity: 1; transform: scale(1); }
  90% { opacity: 0.7; }
  100% {
    transform: translateY(105vh) rotate(720deg) scale(0.8);
    opacity: 0;
  }
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  animation: victory-enter 0.6s ease-out;
}

@keyframes victory-enter {
  from { opacity: 0; transform: scale(0.85) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.crown-glow {
  font-size: 72px;
  margin-bottom: 4px;
  animation: crown-bounce 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
}

@keyframes crown-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-12px) scale(1.1); }
}

.title {
  font-family: var(--font-display);
  font-size: 60px;
  background: linear-gradient(180deg, #FFD54F, #FF8F00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  animation: title-glow 2s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% { filter: drop-shadow(0  2px 4px rgba(0, 0, 0, 0.4)); }
  50% { filter: drop-shadow(0 2px 16px rgba(255, 179, 0, 0.5)); }
}

.subtitle {
  color: rgba(200, 230, 201, 0.9);
  font-size: 20px;
  margin-bottom: 24px;
  font-weight: 500;
}

.wave-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(255, 179, 0, 0.3), rgba(255, 143, 0, 0.2));
  color: #FFD54F;
  font-size: 17px;
  font-weight: 700;
  padding: 10px 28px;
  border-radius: 24px;
  margin-bottom: 36px;
  border: 2px solid rgba(255, 179, 0, 0.4);
  box-shadow: 0 4px 16px rgba(255, 165, 0, 0.3);
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
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
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
  .title { font-size: 42px; }
  .crown-glow { font-size: 56px; }
  .stats { gap: 12px; }
  .stat-card { padding: 16px 20px; min-width: 100px; }
  .stat-value { font-size: 24px; }
}
</style>
