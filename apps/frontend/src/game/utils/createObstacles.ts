import * as THREE from 'three'
import { collisionDetector } from '@/game/utils/Collision'
import { obstaclePresets, type ObstaclePreset } from '@/game/config/obstacles'

// 创建卡通渐变贴图
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([0, 128, 255])
  const texture = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

// Toon材质创建函数
function createToonMaterial(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: createGradientMap(),
  })
}

// 创建树木（树干+树冠）
function createTreeMesh(preset: ObstaclePreset): THREE.Group {
  const group = new THREE.Group()

  const [rTop, , height] = preset.size
  const trunkHeight = height * 0.5
  const foliageHeight = height * 0.7

  // 树干
  const trunkGeometry = new THREE.CylinderGeometry(rTop * 0.3, rTop * 0.4, trunkHeight, 8)
  const trunkMaterial = new THREE.MeshToonMaterial({ color: 0x8B4513, gradientMap: createGradientMap() })
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.position.y = trunkHeight / 2
  trunk.castShadow = preset.castShadow
  group.add(trunk)

  // 树冠（3层圆锥叠加）
  const foliageColors = [preset.color, adjustColor(preset.color, -20), adjustColor(preset.color, 20)]
  const foliageSizes = [rTop * 1.0, rTop * 0.75, rTop * 0.5]
  const foliageHeights = [foliageHeight * 0.3, foliageHeight * 0.6, foliageHeight * 0.9]

  foliageSizes.forEach((size, i) => {
    const foliageGeometry = new THREE.ConeGeometry(size, foliageHeight * 0.4, 8)
    const foliageMaterial = createToonMaterial(foliageColors[i])
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
    foliage.position.y = trunkHeight + foliageHeights[i]
    foliage.castShadow = preset.castShadow
    group.add(foliage)
  })

  group.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  return group
}

// 创建岩石
function createRockMesh(preset: ObstaclePreset): THREE.Group {
  const group = new THREE.Group()
  const [w, h, d] = preset.size

  // 主岩石
  const rockGeometry = new THREE.DodecahedronGeometry(Math.max(w, h, d) * 0.5, 1)
  const rockMaterial = createToonMaterial(preset.color)
  const rock = new THREE.Mesh(rockGeometry, rockMaterial)
  rock.position.y = h * 0.4
  rock.scale.set(w / d, h / d, 1)
  rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3)
  rock.castShadow = preset.castShadow
  group.add(rock)

  // 添加小块岩石
  const smallRockCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < smallRockCount; i++) {
    const smallSize = Math.min(w, h, d) * 0.25
    const smallGeometry = new THREE.DodecahedronGeometry(smallSize, 0)
    const smallMaterial = createToonMaterial(adjustColor(preset.color, -30 + Math.random() * 20))
    const smallRock = new THREE.Mesh(smallGeometry, smallMaterial)
    smallRock.position.set(
      (Math.random() - 0.5) * w * 0.6,
      smallSize * 0.5,
      (Math.random() - 0.5) * d * 0.6
    )
    smallRock.rotation.set(Math.random(), Math.random(), Math.random())
    smallRock.castShadow = preset.castShadow
    group.add(smallRock)
  }

  group.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  return group
}

// 创建灌木（多个球体组合）
function createBushMesh(preset: ObstaclePreset): THREE.Group {
  const group = new THREE.Group()
  const [w, h] = preset.size

  // 中心大灌木
  const centerGeometry = new THREE.SphereGeometry(h * 0.6, 8, 8)
  const centerMaterial = createToonMaterial(preset.color)
  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  center.position.y = h * 0.5
  center.scale.set(1, 0.8, 1)
  center.castShadow = preset.castShadow
  group.add(center)

  // 周围小球
  const positions = [
    { x: w * 0.4, z: 0 },
    { x: -w * 0.4, z: 0 },
    { x: 0, z: w * 0.3 },
    { x: 0, z: -w * 0.3 },
  ]

  positions.forEach(pos => {
    const sphereGeometry = new THREE.SphereGeometry(h * 0.35, 8, 8)
    const sphereMaterial = createToonMaterial(adjustColor(preset.color, -15 + Math.random() * 30))
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(pos.x, h * 0.4, pos.z)
    sphere.castShadow = preset.castShadow
    group.add(sphere)
  })

  group.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  return group
}

// 创建花朵
function createFlowerMesh(preset: ObstaclePreset): THREE.Group {
  const group = new THREE.Group()
  const [, h] = preset.size

  // 花茎
  const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, h * 0.8, 6)
  const stemMaterial = new THREE.MeshToonMaterial({ color: 0x228B22, gradientMap: createGradientMap() })
  const stem = new THREE.Mesh(stemGeometry, stemMaterial)
  stem.position.y = h * 0.4
  group.add(stem)

  // 花瓣（多个小球组成）
  const petalCount = 5
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    const petalGeometry = new THREE.SphereGeometry(0.08, 6, 6)
    const petalMaterial = createToonMaterial(preset.color)
    const petal = new THREE.Mesh(petalGeometry, petalMaterial)
    petal.position.set(
      Math.cos(angle) * 0.1,
      h * 0.85,
      Math.sin(angle) * 0.1
    )
    group.add(petal)
  }

  // 花心
  const centerGeometry = new THREE.SphereGeometry(0.05, 6, 6)
  const centerMaterial = new THREE.MeshToonMaterial({ color: 0xFFFF00, gradientMap: createGradientMap() })
  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  center.position.y = h * 0.85
  group.add(center)

  group.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  return group
}

// 创建树桩
function createStumpMesh(preset: ObstaclePreset): THREE.Group {
  const group = new THREE.Group()
  const [r, , h] = preset.size

  // 树桩主体
  const stumpGeometry = new THREE.CylinderGeometry(r * 0.9, r, h, 8)
  const stumpMaterial = createToonMaterial(preset.color)
  const stump = new THREE.Mesh(stumpGeometry, stumpMaterial)
  stump.position.y = h / 2
  stump.castShadow = preset.castShadow
  group.add(stump)

  // 年轮纹理（同心���）
  const ringGeometry = new THREE.RingGeometry(r * 0.2, r * 0.8, 16)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x5D3A1A,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = h + 0.01
  group.add(ring)

  group.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  return group
}

// 调整颜色亮度
function adjustColor(color: number, amount: number): number {
  const r = Math.min(255, Math.max(0, ((color >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((color >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (color & 0xff) + amount))
  return (r << 16) | (g << 8) | b
}

// 创建障碍物网格
export function createObstacleMesh(preset: ObstaclePreset): THREE.Group {
  switch (preset.type) {
    case 'tree':
      return createTreeMesh(preset)
    case 'rock':
      return createRockMesh(preset)
    case 'bush':
      return createBushMesh(preset)
    case 'flower':
      return createFlowerMesh(preset)
    case 'stump':
      return createStumpMesh(preset)
    default:
      // 回退到简单盒子
      const geometry = new THREE.BoxGeometry(...preset.size)
      const material = createToonMaterial(preset.color)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
      mesh.castShadow = preset.castShadow
      const group = new THREE.Group()
      group.add(mesh)
      return group
  }
}

export function createObstacles(scene: THREE.Scene): void {
  obstaclePresets.forEach((preset) => {
    const mesh = createObstacleMesh(preset)
    scene.add(mesh)

    // 使用主网格的位置作为碰撞检测点
    const hitPosition = new THREE.Vector3(preset.pos[0], preset.pos[1], preset.pos[2])
    collisionDetector.addCollider(mesh, preset.health, hitPosition)
  })
}