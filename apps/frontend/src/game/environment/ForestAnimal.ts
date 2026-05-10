import * as THREE from 'three'

/**
 * 动物类型枚举
 */
export type AnimalType = 'sheep' | 'rabbit' | 'deer' | 'fox'

/**
 * 动物行为状态
 */
type AnimalState = 'IDLE' | 'WALKING' | 'FLEEING'

/**
 * 动物配置
 */
export interface AnimalConfig {
  type: AnimalType
  /** 初始位置 */
  position: THREE.Vector3
}

/**
 * 障碍物坐标列表（用于路径规避）
 */
const OBSTACLE_POSITIONS: { x: number; z: number; radius: number }[] = [
  // 树木
  { x: -12, z: -8, radius: 2 },
  { x: 12, z: -6, radius: 2 },
  { x: 0, z: -15, radius: 2 },
  { x: -5, z: -5, radius: 1.5 },
  { x: 5, z: -8, radius: 1.5 },
  { x: -8, z: 3, radius: 1.5 },
  { x: 8, z: 5, radius: 1.5 },
  { x: 0, z: -12, radius: 1.5 },
  // 岩石
  { x: -10, z: 0, radius: 1.5 },
  { x: 10, z: -2, radius: 1.5 },
  { x: 15, z: 8, radius: 2 },
  // 灌木
  { x: -3, z: 0, radius: 1.2 },
  { x: 3, z: 2, radius: 1.2 },
  { x: 0, z: 5, radius: 1.2 },
  // 树桩
  { x: -2, z: -3, radius: 0.8 },
  { x: 2, z: -4, radius: 0.8 },
]

/** 检查位置是否靠近障碍物 */
function isNearObstacle(x: number, z: number, margin = 2): boolean {
  for (const obs of OBSTACLE_POSITIONS) {
    const dx = x - obs.x
    const dz = z - obs.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < obs.radius + margin) return true
  }
  return false
}

/** 生成活动范围内的随机点 */
function randomWalkPoint(): THREE.Vector3 {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 4 + Math.random() * 11 // 4~15，在森林绿地范围内
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (!isNearObstacle(x, z)) {
      return new THREE.Vector3(x, 0, z)
    }
  }
  // 保底：不检查障碍物
  const angle = Math.random() * Math.PI * 2
  const radius = 4 + Math.random() * 9
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
}

/** 小羊配色 */
const SHEEP_COLORS = {
  body: 0xF5F5F5,
  shadow: 0xE0E0E0,
  face: 0xFFD1DC,
  ear: 0xFFB6C1,
  leg: 0xCCCCCC,
  eye: 0x333333,
}

/** 小兔配色 */
const RABBIT_COLORS = {
  body: 0xE8DCD0,
  earOuter: 0xD4A8A8,
  earInner: 0xF0C0C0,
  eye: 0x333333,
  nose: 0xFFB6C1,
  tail: 0xFFFFFF,
}

/** 小鹿配色 */
const DEER_COLORS = {
  body: 0xC4956A,
  belly: 0xE8D5B7,
  spot: 0xF5E6CC,
  antler: 0x8B6914,
  leg: 0xA0784A,
  eye: 0x333333,
  nose: 0x5C3A21,
  tail: 0xFFFFFF,
}

/** 小狐狸配色 */
const FOX_COLORS = {
  body: 0xE8742A,
  belly: 0xF5DEB3,
  earInner: 0xFFF5E6,
  earTip: 0x333333,
  leg: 0x5C3A21,
  tailTip: 0xFFFFFF,
  eye: 0x333333,
  nose: 0x222222,
}

type AnimalParts = Record<string, THREE.Mesh>

function makeToonMat(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color })
}

function makeBasicMat(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color })
}

// ============== 动物几何体构建 ==============

