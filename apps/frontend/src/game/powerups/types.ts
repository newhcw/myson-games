/**
 * 道具系统类型定义
 */

import * as THREE from 'three'

/** 道具类型 */
export type PowerUpType = 'health' | 'ammo' | 'doubleDamage'

/** 道具掉落概率配置 */
export const DROP_RATES: Record<string, number> = {
  soldier: 0.50,  // 小兵 50%
  elite:   0.50,  // 精英 50%
  boss:    1.00,  // BOSS 100%
}

/** BOSS 掉落数量 */
export const BOSS_DROP_COUNT = 2

/** 道具类型详细信息 */
export interface PowerUpTypeInfo {
  type: PowerUpType
  color: number           // 发光颜色（十六进制）
  label: string           // 显示名称
  duration: number        // Buff 持续时间（秒），0 表示即时生效
}

/** 三种道具的信息表 */
export const POWERUP_INFO: Record<PowerUpType, PowerUpTypeInfo> = {
  health: {
    type: 'health',
    color: 0xFF69B4,      // 粉红色
    label: '生命药水',
    duration: 0,           // 即时生效
  },
  ammo: {
    type: 'ammo',
    color: 0x4488FF,      // 蓝色
    label: '弹药补给',
    duration: 0,           // 即时生效
  },
  doubleDamage: {
    type: 'doubleDamage',
    color: 0xFFDD44,      // 黄色
    label: '双倍伤害',
    duration: 10,          // 持续 10 秒
  },
}

/** 所有道具类型（用于随机选择） */
export const ALL_POWERUP_TYPES: PowerUpType[] = ['health', 'ammo', 'doubleDamage']

/** 道具掉落权重：health 更高权重，确保玩家有回血机会 */
export const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  health: 50,        // 50% 概率掉血包
  ammo: 30,          // 30% 概率掉弹药
  doubleDamage: 20,  // 20% 概率掉双倍伤害
}

/** 场景中的道具实例 */
export interface PowerUpItem {
  id: string
  type: PowerUpType
  mesh: THREE.Group
  position: THREE.Vector3
  spawnTime: number       // 出生时间戳
  alive: boolean
}

/** 道具生成参数 */
export interface PowerUpSpawnConfig {
  type: PowerUpType
  position: THREE.Vector3
}

/** 道具效果回调 */
export interface PowerUpCallbacks {
  onHealthPickup: (amount: number) => void      // 生命恢复
  onAmmoPickup: () => void                       // 弹药补满
  onDoubleDamagePickup: (duration: number) => void // 双倍伤害
}

/** 道具系统常量 */
export const POWERUP_CONSTANTS = {
  PICKUP_RANGE: 1.5,          // 水平拾取距离
  PICKUP_RANGE_Y: 2.0,        // 垂直拾取距离
  MAX_POWERUPS: 8,            // 同屏上限
  LIFETIME: 15000,            // 存活时间（毫秒）
  FLOAT_AMPLITUDE: 0.2,       // 浮动振幅（米）
  FLOAT_PERIOD: 2.0,          // 浮动周期（秒）
  ROTATE_SPEED: 1.5,          // 旋转速度（弧度/秒）
  FADE_OUT_DURATION: 500,     // 淡出时间（毫秒）
  HEAL_AMOUNT: 30,            // 生命恢复量
} as const
