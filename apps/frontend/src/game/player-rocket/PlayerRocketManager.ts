import * as THREE from 'three'
import { collisionDetector } from '@/game/utils/Collision'
import { RpgExplosion } from './RpgExplosion'

/** 火箭实体 */
export interface PlayerRocket {
  mesh: THREE.Group
  position: THREE.Vector3
  velocity: THREE.Vector3
  lifetime: number
  maxRange: number
  distanceTraveled: number
  spawnTime: number
  /** 发射时的水平偏移角度（用于摇摆计算） */
  wobblePhase: number
  trailTimer: number
  alive: boolean
  spawnScale: number
}

export interface RocketSpawnConfig {
  origin: THREE.Vector3
  direction: THREE.Vector3
  speed?: number
}

export class PlayerRocketManager {
  private rockets: PlayerRocket[] = []
  private scene: THREE.Scene | null = null
  private onExplosion: ((position: THREE.Vector3) => void) | null = null
  private getEnemyPositions: (() => { position: THREE.Vector3; isDead: boolean }[]) | null = null

  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  setOnExplosion(callback: (position: THREE.Vector3) => void): void {
    this.onExplosion = callback
  }

  /** 设置敌人位置提供器，用于火箭飞行过程中的敌人接近检测 */
  setEnemyProvider(provider: () => { position: THREE.Vector3; isDead: boolean }[]): void {
    this.getEnemyPositions = provider
  }

  /** 发射火箭 */
  spawn(config: RocketSpawnConfig): PlayerRocket | null {
    if (!this.scene) return null

    const speed = config.speed || 650
    const rocket = this.createRocketMesh()
    const pos = config.origin.clone()
    const dir = config.direction.clone().normalize()
    const vel = dir.clone().multiplyScalar(speed)

    rocket.position.copy(pos)

    // 火箭指向飞行方向
    rocket.lookAt(pos.clone().add(dir))
    // 略微倾斜火箭（看起来更卡通）
    rocket.rotateZ(0.2)

    // 出场缩放动画：从小变大
    rocket.scale.set(0.2, 0.2, 0.2)

    this.scene.add(rocket)

    const entity: PlayerRocket = {
      mesh: rocket,
      position: pos,
      velocity: vel,
      lifetime: 3.0,
      maxRange: 150,
      distanceTraveled: 0,
      spawnTime: Date.now(),
      wobblePhase: Math.random() * Math.PI * 2,
      trailTimer: 0,
      alive: true,
      spawnScale: 0.2,
    }

    this.rockets.push(entity)

    // 发射闪光效果
    this.createMuzzleFlash(pos, dir)

    return entity
  }

  /** 每帧更新所有火箭 */
  update(delta: number, playerPosition: THREE.Vector3): void {
    // 需要 playerPosition 来排除主角碰撞，但火箭实际上不用检测玩家
    void playerPosition

    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i]
      if (!rocket.alive) {
        this.destroyRocket(i)
        continue
      }

      // === 保存移动前位置（用于段碰撞检测） ===
      const prevPosition = rocket.position.clone()

      // === 飞行运动 ===
      const step = rocket.velocity.clone().multiplyScalar(delta)

      // 重力下坠（轻微）
      rocket.velocity.y += -2 * delta

      // 正弦波摇摆
      const time = (Date.now() - rocket.spawnTime) / 1000
      const wobbleH = Math.sin(time * 3 * Math.PI + rocket.wobblePhase) * 0.2 * delta * 10
      const wobbleV = Math.sin(time * 2 * Math.PI + rocket.wobblePhase + 1.5) * 0.15 * delta * 10

      // 摇摆方向：基于火箭速度方向的垂直向量
      const forward = rocket.velocity.clone().normalize()
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
      const up = new THREE.Vector3(0, 1, 0)

      step.add(right.clone().multiplyScalar(wobbleH))
      step.add(up.clone().multiplyScalar(wobbleV))

      rocket.position.add(step)
      rocket.mesh.position.copy(rocket.position)
      rocket.distanceTraveled += step.length()

      // 火箭朝向运动方向
      if (rocket.velocity.length() > 0.01) {
        const lookTarget = rocket.position.clone().add(rocket.velocity.clone().normalize())
        rocket.mesh.lookAt(lookTarget)
        // 保持卡通倾斜
        rocket.mesh.rotateZ(0.2)
      }

      // === 出场缩放动画 ===
      if (rocket.spawnScale < 1) {
        rocket.spawnScale += delta * 4 // 0.2秒完成（从0.2到1，速率4/秒）
        if (rocket.spawnScale >= 1) {
          rocket.spawnScale = 1
        }
        rocket.mesh.scale.setScalar(rocket.spawnScale)
      }

      // === 尾迹粒子 ===
      rocket.trailTimer += delta
      if (rocket.trailTimer >= 0.03) {
        rocket.trailTimer = 0
        this.spawnTrailParticle(rocket)
        // 额外喷射火焰粒子（每帧多1-2个）
        this.spawnFlameParticle(rocket)
        if (Math.random() > 0.5) {
          this.spawnFlameParticle(rocket)
        }
      }