function buildSheep(group: THREE.Group): AnimalParts {
  const parts: AnimalParts = {}

  // 身体 - 蓬松的椭球
  const bodyGeo = new THREE.SphereGeometry(0.5, 10, 8)
  bodyGeo.scale(1.4, 0.9, 0.9)
  const body = new THREE.Mesh(bodyGeo, makeToonMat(SHEEP_COLORS.body))
  body.position.y = 0.5
  group.add(body)
  parts.body = body

  // 蓬松毛团（多个小球围绕身体）
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const r = 0.35
    const fleece = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      makeToonMat(SHEEP_COLORS.shadow),
    )
    fleece.position.set(
      Math.cos(angle) * r,
      0.5 + Math.sin(i * 1.5) * 0.1,
      Math.sin(angle) * r,
    )
    fleece.scale.set(1, 0.7, 1)
    group.add(fleece)
  }

  // 头部
  const headGeo = new THREE.SphereGeometry(0.2, 8, 6)
  headGeo.scale(1, 0.9, 0.8)
  const head = new THREE.Mesh(headGeo, makeToonMat(SHEEP_COLORS.face))
  head.position.set(0.65, 0.6, 0)
  group.add(head)
  parts.head = head

  // 眼睛
  const eyeMat = makeBasicMat(SHEEP_COLORS.eye)
  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6)
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(0.72, 0.67, 0.12)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.72, 0.67, -0.12)
  group.add(rightEye)

  // 耳朵（左）
  const earGeo = new THREE.SphereGeometry(0.08, 6, 6)
  earGeo.scale(0.7, 0.5, 1)
  const earMat = makeToonMat(SHEEP_COLORS.ear)
  const leftEar = new THREE.Mesh(earGeo, earMat)
  leftEar.position.set(0.58, 0.75, 0.18)
  group.add(leftEar)
  parts.leftEar = leftEar
  const rightEar = new THREE.Mesh(earGeo, earMat)
  rightEar.position.set(0.58, 0.75, -0.18)
  group.add(rightEar)
  parts.rightEar = rightEar

  // 腿（4条）
  const legGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6)
  const legMat = makeToonMat(SHEEP_COLORS.leg)
  const legPositions = [
    { x: 0.3, z: 0.15 }, // 左前
    { x: 0.3, z: -0.15 }, // 右前
    { x: -0.3, z: 0.15 }, // 左后
    { x: -0.3, z: -0.15 }, // 右后
  ]
  const legNames = ['FL', 'FR', 'BL', 'BR']
  legPositions.forEach((pos, i) => {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(pos.x, 0.15, pos.z)
    group.add(leg)
    parts[`leg${legNames[i]}`] = leg
  })

  // 尾巴
  const tailGeo = new THREE.SphereGeometry(0.06, 6, 6)
  const tail = new THREE.Mesh(tailGeo, makeToonMat(SHEEP_COLORS.body))
  tail.position.set(-0.6, 0.55, 0)
  group.add(tail)
  parts.tail = tail

  return parts
}

function buildRabbit(group: THREE.Group): AnimalParts {
  const parts: AnimalParts = {}

  // 身体
  const bodyGeo = new THREE.SphereGeometry(0.3, 8, 8)
  bodyGeo.scale(1.2, 0.8, 0.8)
  const body = new THREE.Mesh(bodyGeo, makeToonMat(RABBIT_COLORS.body))
  body.position.y = 0.35
  group.add(body)
  parts.body = body

  // 头部
  const headGeo = new THREE.SphereGeometry(0.2, 8, 6)
  const head = new THREE.Mesh(headGeo, makeToonMat(RABBIT_COLORS.body))
  head.position.set(0.45, 0.5, 0)
  group.add(head)
  parts.head = head

  // 左耳朵（长竖耳）
  const earMat = makeToonMat(RABBIT_COLORS.earOuter)
  const earInnerMat = makeToonMat(RABBIT_COLORS.earInner)
  const buildEar = (xOff: number, zOff: number, name: string) => {
    const earGroup = new THREE.Group()
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.07, 0.35, 6),
      earMat,
    )
    outer.position.y = 0.175
    earGroup.add(outer)

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.045, 0.3, 6),
      earInnerMat,
    )
    inner.position.y = 0.175
    earGroup.add(inner)

    earGroup.position.set(0.4, 0.62, zOff)
    // 耳朵略向外倾斜
    earGroup.rotation.z = xOff > 0 ? -0.15 : 0.15
    earGroup.rotation.x = -0.1
    group.add(earGroup)
    parts[name] = earGroup as any
  }
  buildEar(1, 0.15, 'leftEar')
  buildEar(1, -0.15, 'rightEar')

  // 眼睛
  const eyeMat = makeBasicMat(RABBIT_COLORS.eye)
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6)
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(0.52, 0.55, 0.1)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.52, 0.55, -0.1)
  group.add(rightEye)

  // 鼻子（粉色小点）
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    makeBasicMat(RABBIT_COLORS.nose),
  )
  nose.position.set(0.6, 0.48, 0)
  group.add(nose)

  // 腿
  const legGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.2, 6)
  const legMat = makeToonMat(RABBIT_COLORS.body)
  const legPositions = [
    { x: 0.2, z: 0.12 }, { x: 0.2, z: -0.12 },
    { x: -0.2, z: 0.12 }, { x: -0.2, z: -0.12 },
  ]
  legPositions.forEach((pos, i) => {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(pos.x, 0.1, pos.z)
    group.add(leg)
    parts[`leg${i}`] = leg
  })

  // 尾巴（小圆球）
  const tail = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 6),
    makeToonMat(RABBIT_COLORS.tail),
  )
  tail.position.set(-0.4, 0.3, 0)
  group.add(tail)
  parts.tail = tail

  return parts
}

