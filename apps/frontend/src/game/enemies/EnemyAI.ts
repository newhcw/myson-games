import * as THREE from 'three'
import type { Enemy } from './types'
import { ENEMY_CONFIGS } from './types'
import { createEnemyMesh, playIdleAnimation, playWalkAnimation, playChaseAnimation, playHitAnimation, playDeathAnimation, updateEnemyPosition } from './EnemyRenderer'
import { EnemyHealthBar } from './EnemyHealthBar'

export interface EnemyAIOptions {
  playerPosition: THREE.Vector3
  playerHealth: number
  onEnemyDead: (enemy: Enemy, killerId?: string) => void
  onPlayerHit: (damage: number) => void
}

export class EnemyAI {
  private enemies: Map<string, Enemy> = new Map()
  private scene: THREE.Group | null = null
  private lastPlayerPosition: THREE.Vector3 = new THREE.Vector3()
  private options: EnemyAIOptions | null = null
  private searchTimeout: Map<string, number> = new Map() // 敌人ID -> 开始搜索的时间
  private healthBar: EnemyHealthBar | null = null
  private _camera: THREE.Camera | null = null

  // 生成敌人
  spawnEnemy(type: keyof typeof ENEMY_CONFIGS, position: THREE.Vector3): Enemy {
    const config = ENEMY_CONFIGS[type]
    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      config,
      mesh: null,
      position: position.clone(),
      health: config.health,
      maxHealth: config.health,
      state: 'patrol',
      targetPosition: null,
      waypoints: this.generateWaypoints(position, config.patrolRadius),
      currentWaypointIndex: 0,
      waitTime: 0,
      lastAttackTime: 0,
      isDead: false,
      spawnTime: Date.now(),
    }

    // 创建3D模型
    if (this.scene) {
      // 创建Q版卡通模型
      const enemyMesh = createEnemyMesh(config)
      enemy.mesh = enemyMesh
      if (enemy.mesh) {
        enemy.mesh.position.copy(enemy.position)
        this.scene.add(enemy.mesh)
      }
    }

