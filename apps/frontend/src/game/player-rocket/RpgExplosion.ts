import * as THREE from 'three'

/**
 * RPG 爆炸特效类
 * 提供静态方法创建卡通风格的 RPG 爆炸效果
 */
export class RpgExplosion {
  /**
   * 创建完整的 RPG 爆炸特效
   * @param position 爆炸中心位置
   * @param scene 场景引用
   * @param onEnemyInRange 可选回调，用于 AOE 检测
   */
  static createExplosion(
    position: THREE.Vector3,
    scene: THREE.Scene | THREE.Group,
    onEnemyInRange?: (position: THREE.Vector3, radius: number) => void
  ): void {
    // AOE 检测回调（如果提供了回调，则调用；实际 AOE 伤害由 FPSGame.handleRocketExplosion 统一处理）
    if (onEnemyInRange) {
      onEnemyInRange(position, 20)
    }

    // 创建爆炸特效组
    const explosion = new THREE.Group()
    explosion.position.copy(position)
    scene.add(explosion)

    // 1. 彩色纸屑粒子
    RpgExplosion.createConfetti(explosion)

    // 2. 彩虹环扩散
    RpgExplosion.createRainbowRing(explosion)

    // 3. 星星闪光
    RpgExplosion.createStarBurst(explosion)

    // 4. "BOOM！"环形闪光
    RpgExplosion.createBoomFlash(explosion)

    // 1 秒后自动清理
    setTimeout(() => {
      scene.remove(explosion)
      explosion.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }, 1000)
  }

