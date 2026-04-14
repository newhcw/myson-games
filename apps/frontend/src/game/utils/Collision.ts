import * as THREE from 'three'

export class CollisionDetector {
  private colliders: THREE.Box3[] = []

  addCollider(mesh: THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(mesh)
    this.colliders.push(box)
  }

  removeAllColliders() {
    this.colliders = []
  }

  checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, position.y - 1, position.z - radius),
      new THREE.Vector3(position.x + radius, position.y + 0.5, position.z + radius)
    )

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider)) {
        return true
      }
    }
    return false
  }

  getClosestCollisionPoint(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 100
  ): THREE.Vector3 | null {
    const raycaster = new THREE.Raycaster(position, direction.clone().normalize())
    // For now, return null - proper collision will need mesh intersection
    return null
  }
}

export const collisionDetector = new CollisionDetector()