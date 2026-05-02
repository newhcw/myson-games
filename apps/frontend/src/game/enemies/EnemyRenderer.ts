import * as THREE from 'three'
import type { Enemy, EnemyConfig } from './types'

// Q版卡通材质颜色
const ENEMY_COLORS = {
  soldier: {
    body: 0x3498db, // 蓝色
    head: 0xffd1dc, // 肤色
    accent: 0x2980b9,
  },
  elite: {
    body: 0x9b59b6, // 紫色
    head: 0xffd1dc,
    accent: 0x8e44ad,
  },
  boss: {
    body: 0xe74c3c, // 红色
    head: 0xffd1dc,
    accent: 0xc0392b,
  },
  exploder: {
    body: 0xff8c00, // 橙色
    head: 0x222222, // 黑色头部
    accent: 0xcc7000,
  },
  healer: {
    body: 0x2ecc71, // 绿色
    head: 0xffd1dc,
    accent: 0x27ae60,
  },
}

// 体型缩放比例
const ENEMY_SCALE = {
  soldier: 1.0,
  elite: 1.5,
  boss: 2.0,
  exploder: 0.9, // 自爆兵较小
  healer: 1.1, // 治疗者略大
}

// 创建Q版敌人3D模型
export function createEnemyMesh(config: EnemyConfig): THREE.Group {
  const group = new THREE.Group()
  const colors = ENEMY_COLORS[config.type] || ENEMY_COLORS.soldier
  const scale = ENEMY_SCALE[config.type] || 1.0

  // Toon材质
  const createToonMaterial = (color: number) => {
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: createGradientMap(),
    })
  }

  // 身体 - 圆润的盒子
  const bodyGeometry = new THREE.BoxGeometry(0.8 * scale, 1.0 * scale, 0.5 * scale)
  const bodyMaterial = createToonMaterial(colors.body)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.5 * scale
  body.castShadow = true
  group.add(body)

  // 头部 - 大头（Q版特征）
  const headScale = config.type === 'boss' ? 1.2 : config.type === 'elite' ? 1.0 : 0.9
  const headGeometry = new THREE.BoxGeometry(0.7 * headScale * scale, 0.6 * headScale * scale, 0.6 * headScale * scale)
  const headMaterial = createToonMaterial(colors.head)
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.3 * scale
  head.castShadow = true
  group.add(head)

  // 眼睛
  const eyeGeometry = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.05)
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.15 * headScale * scale, 1.35 * scale, 0.3 * headScale * scale)
  group.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.15 * headScale * scale, 1.35 * scale, 0.3 * headScale * scale)
  group.add(rightEye)

  // 眼睛高光
  const highlightGeometry = new THREE.BoxGeometry(0.04 * scale, 0.04 * scale, 0.02)
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })

  const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  leftHighlight.position.set(-0.13 * headScale * scale, 1.38 * scale, 0.32 * headScale * scale)
  group.add(leftHighlight)

  const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  rightHighlight.position.set(0.17 * headScale * scale, 1.38 * scale, 0.32 * headScale * scale)
  group.add(rightHighlight)

  // 手臂 - 小小的
  const armGeometry = new THREE.BoxGeometry(0.25 * scale, 0.6 * scale, 0.25 * scale)
  const armMaterial = createToonMaterial(colors.accent)

  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.55 * scale, 0.5 * scale, 0)
  leftArm.castShadow = true
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.55 * scale, 0.5 * scale, 0)
  rightArm.castShadow = true
  group.add(rightArm)

  // 腿
  const legGeometry = new THREE.BoxGeometry(0.3 * scale, 0.5 * scale, 0.3 * scale)
  const legMaterial = createToonMaterial(colors.accent)

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-0.2 * scale, -0.25 * scale, 0)
  leftLeg.castShadow = true
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(0.2 * scale, -0.25 * scale, 0)
  rightLeg.castShadow = true
  group.add(rightLeg)

  // ========== 精英特殊装饰：护甲肩甲 ==========
  if (config.type === 'elite') {
    const armorColor = 0xffd700 // 金色
    const armorMaterial = new THREE.MeshToonMaterial({ color: armorColor, gradientMap: createGradientMap() })

    // 左肩甲
    const shoulderGeometry = new THREE.BoxGeometry(0.35 * scale, 0.25 * scale, 0.3 * scale)
    const leftShoulder = new THREE.Mesh(shoulderGeometry, armorMaterial)
    leftShoulder.position.set(-0.55 * scale, 0.9 * scale, 0)
    leftShoulder.castShadow = true
    group.add(leftShoulder)

    // 右肩甲
    const rightShoulder = new THREE.Mesh(shoulderGeometry, armorMaterial)
    rightShoulder.position.set(0.55 * scale, 0.9 * scale, 0)
    rightShoulder.castShadow = true
    group.add(rightShoulder)

    // 胸甲
    const chestGeometry = new THREE.BoxGeometry(0.85 * scale, 0.4 * scale, 0.15 * scale)
    const chest = new THREE.Mesh(chestGeometry, armorMaterial)
    chest.position.set(0, 0.7 * scale, 0.27 * scale)
    group.add(chest)
  }

  // ========== BOSS特殊装饰：皇冠 + 角 ==========
  if (config.type === 'boss') {
    const crownColor = 0xffd700 // 金色
    const crownMaterial = new THREE.MeshToonMaterial({ color: crownColor, gradientMap: createGradientMap() })

    // 皇冠底座
    const crownBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 * scale, 0.15 * scale, 0.5 * scale),
      crownMaterial
    )
    crownBase.position.y = 1.65 * scale
    group.add(crownBase)

    // 皇冠尖刺（5个）
    for (let i = -2; i <= 2; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.06 * scale, 0.2 * scale, 4),
        crownMaterial
      )
      spike.position.set(i * 0.1 * scale, 1.78 * scale, 0.05 * scale)
      spike.rotation.x = 0
      group.add(spike)
    }

    // 红色宝石（皇冠中央）
    const gemGeom = new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.05 * scale)
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000, roughness: 0.3 })
    const gem = new THREE.Mesh(gemGeom, gemMat)
    gem.position.set(0, 1.63 * scale, 0.28 * scale)
    group.add(gem)

    // 恶魔角
    const hornColor = 0x2c1810
    const hornMaterial = new THREE.MeshToonMaterial({ color: hornColor, gradientMap: createGradientMap() })

    const leftHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.1 * scale, 0.35 * scale, 8),
      hornMaterial
    )
    leftHorn.position.set(-0.2 * scale, 1.5 * scale, 0)
    leftHorn.rotation.z = 0.4
    group.add(leftHorn)

    const rightHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.1 * scale, 0.35 * scale, 8),
      hornMaterial
    )
    rightHorn.position.set(0.2 * scale, 1.5 * scale, 0)
    rightHorn.rotation.z = -0.4
    group.add(rightHorn)
  }

  // ========== BOSS粒子光晕 ==========
  if (config.type === 'boss') {
    const particleCount = 16
    const particleGeom = new THREE.SphereGeometry(0.06 * scale, 4, 4)
    const particles: THREE.Mesh[] = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const particleMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff4444 : 0xff8800,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
      })
      const particle = new THREE.Mesh(particleGeom, particleMat)
      // 存储粒子轨道参数
      ;(particle as any).__orbitAngle = angle
      ;(particle as any).__orbitRadius = 1.2 * scale + Math.random() * 0.4 * scale
      ;(particle as any).__orbitSpeed = 1.5 + Math.random() * 1.5
      ;(particle as any).__orbitYBase = 0.6 * scale
      ;(particle as any).__orbitYAmplitude = 0.3 * scale + Math.random() * 0.3 * scale
      ;(particle as any).__orbitYPhase = Math.random() * Math.PI * 2

      particles.push(particle)
      group.add(particle)
    }

    // 底部光环
    const ringGeom = new THREE.TorusGeometry(0.8 * scale, 0.06 * scale, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.5,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -0.2 * scale
    group.add(ring)

    group.userData.bossParticles = particles
    group.userData.bossRing = ring
  }

  // ========== 自爆兵红色脉冲光晕 ==========
  if (config.type === 'exploder') {
    const pulseGeom = new THREE.SphereGeometry(0.6 * scale, 8, 8)
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.4,
    })
    const pulseGlow = new THREE.Mesh(pulseGeom, pulseMat)
    pulseGlow.position.y = 0.5 * scale
    group.add(pulseGlow)

    // 红色粒子环
    const ringGeom = new THREE.TorusGeometry(0.5 * scale, 0.04 * scale, 8, 16)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.5 * scale
    group.add(ring)

    group.userData.exploderPulse = pulseGlow
    group.userData.exploderRing = ring
  }

  // ========== 治疗者绿色光晕 ==========
  if (config.type === 'healer') {
    const healGeom = new THREE.SphereGeometry(0.5 * scale, 8, 8)
    const healMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
    })
    const healGlow = new THREE.Mesh(healGeom, healMat)
    healGlow.position.y = 0.5 * scale
    group.add(healGlow)

    // 白色十字标记
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.3 * scale, 0.05), crossMat)
    vBar.position.y = 1.3 * scale
    group.add(vBar)
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.08 * scale, 0.05), crossMat)
    hBar.position.y = 1.3 * scale
    group.add(hBar)

    group.userData.healerGlow = healGlow
  }

  // 存储对各部分的引用以便动画使用
  group.userData = {
    ...group.userData,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    config,
  }

  return group
}

