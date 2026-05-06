export interface ObstaclePreset {
  type: 'tree' | 'rock' | 'bush' | 'flower' | 'stump'
  size: number[]
  pos: [number, number, number]
  color: number
  castShadow: boolean
  health: number
}

// 森林主题障碍物配置
export const obstaclePresets: ObstaclePreset[] = [
  // 大型树木 - 100HP
  { type: 'tree', size: [0.8, 4, 0.8], pos: [-12, 2, -8], color: 0x228B22, castShadow: true, health: 100 },
  { type: 'tree', size: [1, 5, 1], pos: [12, 2.5, -6], color: 0x006400, castShadow: true, health: 100 },
  { type: 'tree', size: [0.7, 3.5, 0.7], pos: [0, 1.75, -15], color: 0x2E8B57, castShadow: true, health: 100 },

  // 中型树木 - 60HP
  { type: 'tree', size: [0.5, 2.5, 0.5], pos: [-5, 1.25, -5], color: 0x32CD32, castShadow: true, health: 60 },
  { type: 'tree', size: [0.6, 3, 0.6], pos: [5, 1.5, -8], color: 0x3CB371, castShadow: true, health: 60 },
  { type: 'tree', size: [0.5, 2.5, 0.5], pos: [-8, 1.25, 3], color: 0x228B22, castShadow: true, health: 60 },
  { type: 'tree', size: [0.6, 3, 0.6], pos: [8, 1.5, 5], color: 0x2E8B57, castShadow: true, health: 60 },
  { type: 'tree', size: [0.55, 2.8, 0.55], pos: [0, 1.4, -12], color: 0x3CB371, castShadow: true, health: 60 },

  // 灌木丛 - 60HP
  { type: 'bush', size: [1.5, 1, 1], pos: [-3, 0.5, 0], color: 0x228B22, castShadow: true, health: 60 },
  { type: 'bush', size: [1.5, 1, 1], pos: [3, 0.5, 2], color: 0x2E8B57, castShadow: true, health: 60 },
  { type: 'bush', size: [1, 0.8, 1.2], pos: [0, 0.4, 5], color: 0x3CB371, castShadow: true, health: 60 },

  // 岩石 - 60HP
  { type: 'rock', size: [1.2, 0.8, 1], pos: [-10, 0.4, 0], color: 0x696969, castShadow: true, health: 60 },
  { type: 'rock', size: [1, 0.6, 0.8], pos: [10, 0.3, -2], color: 0x808080, castShadow: true, health: 60 },
  { type: 'rock', size: [1.5, 1, 1.2], pos: [15, 0.5, 8], color: 0x778899, castShadow: true, health: 60 },

  // 小花丛 - 30HP
  { type: 'flower', size: [0.5, 0.3, 0.5], pos: [-15, 0.15, 5], color: 0xFF69B4, castShadow: false, health: 30 },
  { type: 'flower', size: [0.5, 0.3, 0.5], pos: [15, 0.15, -10], color: 0xFF1493, castShadow: false, health: 30 },
  { type: 'flower', size: [0.6, 0.25, 0.6], pos: [-6, 0.125, 8], color: 0xFFD700, castShadow: false, health: 30 },
  { type: 'flower', size: [0.6, 0.25, 0.6], pos: [7, 0.125, -15], color: 0xFF6347, castShadow: false, health: 30 },

  // 树桩 - 60HP
  { type: 'stump', size: [0.6, 0.8, 0.6], pos: [-2, 0.4, -3], color: 0x8B4513, castShadow: true, health: 60 },
  { type: 'stump', size: [0.6, 0.8, 0.6], pos: [2, 0.4, -4], color: 0xA0522D, castShadow: true, health: 60 },
]