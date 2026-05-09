import { ref, type ShallowRef } from 'vue'
import * as THREE from 'three'
import { collisionDetector } from '@/game/utils/Collision'
import { clampToSafeArea } from '@/game/utils/areaRestriction'

export interface PlayerMovementState {
  keys: { w: boolean; a: boolean; s: boolean; d: boolean }
  isRunning: boolean
  isCrouching: boolean
  playerHeight: number
  isJumping: boolean
  jumpVelocity: number
}

export function usePlayerMovement(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  playerPosition: THREE.Vector3,
) {
  const moveSpeed = 5
  const gravity = -9.8

  const keys: PlayerMovementState['keys'] = { w: false, a: false, s: false, d: false }
  const isRunning = ref(false)
  const isCrouching = ref(false)
  const playerHeight = ref(1.6)
  const isJumping = ref(false)
  const jumpVelocity = ref(0)

  const update = (delta: number) => {
    if (!camera.value) return

    const direction = new THREE.Vector3()

    if (keys.w) direction.z -= 1
    if (keys.s) direction.z += 1
    if (keys.a) direction.x -= 1
    if (keys.d) direction.x += 1

    let speed = moveSpeed
    if (isRunning.value) speed *= 1.5
    if (isCrouching.value) speed *= 0.5

    if (direction.length() > 0) {
      direction.normalize()
      direction.applyQuaternion(camera.value.quaternion)
      direction.y = 0
      direction.normalize()

      const newPosition = playerPosition.clone()
      newPosition.x += direction.x * speed * delta
      newPosition.z += direction.z * speed * delta

      if (!collisionDetector.checkCollision(newPosition)) {
        playerPosition.copy(newPosition)
      }

      const clamped = clampToSafeArea(playerPosition.x, playerPosition.z)
      playerPosition.x = clamped.x
      playerPosition.z = clamped.z
    }

    if (isJumping.value) {
      jumpVelocity.value += gravity * delta
      playerPosition.y += jumpVelocity.value * delta

      if (playerPosition.y <= playerHeight.value) {
        playerPosition.y = playerHeight.value
        isJumping.value = false
        jumpVelocity.value = 0
      }
    }

    camera.value.position.set(playerPosition.x, playerPosition.y, playerPosition.z)
  }

  const jump = () => {
    if (!isJumping.value) {
      isJumping.value = true
      jumpVelocity.value = 5
    }
  }

  const toggleCrouch = () => {
    isCrouching.value = !isCrouching.value
    playerHeight.value = isCrouching.value ? 0.8 : 1.6
  }

  const reset = () => {
    keys.w = false
    keys.a = false
    keys.s = false
    keys.d = false
    isRunning.value = false
    isCrouching.value = false
    playerHeight.value = 1.6
    isJumping.value = false
    jumpVelocity.value = 0
    playerPosition.set(0, 1.6, 0)
  }

  return {
    keys,
    isRunning,
    isCrouching,
    playerHeight,
    isJumping,
    jumpVelocity,
    update,
    jump,
    toggleCrouch,
    reset,
  }
}
