import * as THREE from 'three'

// 弹道子弹外观类型
export type ProjectileVisual = 'star' | 'crystal' | 'fireball'

// BOSS 特殊攻击配置
export interface SpecialAttackConfig {
  type: 'fan' // 扇形弹幕
  projectileCount: number // 弹幕子弹数量
  fanAngle: number // 扇形扩散角度（度）
  cooldown: number // 冷却时间（毫秒）
  warningDuration: number // 预警时间（毫秒）
}

export interface EnemyConfig {
  id: string
  name: string
  type: 'soldier' | 'elite' | 'boss' | 'exploder' | 'healer'
  health: number
  moveSpeed: number
  viewDistance: number // 视野距离
  viewAngle: number // 视野角度（弧度）
  patrolRadius: number
  damage: number
  scoreValue: number // 击杀得分
  // 弹道投射物参数
  projectileSpeed: number // 子弹飞行速度（单位/秒）
  projectileSpread: number // 散布角度（度）
  attackInterval: number // 攻击间隔（毫秒）
  projectileVisual: ProjectileVisual // 子弹外观类型
  burstCount: number // 每次射击发射的子弹数
  // BOSS 专属
  specialAttack?: SpecialAttackConfig // 特殊攻击配置
  // 阶段转换倍率（BOSS）
  phase2Multiplier?: number // 狂暴阶段属性倍率
  // 自爆兵专属
  explosionRadius?: number // 爆炸半径
  explosionTriggerDistance?: number // 触发爆炸距离
  explosionWarningDuration?: number // 预警时间（毫秒）
  // 治疗者专属
  healAmount?: number // 治疗量
  healRadius?: number // 治疗范围
  healInterval?: number // 治疗间隔（毫秒）
}

// 敌人配置
export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  soldier: {
    id: 'soldier',
    name: '小兵',
    type: 'soldier',
    health: 100,
    moveSpeed: 3,
    viewDistance: 15,
    viewAngle: Math.PI / 3, // 60度
    patrolRadius: 10,
    damage: 5, // 弹道模式下降低单发伤害，靠射速弥补
    scoreValue: 100,
    projectileSpeed: 20, // 快速子弹
    projectileSpread: 8, // 散布较大
    attackInterval: 400, // 快速连射 400ms
    projectileVisual: 'star', // 小星星
    burstCount: 1,
  },
  elite: {
    id: 'elite',
    name: '精英',
    type: 'elite',
    health: 200,
    moveSpeed: 5,
    viewDistance: 20,
    viewAngle: Math.PI / 2.5, // 约72度
    patrolRadius: 15,
    damage: 40, // 蓄力高伤害
    scoreValue: 300,
    projectileSpeed: 14, // 中等速度
    projectileSpread: 2, // 很精准
    attackInterval: 2000, // 慢速蓄力射击
    projectileVisual: 'crystal', // 水晶弹
    burstCount: 1,
  },
  boss: {
    id: 'boss',
    name: 'BOSS',
    type: 'boss',
    health: 500,
    moveSpeed: 2,
    viewDistance: 25,
    viewAngle: Math.PI / 2, // 90度
    patrolRadius: 8,
    damage: 30,
    scoreValue: 1000,
    projectileSpeed: 8, // 慢速大火球
    projectileSpread: 3, // 较准
    attackInterval: 1000, // 每秒一发
    projectileVisual: 'fireball', // 大火球
    burstCount: 1,
    phase2Multiplier: 1.5, // 狂暴阶段倍率
    specialAttack: {
      type: 'fan',
      projectileCount: 6, // 6发弹幕
      fanAngle: 60, // 60度扇形
      cooldown: 8000, // 8秒冷却
      warningDuration: 2000, // 2秒预警
    },
  },
  exploder: {
    id: 'exploder',
    name: '自爆兵',
    type: 'exploder',
    health: 80,
    moveSpeed: 6,
    viewDistance: 12,
    viewAngle: Math.PI, // 360度
    patrolRadius: 8,
    damage: 40,
    scoreValue: 150,
    projectileSpeed: 0, // 不射击
    projectileSpread: 0,
    attackInterval: 0, // 不自瞄射击
    projectileVisual: 'fireball',
    burstCount: 0,
    explosionRadius: 3,
    explosionTriggerDistance: 2,
    explosionWarningDuration: 1000, // 1秒预警
  },
  healer: {
    id: 'healer',
    name: '治疗者',
    type: 'healer',
    health: 60,
    moveSpeed: 2,
    viewDistance: 25,
    viewAngle: Math.PI * 2, // 360度
    patrolRadius: 6,
    damage: 0, // 不造成伤害
    scoreValue: 200,
    projectileSpeed: 0,
    projectileSpread: 0,
    attackInterval: 0,
    projectileVisual: 'star',
    burstCount: 0,
    healAmount: 20,
    healRadius: 8,
    healInterval: 3000, // 3秒
  },
}

