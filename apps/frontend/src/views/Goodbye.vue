<template>
  <div class="goodbye">
    <!-- 夜晚森林背景 -->
    <div class="night-background">
      <!-- 星星 -->
      <div
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="star.style"
      ></div>

      <!-- 月亮 -->
      <div class="moon"></div>

      <!-- 萤火虫 -->
      <div
        v-for="firefly in fireflies"
        :key="firefly.id"
        class="firefly"
        :style="firefly.style"
      ></div>

      <!-- 远山剪影 -->
      <div class="mountains"></div>

      <!-- 森林剪影 -->
      <div class="forest"></div>

      <!-- 地面 -->
      <div class="ground"></div>

      <!-- 告别内容 -->
      <div class="goodbye-content">
        <!-- 小动物角色 -->
        <div class="characters">
          <span class="character fox" :class="{ waving: isWaving }">🦊</span>
          <span class="character owl" :class="{ nodding: isNodding }">🦉</span>
          <span class="character bunny" :class="{ hopping: isHopping }">🐰</span>
        </div>

        <!-- 标题 -->
        <div class="goodbye-title">
          <h1>再见啦，小勇士！</h1>
          <p class="subtitle">森林的大门永远为你敞开~</p>
        </div>

        <!-- 游戏统计 -->
        <div v-if="hasGameData" class="game-stats">
          <div class="stat-card">
            <span class="stat-icon">🏆</span>
            <span class="stat-value">{{ gameStore.score }}</span>
            <span class="stat-label">得分</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💀</span>
            <span class="stat-value">{{ gameStore.kills }}</span>
            <span class="stat-label">击杀</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ formatTime(gameStore.gameTime) }}</span>
            <span class="stat-label">存活时间</span>
          </div>
        </div>

        <!-- 无数据时的文案 -->
        <div v-else class="welcome-text">
          <p>欢迎下次再来森林冒险哦~</p>
          <p class="hint">玩一局之后，这里会显示你的战绩！</p>
        </div>

        <!-- 按钮 -->
        <div class="action-buttons">
          <button class="action-btn play-again" @click="playAgain">
            <span class="btn-icon">🎮</span>
            <span class="btn-text">再玩一次</span>
            <span class="btn-shine"></span>
          </button>
          <button class="action-btn go-home" @click="goHome">
            <span class="btn-icon">🏠</span>
            <span class="btn-text">回家啦</span>
            <span class="btn-shine"></span>
          </button>
        </div>
      </div>

      <!-- 底部装饰 -->
      <div class="bottom-decor">
        <span class="decor-item">🌙</span>
        <span class="decor-item">✨</span>
        <span class="decor-item">🌟</span>
        <span class="decor-item">✨</span>
        <span class="decor-item">🌙</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { storageManager } from '@/game/storage/StorageManager'

const router = useRouter()
const gameStore = useGameStore()

// 动画状态
const isWaving = ref(false)
const isNodding = ref(false)
const isHopping = ref(false)

// 星星
const stars = ref([])
const fireflies = ref([])

// 是否有游戏数据
const hasGameData = computed(() => {
  return gameStore.score > 0 || gameStore.kills > 0 || gameStore.gameTime > 0
})

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 生成星星
const generateStars = () => {
  for (let i = 0; i < 50; i++) {
    stars.value.push({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 40}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      },
    })
  }
}

