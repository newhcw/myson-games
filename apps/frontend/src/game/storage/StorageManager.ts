import { localStorage$, STORAGE_KEYS } from './LocalStorage'
import { indexedDB$ } from './IndexedDB'

/**
 * 数据类型定义
 */
export interface GameSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  mouseSensitivity: number
 Graphicsquality?: string
  difficulty?: string
}

export interface CharacterData {
  selectedCharacter: string
  unlockedCharacters: string[]
}

export interface WeaponProgress {
  unlockedWeapons: string[]
  weapon_stats?: Record<string, { kills: number; headshots: number }>
}

export interface ScopeProgress {
  unlockedScopes: string[]
}

/**
 * 游戏存档数据结构
 */
export interface GameSaveData {
  timestamp: number  // 存档时间戳
  player: {
    health: number
    position: { x: number; y: number; z: number }
    rotation: { yaw: number; pitch: number }
  }
  game: {
    score: number
    kills: number
    gameTime: number
    state: 'playing' | 'paused' | 'idle'
  }
  weapon: {
    currentIndex: number
    ammo: Record<string, { current: number; reserve: number }>
  }
}

export interface GameProgress {
  totalKills: number
  totalScore: number
  totalPlayTime: number // seconds
  highScores: Record<string, number>
  achievements: string[]
}

/**
 * 默认值
 */
export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  mouseSensitivity: 1.0,
  difficulty: 'normal',
}

export const DEFAULT_CHARACTER: CharacterData = {
  selectedCharacter: 'avatar_1',
  unlockedCharacters: ['avatar_1'],
}

export const DEFAULT_WEAPON_PROGRESS: WeaponProgress = {
  unlockedWeapons: ['pistol'],
}

export const DEFAULT_SCOPE_PROGRESS: ScopeProgress = {
  unlockedScopes: ['iron_sight'],
}

export const DEFAULT_PROGRESS: GameProgress = {
  totalKills: 0,
  totalScore: 0,
  totalPlayTime: 0,
  highScores: {},
  achievements: [],
}

/**
 * 统一的存储管理器
 */
export class StorageManager {
  private initialized = false

  /**
   * 初始化存储系统
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true

    // 尝试初始化 IndexedDB
    const idbOk = await indexedDB$.init()

    // 检查 localStorage 是否可用
    const lsOk = localStorage$.isAvailable()

    console.log('Storage initialized:', { idb: idbOk, ls: lsOk })

    this.initialized = true
    return lsOk || idbOk
  }

  /**
   * 检查存储是否可用
   */
  isStorageAvailable(): boolean {
    return localStorage$.isAvailable()
  }

  // ===== Settings =====

  getSettings(): GameSettings {
    return localStorage$.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }

  async saveSettings(settings: GameSettings): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.SETTINGS, settings)
  }

  // ===== Character =====

  getCharacter(): CharacterData {
    return localStorage$.get(STORAGE_KEYS.CHARACTER, DEFAULT_CHARACTER)
  }

  async saveCharacter(character: CharacterData): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.CHARACTER, character)
  }

  // ===== Weapons =====

  getWeaponProgress(): WeaponProgress {
    return localStorage$.get(STORAGE_KEYS.WEAPONS, DEFAULT_WEAPON_PROGRESS)
  }

  async saveWeaponProgress(progress: WeaponProgress): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.WEAPONS, progress)
  }

  // ===== Scopes =====

  getScopeProgress(): ScopeProgress {
    return localStorage$.get(STORAGE_KEYS.SCOPES, DEFAULT_SCOPE_PROGRESS)
  }

  async saveScopeProgress(progress: ScopeProgress): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.SCOPES, progress)
  }

  // ===== Game Progress =====

  getProgress(): GameProgress {
    return localStorage$.get(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS)
  }

  async saveProgress(progress: GameProgress): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.PROGRESS, progress)
  }

  // ===== Game Save/Load =====

  /**
   * 保存游戏存档
   */
  async saveGame(saveData: GameSaveData): Promise<boolean> {
    return localStorage$.set(STORAGE_KEYS.SAVE, saveData)
  }

  /**
   * 读取游戏存档
   */
  loadGame(): GameSaveData | null {
    return localStorage$.get<GameSaveData | null>(STORAGE_KEYS.SAVE, null) as GameSaveData | null
  }

  /**
   * 检查是否有存档
   */
  hasSave(): boolean {
    try {
      const save = this.loadGame()
      return save !== null
    } catch {
      return false
    }
  }

  /**
   * 删除游戏存档
   */
  async deleteSave(): Promise<boolean> {
    return localStorage$.remove(STORAGE_KEYS.SAVE)
  }

  // ===== Update operations =====

  async unlockWeapon(weaponId: string): Promise<boolean> {
    const progress = this.getWeaponProgress()
    if (!progress.unlockedWeapons.includes(weaponId)) {
      progress.unlockedWeapons.push(weaponId)
      return this.saveWeaponProgress(progress)
    }
    return true
  }

  async unlockCharacter(characterId: string): Promise<boolean> {
    const character = this.getCharacter()
    if (!character.unlockedCharacters.includes(characterId)) {
      character.unlockedCharacters.push(characterId)
      return this.saveCharacter(character)
    }
    return true
  }

  async unlockScope(scopeId: string): Promise<boolean> {
    const progress = this.getScopeProgress()
    if (!progress.unlockedScopes.includes(scopeId)) {
      progress.unlockedScopes.push(scopeId)
      return this.saveScopeProgress(progress)
    }
    return true
  }

  async addKill(count: number = 1): Promise<boolean> {
    const progress = this.getProgress()
    progress.totalKills += count
    return this.saveProgress(progress)
  }

  async addScore(score: number): Promise<boolean> {
    const progress = this.getProgress()
    progress.totalScore += score
    return this.saveProgress(progress)
  }

  async updatePlayTime(additionalSeconds: number): Promise<boolean> {
    const progress = this.getProgress()
    progress.totalPlayTime += additionalSeconds
    return this.saveProgress(progress)
  }

  async updateHighScore(gameId: string, score: number): Promise<boolean> {
    const progress = this.getProgress()
    if (!progress.highScores[gameId] || score > progress.highScores[gameId]) {
      progress.highScores[gameId] = score
      return this.saveProgress(progress)
    }
    return true
  }

  // ===== Reset =====

  /**
   * 重置所有进度
   */
  async resetProgress(): Promise<boolean> {
    // 先清除所有存储
    localStorage$.clear()

    // 重新保存默认值
    await Promise.all([
      this.saveSettings(DEFAULT_SETTINGS),
      this.saveCharacter(DEFAULT_CHARACTER),
      this.saveWeaponProgress(DEFAULT_WEAPON_PROGRESS),
      this.saveScopeProgress(DEFAULT_SCOPE_PROGRESS),
      this.saveProgress(DEFAULT_PROGRESS),
    ])

    return true
  }

  /**
   * 确认重置（带确认对话框）
   */
  async confirmReset(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.confirm('确定要重置所有游戏进度吗？此操作不可撤销！')) {
      return this.resetProgress()
    }
    return false
  }
}

// 单例实例
export const storageManager = new StorageManager()