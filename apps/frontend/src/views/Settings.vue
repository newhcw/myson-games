<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_KEY_BINDINGS, ACTION_LABELS, KEY_LABELS, getKeyLabel, type KeyBindingConfig } from '@/game/input/KeyBindings'

const router = useRouter()

// 设置项
const settings = ref({
  volume: 80,
  difficulty: 'normal',
  showDamageNumber: true,
  autoAim: false,
})

// 按键映射
const keyBindings = ref<KeyBindingConfig>({ ...DEFAULT_KEY_BINDINGS })
const editingAction = ref<string | null>(null)

// 加载按键映射
onMounted(() => {
  const saved = localStorage.getItem('game-key-bindings')
  if (saved) {
    try {
      keyBindings.value = JSON.parse(saved)
    } catch {
      keyBindings.value = { ...DEFAULT_KEY_BINDINGS }
    }
  }
})

// 开始重新绑定按键
const startBinding = (action: string) => {
  editingAction.value = action
}

// 处理按键事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (!editingAction.value) return

  e.preventDefault()
  const action = editingAction.value
  const newKey = e.key.toLowerCase()

  // 检查是否与其他动作冲突
  const existingAction = Object.keys(keyBindings.value).find(
    (act) => keyBindings.value[act] === newKey && act !== action
  )

  if (existingAction) {
    alert(`按键 ${getKeyLabel(newKey)} 已被用于 ${ACTION_LABELS[existingAction] || existingAction}`)
    return
  }

  // 更新映射
  keyBindings.value = { ...keyBindings.value, [action]: newKey }
  editingAction.value = null

  // 保存
  localStorage.setItem('game-key-bindings', JSON.stringify(keyBindings.value))
}

// 取消绑定
const cancelBinding = () => {
  editingAction.value = null
}

// 重置为默认
const resetKeyBindings = () => {
  if (confirm('确定要重置所有按键映射到默认值吗？')) {
    keyBindings.value = { ...DEFAULT_KEY_BINDINGS }
    localStorage.setItem('game-key-bindings', JSON.stringify(keyBindings.value))
  }
}

// 监听按键
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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

      <section class="setting-group">
        <h2>按键映射配置</h2>
        <div v-if="editingAction" class="binding-hint">
          请按下新的按键来绑定 "{{ ACTION_LABELS[editingAction] || editingAction }}"...
          <button class="cancel-btn" @click="cancelBinding">取消</button>
        </div>
        <div v-else>
          <div
            v-for="(key, action) in keyBindings"
            :key="action"
            class="setting-item binding-item"
            @click="startBinding(action)"
            :class="{ editing: editingAction === action }"
          >
            <label>{{ ACTION_LABELS[action] || action }}</label>
            <span class="key-label">{{ KEY_LABELS[key] || key.toUpperCase() }}</span>
          </div>
          <button class="reset-btn" @click="resetKeyBindings">
            重置为默认按键
          </button>
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

.binding-hint {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  text-align: center;
  font-weight: 600;
}

.binding-item {
  cursor: pointer;
  transition: all var(--transition-base);
}

.binding-item:hover {
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
}

.binding-item.editing {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-sm);
}

.key-label {
  min-width: 60px;
  text-align: center;
  background: var(--color-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: monospace;
  font-weight: 700;
}
</style>