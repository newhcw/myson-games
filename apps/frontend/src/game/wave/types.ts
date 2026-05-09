/**
 * 波次系统类型定义
 */

/** 敌人类型关键词 */
export type EnemyTypeKeyword = 'soldier' | 'elite' | 'boss' | 'exploder' | 'healer'

/** 单波敌人配置 */
export interface WaveEnemyConfig {
  type: EnemyTypeKeyword
  count: number
}

/** 完整波次配置 */
export interface WaveConfig {
  waveNumber: number       // 波次编号（1-10）
  enemies: WaveEnemyConfig[] // 该波次的敌人组成
  isBossWave?: boolean     // 是否为 BOSS 波（用于 HUD 提示）
}

/** 波次状态 */
export type WaveState = 'waving' | 'intermission' | 'victory'

/** 波次事件回调 */
export interface WaveCallbacks {
  onWaveStart: (waveNumber: number) => void
  onWaveClear: (waveNumber: number) => void
  onAllWavesComplete: () => void
}

/** 总波次数 */
export const TOTAL_WAVES = 10

/** 波次间歇倒计时（秒） */
export const INTERMISSION_DURATION = 5
