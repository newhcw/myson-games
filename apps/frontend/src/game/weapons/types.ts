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