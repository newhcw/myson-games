/**
 * 存储键名命名空间
 */
export const STORAGE_KEYS = {
  // 配置数据
  SETTINGS: 'kidsgame_settings',
  CHARACTER: 'kidsgame_character',
  WEAPONS: 'kidsgame_weapons',
  SCOPES: 'kidsgame_scopes',

  // 游戏进度
  PROGRESS: 'kidsgame_progress',

  // 游戏状态
  GAME_STATE: 'kidsgame_state',

  // 游戏存档
  SAVE: 'kidsgame_save',
} as const

/**
 * LocalStorage 存储模块
 */
export class LocalStorage {
  private prefix = 'kidsgame_'

  /**
   * 检查 localStorage 是否可用
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * 设置值
   */
  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false

    try {
      const fullKey = this.prefix + key
      const serialized = JSON.stringify(value)
      localStorage.setItem(fullKey, serialized)
      return true
    } catch (e) {
      console.error('LocalStorage set error:', e)
      return false
    }
  }

  /**
   * 获取值
   */
  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue

    try {
      const fullKey = this.prefix + key
      const item = localStorage.getItem(fullKey)
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch (e) {
      console.error('LocalStorage get error:', e)
      return defaultValue
    }
  }

  /**
   * 删除值
   */
  remove(key: string): boolean {
    if (!this.isAvailable()) return false

    try {
      const fullKey = this.prefix + key
      localStorage.removeItem(fullKey)
      return true
    } catch (e) {
      console.error('LocalStorage remove error:', e)
      return false
    }
  }

  /**
   * 清空所有存储
   */
  clear(): boolean {
    if (!this.isAvailable()) return false

    try {
      const keys = Object.values(STORAGE_KEYS)
      keys.forEach(key => {
        localStorage.removeItem(this.prefix + key)
      })
      return true
    } catch (e) {
      console.error('LocalStorage clear error:', e)
      return false
    }
  }
}

// 单例实例
export const localStorage$ = new LocalStorage()