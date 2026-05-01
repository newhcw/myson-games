<template>
  <div class="game-menu">
    <!-- 背景 -->
    <div class="menu-background">
      <!-- 云朵装饰 -->
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>

      <!-- 游戏标题 -->
      <div class="title-container">
        <h1 class="game-title">小勇士大冒险</h1>
        <div class="title-decoration"></div>
      </div>

      <!-- 主菜单按钮 -->
      <div class="menu-buttons">
        <button
          class="menu-button start-button"
          @click="startGame"
        >
          <span class="button-text">开始游戏</span>
        </button>

        <!-- 继续游戏按钮（仅在存在存档时显示） -->
        <button
          v-if="hasSave"
          class="menu-button continue-button"
          @click="continueGame"
        >
          <span class="button-text">继续游戏</span>
        </button>

        <button
          class="menu-button settings-button"
          @click="showSettings"
        >
          <span class="button-text">设置</span>
        </button>

        <button
          class="menu-button exit-button"
          @click="exitGame"
        >
          <span class="button-text">退出</span>
        </button>
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

onMounted(() => {
  // 检查是否有存档
  hasSave.value = storageManager.hasSave()
})

const startGame = () => {
  console.log('开始游戏')
  // 实现游戏开始逻辑
   router.push('/game') // 跳转到 FPS 游戏
}

const continueGame = () => {
  console.log('继续游戏')
  // 传递参数表示要加载存档
  router.push({ path: '/game', query: { continue: 'true' } })
}

const showSettings = () => {
  console.log('显示设置')
  // 实现设置界面逻辑
    router.push('/settings') // 跳转到设置界面
}

const exitGame = () => {
  console.log('退出游戏')
  // 实现退出游戏逻辑
    router.push('/goodbye') // 跳转到退出界面

}
</script>

<style scoped>
.game-menu {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: linear-gradient(to bottom, #87CEEB, #4682B4);
  font-family: 'Comic Sans MS', '幼圆', sans-serif;
}

.menu-background {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 标题样式 */
.title-container {
  margin-bottom: 40px;
  text-align: center;
  animation: float 3s ease-in-out infinite;
}

.game-title {
  font-size: 3.5rem;
  color: #FF6B6B;
  text-shadow: 3px 3px 0 #FFD166,
              6px 6px 0 rgba(0, 0, 0, 0.1);
  margin: 0;
  font-weight: bold;
  letter-spacing: 2px;
  position: relative;
}

.title-decoration {
  width: 150px;
  height: 8px;
  background: #FF6B6B;
  border-radius: 4px;
  margin: 15px auto 0;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
}

/* 按钮容器 */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 25px;
  align-items: center;
}

/* 菜单按钮 */
.menu-button {
  width: 280px;
  height: 70px;
  border: none;
  border-radius: 25px;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  text-align: center;
  transform: translateY(0);
}

.menu-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 0 rgba(0, 0, 0, 0.15);
}

.menu-button:active {
  transform: translateY(3px);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
}

/* 按钮样式变体 */
.start-button {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border: 3px solid #FF5252;
}

.settings-button {
  background: linear-gradient(135deg, #4ECDC4, #88D8B0);
  color: white;
  border: 3px solid #26A69A;
}

.exit-button {
  background: linear-gradient(135deg, #FFD93D, #FFD166);
  color: #333;
  border: 3px solid #FFB347;
  font-weight: bold;
}

.continue-button {
  background: linear-gradient(135deg, #34C759, #30D158);
  color: white;
  border: 3px solid #28A745;
}

.button-text {
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

/* 云朵装饰 */
.cloud {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  z-index: 0;
}

.cloud-1 {
  width: 120px;
  height: 50px;
  top: 15%;
  left: 10%;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
}

.cloud-2 {
  width: 80px;
  height: 40px;
  top: 25%;
  right: 15%;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

.cloud-3 {
  width: 100px;
  height: 45px;
  bottom: 20%;
  left: 20%;
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.8);
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-title {
    font-size: 2.5rem;
  }

  .menu-button {
    width: 220px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>