<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 游戏注册表
const games = ref([
  {
    id: 'fps-shooter',
    name: '小小神枪手',
    description: '有趣的第一人称射击游戏',
    icon: '🎮',
    color: '#4A90D9',
  },
])

const enterGame = (gameId: string) => {
  router.push({ name: 'Game', query: { game: gameId } })
}
</script>

<template>
  <div class="home">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">🎯</span>
        <h1>儿童游戏平台</h1>
      </div>
      <nav class="nav">
        <button class="nav-btn" @click="router.push({ name: 'Settings' })">
          <span>⚙️</span> 设置
        </button>
      </nav>
    </header>

    <main class="main">
      <section class="hero">
        <h2>欢迎来到游戏世界！</h2>
        <p>选择一个游戏开始冒险吧</p>
      </section>

      <section class="game-grid">
        <div
          v-for="game in games"
          :key="game.id"
          class="game-card"
          :style="{ '--card-color': game.color }"
          @click="enterGame(game.id)"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
          </div>
          <div class="play-btn">
            <span>开始游戏</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p> © 2026 儿童游戏平台 - 健康游戏，快乐成长</p>
    </footer>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  font-size: 32px;
}

.logo h1 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin: 0;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.nav-btn:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.main {
  flex: 1;
  padding: var(--spacing-2xl);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.hero {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.hero h2 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.hero p {
  color: var(--color-text-light);
  font-size: var(--font-size-lg);
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.game-card {
  background: var(--color-bg-card);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.game-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
}

.game-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--card-color);
}

.game-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.game-info h3 {
  color: var(--card-color);
  margin-bottom: var(--spacing-xs);
}

.game-info p {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--card-color);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  font-weight: 600;
  transition: all var(--transition-base);
}

.game-card:hover .play-btn {
  gap: var(--spacing-md);
}

.arrow {
  transition: transform var(--transition-base);
}

.game-card:hover .arrow {
  transform: translateX(4px);
}

.footer {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  background: var(--color-bg-card);
}
</style>