import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type GameState = 'idle' | 'playing' | 'paused' | 'ended'

export const useGameStore = defineStore('game', () => {
  // Game state
  const gameState = ref<GameState>('idle')

  // Score
  const score = ref(0)

  // Kills
  const kills = ref(0)

  // Game time (in seconds)
  const gameTime = ref(0)
  let gameTimer: number | null = null

  // Player health
  const health = ref(100)
  const maxHealth = 100

  // Computed
  const isPlaying = computed(() => gameState.value === 'playing')
  const isPaused = computed(() => gameState.value === 'paused')
  const isDead = computed(() => gameState.value === 'ended')

  // Actions
  const startGame = () => {
    gameState.value = 'playing'
    score.value = 0
    kills.value = 0
    health.value = maxHealth
    gameTime.value = 0

    // Start timer
    gameTimer = window.setInterval(() => {
      gameTime.value++
    }, 1000)
  }

  const pauseGame = () => {
    if (gameState.value === 'playing') {
      gameState.value = 'paused'
      if (gameTimer) {
        clearInterval(gameTimer)
        gameTimer = null
      }
    }
  }

  const resumeGame = () => {
    if (gameState.value === 'paused') {
      gameState.value = 'playing'
      gameTimer = window.setInterval(() => {
        gameTime.value++
      }, 1000)
    }
  }

  const endGame = () => {
    gameState.value = 'ended'
    if (gameTimer) {
      clearInterval(gameTimer)
      gameTimer = null
    }
  }

  const takeDamage = (amount: number) => {
    health.value = Math.max(0, health.value - amount)
    if (health.value <= 0) {
      endGame()
    }
  }

  const addScore = (points: number) => {
    score.value += points
  }

  const addKill = () => {
    kills.value++
  }

  const resetGame = () => {
    if (gameTimer) {
      clearInterval(gameTimer)
      gameTimer = null
    }
    gameState.value = 'idle'
    score.value = 0
    kills.value = 0
    health.value = maxHealth
    gameTime.value = 0
  }

  // 完全重置游戏（用于死亡后重新开始）
  const fullReset = () => {
    resetGame()
    startGame()
  }

  return {
    gameState,
    score,
    kills,
    gameTime,
    health,
    maxHealth,
    isPlaying,
    isPaused,
    isDead,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    takeDamage,
    addScore,
    addKill,
    resetGame,
    fullReset,
  }
})