function buildDeer(group: THREE.Group): AnimalParts {
  const parts: AnimalParts = {}

  // 身体
  const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8)
  bodyGeo.scale(1.3, 0.8, 0.8)
  const body = new THREE.Mesh(bodyGeo, makeToonMat(DEER_COLORS.body))
  body.position.y = 0.6
  group.add(body)
  parts.body = body

  // 腹部（浅色）
  const bellyGeo = new THREE.SphereGeometry(0.25, 6, 6)
  bellyGeo.scale(1.2, 0.5, 0.8)
  const belly = new THREE.Mesh(bellyGeo, makeToonMat(DEER_COLORS.belly))
  belly.position.set(0, 0.4, 0)
  group.add(belly)

  // 斑点（装饰）
  for (let i = 0; i < 4; i++) {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      makeToonMat(DEER_COLORS.spot),
    )
    spot.position.set(
      (Math.random() - 0.5) * 0.5,
      0.6 + (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.3,
    )
    group.add(spot)
  }

  // 脖子
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.25, 6)
  const neck = new THREE.Mesh(neckGeo, makeToonMat(DEER_COLORS.body))
  neck.position.set(0.5, 0.75, 0)
  neck.rotation.z = -0.3
  group.add(neck)

  // 头部
  const headGeo = new THREE.SphereGeometry(0.18, 8, 6)
  const head = new THREE.Mesh(headGeo, makeToonMat(DEER_COLORS.body))
  head.position.set(0.7, 0.8, 0)
  group.add(head)
  parts.head = head

  // 眼睛
  const eyeMat = makeBasicMat(DEER_COLORS.eye)
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6)
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(0.76, 0.85, 0.1)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.76, 0.85, -0.1)
  group.add(rightEye)

  // 鼻子
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    makeBasicMat(DEER_COLORS.nose),
  )
  nose.position.set(0.84, 0.78, 0)
  group.add(nose)

  // 左角
  const antlerMat = makeToonMat(DEER_COLORS.antler)
  const buildAntler = (zOff: number) => {
    const main = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.03, 0.2, 4),
      antlerMat,
    )
    main.position.set(0.65, 0.95, zOff)
    main.rotation.z = -0.2
    group.add(main)

    // 分支
    for (let j = -1; j <= 1; j += 2) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.015, 0.1, 4),
        antlerMat,
      )
      branch.position.set(0.72, 0.95, zOff + j * 0.05)
      branch.rotation.z = -0.4
      branch.rotation.x = j * 0.3
      group.add(branch)
    }
  }
  buildAntler(0.1)
  buildAntler(-0.1)

  // 腿（长腿）
  const legGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.45, 6)
  const legMat = makeToonMat(DEER_COLORS.leg)
  const legPositions = [
    { x: 0.25, z: 0.12 }, { x: 0.25, z: -0.12 },
    { x: -0.25, z: 0.12 }, { x: -0.25, z: -0.12 },
  ]
  legPositions.forEach((pos, i) => {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(pos.x, 0.225, pos.z)
    group.add(leg)
    parts[`leg${i}`] = leg
  })

  // 尾巴
  const tail = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    makeToonMat(DEER_COLORS.tail),
  )
  tail.position.set(-0.55, 0.65, 0)
  group.add(tail)
  parts.tail = tail

  return parts
}

