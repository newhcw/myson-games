import * as THREE from 'three'

// 障碍物数据接口
export interface ObstacleData {
  id: string
  mesh: THREE.Object3D
  health: number
  maxHealth: number
  isDestroyed: boolean
  hitPosition: THREE.Vector3
}

export class CollisionDetector {
  private colliders: THREE.Box3[] = []
  private obstacleMap: Map<string, ObstacleData> = new Map()

  addCollider(mesh: THREE.Object3D, health?: number, hitPosition?: THREE.Vector3) {
    const box = new THREE.Box3().setFromObject(mesh)
    this.colliders.push(box)

    // 如果指定了血量，注册为可破坏障碍物
    if (health !== undefined) {
      const position = hitPosition || mesh.position.clone()
      const obstacleData: ObstacleData = {
        id: mesh.uuid,
        mesh,
        health,
        maxHealth: health,
        isDestroyed: false,
        hitPosition: position,
      }
      this.obstacleMap.set(mesh.uuid, obstacleData)
      // 在 mesh.userData 中存储引用
      mesh.userData = mesh.userData || {}
      mesh.userData.obstacleData = obstacleData
    }
  }

  removeAllColliders() {
    this.colliders = []
    this.obstacleMap.clear()
  }

  // 移除指定障碍物
  removeCollider(meshUuid: string) {
    this.obstacleMap.delete(meshUuid)
    // 注意：colliders 数组中的 Box3 不会自动移除，但被破坏的障碍物 mesh 会被移除
  }

  checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, position.y - 1, position.z - radius),
      new THREE.Vector3(position.x + radius, position.y + 0.5, position.z + radius)
    )

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider)) {
        return true
      }
    }
    return false
  }

  // 对位置附近的障碍物造成伤害
  takeDamageAtPosition(position: THREE.Vector3, damage: number): { destroyed: boolean; obstacle: ObstacleData | null } {
    const radius = 1.0 // 1米范围内检测

    for (const [uuid, obstacle] of this.obstacleMap) {
      if (obstacle.isDestroyed) continue

      const distance = obstacle.hitPosition.distanceTo(position)
      if (distance <= radius) {
        obstacle.health -= damage
        if (obstacle.health <= 0) {
          obstacle.health = 0
          obstacle.isDestroyed = true
          return { destroyed: true, obstacle }
        }
        return { destroyed: false, obstacle }
      }
    }

    return { destroyed: false, obstacle: null }
  }

  // 获取位置附近的障碍物
  getObstacleAt(position: THREE.Vector3, radius: number = 1.0): ObstacleData | null {
    for (const [uuid, obstacle] of this.obstacleMap) {
      if (obstacle.isDestroyed) continue
      const distance = obstacle.mesh.position.distanceTo(position)
      if (distance <= radius) {
        return obstacle
      }
    }
    return null
  }

  // Placeholder for ray-based collision detection
  // Will be implemented when needed for shooting mechanics
  raycast(
    _origin: THREE.Vector3,
    _direction: THREE.Vector3,
    _maxDistance: number = 100
  ): THREE.Vector3 | null {
    // TODO: Implement proper ray-based collision
    return null
  }
}

export const collisionDetector = new CollisionDetector()
