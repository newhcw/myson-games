import * as THREE from 'three'
import type { ProjectileVisual } from './types'
import { ProjectilePool, type EnemyProjectile } from './EnemyProjectile'
import { createProjectileVisual, createTrailParticles, updateTrailParticles, createHitExplosion } from './ProjectileRenderer'

/**
 * 子弹生成参数
 */
export interface ProjectileSpawnConfig {
  position: THREE.Vector3
  direction: THREE.Vector3
  speed: number
  damage: number
  visual: ProjectileVisual
  ownerId: string
  spreadAngle: number // 散布角度（度）
}

/**
 * 子弹管理器，负责子弹的生成、飞行、碰撞检测和生命周期管理
 */
export class ProjectileManager {
  private pool: ProjectilePool
  private scene: THREE.Group | null = null
  private playerPosition: THREE.Vector3 = new THREE.Vector3()
  private onPlayerHit: ((damage: number) => void) | null = null

  constructor(poolSize: number = 100) {
    this.pool = new ProjectilePool(poolSize)
  }

  /** 设置场景引用 */
  setScene(scene: THREE.Group): void {
    this.scene = scene
    this.pool.setScene(scene)
  }

  /** 设置玩家位置引用 */
  setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition = position
  }

  /** 设置命中回调 */
  setOnPlayerHit(callback: (damage: number) => void): void {
    this.onPlayerHit = callback
  }

  /** 生成一颗子弹 */
  spawn(config: ProjectileSpawnConfig): EnemyProjectile | null {
    const projectile = this.pool.acquire()
    if (!projectile) return null

    // 应用散布偏移
    const spreadRad = (config.spreadAngle * Math.PI) / 180
    const offsetAngle = (Math.random() - 0.5) * 2 * spreadRad
    const direction = config.direction.clone()

    // 在水平面上偏移
    const upVector = new THREE.Vector3(0, 1, 0)
    direction.applyAxisAngle(upVector, offsetAngle)
    direction.normalize()

    projectile.position.copy(config.position)
    projectile.velocity.copy(direction.multiplyScalar(config.speed))
    projectile.damage = config.damage
    projectile.lifetime = 2.0 // 最多存活 2 秒
    projectile.maxRange = 25
    projectile.ownerId = config.ownerId
    projectile.visual = config.visual
    projectile.mesh.visible = true
    projectile.mesh.position.copy(config.position)
    projectile.mesh.rotation.set(0, Math.atan2(direction.x, direction.z), 0)

    // 创建子弹外观
    createProjectileVisual(projectile.mesh, config.visual)

    // 创建尾迹粒子（精英和 BOSS）
    if (config.visual === 'crystal' || config.visual === 'fireball') {
      const trailParticles = createTrailParticles(projectile.mesh, config.visual)
      projectile.trailParticles = trailParticles
    }

    return projectile
  }

  /** 每帧更新所有活跃子弹 */
  update(delta: number): void {
    const active = this.pool.getActive()
    const playerPos = this.playerPosition

    for (const p of active) {
      // 飞行运动
      const step = p.velocity.clone().multiplyScalar(delta)
      p.position.add(step)
      p.mesh.position.copy(p.position)

      // 累计飞行距离
      p.distanceTraveled += step.length()

      // 更新尾迹位置记录
      p.trailPositions.push(p.position.clone())
      if (p.trailPositions.length > 5) {
        p.trailPositions.shift()
      }

      // 更新尾迹粒子
      if (p.trailParticles.length > 0) {
        updateTrailParticles(p)
      }

      // 子弹始终面朝运动方向
      if (p.velocity.length() > 0.01) {
        const dir = p.velocity.clone().normalize()
        p.mesh.rotation.set(0, Math.atan2(dir.x, dir.z), 0)
      }

      // 碰撞检测：水平距离 + 垂直距离分别检测
      // 水平距离阈值 0.5 单位
      const distXZ = Math.sqrt(
        (p.position.x - playerPos.x) ** 2 + (p.position.z - playerPos.z) ** 2
      )
      const distY = Math.abs(p.position.y - playerPos.y)
      if (distXZ < 0.5 && distY < 1.2) {
        // 命中玩家
        if (this.onPlayerHit) {
          this.onPlayerHit(p.damage)
        }
        // 命中爆炸特效
        if (this.scene) {
          createHitExplosion(p.position.clone(), p.visual, this.scene)
        }
        this.pool.release(p)
        continue
      }

      // 超时或超出射程
      p.lifetime -= delta
      if (p.lifetime <= 0 || p.distanceTraveled >= p.maxRange) {
        this.pool.release(p)
        continue
      }
    }
  }

  /** 获取活跃子弹列表 */
  getActiveProjectiles(): EnemyProjectile[] {
    return this.pool.getActive()
  }

  /** 获取活跃子弹数量 */
  getActiveCount(): number {
    return this.pool.getActive().length
  }

  /** 清理所有子弹 */
  clear(): void {
    this.pool.clear()
  }

  /** 完全销毁 */
  dispose(): void {
    this.pool.dispose()
  }
}