function buildFox(group: THREE.Group): AnimalParts {
  const parts: AnimalParts = {}

  // 身体
  const bodyGeo = new THREE.SphereGeometry(0.35, 8, 8)
  bodyGeo.scale(1.3, 0.7, 0.7)
  const body = new THREE.Mesh(bodyGeo, makeToonMat(FOX_COLORS.body))
  body.position.y = 0.4
  group.add(body)
  parts.body = body

  // 腹部（浅色）
  const bellyGeo = new THREE.SphereGeometry(0.2, 6, 6)
  bellyGeo.scale(1, 0.5, 0.7)
  const belly = new THREE.Mesh(bellyGeo, makeToonMat(FOX_COLORS.belly))
  belly.position.set(0, 0.3, 0)
  group.add(belly)

  // 头部
  const headGeo = new THREE.SphereGeometry(0.18, 8, 6)
  headGeo.scale(1.1, 0.9, 0.8)
  const head = new THREE.Mesh(headGeo, makeToonMat(FOX_COLORS.body))
  head.position.set(0.45, 0.55, 0)
  group.add(head)
  parts.head = head

  // 尖耳朵（左）
  const earMat = makeToonMat(FOX_COLORS.body)
  const buildEar = (xOff: number, zOff: number, name: string) => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.15, 4),
      earMat,
    )
    ear.position.set(0.42, 0.68, zOff)
    ear.rotation.z = xOff > 0 ? -0.3 : 0.3
    group.add(ear)
    // 耳内
    const inner = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.1, 4),
      makeToonMat(FOX_COLORS.earInner),
    )
    inner.position.set(0.42, 0.68, zOff)
    inner.rotation.z = xOff > 0 ? -0.3 : 0.3
    group.add(inner)
    // 耳尖黑
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.05, 4),
      makeBasicMat(FOX_COLORS.earTip),
    )
    tip.position.set(0.42, 0.75, zOff)
    tip.rotation.z = xOff > 0 ? -0.3 : 0.3
    group.add(tip)
    parts[name] = ear
  }
  buildEar(1, 0.14, 'leftEar')
  buildEar(1, -0.14, 'rightEar')

  // 眼睛
  const eyeMat = makeBasicMat(FOX_COLORS.eye)
  const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6)
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(0.5, 0.58, 0.1)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.5, 0.58, -0.1)
  group.add(rightEye)

  // 鼻子
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 6, 6),
    makeBasicMat(FOX_COLORS.nose),
  )
  nose.position.set(0.58, 0.52, 0)
  group.add(nose)

  // 腿
  const legGeo = new THREE.CylinderGeometry(0.03, 0.045, 0.25, 6)
  const legMat = makeToonMat(FOX_COLORS.leg)
  const legPositions = [
    { x: 0.2, z: 0.1 }, { x: 0.2, z: -0.1 },
    { x: -0.2, z: 0.1 }, { x: -0.2, z: -0.1 },
  ]
  legPositions.forEach((pos, i) => {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(pos.x, 0.125, pos.z)
    group.add(leg)
    parts[`leg${i}`] = leg
  })

  // 大尾巴
  const tailGroup = new THREE.Group()
  const tailMat = makeToonMat(FOX_COLORS.body)
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 - i * 0.015, 6, 6),
      tailMat,
    )
    seg.position.set(-i * 0.1, 0, 0)
    seg.scale.set(1, 0.7 + i * 0.1, 0.8)
    tailGroup.add(seg)
  }
  // 尾巴尖白色
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 6),
    makeToonMat(FOX_COLORS.tailTip),
  )
  tip.position.set(-0.25, 0, 0)
  tip.scale.set(1, 0.8, 0.8)
  tailGroup.add(tip)

  tailGroup.position.set(-0.4, 0.4, 0)
  tailGroup.rotation.x = 0.4
  group.add(tailGroup)
  parts.tail = tailGroup as any

  return parts
}

