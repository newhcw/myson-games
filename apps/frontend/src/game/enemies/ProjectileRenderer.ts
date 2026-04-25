import * as THREE from 'three'
import type { ProjectileVisual } from './types'

/**
 * 创建子弹外观模型并附加到给定的 Group 上
 * 返回创建的主 mesh（用于后续清理）
 */
export function createProjectileVisual(
  parentGroup: THREE.Group,
  visual: ProjectileVisual,
): THREE.Mesh {
  switch (visual) {
    case 'star':
      return createStarProjectile(parentGroup)
    case 'crystal':
      return createCrystalProjectile(parentGroup)
    case 'fireball':
      return createFireballProjectile(parentGroup)
  }
}

/** 小兵：黄色小星星 */
function createStarProjectile(parent: THREE.Group): THREE.Mesh {
  const geom = new THREE.OctahedronGeometry(0.15, 0)
  const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700 })
  const star = new THREE.Mesh(geom, mat)

  // 添加尖角装饰（小圆锥）
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const spikeGeom = new THREE.ConeGeometry(0.04, 0.12, 4, 4)
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xFFF176 })
    const spike = new THREE.Mesh(spikeGeom, spikeMat)
    spike.position.set(
      Math.cos(angle) * 0.15,
      Math.sin(angle) * 0.15,
      0,
    )
    spike.rotation.z = angle
    star.add(spike)
  }

  parent.add(star)
  return star
}

/** 精英：紫色菱形水晶 */
function createCrystalProjectile(parent: THREE.Group): THREE.Mesh {
  const geom = new THREE.OctahedronGeometry(0.25, 0)
  const mat = new THREE.MeshBasicMaterial({ color: 0x9B59B6 })
  const crystal = new THREE.Mesh(geom, mat)
  // 45 度旋转让八面体呈菱形
  crystal.rotation.x = Math.PI / 4
  crystal.rotation.z = Math.PI / 4

  parent.add(crystal)
  return crystal
}

/** BOSS：红色大火球 */
function createFireballProjectile(parent: THREE.Group): THREE.Mesh {
  const geom = new THREE.SphereGeometry(0.5, 12, 12)
  const mat = new THREE.MeshBasicMaterial({ color: 0xE74C3C })
  const fireball = new THREE.Mesh(geom, mat)

  // 发光光环
  const ringGeom = new THREE.TorusGeometry(0.55, 0.06, 8, 16)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xFF8800, transparent: true, opacity: 0.7 })
  const ring = new THREE.Mesh(ringGeom, ringMat)
  fireball.add(ring)

  parent.add(fireball)
  return fireball
}

/**
 * 创建尾迹粒子
 * 返回粒子 mesh 数组，挂载到 parent 上
 */
export function createTrailParticles(
  parent: THREE.Group,
  visual: ProjectileVisual,
): THREE.Mesh[] {
  const particles: THREE.Mesh[] = []
  const count = visual === 'fireball' ? 5 : visual === 'crystal' ? 3 : 0

  const color = visual === 'fireball' ? 0xFF8800 : 0x9B59B6
  const baseSize = visual === 'fireball' ? 0.1 : 0.06

  for (let i = 0; i < count; i++) {
    const geom = new THREE.SphereGeometry(baseSize * (1 - i * 0.2), 4, 4)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6 - i * 0.12,
    })
    const particle = new THREE.Mesh(geom, mat)
    particle.position.set(0, 0, -0.3 - i * 0.25)
    particle.visible = false
    parent.add(particle)
    particles.push(particle)
  }

  return particles
}

/**
 * 更新尾迹粒子位置（沿子弹后方的历史轨迹排列）
 */
export function updateTrailParticles(
  projectile: { trailParticles: THREE.Mesh[]; trailPositions: THREE.Vector3[]; mesh: THREE.Group },
): void {
  const { trailParticles, trailPositions, mesh } = projectile
  if (trailParticles.length === 0 || trailPositions.length < 2) {
    // 隐藏所有尾迹粒子
    for (const p of trailParticles) p.visible = false
    return
  }

  for (let i = 0; i < trailParticles.length; i++) {
    // 从后往前取历史位置
    const posIndex = trailPositions.length - 2 - i * 1
    if (posIndex < 0) {
      trailParticles[i].visible = false
      continue
    }

    const worldPos = trailPositions[Math.max(0, Math.floor(posIndex))]
    // 转换为子弹本地坐标
    const localPos = mesh.worldToLocal(worldPos.clone())
    trailParticles[i].position.copy(localPos)
    trailParticles[i].visible = true

    // 递减大小
    const scale = 1 - i * 0.2
    trailParticles[i].scale.setScalar(Math.max(0.1, scale))
    // 递减透明度
    const mat = trailParticles[i].material as THREE.MeshBasicMaterial
    if (mat && !Array.isArray(mat)) {
      mat.opacity = Math.max(0.05, 0.6 - i * 0.12)
    }
  }
}

/**
 * 创建命中爆炸粒子特效
 * 返回 Group 用于添加到场景，1 秒后自动清理
 */
export function createHitExplosion(
  position: THREE.Vector3,
  _visual: ProjectileVisual,
  scene: THREE.Group,
): void {
  const explosion = new THREE.Group()
  explosion.position.copy(position)

  const particleCount = 10
  const velocities: THREE.Vector3[] = []

  for (let i = 0; i < particleCount; i++) {
    const size = 0.04 + Math.random() * 0.06
    const geom = new THREE.SphereGeometry(size, 4, 4)
    // 卡通化：金色 / 橙色 / 白色混合
    const colors = [0xFFD700, 0xFFA500, 0xFFF8DC, 0xFF6347]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
    const particle = new THREE.Mesh(geom, mat)

    particle.position.set(0, 0, 0)
    explosion.add(particle)

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
    ))
  }

  scene.add(explosion)

  // 动画：飞散 + 淡出
  let elapsed = 0
  const duration = 1.0
  const animate = () => {
    elapsed += 0.016 // ~60fps
    const progress = elapsed / duration

    if (progress >= 1) {
      scene.remove(explosion)
      explosion.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      return
    }

    for (let i = 0; i < particleCount; i++) {
      const p = explosion.children[i] as THREE.Mesh
      p.position.add(velocities[i].clone().multiplyScalar(0.016))
      velocities[i].multiplyScalar(0.95) // 减速
      if (p.material instanceof THREE.MeshBasicMaterial) {
        p.material.opacity = 1 - progress
      }
    }

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}
