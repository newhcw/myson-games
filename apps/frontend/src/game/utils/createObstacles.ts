import * as THREE from 'three'
import { collisionDetector } from '@/game/utils/Collision'
import { obstaclePresets, type ObstaclePreset } from '@/game/config/obstacles'

export function createObstacleMesh(
  preset: ObstaclePreset,
  material?: THREE.MeshStandardMaterial
): THREE.Mesh {
  let geometry: THREE.BufferGeometry
  if (preset.type === 'cylinder') {
    const [rTop, rBottom, height, segments] = preset.size
    geometry = new THREE.CylinderGeometry(rTop, rBottom, height, segments)
  } else {
    const [w, h, d] = preset.size
    geometry = new THREE.BoxGeometry(w, h, d)
  }

  const meshMaterial = material || new THREE.MeshStandardMaterial({
    color: preset.color,
    roughness: 0.8,
    metalness: 0.1,
  })

  const mesh = new THREE.Mesh(geometry, meshMaterial)
  mesh.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
  mesh.castShadow = preset.castShadow ?? true
  mesh.receiveShadow = true

  return mesh
}

export function createObstacles(scene: THREE.Scene): void {
  obstaclePresets.forEach((preset) => {
    const mesh = createObstacleMesh(preset)
    scene.add(mesh)
    collisionDetector.addCollider(mesh, preset.health)
  })
}
