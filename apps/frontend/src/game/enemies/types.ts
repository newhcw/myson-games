import * as THREE from 'three'

export interface EnemyConfig {
  id: string
  name: string
  type: 'soldier' | 'elite' | 'boss'
  health: number
  moveSpeed: number
  viewDistance: number // 视野距离
  viewAngle: number // 视野角度（弧度）
  patrolRadius: number
  damage: number
  scoreValue: number // 击杀得分
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
    damage: 10,
    scoreValue: 100,
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
    damage: 20,
    scoreValue: 300,
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