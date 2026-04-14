<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 设置项
const settings = ref({
  volume: 80,
  difficulty: 'normal',
  showDamageNumber: true,
  autoAim: false,
})

const saveSettings = () => {
  // 保存到 localStorage
  localStorage.setItem('game-settings', JSON.stringify(settings.value))
  router.push({ name: 'Home' })
}

const resetProgress = () => {
  if (confirm('确定要重置所有进度吗？此操作不可恢复！')) {
    localStorage.clear()
    alert('进度已重置')
  }
}
</script>

<template>
  <div class="settings">
    <header class="header">
      <button class="back-btn" @click="router.push({ name: 'Home' })">
        ← 返回
      </button>
      <h1>游戏设置</h1>
    </header>

    <main class="content">
      <section class="setting-group">
        <h2>声音设置</h2>
        <div class="setting-item">
          <label>音量</label>
          <input
            type="range"
            v-model="settings.volume"
            min="0"
            max="100"
          />
          <span class="value">{{ settings.volume }}%</span>
        </div>
      </section>

      <section class="setting-group">
        <h2>游戏设置</h2>
        <div class="setting-item">
          <label>难度</label>
          <select v-model="settings.difficulty">
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="setting-item">
          <label>显示伤害数字</label>
          <input
            type="checkbox"
            v-model="settings.showDamageNumber"
          />
        </div>
        <div class="setting-item">
          <label>自动瞄准辅助</label>
          <input
            type="checkbox"
            v-model="settings.autoAim"
          />
        </div>
      </section>

      <section class="setting-group danger">
        <h2>数据管理</h2>
        <button class="reset-btn" @click="resetProgress">
          重置所有进度
        </button>
      </section>
    </main>

    <footer class="footer">
      <button class="save-btn" @click="saveSettings">保存设置</button>
    </footer>
  </div>
</template>

<style scoped>
.settings {
  min-height: 100vh;
  background: var(--color-bg);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.back-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  transition: all var(--transition-base);
}

.back-btn:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.header h1 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
}

.content {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.setting-group {
  background: var(--color-bg-card);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.setting-group h2 {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-bg);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
}

.setting-item label {
  font-weight: 600;
}

.setting-item input[type="range"] {
  width: 200px;
}

.setting-item input[type="checkbox"] {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.setting-item select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--color-primary);
}

.setting-group.danger {
  border: 2px solid var(--color-danger);
}

.reset-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  transition: all var(--transition-base);
}

.reset-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.footer {
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  text-align: center;
}

.save-btn {
  padding: var(--spacing-md) var(--spacing-2xl);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-lg);
  font-weight: 700;
  transition: all var(--transition-base);
}

.save-btn:hover {
  background: var(--color-primary-dark);
  transform: scale(1.05);
  box-shadow: var(--shadow-glow);
}
</style>