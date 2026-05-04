/**
 * 道具管理器
 * 负责道具的 3D 模型创建、动画、拾取检测、生命周期管理、Buff 效果触发
 */

import * as THREE from 'three'
import type { PowerUpType, PowerUpItem, PowerUpSpawnConfig, PowerUpCallbacks } from './types'
import { POWERUP_INFO, ALL_POWERUP_TYPES, POWERUP_WEIGHTS, POWERUP_CONSTANTS } from './types'

export class PowerUpManager {
  private scene: THREE.Scene | null = null
  private items: PowerUpItem[] = []
  private callbacks: PowerUpCallbacks | null = null
  private playerPosition: THREE.Vector3 = new THREE.Vector3()

  /** 设置场景引用 */
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  /** 设置效果回调 */
  setCallbacks(callbacks: PowerUpCallbacks): void {
    this.callbacks = callbacks
  }

  /** 更新玩家位置（用于拾取检测） */
  setPlayerPosition(pos: THREE.Vector3): void {
    this.playerPosition.copy(pos)
  }

  /** 根据权重随机选择一个道具类型（血量优先） */
  static randomType(): PowerUpType {
    const totalWeight = POWERUP_WEIGHTS.health + POWERUP_WEIGHTS.ammo + POWERUP_WEIGHTS.doubleDamage
    let r = Math.random() * totalWeight
    for (const type of ALL_POWERUP_TYPES) {
      r -= POWERUP_WEIGHTS[type]
      if (r <= 0) return type
    }
    return 'health' // fallback
  }