    this.enemies.set(enemy.id, enemy)
    return enemy
  }

  // 设置场景引用
  setScene(scene: THREE.Group, camera: THREE.Camera) {
    this.scene = scene
    this._camera = camera
    // 初始化血条系统
    if (!this.healthBar) {
      this.healthBar = new EnemyHealthBar(this._camera)
    }
    // 为已存在的敌人创建mesh
    this.enemies.forEach(enemy => {
      if (!enemy.mesh) {
        const enemyMesh = createEnemyMesh(enemy.config)
        enemy.mesh = enemyMesh
        if (enemy.mesh) {
          enemy.mesh.position.copy(enemy.position)
          this.scene!.add(enemy.mesh)
        }
      }
    })
  }

  // 设置选项
  setOptions(options: EnemyAIOptions) {
    this.options = options
  }

  // 生成巡逻路径点
  private generateWaypoints(center: THREE.Vector3, radius: number): THREE.Vector3[] {
    const waypoints: THREE.Vector3[] = []
    const pointCount = 4

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2
      const x = center.x + Math.cos(angle) * radius
      const z = center.z + Math.sin(angle) * radius
      waypoints.push(new THREE.Vector3(x, 0, z))
    }

    return waypoints
  }

  // 检查玩家是否在敌人视野范围内
  private canSeePlayer(enemy: Enemy, playerPos: THREE.Vector3): boolean {
    const directionToPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position)
    const distance = directionToPlayer.length()

    // 距离检查
    if (distance > enemy.config.viewDistance) {
      return false
    }

    // 角度检查
    directionToPlayer.normalize()
    const enemyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      enemy.mesh?.quaternion || new THREE.Quaternion()
    )

    // 如果没有mesh，使用默认朝向前方
    if (!enemy.mesh) {
      enemyForward.set(Math.sin(enemy.position.x * 0.1), 0, Math.cos(enemy.position.z * 0.1))
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, enemyForward.dot(directionToPlayer))))

    return angle < enemy.config.viewAngle / 2
  }

  // 更新所有敌人
  update(delta: number, playerPosition: THREE.Vector3, time: number) {
    if (!this.options) return

    const { onPlayerHit } = this.options
    this.lastPlayerPosition.copy(playerPosition)

    this.enemies.forEach(enemy => {
      if (enemy.isDead) return

      // 状态机更新
      this.updateEnemyState(enemy, playerPosition, delta)

      // 行为更新
      this.updateEnemyBehavior(enemy, playerPosition, delta, time)

      // 攻击玩家
      if (enemy.state === 'chase' || enemy.state === 'attack') {
        const distance = enemy.position.distanceTo(playerPosition)
        if (distance < 1.5) {
          this.attackPlayer(enemy, onPlayerHit)
        }
      }

      // 更新模型位置
      if (enemy.mesh) {
        updateEnemyPosition(enemy)

        // 面向玩家（追逐状态）
        if (enemy.state === 'chase' || enemy.state === 'attack') {
          const lookTarget = new THREE.Vector3(playerPosition.x, enemy.position.y, playerPosition.z)
          enemy.mesh.lookAt(lookTarget)
        } else if (enemy.targetPosition) {
          // 面向移动方向
          const direction = new THREE.Vector3().subVectors(enemy.targetPosition, enemy.position).normalize()
          if (direction.length() > 0.01) {
            const angle = Math.atan2(direction.x, direction.z)
            enemy.mesh.rotation.y = angle
          }
        }
      }

      // 更新血条
      if (this.healthBar) {
        this.healthBar.update(enemy)
      }
    })
  }

  // 更新敌人状态
  private updateEnemyState(enemy: Enemy, playerPos: THREE.Vector3, delta: number) {
    const canSee = this.canSeePlayer(enemy, playerPos)

    switch (enemy.state) {
      case 'patrol':
        if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'wait':
        enemy.waitTime -= delta
        if (enemy.waitTime <= 0) {
          enemy.state = 'patrol'
        } else if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'chase':
        if (!canSee) {
          enemy.state = 'search'
          this.searchTimeout.set(enemy.id, Date.now())
        }
        break

      case 'search':
        // 5秒后恢复巡逻
        const searchStart = this.searchTimeout.get(enemy.id)
        if (searchStart && Date.now() - searchStart > 5000) {
          enemy.state = 'patrol'
          // 重新生成巡逻点
          enemy.waypoints = this.generateWaypoints(enemy.position, enemy.config.patrolRadius)
          enemy.currentWaypointIndex = 0
          this.searchTimeout.delete(enemy.id)
        } else if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'attack':
        if (!canSee) {
          enemy.state = 'search'
          this.searchTimeout.set(enemy.id, Date.now())
        }
        break
    }
  }

  // 更新敌人行为
  private updateEnemyBehavior(enemy: Enemy, playerPos: THREE.Vector3, delta: number, time: number) {
    const speed = enemy.config.moveSpeed

    switch (enemy.state) {
      case 'patrol':
        playWalkAnimation(enemy, time)
        if (enemy.waypoints.length > 0) {
          const target = enemy.waypoints[enemy.currentWaypointIndex]
          const distance = enemy.position.distanceTo(target)

          if (distance < 0.5) {
            // 到达路点，等待
            enemy.state = 'wait'
            enemy.waitTime = 1 + Math.random() * 2 // 1-3秒
            enemy.currentWaypointIndex = (enemy.currentWaypointIndex + 1) % enemy.waypoints.length
          } else {
            // 移动向下一个路点
            const direction = new THREE.Vector3().subVectors(target, enemy.position).normalize()
            enemy.position.add(direction.multiplyScalar(speed * delta))
          }
        }
        break

      case 'wait':
        playIdleAnimation(enemy, time)
        break

      case 'chase':
        playChaseAnimation(enemy, time)
        // 追逐玩家
        const chaseDirection = new THREE.Vector3().subVectors(playerPos, enemy.position)
        chaseDirection.y = 0 // 保持在地上
        chaseDirection.normalize()
        enemy.position.add(chaseDirection.multiplyScalar(speed * 1.5 * delta))
        break

      case 'search':
        playIdleAnimation(enemy, time)
        // 在当前位置等待或缓慢移动
        break

      case 'attack':
        playChaseAnimation(enemy, time)
        break
    }
  }

  // 攻击玩家
  private attackPlayer(enemy: Enemy, onPlayerHit: (damage: number) => void) {
    const now = Date.now()
    const attackInterval = 1000 // 1秒攻击一次

    if (now - enemy.lastAttackTime > attackInterval) {
      enemy.lastAttackTime = now
      onPlayerHit(enemy.config.damage)
    }
  }

  // 敌人受伤
  enemyHit(enemyId: string, damage: number): { killed: boolean; damageDealt: number } {
    const enemy = this.enemies.get(enemyId)
    if (!enemy || enemy.isDead) {
      return { killed: false, damageDealt: 0 }
    }

    enemy.health -= damage

    // 播放被击中动画
    if (enemy.mesh) {
      playHitAnimation(enemy)
    }

    // 显示伤害数字
    if (this.healthBar) {
      const isCritical = damage >= enemy.config.damage * 2
      this.healthBar.showDamage(enemy, damage, isCritical)
    }

    let killed = false
    if (enemy.health <= 0) {
      enemy.health = 0
      enemy.isDead = true
      enemy.state = 'dead'
      killed = true

      // 播放死亡动画
      if (enemy.mesh) {
        playDeathAnimation(enemy, () => {
          // 动画完成后移除
          if (this.scene && enemy.mesh) {
            this.scene.remove(enemy.mesh)
          }
        })
      }

      // 通知击杀
      if (this.options && this.options.onEnemyDead) {
        this.options.onEnemyDead(enemy)
      }
    }

    return { killed, damageDealt: damage }
  }

  // 获取所有敌人
  getEnemies(): Enemy[] {
    return Array.from(this.enemies.values())
  }

  // 获取活着的敌人
  getActiveEnemies(): Enemy[] {
    return this.getEnemies().filter(e => !e.isDead)
  }

  // 清理
  clear() {
    this.enemies.forEach(enemy => {
      if (enemy.mesh && this.scene) {
        this.scene.remove(enemy.mesh)
      }
    })
    this.enemies.clear()
    this.searchTimeout.clear()
    this.healthBar?.clear()
  }
}

export const enemyAI = new EnemyAI()