  /** 彩色纸屑：40-50 个小方块/圆片飞散 */
  private static createConfetti(parent: THREE.Group): void {
    const count = 40 + Math.floor(Math.random() * 10)
    const confettiColors = [0xFF6B6B, 0xFFA94D, 0xFFD43B, 0x69DB7C, 0x74C0FC, 0xB197FC, 0xFF8ED4]

    for (let i = 0; i < count; i++) {
      const isSquare = Math.random() > 0.5
      const geom = isSquare
        ? new THREE.BoxGeometry(0.04 + Math.random() * 0.04, 0.04 + Math.random() * 0.04, 0.01)
        : new THREE.CircleGeometry(0.03 + Math.random() * 0.03, 5)
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)]
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      })
      const particle = new THREE.Mesh(geom, mat)
      particle.position.set(0, 0, 0)
      parent.add(particle)

      // 随机飞散方向
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 1 + Math.random() * 3
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.sin(phi) * Math.sin(theta)) * speed + 1, // 永远向上
        Math.cos(phi) * speed
      )
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )

      // 动画
      RpgExplosion.animateConfetti(particle, vel, rotSpeed)
    }
  }

  /** 单个纸屑动画 */
  private static animateConfetti(
    particle: THREE.Mesh,
    velocity: THREE.Vector3,
    rotSpeed: THREE.Vector3,
  ): void {
    let elapsed = 0

    const frame = () => {
      elapsed += 0.016
      const progress = elapsed / 1.0

      if (progress >= 1 || !particle.parent) return

      particle.position.add(velocity.clone().multiplyScalar(0.016))
      particle.rotation.x += rotSpeed.x * 0.016
      particle.rotation.y += rotSpeed.y * 0.016

      velocity.y -= 2 * 0.016 // 重力
      velocity.multiplyScalar(0.98) // 空气阻力

      if (particle.material instanceof THREE.MeshBasicMaterial) {
        particle.material.opacity = 1 - progress * 0.5
      }

      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  /** 彩虹环扩散 */
  private static createRainbowRing(parent: THREE.Group): void {
    const ringColors = [0xFF6B6B, 0xFFA94D, 0xFFD43B, 0x69DB7C, 0x74C0FC, 0xB197FC]
    const segments = 6

    for (let i = 0; i < segments; i++) {
      const arcLength = (Math.PI * 2) / segments
      const startAngle = i * arcLength

      // 每个分段用一个小方块构成环
      const geom = new THREE.BoxGeometry(0.08, 0.02, 0.08)
      const mat = new THREE.MeshBasicMaterial({
        color: ringColors[i % ringColors.length],
        transparent: true,
        opacity: 0.9,
      })
      const piece = new THREE.Mesh(geom, mat)
      piece.position.set(
        Math.cos(startAngle + arcLength / 2) * 1,
        0,
        Math.sin(startAngle + arcLength / 2) * 1
      )
      piece.lookAt(0, 0, 0)
      piece.rotateX(Math.PI / 2)
      parent.add(piece)

      // 环扩散动画
      RpgExplosion.animateRingPiece(piece)
    }
  }

  /** 环扩散动画 */
  private static animateRingPiece(piece: THREE.Mesh): void {
    let elapsed = 0
    const duration = 0.5

    const frame = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !piece.parent) {
        piece.visible = false
        return
      }

      const currentRadius = 1 + progress * 4 // 1 到 5 单位
      const angle = Math.atan2(piece.position.z, piece.position.x)
      piece.position.set(
        Math.cos(angle) * currentRadius,
        piece.position.y + 0.3 * 0.016, // 轻微上升
        Math.sin(angle) * currentRadius
      )

      if (piece.material instanceof THREE.MeshBasicMaterial) {
        piece.material.opacity = 0.9 * (1 - progress * 0.8)
      }

      // 环片段始终面向外
      piece.lookAt(0, piece.position.y, 0)
      piece.rotateX(Math.PI / 2)

      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  /** 星星闪光：5-8 个黄色星星射出 */
  private static createStarBurst(parent: THREE.Group): void {
    const count = 5 + Math.floor(Math.random() * 4)

    for (let i = 0; i < count; i++) {
      const starGeom = new THREE.OctahedronGeometry(0.06, 0)
      const starMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 1,
      })
      const star = new THREE.Mesh(starGeom, starMat)
      star.position.set(0, 0, 0)
      parent.add(star)

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 2 + Math.random() * 2
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.sin(phi) * Math.sin(theta)) * speed + 0.5,
        Math.cos(phi) * speed
      )

      // 星星闪光动画
      RpgExplosion.animateStar(star, vel)
    }
  }

  /** 星星动画：射出 + 闪烁 + 淡出 */
  private static animateStar(star: THREE.Mesh, velocity: THREE.Vector3): void {
    let elapsed = 0
    const duration = 0.6

    const frame = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !star.parent) {
        star.visible = false
        return
      }

      star.position.add(velocity.clone().multiplyScalar(0.016))
      star.rotation.x += 3 * 0.016
      star.rotation.y += 2 * 0.016

      velocity.multiplyScalar(0.97)

      // 闪烁效果
      const flash = 0.6 + Math.sin(elapsed * 30) * 0.4
      if (star.material instanceof THREE.MeshBasicMaterial) {
        star.material.opacity = (1 - progress) * flash
      }

      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  /** "BOOM！"环形闪光 */
  private static createBoomFlash(parent: THREE.Group): void {
    const ringGeom = new THREE.RingGeometry(0.1, 0.3, 16)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFEE44,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.position.y = 0.5
    parent.add(ring)

    // 闪光动画：快速放大 + 淡出
    let elapsed = 0
    const duration = 0.3

    const frame = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1 || !ring.parent) {
        ring.visible = false
        return
      }

      const scale = 1 + progress * 3
      ring.scale.setScalar(scale)

      if (ring.material instanceof THREE.MeshBasicMaterial) {
        ring.material.opacity = 1 - progress
      }

      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  /**
   * 创建敌人弹飞效果
   * @param enemyMesh 敌人网格
   * @param dead 是否已死亡（已死亡弹飞更高）
   */
  static createKnockback(enemyMesh: THREE.Group, dead: boolean = false): void {
    const upSpeed = dead ? 6 + Math.random() * 4 : 3 + Math.random() * 2
    const rotSpeed = dead ? 4 + Math.random() * 4 : 2 + Math.random() * 2
    const direction = (Math.random() - 0.5) * 0.5
    const duration = dead ? 1.2 : 0.6

    let elapsed = 0
    let yVel = upSpeed
    const originalY = enemyMesh.position.y

    const frame = () => {
      elapsed += 0.016
      const progress = elapsed / duration

      if (progress >= 1) {
        enemyMesh.position.y = originalY
        enemyMesh.rotation.x = 0
        enemyMesh.rotation.z = 0
        return
      }

      // 弹飞
      enemyMesh.position.y += yVel * 0.016
      yVel -= 9.8 * 0.016 // 重力

      // 旋转
      enemyMesh.rotation.x += rotSpeed * 0.016
      enemyMesh.rotation.z += direction * rotSpeed * 0.016

      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }
}
