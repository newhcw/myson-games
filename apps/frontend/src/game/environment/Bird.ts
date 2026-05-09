import * as THREE from 'three'

export interface BirdConfig {
  /** 轨道半径 */
  radius: number
  /** 轨道中心 Y 高度 */
  height: number
  /** 飞行角速度 (rad/s) */
  speed: number
  /** 初始角度 (rad) */
  initialAngle: number
  /** 翅膀扇动速度倍率 */
  wingSpeed: number
  /** 翅膀扇动初始相位 */
  wingPhase: number
}

/**
 * 卡通风格小鸟：简单几何体组合，沿圆形路径飞行，翅膀持续扇动
 *
 * 小鸟颜色方案
 */
const BIRD_COLORS = [
  { body: 0x8B4513, wings: 0xA0522D },  // 棕色
  { body: 0x4A90D9, wings: 0x6BB3E0 },  // 蓝色
  { body: 0xE67E22, wings: 0xF39C12 },  // 橙色
  { body: 0x27AE60, wings: 0x2ECC71 },  // 绿色
  { body: 0xE74C3C, wings: 0xF1948A },  // 红色
]

export class Bird {
  readonly group: THREE.Group
  private body: THREE.Mesh
  private leftWing: THREE.Mesh
  private rightWing: THREE.Mesh
  private config: BirdConfig
  private elapsed = 0
  private color: { body: number; wings: number }

  /** 生成随机配置 */
  static randomConfig(): BirdConfig {
    return {
      radius: 25 + Math.random() * 30,
      height: 18 + Math.random() * 15,
      speed: 0.3 + Math.random() * 0.4,
      initialAngle: Math.random() * Math.PI * 2,
      wingSpeed: 2.5 + Math.random() * 2.0,
      wingPhase: Math.random() * Math.PI * 2,
    }
  }

  constructor(config?: Partial<BirdConfig>) {
    this.config = {
      radius: 30,
      height: 20,
      speed: 0.5,
      initialAngle: 0,
      wingSpeed: 3,
      wingPhase: 0,
      ...config,
    }

    // 随机选择颜色
    this.color = BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)]

    this.group = new THREE.Group()

    // 颜色材质
    const bodyMat = new THREE.MeshBasicMaterial({ color: this.color.body })
    const wingMat = new THREE.MeshBasicMaterial({ color: this.color.wings })

    // 身体 - 椭球体
    const bodyGeo = new THREE.SphereGeometry(0.4, 8, 6)
    bodyGeo.scale(1, 0.6, 0.8)
    this.body = new THREE.Mesh(bodyGeo, bodyMat)
    this.group.add(this.body)

    // 头部 - 小球体
    const headGeo = new THREE.SphereGeometry(0.2, 6, 6)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0.5, 0.1, 0)
    this.group.add(head)

    // 鸟喙 - 小锥体
    const beakGeo = new THREE.ConeGeometry(0.08, 0.2, 4)
    const beakMat = new THREE.MeshBasicMaterial({ color: 0xF39C12 })
    const beak = new THREE.Mesh(beakGeo, beakMat)
    beak.rotation.z = -Math.PI / 2
    beak.position.set(0.68, 0.05, 0)
    this.group.add(beak)

    // 尾巴 - 小梯形
    const tailGeo = new THREE.BoxGeometry(0.1, 0.25, 0.2)
    const tail = new THREE.Mesh(tailGeo, wingMat)
    tail.position.set(-0.5, 0, 0)
    this.group.add(tail)

    // 左翅膀 - 扁平长方体，枢轴在根部
    const wingGeo = new THREE.BoxGeometry(0.1, 0.55, 0.3)
    wingGeo.translate(0, -0.275, 0)
    this.leftWing = new THREE.Mesh(wingGeo, wingMat)
    this.leftWing.position.set(0, 0.25, 0)
    this.group.add(this.leftWing)

    // 右翅膀
    const rightWingGeo = wingGeo.clone()
    this.rightWing = new THREE.Mesh(rightWingGeo, wingMat)
    this.rightWing.position.set(0, -0.25, 0)
    this.group.add(this.rightWing)

    // 身体朝向圆形切向 + 朝向外
    // 先设置初始角度
    const angle = this.config.initialAngle
    const r = this.config.radius
    const h = this.config.height
    this.group.position.set(
      Math.cos(angle) * r,
      h,
      Math.sin(angle) * r,
    )

    // 鸟身体朝向：始终面向飞行方向 + 略微朝外
    this.updateOrientation(angle, r)
  }

  private updateOrientation(angle: number, r: number): void {
    // 朝向外（径向）
    this.group.lookAt(0, this.config.height, 0)
    // 身体沿圆形切线方向倾斜（模拟转弯）
    const tiltAngle = Math.PI / 2
    this.group.rotation.y = angle + tiltAngle
  }

  update(delta: number): void {
    this.elapsed += delta

    // 沿圆形路径前进
    const angle = this.config.initialAngle + this.elapsed * this.config.speed
    const r = this.config.radius
    const h = this.config.height + Math.sin(this.elapsed * 0.8) * 2 // 垂直方向轻微起伏

    this.group.position.set(
      Math.cos(angle) * r,
      h,
      Math.sin(angle) * r,
    )

    // 更新朝向
    this.updateOrientation(angle, r)

    // 翅膀扇动
    const wingAngle = Math.sin(this.elapsed * this.config.wingSpeed + this.config.wingPhase) * 0.5
    this.leftWing.rotation.z = wingAngle
    this.rightWing.rotation.z = -wingAngle
  }

  dispose(): void {
    this.group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        child.material.dispose()
      }
    })
  }
}
