import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  storageManager,
  DEFAULT_SETTINGS,
  DEFAULT_CHARACTER,
  DEFAULT_WEAPON_PROGRESS,
  DEFAULT_PROGRESS,
  type GameSettings,
  type CharacterData,
  type WeaponProgress,
  type GameProgress,
} from '@/game/storage/StorageManager'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<GameSettings>({ ...DEFAULT_SETTINGS })
  const character = ref<CharacterData>({ ...DEFAULT_CHARACTER })
  const weaponProgress = ref<WeaponProgress>({ ...DEFAULT_WEAPON_PROGRESS })
  const progress = ref<GameProgress>({ ...DEFAULT_PROGRESS })

  // 初始化
  const initialized = ref(false)

  // 计算属性
  const masterVolume = computed(() => settings.value.masterVolume)
  const sfxVolume = computed(() => settings.value.sfxVolume)
  const musicVolume = computed(() => settings.value.musicVolume)
  const mouseSensitivity = computed(() => settings.value.mouseSensitivity)
  const difficulty = computed(() => settings.value.difficulty)

  const selectedCharacter = computed(() => character.value.selectedCharacter)
  const unlockedCharacters = computed(() => character.value.unlockedCharacters)
  const unlockedWeapons = computed(() => weaponProgress.value.unlockedWeapons)

  const totalKills = computed(() => progress.value.totalKills)
  const totalScore = computed(() => progress.value.totalScore)
  const totalPlayTime = computed(() => progress.value.totalPlayTime)

  // 初始化存储
  const init = async () => {
    await storageManager.init()
    settings.value = storageManager.getSettings()
    character.value = storageManager.getCharacter()
    weaponProgress.value = storageManager.getWeaponProgress()
    progress.value = storageManager.getProgress()
    initialized.value = true
  }

  // 保存设置
  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    await storageManager.saveSettings(settings.value)
  }

  // 选择角色
  const selectCharacter = async (characterId: string) => {
    if (character.value.unlockedCharacters.includes(characterId)) {
      character.value.selectedCharacter = characterId
      await storageManager.saveCharacter(character.value)
    }
  }

  // 解锁角色
  const unlockCharacter = async (characterId: string) => {
    await storageManager.unlockCharacter(characterId)
    character.value = storageManager.getCharacter()
  }

  // 解锁武器
  const unlockWeapon = async (weaponId: string) => {
    await storageManager.unlockWeapon(weaponId)
    weaponProgress.value = storageManager.getWeaponProgress()
  }

  // 更新游戏分数
  const updateScore = async (score: number) => {
    await storageManager.addScore(score)
    progress.value = storageManager.getProgress()
  }

  // 更新击杀数
  const updateKills = async (kills: number) => {
    await storageManager.addKill(kills)
    progress.value = storageManager.getProgress()
  }

  // 更新游戏时间
  const updatePlayTime = async (seconds: number) => {
    await storageManager.updatePlayTime(seconds)
    progress.value = storageManager.getProgress()
  }

  // 更新最高分
  const updateHighScore = async (gameId: string, score: number) => {
    await storageManager.updateHighScore(gameId, score)
    progress.value = storageManager.getProgress()
  }

  // 重置进度
  const resetProgress = async () => {
    await storageManager.confirmReset()
    settings.value = storageManager.getSettings()
    character.value = storageManager.getCharacter()
    weaponProgress.value = storageManager.getWeaponProgress()
    progress.value = storageManager.getProgress()
  }

  // 设置音量
  const setVolume = async (type: 'master' | 'music' | 'sfx', value: number) => {
    if (type === 'master') {
      await updateSettings({ masterVolume: value })
    } else if (type === 'music') {
      await updateSettings({ musicVolume: value })
    } else if (type === 'sfx') {
      await updateSettings({ sfxVolume: value })
    }
  }

  // 设置鼠标灵敏度
  const setSensitivity = async (value: number) => {
    await updateSettings({ mouseSensitivity: value })
  }

  // 设置难度
  const setDifficulty = async (value: string) => {
    await updateSettings({ difficulty: value })
  }

  return {
    // 状态
    settings,
    character,
    weaponProgress,
    progress,
    initialized,

    // 计算属性
    masterVolume,
    sfxVolume,
    musicVolume,
    mouseSensitivity,
    difficulty,
    selectedCharacter,
    unlockedCharacters,
    unlockedWeapons,
    totalKills,
    totalScore,
    totalPlayTime,

    // 方法
    init,
    updateSettings,
    selectCharacter,
    unlockCharacter,
    unlockWeapon,
    updateScore,
    updateKills,
    updatePlayTime,
    updateHighScore,
    resetProgress,
    setVolume,
    setSensitivity,
    setDifficulty,
  }
})