export interface ObstaclePreset {
  type: 'box' | 'cylinder'
  size: number[]
  pos: [number, number, number]
  color: number
  castShadow: boolean
  health: number
}

export const obstaclePresets: ObstaclePreset[] = [
  // 大型障碍物（建筑/墙壁）- 100HP
  { type: 'box', size: [4, 3, 1], pos: [-12, 1.5, -8], color: 0x8B7355, castShadow: true, health: 100 },
  { type: 'box', size: [1, 3, 4], pos: [12, 1.5, -6], color: 0x8B7355, castShadow: true, health: 100 },
  { type: 'box', size: [6, 2, 1], pos: [0, 1, -15], color: 0x6B8E23, castShadow: true, health: 100 },

  // 中型立方体 - 60HP
  { type: 'box', size: [2, 2, 2], pos: [-5, 1, -5], color: 0x8B4513, castShadow: true, health: 60 },
  { type: 'box', size: [2, 2, 2], pos: [5, 1, -8], color: 0xA0522D, castShadow: true, health: 60 },
  { type: 'box', size: [2, 2, 2], pos: [-8, 1, 3], color: 0x8B4513, castShadow: true, health: 60 },
  { type: 'box', size: [2, 2, 2], pos: [8, 1, 5], color: 0xA0522D, castShadow: true, health: 60 },
  { type: 'box', size: [2, 2, 2], pos: [0, 1, -12], color: 0xCD853F, castShadow: true, health: 60 },

  // 低矮障碍物（掩体）- 60HP
  { type: 'box', size: [3, 1, 1.5], pos: [-3, 0.5, 0], color: 0x708090, castShadow: true, health: 60 },
  { type: 'box', size: [3, 1, 1.5], pos: [3, 0.5, 2], color: 0x708090, castShadow: true, health: 60 },
  { type: 'box', size: [1.5, 1, 3], pos: [0, 0.5, 5], color: 0x778899, castShadow: true, health: 60 },

  // 圆柱形障碍物 - 60HP
  { type: 'cylinder', size: [0.8, 0.8, 3, 16], pos: [-10, 1.5, 0], color: 0x4682B4, castShadow: true, health: 60 },
  { type: 'cylinder', size: [0.8, 0.8, 3, 16], pos: [10, 1.5, -2], color: 0x4682B4, castShadow: true, health: 60 },
  { type: 'cylinder', size: [1.2, 1.2, 2, 16], pos: [15, 1, 8], color: 0x5F9EA0, castShadow: true, health: 60 },

  // 小型装饰物 - 30HP
  { type: 'box', size: [1, 1, 1], pos: [-15, 0.5, 5], color: 0xDEB887, castShadow: true, health: 30 },
  { type: 'box', size: [1, 1, 1], pos: [15, 0.5, -10], color: 0xDEB887, castShadow: true, health: 30 },
  { type: 'box', size: [1.5, 0.5, 1.5], pos: [-6, 0.25, 8], color: 0x2E8B57, castShadow: false, health: 30 },
  { type: 'box', size: [1.5, 0.5, 1.5], pos: [7, 0.25, -15], color: 0x2E8B57, castShadow: false, health: 30 },

  // 中央区域障碍物 - 60HP
  { type: 'box', size: [2, 1.5, 2], pos: [-2, 0.75, -3], color: 0xB8860B, castShadow: true, health: 60 },
  { type: 'box', size: [2, 1.5, 2], pos: [2, 0.75, -4], color: 0xB8860B, castShadow: true, health: 60 },
]
