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
}

// 创建Q版敌人3D模型
export function createEnemyMesh(config: EnemyConfig): THREE.Group {
  const group = new THREE.Group()
  const colors = ENEMY_COLORS[config.type] || ENEMY_COLORS.soldier

  // Toon材质
  const createToonMaterial = (color: number) => {
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: createGradientMap(),
    })
  }

  // 身体 - 圆润的盒子
  const bodyGeometry = new THREE.BoxGeometry(0.8, 1.0, 0.5)
  const bodyMaterial = createToonMaterial(colors.body)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.5
  body.castShadow = true
  group.add(body)

  // 头部 - 大头（Q版特征）
  const headScale = config.type === 'boss' ? 1.2 : config.type === 'elite' ? 1.0 : 0.9
  const headGeometry = new THREE.BoxGeometry(0.7 * headScale, 0.6 * headScale, 0.6 * headScale)
  const headMaterial = createToonMaterial(colors.head)
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.3
  head.castShadow = true
  group.add(head)

  // 眼睛
  const eyeGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.05)
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.15 * headScale, 1.35, 0.3 * headScale)
  group.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.15 * headScale, 1.35, 0.3 * headScale)
  group.add(rightEye)

  // 眼睛高光
  const highlightGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.02)
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })

  const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  leftHighlight.position.set(-0.13 * headScale, 1.38, 0.32 * headScale)
  group.add(leftHighlight)

  const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  rightHighlight.position.set(0.17 * headScale, 1.38, 0.32 * headScale)
  group.add(rightHighlight)

  // 手臂 - 小小的
  const armGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25)
  const armMaterial = createToonMaterial(colors.accent)

  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.55, 0.5, 0)
  leftArm.castShadow = true
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.55, 0.5, 0)
  rightArm.castShadow = true
  group.add(rightArm)

  // 腿
  const legGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3)
  const legMaterial = createToonMaterial(colors.accent)

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-0.2, -0.25, 0)
  leftLeg.castShadow = true
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(0.2, -0.25, 0)
  rightLeg.castShadow = true
  group.add(rightLeg)

  // 存储对各部分的引用以便动画使用
  group.userData = {
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
    enemy.mesh.position.y += 0.05

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