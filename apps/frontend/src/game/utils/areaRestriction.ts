import * as THREE from 'three'

export const SAFE_AREA_CENTER = { x: 0, z: 0 }
export const SAFE_AREA_RADIUS = 25
export const MIN_SPAWN_DISTANCE = 8

export function isInSafeArea(x: number, z: number): boolean {
  const dx = x - SAFE_AREA_CENTER.x
  const dz = z - SAFE_AREA_CENTER.z
  const distance = Math.sqrt(dx * dx + dz * dz)
  return distance <= SAFE_AREA_RADIUS
}

export function clampToSafeArea(x: number, z: number): THREE.Vector3 {
  const dx = x - SAFE_AREA_CENTER.x
  const dz = z - SAFE_AREA_CENTER.z
  const distance = Math.sqrt(dx * dx + dz * dz)

  if (distance <= SAFE_AREA_RADIUS) {
    return new THREE.Vector3(x, 0, z)
  }

  const scale = SAFE_AREA_RADIUS / distance
  const clampedX = SAFE_AREA_CENTER.x + dx * scale
  const clampedZ = SAFE_AREA_CENTER.z + dz * scale

  return new THREE.Vector3(clampedX, 0, clampedZ)
}

export function getRandomPositionInSafeArea(): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2
  const radius = Math.sqrt(Math.random()) * SAFE_AREA_RADIUS * 0.9
  const x = SAFE_AREA_CENTER.x + Math.cos(angle) * radius
  const z = SAFE_AREA_CENTER.z + Math.sin(angle) * radius
  return new THREE.Vector3(x, 0, z)
}

export interface EnemyPosition {
  x: number
  z: number
}

export function findSafeSpawnPosition(
  existingEnemies: EnemyPosition[],
  minDistance: number = MIN_SPAWN_DISTANCE,
  maxAttempts: number = 50,
): THREE.Vector3 {
  if (existingEnemies.length === 0) {
    return getRandomPositionInSafeArea()
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pos = getRandomPositionInSafeArea()

    let isValid = true
    for (const enemy of existingEnemies) {
      const dx = pos.x - enemy.x
      const dz = pos.z - enemy.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      if (distance < minDistance) {
        isValid = false
        break
      }
    }

    if (isValid) {
      return pos
    }
  }

  return getRandomPositionInSafeArea()
}