  /**
   * 在指定位置生成一个道具
   * 如果同屏道具已达上限，先移除最早掉落的
   */
  spawn(config: PowerUpSpawnConfig): PowerUpItem | null {
    if (!this.scene) return null

    // 超出上限：移除最早的
    while (this.items.length >= POWERUP_CONSTANTS.MAX_POWERUPS) {
      this.removeItem(0)
    }

    const mesh = this.createPowerUpMesh(config.type)
    const position = config.position.clone()
    position.y = 0.5 // 道具漂浮在地面上方
    mesh.position.copy(position)

    this.scene.add(mesh)

    const item: PowerUpItem = {
      id: `powerup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: config.type,
      mesh,
      position,
      spawnTime: Date.now(),
      alive: true,
    }

    this.items.push(item)
    return item
  }

  /**
   * 每帧更新：动画 + 拾取检测 + 超时清理
   */
  update(delta: number, time: number): void {
    const now = Date.now()

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      if (!item.alive) {
        this.removeItem(i)
        continue
      }

      // 超时检测
      const age = now - item.spawnTime
      if (age > POWERUP_CONSTANTS.LIFETIME) {
        this.fadeOutAndRemove(i)
        continue
      }

      // 动画
      this.animateItem(item, delta, time)

      // 拾取检测
      if (this.checkPickup(item)) {
        this.onPickup(item)
        this.removeItem(i)
      }
    }
  }

  /** 清理所有道具 */
  dispose(): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.removeItem(i)
    }
    this.items = []
  }

  /** 获取活跃道具数量 */
  getActiveCount(): number {
    return this.items.length
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /** 创建道具 3D 模型 */
  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group()
    const info = POWERUP_INFO[type]
    const color = info.color

    // 自发光材质
    const emissiveMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.1,
    })

    switch (type) {
      case 'health':
        this.createHeartMesh(group, emissiveMat)
        break
      case 'ammo':
        this.createAmmoMesh(group, emissiveMat)
        break
      case 'doubleDamage':
        this.createStarMesh(group, emissiveMat)
        break
    }

    // 外发光环
    const ringGeom = new THREE.RingGeometry(0.3, 0.4, 16)
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -0.3
    ring.name = 'glowRing'
    group.add(ring)

    return group
  }

  /** 生命药水：心形（两个半球 + 圆柱） */
  private createHeartMesh(group: THREE.Group, mat: THREE.MeshStandardMaterial): void {
    // 左半球
    const sphereGeom = new THREE.SphereGeometry(0.15, 12, 12, 0, Math.PI, 0, Math.PI / 2)
    const left = new THREE.Mesh(sphereGeom, mat.clone())
    left.position.set(-0.1, 0.1, 0)
    group.add(left)

    // 右半球
    const right = new THREE.Mesh(sphereGeom.clone(), mat.clone())
    right.position.set(0.1, 0.1, 0)
    right.rotation.y = Math.PI
    group.add(right)

    // 底部圆柱（心尖）
    const coneGeom = new THREE.ConeGeometry(0.2, 0.25, 4)
    const cone = new THREE.Mesh(coneGeom, mat.clone())
    cone.position.set(0, -0.1, 0)
    cone.rotation.z = Math.PI
    group.add(cone)
  }

  /** 弹药补给：立方体 */
  private createAmmoMesh(group: THREE.Group, mat: THREE.MeshStandardMaterial): void {
    const boxGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const box = new THREE.Mesh(boxGeom, mat.clone())
    group.add(box)

    // 边框线效果
    const edges = new THREE.EdgesGeometry(boxGeom)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    const wireframe = new THREE.LineSegments(edges, lineMat)
    group.add(wireframe)
  }

  /** 双倍伤害：八面体（星形） */
  private createStarMesh(group: THREE.Group, mat: THREE.MeshStandardMaterial): void {
    const octGeom = new THREE.OctahedronGeometry(0.2, 0)
    const oct = new THREE.Mesh(octGeom, mat.clone())
    group.add(oct)

    // 外层光晕八面体（稍大，透明）
    const glowGeom = new THREE.OctahedronGeometry(0.28, 0)
    const glowMat = new THREE.MeshBasicMaterial({
      color: mat.color,
      transparent: true,
      opacity: 0.25,
    })
    const glow = new THREE.Mesh(glowGeom, glowMat)
    glow.name = 'glowShell'
    group.add(glow)
  }

  /** 道具动画：旋转 + 浮动 + 脉冲发光 */
  private animateItem(item: PowerUpItem, delta: number, time: number): void {
    const mesh = item.mesh

    // Y 轴旋转
    mesh.rotation.y += POWERUP_CONSTANTS.ROTATE_SPEED * delta

    // 上下浮动
    const floatY = Math.sin(time * Math.PI * 2 / POWERUP_CONSTANTS.FLOAT_PERIOD) * POWERUP_CONSTANTS.FLOAT_AMPLITUDE
    mesh.position.y = 0.5 + floatY

    // 脉冲发光
    const pulse = 0.5 + Math.sin(time * 4) * 0.3
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = pulse
        }
      }
    })

    // 发光环脉冲
    const ring = mesh.getObjectByName('glowRing')
    if (ring) {
      const ringPulse = 0.3 + Math.sin(time * 3) * 0.2
      ;(ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: POWERUP_INFO[item.type].color,
        transparent: true,
        opacity: ringPulse,
        side: THREE.DoubleSide,
      })
    }
  }

  /** 检测玩家是否在拾取范围内 */
  private checkPickup(item: PowerUpItem): boolean {
    const dx = this.playerPosition.x - item.position.x
    const dz = this.playerPosition.z - item.position.z
    const distXZ = Math.sqrt(dx * dx + dz * dz)
    const distY = Math.abs(this.playerPosition.y - item.position.y)

    return distXZ < POWERUP_CONSTANTS.PICKUP_RANGE && distY < POWERUP_CONSTANTS.PICKUP_RANGE_Y
  }

  /** 拾取道具：触发效果 */
  private onPickup(item: PowerUpItem): void {
    const info = POWERUP_INFO[item.type]

    // 播放拾取粒子效果
    this.createPickupEffect(item.position, info.color)

    // 触发回调
    if (this.callbacks) {
      switch (item.type) {
        case 'health':
          this.callbacks.onHealthPickup(POWERUP_CONSTANTS.HEAL_AMOUNT)
          break
        case 'ammo':
          this.callbacks.onAmmoPickup()
          break
        case 'doubleDamage':
          this.callbacks.onDoubleDamagePickup(info.duration)
          break
      }
    }
  }

  /** 拾取时的粒子爆发效果 */
  private createPickupEffect(position: THREE.Vector3, color: number): void {
    if (!this.scene) return

    const count = 12
    const particles: THREE.Mesh[] = []

    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.04, 4, 4)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      const p = new THREE.Mesh(geom, mat)
      p.position.copy(position)
      this.scene.add(p)
      particles.push(p)

      const angle = (i / count) * Math.PI * 2
      const speed = 1.5 + Math.random()
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        1 + Math.random(),
        Math.sin(angle) * speed,
      )

      let elapsed = 0
      const animate = () => {
        elapsed += 0.016
        if (elapsed > 0.6 || !p.parent) {
          p.geometry.dispose()
          ;(p.material as THREE.Material).dispose()
          this.scene?.remove(p)
          return
        }
        p.position.add(vel.clone().multiplyScalar(0.016))
        vel.y -= 5 * 0.016 // 重力
        ;(p.material as THREE.MeshBasicMaterial).opacity = 1 - elapsed / 0.6
        requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }
  }

  /** 淡出移除（超时） */
  private fadeOutAndRemove(index: number): void {
    const item = this.items[index]
    if (!item.alive) return
    item.alive = false

    const mesh = item.mesh
    const startTime = Date.now()
    const duration = POWERUP_CONSTANTS.FADE_OUT_DURATION

    const fade = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1 || !mesh.parent) {
        this.removeItem(index)
        return
      }

      mesh.scale.setScalar(1 - progress)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial
          if ('opacity' in mat) {
            mat.transparent = true
            mat.opacity = 1 - progress
          }
        }
      })

      requestAnimationFrame(fade)
    }
    requestAnimationFrame(fade)
  }

  /** 从场景和列表中移除道具 */
  private removeItem(index: number): void {
    const item = this.items[index]
    if (!item) return

    item.alive = false

    if (item.mesh.parent) {
      item.mesh.parent.remove(item.mesh)
    }

    // 释放资源
    item.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })

    this.items.splice(index, 1)
  }
}