// 创建卡通渐变贴图
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([0, 128, 255])
  const texture = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

// BOSS粒子光晕动画
export function updateBossEffects(enemy: Enemy, time: number): void {
  if (enemy.config.type !== 'boss' || !enemy.mesh) return

  const particles = enemy.mesh.userData.bossParticles as THREE.Mesh[] | undefined
  const ring = enemy.mesh.userData.bossRing as THREE.Mesh | undefined
  const isBerserk = enemy.phase === 2

  // 狂暴阶段身体颜色渐变
  if (isBerserk) {
    const body = enemy.mesh.userData.body as THREE.Mesh | undefined
    if (body) {
      const material = body.material as THREE.MeshToonMaterial
      // 计算血量百分比（0-50%映射到1-0）
      const healthPercent = enemy.health / (enemy.maxHealth * 0.5)
      const r = 0x8B + (0xFF - 0x8B) * (1 - healthPercent)
      const g = 0x00
      const b = 0x00
      material.color.setHex((Math.floor(r) << 16) | b)
    }
  }

  if (particles) {
    for (const particle of particles) {
      const p = particle as any
      const angle = p.__orbitAngle + time * p.__orbitSpeed
      const radius = p.__orbitRadius
      particle.position.x = Math.cos(angle) * radius
      particle.position.z = Math.sin(angle) * radius
      particle.position.y = p.__orbitYBase + Math.sin(time * 2 + p.__orbitYPhase) * p.__orbitYAmplitude
      // 粒子脉冲大小
      const pulseScale = 0.8 + Math.sin(time * 3 + p.__orbitAngle) * 0.2
      particle.scale.setScalar(pulseScale)

      // 狂暴阶段粒子颜色变红紫混合
      if (isBerserk) {
        const mat = particle.material as THREE.MeshBasicMaterial
        const t = (Math.sin(time * 2 + p.__orbitAngle) + 1) * 0.5
        mat.color.setHex(t > 0.5 ? 0xFF00FF : 0xFF4444) // 红紫色混合
      }
    }
  }

  if (ring) {
    // 狂暴阶段光环旋转加快
    const rotationSpeed = isBerserk ? 0.03 : 0.01
    // 光环脉冲透明度
    const ringOpacity = isBerserk
      ? 0.5 + Math.sin(time * 3) * 0.3
      : 0.3 + Math.sin(time * 2) * 0.2
    ;(ring.material as THREE.MeshBasicMaterial).opacity = ringOpacity
    ring.rotation.z += rotationSpeed

    // 狂暴阶段新增红色火焰环特效
    if (isBerserk && !enemy.mesh.userData.flameRing) {
      const flameGeom = new THREE.TorusGeometry(1.3, 0.08, 8, 24)
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xFF3333,
        transparent: true,
        opacity: 0.7,
      })
      const flameRing = new THREE.Mesh(flameGeom, flameMat)
      flameRing.rotation.x = -Math.PI / 2
      flameRing.position.y = -0.2
      enemy.mesh.add(flameRing)
      enemy.mesh.userData.flameRing = flameRing
    }

    // 更新火焰环动画
    const flameRing = enemy.mesh.userData.flameRing as THREE.Mesh | undefined
    if (flameRing) {
      flameRing.rotation.z += 0.05
      const flameOpacity = 0.5 + Math.sin(time * 4) * 0.3
      ;(flameRing.material as THREE.MeshBasicMaterial).opacity = flameOpacity
    }
  }
}

