export interface WeaponData {
  id: string
  name: string
  type: 'pistol' | 'smg' | 'rifle' | 'sniper' | 'shotgun' | 'rpg'
  damage: number
  fireRate: number // shots per second
  magazineSize: number
  reloadTime: number // in ms
  scope: boolean
  scopeMultiplier: number
  description: string
  isAuto: boolean

  // 后坐力系统
  recoilAmount: number // 后坐力大小 (0-1)
  recoilRecovery: number // 后坐力恢复速度
  recoilPattern: { x: number; y: number }[] // 后坐力模式（连射时的偏移模式）

  // 弹道散布
  spread: number // 基础散布角度（度数）
  spreadRecovery: number // 散布恢复速度
  spreadMultiplier: number // 瞄准时散布减少倍数
}

export interface AmmoData {
  current: number
  reserve: number
  maxReserve: number
}

export const DEFAULT_WEAPONS: WeaponData[] = [
  {
    id: 'pistol',
    name: '手枪',
    type: 'pistol',
    damage: 25,
    fireRate: 2,
    magazineSize: 12,
    reloadTime: 1500,
    scope: false,
    scopeMultiplier: 1,
    description: '精准度高，备用武器',
    isAuto: false,
    // 后坐力：小
    recoilAmount: 0.3,
    recoilRecovery: 8,
    recoilPattern: [
      { x: 0, y: -0.5 },
      { x: 0.1, y: -0.3 },
      { x: -0.1, y: -0.4 },
    ],
    // 弹道：精准
    spread: 1.5,
    spreadRecovery: 10,
    spreadMultiplier: 0.5,
  },
  {
    id: 'smg',
    name: '冲锋枪',
    type: 'smg',
    damage: 20,
    fireRate: 10,
    magazineSize: 50,
    reloadTime: 2000,
    scope: false,
    scopeMultiplier: 1,
    description: '射速快，近战利器',
    isAuto: true,
    // 后坐力：中等，水平晃动大
    recoilAmount: 0.5,
    recoilRecovery: 6,
    recoilPattern: [
      { x: 0, y: -0.4 },
      { x: 0.3, y: -0.2 },
      { x: -0.2, y: -0.3 },
      { x: 0.4, y: -0.2 },
      { x: -0.3, y: -0.3 },
    ],
    // 弹道：散布较大
    spread: 4,
    spreadRecovery: 8,
    spreadMultiplier: 0.7,
  },
  {
    id: 'rifle',
    name: '步枪',
    type: 'rifle',
    damage: 35,
    fireRate: 5,
    magazineSize: 30,
    reloadTime: 2500,
    scope: false,
    scopeMultiplier: 1,
    description: '全能型，适合中距离',
    isAuto: true,
    // 后坐力：中等
    recoilAmount: 0.6,
    recoilRecovery: 5,
    recoilPattern: [
      { x: 0, y: -0.6 },
      { x: 0.2, y: -0.4 },
      { x: -0.1, y: -0.5 },
      { x: 0.15, y: -0.3 },
    ],
    // 弹道：中等散布
    spread: 2.5,
    spreadRecovery: 6,
    spreadMultiplier: 0.4,
  },
  {
    id: 'sniper',
    name: '狙击枪',
    type: 'sniper',
    damage: 100,
    fireRate: 0.5,
    magazineSize: 5,
    reloadTime: 3000,
    scope: true,
    scopeMultiplier: 4,
    description: '高伤害，超远距离',
    isAuto: false,
    // 后坐力：大
    recoilAmount: 1.0,
    recoilRecovery: 3,
    recoilPattern: [
      { x: 0, y: -1.0 },
    ],
    // 弹道：非常精准
    spread: 0.5,
    spreadRecovery: 4,
    spreadMultiplier: 0.1, // 开镜后几乎无散布
  },
  {
    id: 'shotgun',
    name: '霰弹枪',
    type: 'shotgun',
    damage: 15,
    fireRate: 1,
    magazineSize: 6,
    reloadTime: 2800,
    scope: false,
    scopeMultiplier: 1,
    description: '范围伤害，近战之王',
    isAuto: false,
    // 后坐力：很大
    recoilAmount: 0.9,
    recoilRecovery: 2,
    recoilPattern: [
      { x: 0, y: -0.8 },
    ],
    // 弹道：散布很大（霰弹）
    spread: 8,
    spreadRecovery: 3,
    spreadMultiplier: 0.6,
  },
  {
    id: 'rpg',
    name: '火箭筒',
    type: 'rpg',
    damage: 150,
    fireRate: 0.5,
    magazineSize: 1,
    reloadTime: 3000,
    scope: false,
    scopeMultiplier: 1,
    description: '发射火箭，范围爆炸',
    isAuto: false,
    // 后坐力：极大
    recoilAmount: 1.2,
    recoilRecovery: 1.5,
    recoilPattern: [
      { x: 0, y: -1.2 },
    ],
    // 弹道：中等散布
    spread: 3,
    spreadRecovery: 2,
    spreadMultiplier: 0.5,
  },
]

export interface ScopeData {
  isActive: boolean
  magnification: number
  originalFov: number
}

export const SCOPES = {
  none: {
    name: '无倍镜',
    magnification: 1,
  },
  redDot: {
    name: '红点',
    magnification: 1.5,
  },
  holographic: {
    name: '全息',
    magnification: 2,
  },
  fourX: {
    name: '4倍镜',
    magnification: 4,
  },
}