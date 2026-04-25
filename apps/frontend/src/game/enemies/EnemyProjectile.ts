import * as THREE from 'three'
import type { ProjectileVisual } from './types'

/**
 * 敌人子弹实例
 */
export interface EnemyProjectile {
  id: string
  mesh: THREE.Group
  position: THREE.Vector3
  velocity: THREE.Vector3
  damage: number
  lifetime: number
  maxRange: number
  ownerId: string
  alive: boolean
  visual: ProjectileVisual
  distanceTraveled: number
  // 尾迹粒子
  trailParticles: THREE.Mesh[]
  trailPositions: THREE.Vector3[]
}

/**
 * 子弹对象池，预分配实例避免 GC 抖动
 */
export class ProjectilePool {
  private pool: EnemyProjectile[] = []
  private active: EnemyProjectile[] = []
  private scene: THREE.Group | null = null
  private idCounter = 0

  constructor(size: number = 100) {
    for (let i = 0; i < size; i++) {
      const mesh = new THREE.Group()
      mesh.visible = false
      mesh.name = `projectile-pool-${i}`

      const projectile: EnemyProjectile = {
        id: '',
        mesh,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        damage: 0,
        lifetime: 0,
        maxRange: 25,
        distanceTraveled: 0,
        ownerId: '',
        alive: false,
        visual: 'star',
        trailParticles: [],
        trailPositions: [],
      }
      this.pool.push(projectile)
    }
  }

  /** 设置场景引用，所有子弹添加到此 group */
  setScene(scene: THREE.Group): void {
    this.scene = scene
    // 将所有池中网格添加到场景（不可见状态）
    for (const p of this.pool) {
      scene.add(p.mesh)
    }
  }

  /** 从池中获取一个空闲子弹 */
  acquire(): EnemyProjectile | null {
    for (const p of this.pool) {
      if (!p.alive) {
        p.alive = true
        p.id = `proj-${++this.idCounter}-${Date.now()}`
        this.active.push(p)
        return p
      }
    }
    // 池耗尽
    return null
  }

  /** 回收子弹到池中 */
  release(projectile: EnemyProjectile): void {
    projectile.alive = false
    projectile.mesh.visible = false
    projectile.position.set(0, 0, 0)
    projectile.velocity.set(0, 0, 0)
    projectile.damage = 0
    projectile.lifetime = 0
    projectile.maxRange = 25
    projectile.distanceTraveled = 0
    projectile.ownerId = ''
    projectile.trailPositions.length = 0

    // 清理尾迹粒子
    for (const p of projectile.trailParticles) {
      if (projectile.mesh.parent) {
        projectile.mesh.parent.remove(p)
      }
      if (p.material instanceof THREE.Material) {
        p.material.dispose()
      }
      p.geometry.dispose()
    }
    projectile.trailParticles.length = 0

    // 清理子弹网格的子对象（外观模型）
    while (projectile.mesh.children.length > 0) {
      const child = projectile.mesh.children[0]
      projectile.mesh.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    }

    const index = this.active.indexOf(projectile)
    if (index > -1) {
      this.active.splice(index, 1)
    }
  }

  /** 获取所有活跃子弹 */
  getActive(): EnemyProjectile[] {
    return this.active
  }

  /** 清理所有活跃子弹 */
  clear(): void {
    for (const p of [...this.active]) {
      this.release(p)
    }
    this.active.length = 0
  }

  /** 清理整个池（从场景移除） */
  dispose(): void {
    this.clear()
    for (const p of this.pool) {
      if (this.scene) {
        this.scene.remove(p.mesh)
      }
    }
    this.pool.length = 0
  }
}