// ============== 主类 ==============

export class ForestAnimal {
  readonly group: THREE.Group
  readonly type: AnimalType
  private parts: AnimalParts = {}
  private state: AnimalState = 'IDLE'
  private elapsed = 0
  private stateTimer = 0
  private stateDuration = 0
  private targetPosition = new THREE.Vector3()
  private playerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private moveSpeed = 1.2

  /** 生成随机动物类型 */
  static randomType(): AnimalType {
    const types: AnimalType[] = ['sheep', 'rabbit', 'deer', 'fox']
    return types[Math.floor(Math.random() * types.length)]
  }

  constructor(config: AnimalConfig) {
    this.type = config.type
    this.group = new THREE.Group()
    this.parts = this.buildAnimal(config.type)

    // 初始位置
    this.group.position.copy(config.position)

    // 随机初始朝向
    this.group.rotation.y = Math.random() * Math.PI * 2

    // 根据类型设定移动速度
    switch (config.type) {
      case 'sheep': this.moveSpeed = 0.8; break
      case 'rabbit': this.moveSpeed = 1.4; break
      case 'deer': this.moveSpeed = 1.2; break
      case 'fox': this.moveSpeed = 1.6; break
    }

    // 初始状态
    this.enterState('IDLE')
  }

  private buildAnimal(type: AnimalType): AnimalParts {
    switch (type) {
      case 'sheep': return buildSheep(this.group)
      case 'rabbit': return buildRabbit(this.group)
      case 'deer': return buildDeer(this.group)
      case 'fox': return buildFox(this.group)
    }
  }

  /** 设置玩家位置（用于逃离行为） */
  setPlayerPosition(pos: THREE.Vector3): void {
    this.playerPosition.copy(pos)
  }

  private enterState(newState: AnimalState): void {
    this.state = newState
    this.stateTimer = 0

    switch (newState) {
      case 'IDLE': {
        this.stateDuration = 2 + Math.random() * 3 // 2~5s
        break
      }
      case 'WALKING': {
        this.stateDuration = 3 + Math.random() * 5 // 3~8s
        this.targetPosition = randomWalkPoint()
        break
      }
      case 'FLEEING': {
        this.stateDuration = 1.5 + Math.random() * 1.5 // 1.5~3s
        // 远离玩家的方向
        const dx = this.group.position.x - this.playerPosition.x
        const dz = this.group.position.z - this.playerPosition.z
        const dir = new THREE.Vector2(dx, dz).normalize()
        const dist = 5 + Math.random() * 4
        this.targetPosition.set(
          this.group.position.x + dir.x * dist,
          0,
          this.group.position.z + dir.y * dist,
        )
        // 限制在活动范围内（4~15）
        const radius = Math.sqrt(
          this.targetPosition.x * this.targetPosition.x +
          this.targetPosition.z * this.targetPosition.z,
        )
        if (radius > 15 || radius < 4) {
          this.targetPosition.copy(randomWalkPoint())
        }
        break
      }
    }
  }

  private isPlayerNearby(): boolean {
    const dx = this.group.position.x - this.playerPosition.x
    const dz = this.group.position.z - this.playerPosition.z
    return dx * dx + dz * dz < 64 // 8^2
  }

  update(delta: number, playerPos?: THREE.Vector3): void {
    if (playerPos) this.setPlayerPosition(playerPos)

    this.elapsed += delta
    this.stateTimer += delta

    // 逃离检测（仅在非逃离状态下检查）
    if (this.state !== 'FLEEING' && this.isPlayerNearby()) {
      this.enterState('FLEEING')
    }

    // 状态切换
    if (this.stateTimer >= this.stateDuration) {
      if (this.state === 'FLEEING') {
        this.enterState('IDLE')
      } else {
        this.enterState(this.state === 'IDLE' ? 'WALKING' : 'IDLE')
      }
    }

    // 更新位置和动画
    switch (this.state) {
      case 'IDLE':
        this.updateIdleAnimation(delta)
        break
      case 'WALKING':
      case 'FLEEING':
        this.updateMovement(delta)
        this.updateWalkAnimation(delta)
        break
    }
  }

