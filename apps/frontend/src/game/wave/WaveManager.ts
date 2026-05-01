/**
 * 波次管理器
 * 负责波次状态机、波次配置、敌人生成指令、间歇计时、通关检测
 */

import type { WaveConfig, WaveState, WaveCallbacks, WaveEnemyConfig } from './types'
import { SPAWN_POINTS, TOTAL_WAVES, INTERMISSION_DURATION, type EnemyTypeKeyword } from './types'

// ============================================================
// 波次配置表
// ============================================================

export const WAVE_CONFIGS: WaveConfig[] = [
  { waveNumber:  1, enemies: [{ type: 'soldier', count: 3 }] },
  { waveNumber:  2, enemies: [{ type: 'soldier', count: 5 }] },
  { waveNumber:  3, enemies: [{ type: 'soldier', count: 4 }, { type: 'elite', count: 1 }] },
  { waveNumber:  4, enemies: [{ type: 'soldier', count: 6 }, { type: 'elite', count: 2 }] },
  { waveNumber:  5, enemies: [{ type: 'boss', count: 1 }, { type: 'soldier', count: 3 }], isBossWave: true },
  { waveNumber:  6, enemies: [{ type: 'soldier', count: 8 }] },
  { waveNumber:  7, enemies: [{ type: 'soldier', count: 5 }, { type: 'elite', count: 3 }] },
  { waveNumber:  8, enemies: [{ type: 'soldier', count: 10 }] },
  { waveNumber:  9, enemies: [{ type: 'elite', count: 4 }, { type: 'boss', count: 2 }] },
  { waveNumber: 10, enemies: [{ type: 'boss', count: 2 }, { type: 'elite', count: 5 }], isBossWave: true },
]

// ============================================================
// WaveManager
// ============================================================

export class WaveManager {
  // 状态
  private state: WaveState = 'waving'
  private currentWave: number = 1
  private callbacks: WaveCallbacks | null = null

  // 间歇计时
  private intermissionRemaining: number = INTERMISSION_DURATION

  // 敌人追踪
  private activeEnemyIds: string[] = []

  // 当前波次的敌人配置（缓存，用于重生判断）
  private currentWaveEnemies: WaveEnemyConfig[] = []

  /** 注册事件回调 */
  setCallbacks(callbacks: WaveCallbacks): void {
    this.callbacks = callbacks
  }

  /** 获取当前波次编号 */
  getCurrentWave(): number {
    return this.currentWave
  }

  /** 获取总波次数 */
  getTotalWaves(): number {
    return TOTAL_WAVES
  }

  /** 获取当前状态 */
  getState(): WaveState {
    return this.state
  }

  /** 获取间歇剩余时间（秒），非间歇状态返回 0 */
  getIntermissionRemaining(): number {
    return this.state === 'intermission' ? this.intermissionRemaining : 0
  }

  /** 获取当前波次配置 */
  getCurrentWaveConfig(): WaveConfig {
    return WAVE_CONFIGS[this.currentWave - 1]
  }

  /** 开始游戏：生成第 1 波 */
  startGame(): void {
    this.currentWave = 1
    this.state = 'waving'
    this.activeEnemyIds = []
    this.spawnCurrentWave()
  }

  /**
   * 通知敌人已被击杀
   * @param enemyId 被击杀的敌人 ID
   * @returns true 表示该波次已全部击杀
   */
  onEnemyKilled(enemyId: string): boolean {
    const idx = this.activeEnemyIds.indexOf(enemyId)
    if (idx !== -1) {
      this.activeEnemyIds.splice(idx, 1)
    }

    if (this.activeEnemyIds.length === 0 && this.state === 'waving') {
      this.onWaveCleared()
      return true
    }
    return false
  }

  /** 注册活跃敌人 ID（由 EnemyManager 生成敌人后调用） */
  registerEnemies(enemyIds: string[]): void {
    this.activeEnemyIds.push(...enemyIds)
  }

  /** 每帧更新（用于间歇倒计时） */
  update(delta: number): void {
    if (this.state !== 'intermission') return

    this.intermissionRemaining -= delta
    if (this.intermissionRemaining <= 0) {
      this.startNextWave()
    }
  }

  /** 玩家按下提前开始按键 */
  skipIntermission(): void {
    if (this.state !== 'intermission') return
    this.startNextWave()
  }

  /** 重置整个波次系统（重新开始） */
  reset(): void {
    this.currentWave = 1
    this.state = 'waving'
    this.activeEnemyIds = []
    this.intermissionRemaining = INTERMISSION_DURATION
    this.spawnCurrentWave()
  }

  /** 清理所有引用 */
  dispose(): void {
    this.callbacks = null
    this.activeEnemyIds = []
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private spawnCurrentWave(): void {
    const config = WAVE_CONFIGS[this.currentWave - 1]
    this.currentWaveEnemies = [...config.enemies]

    if (this.callbacks) {
      this.callbacks.onWaveStart(this.currentWave)
    }
  }

  private onWaveCleared(): void {
    // 检查是否为最后一波
    if (this.currentWave >= TOTAL_WAVES) {
      this.state = 'victory'
      if (this.callbacks) {
        this.callbacks.onAllWavesComplete()
      }
      return
    }

    // 进入间歇（倒计时由 update() delta 驱动）
    this.state = 'intermission'
    this.intermissionRemaining = INTERMISSION_DURATION

    if (this.callbacks) {
      this.callbacks.onWaveClear(this.currentWave)
    }
  }

  private startNextWave(): void {
    this.intermissionRemaining = INTERMISSION_DURATION
    this.currentWave++
    this.state = 'waving'
    this.activeEnemyIds = []
    this.spawnCurrentWave()
  }

}

export { SPAWN_POINTS, TOTAL_WAVES, INTERMISSION_DURATION } from './types'

