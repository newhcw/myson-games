import * as THREE from 'three'
import type { Enemy, ShootResult } from './types'
import { collisionDetector } from '@/game/utils/Collision'

// 敌人射击配置
export const ENEMY_SHOOT_CONFIG = {
  // 射击间隔（毫秒）
  attackInterval: 1000,
  // 精度偏移角度（度）
  accuracyOffset: 10,
  // 最大射程（单位）
  maxRange: 20,
  // 有效射击角度（度）
  effectiveAngle: 180,
}

// 障碍物接口（用于类型检查）
interface ObstacleMesh extends THREE.Mesh {
  userData: {
    obstacleData?: {
      id: string
      health: number
      maxHealth: number
      isDestroyed: boolean
    }
  }
}

/**
 * 敌人射击系统
 * 负责敌人远程射线检测射击逻辑
 */
export class EnemyShooter {
  private raycaster: THREE.Raycaster

  constructor() {
    this.raycaster = new THREE.Raycaster()
  }

  /**
   * 检查敌人是否可以射击玩家
   * @param enemy 敌人
   * @param playerPosition 玩家位置
   * @returns 是否可以射击
   */
  canShoot(enemy: Enemy, playerPosition: THREE.Vector3): boolean {
    const directionToPlayer = new THREE.Vector3().subVectors(playerPosition, enemy.position)
    const distance = directionToPlayer.length()

    // 距离检查：超出射程则不能射击
    if (distance > ENEMY_SHOOT_CONFIG.maxRange) {
      return false
    }

    // 角度检查：玩家必须在敌人前方有效角度内
    directionToPlayer.normalize()
    const enemyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      enemy.mesh?.quaternion || new THREE.Quaternion()
    )

    const angle = Math.acos(Math.max(-1, Math.min(1, enemyForward.dot(directionToPlayer))))
    const angleDegrees = (angle * 180) / Math.PI

    return angleDegrees <= ENEMY_SHOOT_CONFIG.effectiveAngle
  }

  /**
   * 对玩家进行射线射击
   * @param enemy 敌人
   * @param playerPosition 玩家位置
   * @param playerMesh 玩家网格（用于射线检测）
   * @returns 射击结果
   */
  shootAtPlayer(
    enemy: Enemy,
    playerPosition: THREE.Vector3,
    playerMesh: THREE.Object3D | null
  ): ShootResult {
    // 计算射击方向
    const direction = new THREE.Vector3().subVectors(playerPosition, enemy.position)
    const baseDistance = direction.length()
    direction.normalize()

    // 应用精度偏移（±10度随机）
    const offsetAngle = (Math.random() - 0.5) * 2 * ENEMY_SHOOT_CONFIG.accuracyOffset
    const offsetRad = (offsetAngle * Math.PI) / 180

    // 随机偏移方向（水平偏移）
    const upVector = new THREE.Vector3(0, 1, 0)
    direction.applyAxisAngle(upVector, offsetRad)

    // 设置射线
    this.raycaster.set(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)), direction)
    this.raycaster.far = ENEMY_SHOOT_CONFIG.maxRange

    // 如果有玩家网格，检测射线是否击中
    if (playerMesh) {
      const intersects = this.raycaster.intersectObject(playerMesh, true)
      if (intersects.length > 0 && intersects[0].distance <= baseDistance + 1) {
        // 击中玩家
        return {
          hit: true,
          damage: enemy.config.damage,
          enemy,
        }
      }
      // 有玩家 mesh 但射线没命中
      return {
        hit: false,
        damage: 0,
        enemy,
      }
    }

    // 没有玩家 mesh（FPS 模式，玩家即摄像机），canShoot() 已验证距离和角度，直接命中
    return {
      hit: true,
      damage: enemy.config.damage,
      enemy,
    }
  }

  /**
   * 检查射击路径上是否有障碍物遮挡
   * @param start 起始位置
   * @param end 目标位置
   * @param obstacles 障碍物列表
   * @returns 是否有障碍物
   */
  checkObstacleBetween(start: THREE.Vector3, end: THREE.Vector3, obstacles: THREE.Mesh[]): boolean {
    const direction = new THREE.Vector3().subVectors(end, start)
    const distance = direction.length()
    direction.normalize()

    this.raycaster.set(start, direction)
    this.raycaster.far = distance

    for (const obstacle of obstacles) {
      const intersects = this.raycaster.intersectObject(obstacle, true)
      if (intersects.length > 0) {
        return true
      }
    }

    return false
  }

  /**
   * 查找攻击目标（优先玩家，若被遮挡则攻击障碍物）
   * @param enemy 敌人
   * @param playerPosition 玩家位置
   * @param obstacles 障碍物网格数组
   * @returns 攻击目标信息
   */
  findTargetToAttack(
    enemy: Enemy,
    playerPosition: THREE.Vector3,
    obstacles: THREE.Mesh[]
  ): { type: 'player' | 'obstacle'; position: THREE.Vector3; obstacle?: any } | null {
    // 先检测是否可以射击玩家
    if (this.canShoot(enemy, playerPosition)) {
      return { type: 'player', position: playerPosition }
    }

    // 玩家被遮挡，尝试查找路径上的障碍物
    const enemyPos = enemy.position.clone().add(new THREE.Vector3(0, 1, 0))
    const directionToPlayer = new THREE.Vector3().subVectors(playerPosition, enemyPos).normalize()

    this.raycaster.set(enemyPos, directionToPlayer)
    this.raycaster.far = 10 // 检测前方10米

    for (const obstacle of obstacles) {
      const intersects = this.raycaster.intersectObject(obstacle, true)
      if (intersects.length > 0) {
        return { type: 'obstacle', position: obstacle.position.clone() }
      }
    }

    return null
  }

  /**
   * 对障碍物造成伤害（委托给 collisionDetector）
   * @param position 伤害位置
   * @param damage 伤害值
   * @returns 破坏结果
   */
  damageObstacle(
    position: THREE.Vector3,
    damage: number
  ): { destroyed: boolean; obstacle: any } {
    if (collisionDetector) {
      return collisionDetector.takeDamageAtPosition(position, damage)
    }
    return { destroyed: false, obstacle: null }
  }
}

export const enemyShooter = new EnemyShooter()
