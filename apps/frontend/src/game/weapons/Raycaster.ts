import * as THREE from 'three'
import type { Enemy } from '../enemies/types'

export interface HitResult {
  enemy: Enemy
  position: THREE.Vector3
  damage: number
}

export class WeaponRaycaster {
  private raycaster: THREE.Raycaster
  private scene: THREE.Scene | null = null

  constructor() {
    this.raycaster = new THREE.Raycaster()
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * 射击射线检测
   * @param origin 射击起点（枪口位置）
   * @param direction 射击方向
   * @param damage 伤害值
   * @param enemies 敌人列表
   * @param maxDistance 最大射程
   */
  fire(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    enemies: Enemy[],
    maxDistance: number = 100
  ): HitResult | null {
    if (!this.scene) {
      console.warn('Scene not set for raycaster')
      return null
    }

    // 设置射线
    this.raycaster.set(origin, direction.clone().normalize())
    this.raycaster.far = maxDistance

    // 获取所有可碰撞对象
    const collidableObjects: THREE.Object3D[] = []
    enemies.forEach(enemy => {
      if (enemy.mesh) {
        collidableObjects.push(enemy.mesh)
      }
    })

    // 执行射线检测
    const intersects = this.raycaster.intersectObjects(collidableObjects, false)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // 找到被击中的敌人
      for (const enemy of enemies) {
        if (enemy.mesh && hit.object === enemy.mesh) {
          return {
            enemy,
            position: hit.point,
            damage,
          }
        }
      }
    }

    return null
  }

  /**
   * 散弹枪多点射线检测
   */
  fireShotgun(
    origin: THREE.Vector3,
    baseDirection: THREE.Vector3,
    damage: number,
    enemies: Enemy[],
    pelletCount: number = 8,
    spread: number = 0.1,
    maxDistance: number = 50
  ): HitResult[] {
    const results: HitResult[] = []

    for (let i = 0; i < pelletCount; i++) {
      // 计算散射方向
      const offsetX = (Math.random() - 0.5) * spread
      const offsetY = (Math.random() - 0.5) * spread

      const direction = baseDirection.clone()
      direction.x += offsetX
      direction.y += offsetY
      direction.normalize()

      const hit = this.fire(origin, direction, damage, enemies, maxDistance)

      if (hit) {
        // 确保不重复击中同一敌人
        if (!results.some(r => r.enemy === hit.enemy)) {
          results.push(hit)
        }
      }
    }

    return results
  }

  /**
   * 获取射线方向的终点（用于显示弹道）
   */
  getRayEndpoint(origin: THREE.Vector3, direction: THREE.Vector3, distance: number = 100): THREE.Vector3 {
    return origin.clone().add(direction.clone().normalize().multiplyScalar(distance))
  }
}

export const weaponRaycaster = new WeaponRaycaster()