// 生成萤火虫
const generateFireflies = () => {
  for (let i = 0; i < 15; i++) {
    fireflies.value.push({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${30 + Math.random() * 40}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${3 + Math.random() * 3}s`,
      },
    })
  }
}

// 按钮点击
const playAgain = () => {
  router.push('/game')
}

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  generateStars()
  generateFireflies()

  // 启动角色动画
  setTimeout(() => { isWaving.value = true }, 500)
  setTimeout(() => { isNodding.value = true }, 1200)
  setTimeout(() => { isHopping.value = true }, 1800)
})
</script>

<style scoped>
.goodbye {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.night-background {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(
    180deg,
    #0D1B2A 0%,
    #1B263B 30%,
    #415A77 60%,
    #1B263B 100%
  );
  overflow: hidden;
}

/* 星星 */
.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #FFF;
  border-radius: 50%;
  animation: twinkle ease-in-out infinite;
  box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 月亮 */
.moon {
  position: absolute;
  top: 8%;
  right: 15%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle at 30% 30%, #FFFDE7, #FFF9C4);
  border-radius: 50%;
  box-shadow: 0 0 30px 10px rgba(255, 253, 231, 0.4);
  animation: moon-glow 4s ease-in-out infinite;
}

@keyframes moon-glow {
  0%, 100% { box-shadow: 0 0 30px 10px rgba(255, 253, 231, 0.4); }
  50% { box-shadow: 0 0 50px 20px rgba(255, 253, 231, 0.6); }
}

/* 萤火虫 */
.firefly {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #C8E6C9, #81C784, transparent);
  border-radius: 50%;
  animation: firefly-fly 6s ease-in-out infinite;
  box-shadow: 0 0 8px 3px rgba(200, 230, 201, 0.5);
}

@keyframes firefly-fly {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(30px, -20px) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate(60px, 10px) scale(0.8);
    opacity: 0.8;
  }
  75% {
    transform: translate(30px, 30px) scale(1.1);
    opacity: 1;
  }
}

/* 远山 */
.mountains {
  position: absolute;
  bottom: 25%;
  left: 0;
  right: 0;
  height: 35%;
  background: linear-gradient(180deg, transparent, rgba(27, 38, 59, 0.8), rgba(13, 27, 42, 0.9));
  clip-path: polygon(
    0% 100%, 5% 60%, 15% 80%, 25% 45%, 35% 70%,
    45% 50%, 55% 75%, 65% 40%, 75% 65%, 85% 55%, 95% 70%, 100% 100%
  );
}

/* 森林 */
.forest {
  position: absolute;
  bottom: 10%;
  left: 0;
  right: 0;
  height: 25%;
  background: linear-gradient(180deg, transparent, rgba(13, 27, 42, 0.9), rgba(5, 15, 25, 1));
  clip-path: polygon(
    0% 90%, 5% 50%, 10% 70%, 15% 40%, 20% 60%,
    30% 30%, 40% 55%, 50% 25%, 60% 50%, 70% 35%,
    80% 55%, 90% 45%, 95% 60%, 100% 80%
  );
}

/* 地面 */
.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12%;
  background: linear-gradient(180deg, #1B263B, #0D1B2A);
  border-radius: 50% 50% 0 0 / 20% 20% 0 0;
}

/* 告别内容 */
.goodbye-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 10;
  width: 90%;
  max-width: 600px;
}

/* 角色 */
.characters {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.character {
  font-size: 48px;
  animation: bounce-subtle 2s ease-in-out infinite;
}

.character.fox {
  animation-delay: 0s;
}

.character.fox.waving {
  animation: wave-paw 1s ease-in-out infinite;
}

.character.owl {
  animation-delay: 0.3s;
}

.character.owl.nodding {
  animation: nod-head 1.5s ease-in-out infinite;
}

.character.bunny {
  animation-delay: 0.6s;
}

.character.bunny.hopping {
  animation: hop 0.8s ease-in-out infinite;
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes wave-paw {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

@keyframes nod-head {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

@keyframes hop {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.1); }
}

/* 标题 */
.goodbye-title {
  text-align: center;
}

.goodbye-title h1 {
  font-family: var(--font-display);
  font-size: 2.8rem;
  color: #FFFDE7;
  text-shadow:
    2px 2px 0 #1B263B,
    -2px -2px 0 #1B263B,
    4px 4px 8px rgba(0, 0, 0, 0.4);
  margin: 0 0 8px 0;
}

.goodbye-title .subtitle {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: #A8DADC;
  margin: 0;
}

/* 游戏统计 */
.game-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255, 253, 231, 0.1);
  border: 2px solid rgba(168, 218, 220, 0.3);
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 100px;
  backdrop-filter: blur(4px);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: #FFFDE7;
  font-weight: 700;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: #A8DADC;
}

/* 欢迎文案 */
.welcome-text {
  text-align: center;
  color: #A8DADC;
  font-family: var(--font-body);
  font-size: 1.1rem;
}

.welcome-text p {
  margin: 0 0 8px 0;
}

.welcome-text .hint {
  font-size: 0.95rem;
  opacity: 0.7;
}

/* 按钮 */
.action-buttons {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  width: 200px;
  height: 60px;
  border-radius: 30px;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn:hover {
  transform: translateY(-4px) scale(1.02);
}

.action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 24px;
}

.btn-text {
  color: #FFF8E1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.5s ease;
}

.action-btn:hover .btn-shine {
  left: 120%;
}

.play-again {
  background: linear-gradient(135deg, #66BB6A, #43A047);
  border: 3px solid #388E3C;
}

.go-home {
  background: linear-gradient(135deg, #7E57C2, #5E35B1);
  border: 3px solid #4527A0;
}

/* 底部装饰 */
.bottom-decor {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 16px;
  z-index: 5;
}

.decor-item {
  font-size: 24px;
  animation: float-decor 3s ease-in-out infinite;
}

.decor-item:nth-child(2) { animation-delay: 0.5s; }
.decor-item:nth-child(3) { animation-delay: 1s; }
.decor-item:nth-child(4) { animation-delay: 1.5s; }
.decor-item:nth-child(5) { animation-delay: 2s; }

@keyframes float-decor {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
  50% { transform: translateY(-10px) rotate(10deg); opacity: 1; }
}

/* 响应式 */
@media (max-width: 768px) {
  .goodbye-title h1 {
    font-size: 1.8rem;
  }

  .character {
    font-size: 36px;
  }

  .game-stats {
    gap: 12px;
  }

  .stat-card {
    padding: 12px 16px;
    min-width: 80px;
  }

  .action-btn {
    width: 160px;
    height: 52px;
    font-size: 1rem;
  }
}
</style>