// 更新敌人模型位置
export function updateEnemyPosition(enemy: Enemy): void {
  if (!enemy.mesh) return
  enemy.mesh.position.copy(enemy.position)
}

// 敌人待机动画
export function playIdleAnimation(enemy: Enemy, time: number): void {
  if (!enemy.mesh || enemy.isDead) return

  const { body, head } = enemy.mesh.userData as any
  if (body) {
    body.position.y = 0.5 + Math.sin(time * 2) * 0.02
  }
  if (head) {
    head.rotation.y = Math.sin(time * 1.5) * 0.1
  }
}

// 敌人行走动画
export function playWalkAnimation(enemy: Enemy, time: number): void {
  if (!enemy.mesh || enemy.isDead) return

  const { leftLeg, rightLeg, leftArm, rightArm, body } = enemy.mesh.userData as any
  const walkSpeed = 8

  if (leftLeg) {
    leftLeg.rotation.x = Math.sin(time * walkSpeed) * 0.4
  }
  if (rightLeg) {
    rightLeg.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.4
  }
  if (leftArm) {
    leftArm.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.3
  }
  if (rightArm) {
    rightArm.rotation.x = Math.sin(time * walkSpeed) * 0.3
  }
  if (body) {
    body.position.y = 0.5 + Math.abs(Math.sin(time * walkSpeed * 2)) * 0.05
  }
}