// 敌人AI状态
export type EnemyState = 'patrol' | 'wait' | 'chase' | 'search' | 'attack' | 'dead'

// 敌人实例
export interface Enemy {
  id: string
  config: EnemyConfig
  mesh: THREE.Group | null
  position: THREE.Vector3
  health: number
  maxHealth: number
  state: EnemyState
  targetPosition: THREE.Vector3 | null
  waypoints: THREE.Vector3[]
  currentWaypointIndex: number
  waitTime: number
  lastAttackTime: number
  isDead: boolean
  spawnTime: number // 生成时间，用于重生
  // 蓄力攻击（精英）
  isCharging: boolean
  chargeStartTime: number
  chargeLine: THREE.Line | null // 蓄力瞄准线
  // BOSS 大招
  lastSpecialAttackTime: number
  // BOSS 大招预警特效
  warningRing: THREE.Mesh | null
  // BOSS 阶段转换
  phase: number // 1=正常，2=狂暴
  // 自爆兵
  isExploding: boolean // 是否正在预警
  explosionStartTime: number // 开始预警的时间
  // 治疗者
  lastHealTime: number // 上次治疗时间
}

// 敌人管理
export class EnemyManager {
  private enemies: Map<string, Enemy> = new Map()
  private scene: THREE.Scene | null = null
  private enemyGroup: THREE.Group | null = null

  setScene(scene: THREE.Scene) {
    this.scene = scene
    this.enemyGroup = new THREE.Group()
    this.enemyGroup.name = 'enemies'
    this.scene.add(this.enemyGroup)
  }

  // 创建敌人
  createEnemy(config: EnemyConfig, position: THREE.Vector3): Enemy {
    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      config,
      mesh: null,
      position: position.clone(),
      health: config.health,
      maxHealth: config.health,
      state: 'patrol',
      targetPosition: null,
      waypoints: [],
      currentWaypointIndex: 0,
      waitTime: 0,
      lastAttackTime: 0,
      isDead: false,
      spawnTime: Date.now(),
      isCharging: false,
      chargeStartTime: 0,
      chargeLine: null,
      lastSpecialAttackTime: 0,
      warningRing: null,
    }

    // 生成巡逻路径点
    enemy.waypoints = this.generateWaypoints(position, config.patrolRadius)

    this.enemies.set(enemy.id, enemy)
    return enemy
  }

  // 生成巡逻路径点
  private generateWaypoints(center: THREE.Vector3, radius: number): THREE.Vector3[] {
    const waypoints: THREE.Vector3[] = []
    const pointCount = 4

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2
      const x = center.x + Math.cos(angle) * radius
      const z = center.z + Math.sin(angle) * radius
      waypoints.push(new THREE.Vector3(x, center.y, z))
    }

    return waypoints
  }

  // 获取所有敌人
  getEnemies(): Enemy[] {
    return Array.from(this.enemies.values())
  }

  // 获取活着的敌人
  getActiveEnemies(): Enemy[] {
    return this.getEnemies().filter(e => !e.isDead)
  }

  // 敌人受伤
  takeDamage(enemy: Enemy, damage: number): boolean {
    if (enemy.isDead) return false

    enemy.health -= damage

    if (enemy.health <= 0) {
      enemy.health = 0
      enemy.isDead = true
      enemy.state = 'dead'
    }

    return true
  }

  // 移除敌人
  removeEnemy(enemyId: string) {
    const enemy = this.enemies.get(enemyId)
    if (enemy && enemy.mesh && this.enemyGroup) {
      this.enemyGroup.remove(enemy.mesh)
    }
    this.enemies.delete(enemyId)
  }

  // 清理所有敌人
  clear() {
    if (this.enemyGroup && this.scene) {
      this.scene.remove(this.enemyGroup)
    }
    this.enemies.clear()
  }
}

export const enemyManager = new EnemyManager()