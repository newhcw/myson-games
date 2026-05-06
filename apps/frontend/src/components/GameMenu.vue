<template>
  <div class="game-menu">
    <!-- 天空背景 -->
    <div class="menu-background">
      <!-- 太阳光晕 -->
      <div class="sun-glow"></div>

      <!-- 背景图层：远山 -->
      <div class="bg-layer bg-mountains"></div>

      <!-- 背景图层：森林剪影 -->
      <div class="bg-layer bg-forest-back"></div>
      <div class="bg-layer bg-forest-front"></div>

      <!-- 背景图层：草地 -->
      <div class="bg-layer bg-meadow"></div>

      <!-- 飘落的叶子 -->
      <div
        v-for="leaf in leaves"
        :key="leaf.id"
        class="falling-leaf"
        :style="leaf.style"
      >{{ leaf.emoji }}</div>

      <!-- 萤火虫光点 -->
      <div
        v-for="firefly in fireflies"
        :key="firefly.id"
        class="firefly"
        :style="firefly.style"
      ></div>

      <!-- 游戏标题 -->
      <div class="title-container">
        <div class="title-wreath">
          <span class="wreath-leaf left">🌿</span>
          <h1 class="game-title">
            <span class="title-line">肉肉</span>
            <span class="title-line accent">森林大冒险</span>
          </h1>
          <span class="wreath-leaf right">🌿</span>
        </div>
        <div class="title-decoration">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>
      </div>

      <!-- 主菜单按钮 -->
      <div class="menu-buttons">
        <button class="menu-button start-button" @click="startGame">
          <span class="button-text">⚔️开始冒险</span>
          <span class="btn-shine"></span>
        </button>

        <button
          v-if="hasSave"
          class="menu-button continue-button"
          @click="continueGame"
        >
          <span class="btn-icon">📜</span>
          <span class="button-text">继续冒险</span>
          <span class="btn-shine"></span>
        </button>

        <button class="menu-button settings-button" @click="showSettings">
          <span class="btn-icon">🔮</span>
          <span class="button-text">魔法设置</span>
          <span class="btn-shine"></span>
        </button>

        <button class="menu-button exit-button" @click="exitGame">
          <span class="btn-icon">🏰</span>
          <span class="button-text">离开森林</span>
          <span class="btn-shine"></span>
        </button>
      </div>

      <!-- 底部装饰 -->
      <div class="bottom-decoration">
        <span class="mushroom">🍄</span>
        <span class="flower">🌸</span>
        <span class="mushroom">🍄</span>
        <span class="flower">🌼</span>
        <span class="mushroom">🍄</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { storageManager } from '@/game/storage/StorageManager'

const router = useRouter()
const hasSave = ref(false)

// 随机生成飘落叶子和萤火虫
const leaves = ref([])
const fireflies = ref([])