      // === 障碍物碰撞检测 ===
      if (collisionDetector.checkCollision(rocket.position, 0.3)) {
        this.explode(rocket)
        continue
      }

      // === 敌人接近检测：检查火箭轨迹段（prev→current）是否经过敌人附近 ===
      if (this.getEnemyPositions) {
        const enemies = this.getEnemyPositions()
        const proximityRadius = 3.0
        for (const enemy of enemies) {
          if (enemy.isDead) continue
          if (this.segmentNearPoint(prevPosition, rocket.position, enemy.position, proximityRadius)) {
            // 将火箭移动到接近敌人的位置再爆炸
            rocket.position.copy(enemy.position)
            rocket.mesh.position.copy(rocket.position)
            this.explode(rocket)
            break
          }
        }
        if (!rocket.alive) continue
      }

      // === 超时或超出射程 ===
      rocket.lifetime -= delta
      if (rocket.lifetime <= 0 || rocket.distanceTraveled >= rocket.maxRange) {
        this.explode(rocket)
        continue
      }
    }
  }

  /** 火箭爆炸 */
  private explode(rocket: PlayerRocket): void {
    if (!rocket.alive || !this.scene) return
    rocket.alive = false

    const pos = rocket.position.clone()

    // 播放爆炸特效
    RpgExplosion.createExplosion(pos, this.scene)

    // 回调通知（用于 AOE 伤害）
    if (this.onExplosion) {
      this.onExplosion(pos)
    }

    // 火箭网格会在下一帧被 destroyRocket 清理
  }

  /** 生成尾迹粒子 */
  private spawnTrailParticle(rocket: PlayerRocket): void {
    if (!this.scene) return

    const colors = [0xFF6B6B, 0xFFA94D, 0xFFD43B, 0x69DB7C, 0x74C0FC, 0xB197FC]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = 0.08 + Math.random() * 0.07

    const geom = new THREE.SphereGeometry(size, 6, 6)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9
    })
    const particle = new THREE.Mesh(geom, mat)

    // 在火箭尾部稍后的位置生成
    const backward = rocket.velocity.clone().normalize().multiplyScalar(-0.3)
    particle.position.copy(rocket.position).add(backward)
    // 加一点随机偏移
    particle.position.x += (Math.random() - 0.5) * 0.1
    particle.position.y += (Math.random() - 0.5) * 0.1
    particle.position.z += (Math.random() - 0.5) * 0.1

    this.scene.add(particle)

    // 粒子动画：飘散 + 淡出
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5 + 0.5, // 略微向上
      (Math.random() - 0.5) * 1.5
    )

    let elapsed = 0
    const duration = 0.8
    const animateParticle = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !particle.parent) {
        particle.geometry.dispose()
        mat.dispose()
        this.scene?.remove(particle)
        return
      }

      particle.position.add(vel.clone().multiplyScalar(0.016))
      vel.multiplyScalar(0.95)
      mat.opacity = 0.9 * (1 - progress)

      requestAnimationFrame(animateParticle)
    }
    requestAnimationFrame(animateParticle)
  }

  /** 发射闪光效果：橙黄色球形闪光，快速缩小淡出 */
  private createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    if (!this.scene) return

    // 闪光位置在玩家前方 0.5 单位
    const flashPos = position.clone().add(direction.clone().multiplyScalar(0.5))
    const flashGeom = new THREE.SphereGeometry(0.3, 12, 12)
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA33,
      transparent: true,
      opacity: 0.9,
    })
    const flash = new THREE.Mesh(flashGeom, flashMat)
    flash.position.copy(flashPos)
    this.scene.add(flash)

    // 闪光动画：0.15秒内缩小到0并淡出
    let elapsed = 0
    const duration = 0.15
    const animateFlash = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !flash.parent) {
        this.scene?.remove(flash)
        flash.geometry.dispose()
        flashMat.dispose()
        return
      }

      const scale = 1 - progress
      flash.scale.setScalar(scale)
      flashMat.opacity = 0.9 * (1 - progress)

      requestAnimationFrame(animateFlash)
    }
    requestAnimationFrame(animateFlash)
  }

  /** 尾部火焰喷射粒子：橙红色，短寿命，模拟推进火焰 */
  private spawnFlameParticle(rocket: PlayerRocket): void {
    if (!this.scene) return

    // 火焰粒子比尾迹粒子更大、更短命
    const size = 0.05 + Math.random() * 0.05
    const geom = new THREE.SphereGeometry(size, 6, 6)
    const flameColors = [0xFF4400, 0xFF6600, 0xFFAA00, 0xFF2200]
    const color = flameColors[Math.floor(Math.random() * flameColors.length)]
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    })
    const particle = new THREE.Mesh(geom, mat)

    // 在火箭尾部位置生成
    const backward = rocket.velocity.clone().normalize().multiplyScalar(-0.4)
    particle.position.copy(rocket.position).add(backward)
    // 随机偏移
    particle.position.x += (Math.random() - 0.5) * 0.15
    particle.position.y += (Math.random() - 0.5) * 0.15
    particle.position.z += (Math.random() - 0.5) * 0.15

    this.scene.add(particle)

    // 火焰粒子动画：0.3秒淡出，向后飘散
    const vel = backward.clone().normalize().multiplyScalar(0.5 + Math.random() * 0.5)
    vel.x += (Math.random() - 0.5) * 0.3
    vel.y += (Math.random() - 0.5) * 0.3
    vel.z += (Math.random() - 0.5) * 0.3

    let elapsed = 0
    const duration = 0.3
    const animateFlame = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !particle.parent) {
        this.scene?.remove(particle)
        particle.geometry.dispose()
        mat.dispose()
        return
      }

      particle.position.add(vel.clone().multiplyScalar(0.016))
      vel.multiplyScalar(0.9)
      mat.opacity = 0.8 * (1 - progress)
      particle.scale.setScalar(1 - progress * 0.5)

      requestAnimationFrame(animateFlame)
    }
    requestAnimationFrame(animateFlame)
  }

  private createRocketMesh(): THREE.Group {
    const group = new THREE.Group()

    // 火箭主体（胖胖的圆柱）
    const bodyGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xFF4444,
      emissive: 0xFF2222,
      emissiveIntensity: 0.2,
    })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.rotation.x = Math.PI / 2
    body.position.z = -0.05
    group.add(body)

    // 火箭头（圆锥）
    const noseGeom = new THREE.ConeGeometry(0.12, 0.2, 8)
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00 })
    const nose = new THREE.Mesh(noseGeom, noseMat)
    nose.rotation.x = -Math.PI / 2
    nose.position.z = 0.3
    group.add(nose)

    // 火箭尾翼
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      const finGeom = new THREE.BoxGeometry(0.02, 0.06, 0.1)
      const finMat = new THREE.MeshStandardMaterial({ color: 0xFF8800 })
      const fin = new THREE.Mesh(finGeom, finMat)
      fin.position.set(
        Math.cos(angle) * 0.15,
        Math.sin(angle) * 0.15,
        -0.35
      )
      fin.rotation.z = angle
      group.add(fin)
    }

    // 两只卡通大眼睛
    const eyeMatWhite = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    const eyeMatPupil = new THREE.MeshBasicMaterial({ color: 0x000000 })

    for (let side = -1; side <= 1; side += 2) {
      const eyeGroup = new THREE.Group()

      // 眼白
      const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8)
      const eyeWhite = new THREE.Mesh(eyeGeom, eyeMatWhite)
      eyeGroup.add(eyeWhite)

      // 瞳孔
      const pupilGeom = new THREE.SphereGeometry(0.025, 8, 8)
      const pupil = new THREE.Mesh(pupilGeom, eyeMatPupil)
      pupil.position.set(0, 0, 0.04)
      eyeGroup.add(pupil)

      eyeGroup.position.set(side * 0.06, 0.04, 0.15)
      group.add(eyeGroup)
    }

    // 缩放整体到合适大小
    group.scale.set(1, 1, 1)

    return group
  }

  /** 销毁火箭网格 */
  private destroyRocket(index: number): void {
    const rocket = this.rockets[index]
    if (rocket && rocket.mesh.parent) {
      rocket.mesh.parent.remove(rocket.mesh)
      // 递归释放几何和材质
      rocket.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }
    this.rockets.splice(index, 1)
  }

  /** 获取活跃火箭列表 */
  getActiveRockets(): PlayerRocket[] {
    return this.rockets.filter(r => r.alive)
  }

  /**
   * 检查从 A 到 B 的线段（xz 平面）是否经过 C 的 proximityRadius 范围内
   * 用于检测高速火箭是否穿过了敌人
   */
  private segmentNearPoint(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, radius: number): boolean {
    // xz 平面上的向量
    const abx = b.x - a.x
    const abz = b.z - a.z
    const acx = c.x - a.x
    const acz = c.z - a.z

    const abLenSq = abx * abx + abz * abz
    if (abLenSq < 0.0001) {
      // 线段退化为点
      const dist = Math.sqrt(acx * acx + acz * acz)
      return dist < radius
    }

    // 投影参数 t，钳制到 [0, 1]
    let t = (acx * abx + acz * abz) / abLenSq
    t = Math.max(0, Math.min(1, t))

    // 线段上最近点
    const closestX = a.x + t * abx
    const closestZ = a.z + t * abz

    const dist = Math.sqrt((c.x - closestX) ** 2 + (c.z - closestZ) ** 2)
    return dist < radius
  }

  /** 清理所有火箭 */
  clear(): void {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      this.destroyRocket(i)
    }
    this.rockets = []
  }
}