// 敌人追逐动画
export function playChaseAnimation(enemy: Enemy, time: number): void {
  if (!enemy.mesh || enemy.isDead) return

  const { leftLeg, rightLeg, leftArm, rightArm, body } = enemy.mesh.userData as any
  const runSpeed = 12

  if (leftLeg) {
    leftLeg.rotation.x = Math.sin(time * runSpeed) * 0.6
  }
  if (rightLeg) {
    rightLeg.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.6
  }
  if (leftArm) {
    leftArm.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.5
  }
  if (rightArm) {
    rightArm.rotation.x = Math.sin(time * runSpeed) * 0.5
  }
  if (body) {
    body.position.y = 0.5 + Math.abs(Math.sin(time * runSpeed * 2)) * 0.08
  }
}

// 敌人被击中动画
export function playHitAnimation(enemy: Enemy): void {
  if (!enemy.mesh || enemy.isDead) return

  const { body, head } = enemy.mesh.userData as any

  // 闪烁红色
  if (body) {
    ;(body.material as THREE.MeshToonMaterial).color.setHex(0xff0000)
    setTimeout(() => {
      if (body && !enemy.isDead) {
        const colors = ENEMY_COLORS[enemy.config.type]
        ;(body.material as THREE.MeshToonMaterial).color.setHex(colors.body)
      }
    }, 100)
  }

  // 后仰
  if (head) {
    head.rotation.x = -0.3
    setTimeout(() => {
      if (head) head.rotation.x = 0
    }, 200)
  }
}

// 敌人死亡动画（卡通消散效果）
export function playDeathAnimation(enemy: Enemy, onComplete?: () => void): void {
  if (!enemy.mesh) return

  const { body, head, leftArm, rightArm, leftLeg, rightLeg } = enemy.mesh.userData as any
  const parts = [body, head, leftArm, rightArm, leftLeg, rightLeg].filter(Boolean)

  let opacity = 1
  const fadeOut = () => {
    opacity -= 0.05
    parts.forEach((part: any) => {
      if (part.material) {
        part.material.transparent = true
        part.material.opacity = opacity
      }
    })

    // 向上飘动
    if (enemy.mesh) {
      enemy.mesh.position.y += 0.05
    }

    if (opacity > 0) {
      requestAnimationFrame(fadeOut)
    } else {
      parts.forEach((part: any) => {
        if (part && part.geometry) part.geometry.dispose()
        if (part && part.material) part.material.dispose()
      })
      onComplete?.()
    }
  }

  fadeOut()
}