const generateDecorations = () => {
  const leafEmojis = ['🍃', '🌿', '🍂', '🍁', '🌱']

  for (let i = 0; i < 12; i++) {
    const leaf = leafEmojis[Math.floor(Math.random() * leafEmojis.length)]
    const left = Math.random() * 100
    const delay = Math.random() * 15
    const duration = 8 + Math.random() * 10
    const size = 16 + Math.random() * 20
    const sway = Math.random() * 150 - 75

    leaves.value.push({
      id: i,
      emoji: leaf,
      style: {
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}px`,
        '--sway': `${sway}px`,
      },
    })
  }

  for (let i = 0; i < 20; i++) {
    fireflies.value.push({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${30 + Math.random() * 60}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
      },
    })
  }
}

onMounted(() => {
  hasSave.value = storageManager.hasSave()
  generateDecorations()
})

const startGame = () => {
  router.push('/game')
}

const continueGame = () => {
  router.push({ path: '/game', query: { continue: 'true' } })
}

const showSettings = () => {
  router.push('/settings')
}

const exitGame = () => {
  router.push('/goodbye')
}
</script>

<style scoped>
.game-menu {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: var(--font-body);
}

/* ===== 背景 ===== */
.menu-background {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    #87CEEB 0%,
    #B8E6F0 25%,
    #C8E6C9 55%,
    #A5D6A7 75%,
    #66BB6A 100%
  );
  overflow: hidden;
}

/* 太阳光晕 */
.sun-glow {
  position: absolute;
  top: 8%;
  right: 20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 245, 157, 0.8), rgba(255, 235, 59, 0.3), transparent 70%);
  border-radius: 50%;
  animation: sun-pulse 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sun-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* 背景图层 */
.bg-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.bg-mountains {
  bottom: 40%;
  height: 200px;
  background: linear-gradient(180deg, transparent, rgba(144, 190, 109, 0.4), rgba(144, 190, 109, 0.6));
  clip-path: polygon(
    0% 100%, 10% 30%, 20% 60%, 30% 20%, 40% 50%,
    50% 15%, 60% 45%, 70% 25%, 80% 55%, 90% 30%, 100% 100%
  );
}

.bg-forest-back {
  bottom: 20%;
  height: 300px;
  background: linear-gradient(180deg, transparent, rgba(56, 142, 60, 0.5), rgba(56, 142, 60, 0.7));
  clip-path: polygon(
    0% 80%, 5% 40%, 10% 70%, 15% 30%, 20% 60%,
    25% 45%, 30% 75%, 35% 35%, 40% 55%, 45% 40%,
    50% 70%, 55% 35%, 60% 50%, 65% 30%, 70% 65%,
    75% 45%, 80% 55%, 85% 35%, 90% 60%, 95% 40%, 100% 80%
  );
}

.bg-forest-front {
  bottom: 10%;
  height: 250px;
  background: linear-gradient(180deg, transparent, rgba(46, 125, 50, 0.6), rgba(27, 94, 32, 0.8));
  clip-path: polygon(
    0% 90%, 8% 50%, 18% 75%, 25% 35%, 35% 60%,
    42% 45%, 50% 70%, 58% 40%, 65% 55%, 75% 35%,
    82% 65%, 90% 45%, 100% 80%
  );
}

.bg-meadow {
  bottom: 0;
  height: 15%;
  background: linear-gradient(180deg, #66BB6A, #43A047, #2E7D32);
  border-radius: 60% 80% 0% 0% / 30% 40% 0% 0%;
}

/* ===== 飘落叶子 ===== */
.falling-leaf {
  position: absolute;
  top: -40px;
  opacity: 0;
  animation: leaf-fall linear infinite;
  pointer-events: none;
  z-index: 1;
  text-shadow: 0 0 6px rgba(139, 195, 74, 0.5);
}

@keyframes leaf-fall {
  0% {
    transform: translateY(-5vh) rotate(0deg) translateX(0);
    opacity: 0;
  }
  8% { opacity: 0.9; }
  92% { opacity: 0.8; }
  100% {
    transform: translateY(105vh) rotate(720deg) translateX(var(--sway, 50px));
    opacity: 0;
  }
}

/* ===== 萤火虫 ===== */
.firefly {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #FFEB3B, #FFC107, transparent);
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  animation: firefly-glow 3s ease-in-out infinite;
  box-shadow:
    0 0 6px 2px rgba(255, 235, 59, 0.6),
    0 0 12px 4px rgba(255, 193, 7, 0.3);
}

@keyframes firefly-glow {
  0%, 100% { opacity: 0.15; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1.5); }
}

/* ===== 标题区域 ===== */
.title-container {
  margin-bottom: 32px;
  text-align: center;
  z-index: 10;
  animation: title-float 4s ease-in-out infinite;
}

@keyframes title-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.title-wreath {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.wreath-leaf {
  font-size: 40px;
  animation: leaf-wobble 3s ease-in-out infinite;
}

.wreath-leaf.right {
  animation-delay: 0.5s;
}

@keyframes leaf-wobble {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

.game-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin: 0;
  font-family: var(--font-display);
}

.title-line {
  font-size: 3.8rem;
  line-height: 1.1;
  color: #3E2723;
  text-shadow:
    2px 2px 0 #FFF8E1,
    -2px -2px 0 #FFF8E1,
    2px -2px 0 #FFF8E1,
    -2px 2px 0 #FFF8E1,
    4px 4px 0 rgba(62, 39, 35, 0.2);
  letter-spacing: 4px;
}

.title-line.accent {
  font-size: 4.5rem;
  background: linear-gradient(180deg, #FFD54F 0%, #FF8F00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.title-line.accent::after {
  content: '森林大冒险';
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 4px rgba(62, 39, 35, 0.35);
  text-stroke: 4px rgba(62, 39, 35, 0.35);
  pointer-events: none;
}

/* 标题下方装饰 */
.title-decoration {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
  color: #FFB300;
  font-size: 14px;
  animation: glow-pulse 2s infinite;
}

/* ===== 按钮 ===== */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  z-index: 10;
}

.menu-button {
  width: 300px;
  height: 72px;
  border: 3px solid rgba(62, 39, 35, 0.25);
  border-radius: 36px;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.3s ease;
  box-shadow: 0 4px 0 rgba(62, 39, 35, 0.3), 0 4px 16px rgba(46, 125, 50, 0.18);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 28px;
  color: #FFF8E1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transform: translateY(0);
}

.menu-button:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 8px 0 rgba(62, 39, 35, 0.25), 0 12px 32px rgba(46, 125, 50, 0.3);
}

.menu-button:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 1px 0 rgba(62, 39, 35, 0.2);
}

.btn-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.button-text {
  letter-spacing: 2px;
}

/* 按钮光泽效果 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.5s ease;
}

.menu-button:hover .btn-shine {
  left: 125%;
}

/* 按钮颜色变体 */
.start-button {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border-color: #E55A5A;
}

.continue-button {
  background: linear-gradient(135deg, #66BB6A, #43A047);
  border-color: #388E3C;
}

.settings-button {
  background: linear-gradient(135deg, #7E57C2, #5C6BC0);
  border-color: #5E35B1;
}

.exit-button {
  background: linear-gradient(135deg, #FFB300, #FF8F00);
  border-color: #F57F17;
  color: #3E2723;
  text-shadow: none;
}

/* ===== 底部装饰 ===== */
.bottom-decoration {
  position: absolute;
  bottom: 20px;
  display: flex;
  gap: 20px;
  z-index: 3;
  font-size: 28px;
  animation: float 4s ease-in-out infinite;
  pointer-events: none;
}

.bottom-decoration .mushroom:nth-child(odd),
.bottom-decoration .flower:nth-child(even) {
  animation: float 3.5s ease-in-out infinite 0.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .title-line { font-size: 2.4rem; }
  .title-line.accent { font-size: 2.8rem; }
  .wreath-leaf { font-size: 28px; }

  .menu-button {
    width: 250px;
    height: 62px;
    font-size: 1.2rem;
  }

  .btn-icon { font-size: 22px; }
}
</style>
