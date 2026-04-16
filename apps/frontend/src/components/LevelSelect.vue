<template>
  <div class="level-select">
    <!-- 背景 -->
    <div class="background">
      <!-- 背景装饰元素 -->
      <div class="background-decoration">
        <div class="star star-1"></div>
        <div class="star star-2"></div>
        <div class="star star-3"></div>
        <div class="star star-4"></div>
      </div>

      <!-- 标题 -->
      <div class="title-container">
        <h2 class="level-title">选择关卡</h2>
        <div class="title-decoration"></div>
      </div>

      <!-- 关卡选择容器 -->
      <div class="levels-container">
        <!-- 关卡网格 -->
        <div class="levels-grid">
          <div
            v-for="level in levels"
            :key="level.id"
            class="level-item"
            :class="{
              'locked': !level.unlocked,
              'active': selectedLevel === level.id
            }"
            @click="selectLevel(level.id)"
          >
            <div class="level-content">
              <div class="level-icon">
                <div class="level-number">{{ level.id }}</div>
              </div>
              <div class="level-name">{{ level.name }}</div>
              <div class="level-info">
                <span class="stars" v-if="level.stars > 0">
                  <span v-for="star in level.stars" :key="star" class="star-icon">⭐</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 返回按钮 -->
        <button
          class="back-button"
          @click="goBack"
        >
          返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedLevel = ref(1)
const levels = ref([
  { id: 1, name: '森林冒险', unlocked: true, stars: 3 },
  { id: 2, name: '沙漠迷宫', unlocked: true, stars: 2 },
  { id: 3, name: '雪山挑战', unlocked: false, stars: 0 },
  { id: 4, name: '火山熔岩', unlocked: false, stars: 0 },
  { id: 5, name: '海底世界', unlocked: false, stars: 0 },
  { id: 6, name: '太空之旅', unlocked: false, stars: 0 }
])

const selectLevel = (levelId) => {
  if (levels.value.find(l => l.id === levelId).unlocked) {
    selectedLevel.value = levelId
    console.log(`选择关卡 ${levelId}`)
    // 实现关卡选择逻辑
  }
}

const goBack = () => {
  console.log('返回主菜单')
  // 实现返回逻辑
}
</script>

<style scoped>
.level-select {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: linear-gradient(to bottom, #FFB6C1, #FF69B4);
  font-family: 'Comic Sans MS', '幼圆', sans-serif;
}

.background {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 标题样式 */
.title-container {
  margin-bottom: 30px;
  text-align: center;
}

.level-title {
  font-size: 2.5rem;
  color: #FF6B6B;
  text-shadow: 2px 2px 0 #4ECDC4,
              4px 4px 0 rgba(0, 0, 0, 0.1);
  margin: 0;
  font-weight: bold;
  position: relative;
}

.title-decoration {
  width: 120px;
  height: 6px;
  background: #FF6B6B;
  border-radius: 3px;
  margin: 10px auto 0;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
}

/* 关卡容器 */
.levels-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

/* 关卡网格 */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  width: 100%;
}

/* 关卡项目 */
.level-item {
  background: white;
  border-radius: 15px;
  padding: 20px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 3px solid #4ECDC4;
  position: relative;
  overflow: hidden;
  animation: popIn 0.5s ease-out;
  transform: scale(1);
}

.level-item:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.level-item.locked {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(100%);
}

.level-item.active {
  border-color: #FFD93D;
  box-shadow: 0 0 15px rgba(255, 217, 61, 0.5);
  transform: scale(1.05);
}

/* 级别内容 */
.level-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.level-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4ECDC4, #88D8B0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 3px solid white;
  position: relative;
}

.level-number {
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

.level-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.level-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.star-icon {
  font-size: 1.2rem;
  color: #FFD93D;
}

/* 返回按钮 */
.back-button {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 3px solid #FF5252;
  animation: bounce 2s infinite;
}

.back-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.back-button:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
}

.star-1 {
  width: 10px;
  height: 10px;
  top: 20%;
  left: 15%;
  animation: twinkle 3s infinite;
}

.star-2 {
  width: 15px;
  height: 15px;
  top: 40%;
  right: 25%;
  animation: twinkle 4s infinite;
}

.star-3 {
  width: 8px;
  height: 8px;
  bottom: 30%;
  left: 20%;
  animation: twinkle 2.5s infinite;
}

.star-4 {
  width: 12px;
  height: 12px;
  bottom: 15%;
  right: 15%;
  animation: twinkle 3.5s infinite;
}

/* 动画效果 */
@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .level-title {
    font-size: 2rem;
  }

  .levels-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
  }

  .level-icon {
    width: 65px;
    height: 65px;
  }

  .level-number {
    font-size: 1.8rem;
  }

  .level-name {
    font-size: 1rem;
  }

  .back-button {
    padding: 12px 25px;
    font-size: 1.1rem;
  }
}
</style>