import * as THREE from 'three'

/**
 * 卡通风格太阳：球体 + 粒子光晕
 */
export class Sun {
  readonly group: THREE.Group
  private glowParticles: THREE.Points
  private elapsed = 0

  constructor() {
    this.group = new THREE.Group()

    // 太阳主体 - 暖黄色球体
    const sunGeo = new THREE.SphereGeometry(4, 24, 24)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    this.group.add(sunMesh)

    // 内发光层 - 半透明橙色球体略大一圈
    const glowGeo = new THREE.SphereGeometry(4.8, 24, 24)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.25,
    })
    const glowMesh = new THREE.Mesh(glowGeo, glowMat)
    this.group.add(glowMesh)

    // 粒子光晕 - 围绕太阳的发光粒子
    const particleCount = 300
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      // 分布在半径 5~10 的球壳内
      const radius = 5 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius
      positions[i * 3 + 2] = Math.cos(phi) * radius
      sizes[i] = 0.1 + Math.random() * 0.3
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa44,
      size: 0.3,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    this.glowParticles = new THREE.Points(particleGeo, particleMat)
    this.group.add(this.glowParticles)

    // 固定在场景高空远处
    this.group.position.set(100, 80, 0)
  }

  update(delta: number): void {
    this.elapsed += delta

    // 光晕粒子缓慢旋转
    this.glowParticles.rotation.y += delta * 0.15
    this.glowParticles.rotation.x += delta * 0.05

    // 光晕大小脉动
    const pulse = 1 + Math.sin(this.elapsed * 3) * 0.08
    this.glowParticles.scale.set(pulse, pulse, pulse)

    // 内发光层透明度脉动
    const glowMesh = this.group.children[1] as THREE.Mesh
    const glowMat = glowMesh.material as THREE.MeshBasicMaterial
    glowMat.opacity = 0.2 + Math.sin(this.elapsed * 2.5) * 0.08
  }

  dispose(): void {
    this.group.children.forEach((child) => {
      if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}