  private updateMovement(delta: number): void {
    const dx = this.targetPosition.x - this.group.position.x
    const dz = this.targetPosition.z - this.group.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.3) {
      // 转向目标
      const targetAngle = Math.atan2(dx, dz)
      let diff = targetAngle - this.group.rotation.y
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.group.rotation.y += diff * delta * 4

      // 移动
      const speed = this.state === 'FLEEING' ? this.moveSpeed * 1.5 : this.moveSpeed
      this.group.position.x += Math.sin(this.group.rotation.y) * speed * delta
      this.group.position.z += Math.cos(this.group.rotation.y) * speed * delta
    } else {
      // 到达目标，切换待机
      this.enterState('IDLE')
    }
  }

  /** 待机动画：身体微起伏、耳朵/尾巴晃动 */
  private updateIdleAnimation(_delta: number): void {
    const t = this.elapsed

    // 身体微微起伏
    if (this.parts.body) {
      this.parts.body.position.y = this.getBodyBaseY() + Math.sin(t * 2) * 0.015
    }

    // 耳朵晃动（小羊、小兔、小狐狸）
    if (this.parts.leftEar && this.parts.rightEar) {
      const earWiggle = Math.sin(t * 2.5) * 0.1
      const leftEar = this.parts.leftEar as THREE.Mesh
      const rightEar = this.parts.rightEar as THREE.Mesh
      if (leftEar.rotation) leftEar.rotation.z = earWiggle
      if (rightEar.rotation) rightEar.rotation.z = -earWiggle
    }

    // 尾巴摇摆
    if (this.parts.tail) {
      const tail = this.parts.tail as THREE.Mesh
      if (tail.rotation) {
        tail.rotation.z = Math.sin(t * 1.5) * 0.15
      }
    }

    // 头轻微转动
    if (this.parts.head) {
      const head = this.parts.head as THREE.Mesh
      head.rotation.y = Math.sin(t * 0.8) * 0.15
      head.rotation.x = Math.sin(t * 0.8) * 0.05
    }
  }

  /** 行走动画：四肢交替摆动 */
  private updateWalkAnimation(_delta: number): void {
    const t = this.elapsed
    const walkSpeed = this.state === 'FLEEING' ? 14 : 8

    // 身体上下起伏
    if (this.parts.body) {
      this.parts.body.position.y = this.getBodyBaseY() +
        Math.abs(Math.sin(t * walkSpeed * 2)) * 0.04
    }

    // 四肢动画
    const legKeys = Object.keys(this.parts).filter(k => k.startsWith('leg'))
    legKeys.forEach((key, i) => {
      const leg = this.parts[key] as THREE.Mesh
      if (leg && leg.rotation) {
        const phase = i < 2 ? 0 : Math.PI // 前后腿交错
        leg.rotation.x = Math.sin(t * walkSpeed + phase) * 0.4
      }
    })

    // 头部微点（行走时轻微点头）
    if (this.parts.head) {
      const head = this.parts.head as THREE.Mesh
      head.rotation.x = Math.sin(t * walkSpeed * 2) * 0.03
    }

    // 尾巴摆动
    if (this.parts.tail) {
      const tail = this.parts.tail as THREE.Mesh
      if (tail.rotation) {
        tail.rotation.z = Math.sin(t * walkSpeed * 0.5) * 0.2
      }
    }
  }

  private getBodyBaseY(): number {
    switch (this.type) {
      case 'sheep': return 0.5
      case 'rabbit': return 0.35
      case 'deer': return 0.6
      case 'fox': return 0.4
    }
  }

  dispose(): void {
    this.group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
      // 处理 Group（如耳朵组）
      if (child instanceof THREE.Group) {
        child.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            c.geometry.dispose()
            if (Array.isArray(c.material)) {
              c.material.forEach(m => m.dispose())
            } else {
              c.material.dispose()
            }
          }
        })
      }
    })
  }
}