// 自爆兵预警动画
export function updateExploderEffects(enemy: Enemy, time: number): void {
  if (enemy.config.type !== 'exploder' || !enemy.mesh) return

  const pulseGlow = enemy.mesh.userData.exploderPulse as THREE.Mesh | undefined
  const ring = enemy.mesh.userData.exploderRing as THREE.Mesh | undefined
  const body = enemy.mesh.userData.body as THREE.Mesh | undefined

  // 预警阶段特效
  if (enemy.isExploding) {
    const t = (time * 5) % 1 // 快速闪烁
    const flash = Math.sin(t * Math.PI * 2) * 0.5 + 0.5

    // 脉冲光晕闪烁
    if (pulseGlow) {
      ;(pulseGlow.material as THREE.MeshBasicMaterial).opacity = 0.3 + flash * 0.6
      const pulseScale = 1.0 + flash * 0.3
      pulseGlow.scale.setScalar(pulseScale)
    }

    // 红色粒子环旋转加快
    if (ring) {
      ring.rotation.z += 0.08
      ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + flash * 0.5
    }

    // 身体闪烁红色警告
    if (body) {
      const material = body.material as THREE.MeshToonMaterial
      const r = flash > 0.5 ? 0xff3300 : 0xff8c00
      material.color.setHex(r)
    }
  } else {
    // 正常状态：缓慢脉冲
    if (pulseGlow) {
      const pulseOpacity = 0.3 + Math.sin(time * 2) * 0.15
      ;(pulseGlow.material as THREE.MeshBasicMaterial).opacity = pulseOpacity
      const pulseScale = 0.9 + Math.sin(time * 1.5) * 0.1
      pulseGlow.scale.setScalar(pulseScale)
    }

    if (ring) {
      ring.rotation.z += 0.02
    }
  }
}

// 治疗者特效动画
export function updateHealerEffects(enemy: Enemy, time: number): void {
  if (enemy.config.type !== 'healer' || !enemy.mesh) return

  const healGlow = enemy.mesh.userData.healerGlow as THREE.Mesh | undefined
  if (healGlow) {
    const pulseOpacity = 0.2 + Math.sin(time * 1.5) * 0.15
    ;(healGlow.material as THREE.MeshBasicMaterial).opacity = pulseOpacity
    const pulseScale = 0.9 + Math.sin(time) * 0.1
    healGlow.scale.setScalar(pulseScale)
  }

  // 治疗时的绿色粒子向上飘散
  const healParticles = enemy.mesh.userData.healParticles as THREE.Mesh[] | undefined
  if (healParticles) {
    for (let i = healParticles.length - 1; i >= 0; i--) {
      const p = healParticles[i]
      // 向上飘散
      p.position.y += 0.02
      // 淡出
      const mat = p.material as THREE.MeshBasicMaterial
      mat.opacity! -= 0.02
      if (mat.opacity! <= 0) {
        enemy.mesh.remove(p)
        p.geometry.dispose()
        mat.dispose()
        healParticles.splice(i, 1)
      }
    }
    if (healParticles.length === 0) {
      delete enemy.mesh.userData.healParticles
    }
  }
}

// 创建治疗粒子（由 EnemyAI 调用）
export function createHealParticles(enemy: Enemy): void {
  if (enemy.config.type !== 'healer' || !enemy.mesh) return

  if (!enemy.mesh.userData.healParticles) {
    enemy.mesh.userData.healParticles = []
  }
  const healParticles = enemy.mesh.userData.healParticles as THREE.Mesh[]

  // 创建 3-5 个绿色粒子
  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const particleGeom = new THREE.SphereGeometry(0.05, 4, 4)
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
    })
    const particle = new THREE.Mesh(particleGeom, particleMat)
    // 随机位置（在治疗者周围）
    particle.position.set(
      (Math.random() - 0.5) * 0.8,
      1.2 + Math.random() * 0.3,
      (Math.random() - 0.5) * 0.8
    )
    enemy.mesh.add(particle)
    healParticles.push(particle)
  }
}
