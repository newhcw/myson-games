import { ref, type ShallowRef } from 'vue'
import * as THREE from 'three'
import { collisionDetector } from '@/game/utils/Collision'
import { clampToSafeArea } from '@/game/utils/areaRestriction'
import { soundManager } from '@/game/sound/SoundManager'

export interface PlayerMovementState {
  keys: { w: boolean; a: boolean; s: boolean; d: boolean }
  isRunning: boolean
  isCrouching: boolean
  playerHeight: number
  isJumping: boolean
  jumpVelocity: number
  jumpChargeTime: number
  isChargeKeyHeld: boolean
}

export function usePlayerMovement(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  playerPosition: THREE.Vector3,
) {
  const moveSpeed = 5
  const gravity = -14.7
  const jumpMinVelocity = 5
  const jumpMaxVelocity = 8
  const jumpChargeWindow = 0.2 // 200ms

  const keys: PlayerMovementState['keys'] = { w: false, a: false, s: false, d: false }
  const isRunning = ref(false)
  const isCrouching = ref(false)
  const playerHeight = ref(1.6)
  const isJumping = ref(false)
  const jumpVelocity = ref(0)
  const jumpChargeTime = ref(0)
  const isChargeKeyHeld = ref(false)
  let jumpCameraTimer = 0
  let isJumpCameraSink = false
  let landedHard = false
  let landingShakeTimer = 0
  const JUMP_SINK_DURATION = 0.12
  const JUMP_SINK_AMOUNT = 0.05

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

      if (!collisionDetector.checkCollision(newPosition, 0.5, isJumping.value, newPosition.y - 1)) {
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
        const landingSpeed = Math.abs(jumpVelocity.value)
        playerPosition.y = playerHeight.value
        isJumping.value = false
        jumpVelocity.value = 0
        if (landingSpeed > 5) {
          landedHard = true
          landingShakeTimer = 0.15
          soundManager.playLand()
        }
      }
    } else if (isChargeKeyHeld.value) {
      jumpChargeTime.value += delta
      if (jumpChargeTime.value >= jumpChargeWindow) {
        jumpChargeTime.value = jumpChargeWindow
      }
    }

    // Jump camera sink effect
    if (isJumpCameraSink) {
      jumpCameraTimer += delta
      const sinkProgress = Math.min(jumpCameraTimer / JUMP_SINK_DURATION, 1)
      const sinkOffset = -JUMP_SINK_AMOUNT * Math.sin(sinkProgress * Math.PI)
      camera.value.position.set(playerPosition.x, playerPosition.y + sinkOffset, playerPosition.z)
      if (sinkProgress >= 1) {
        isJumpCameraSink = false
        jumpCameraTimer = 0
      }
    } else if (landedHard && landingShakeTimer > 0) {
      landingShakeTimer -= delta
      const intensity = 0.03 * (landingShakeTimer / 0.15)
      const offsetX = (Math.random() - 0.5) * 2 * intensity
      const offsetY = (Math.random() - 0.5) * 2 * intensity * 0.5
      camera.value.position.set(playerPosition.x + offsetX, playerPosition.y + offsetY, playerPosition.z)
      if (landingShakeTimer <= 0) {
        landedHard = false
        camera.value.position.set(playerPosition.x, playerPosition.y, playerPosition.z)
      }
    } else {
      camera.value.position.set(playerPosition.x, playerPosition.y, playerPosition.z)
    }
  }

  const jump = () => {
    if (!isJumping.value) {
      isJumping.value = true
      const chargeRatio = Math.min(jumpChargeTime.value / jumpChargeWindow, 1)
      jumpVelocity.value = jumpMinVelocity + (jumpMaxVelocity - jumpMinVelocity) * chargeRatio
      jumpChargeTime.value = 0
      isChargeKeyHeld.value = false
      // Start camera sink effect
      isJumpCameraSink = true
      jumpCameraTimer = 0
      soundManager.playJump()
    }
  }

  const startJumpCharge = () => {
    if (!isJumping.value) {
      isChargeKeyHeld.value = true
      jumpChargeTime.value = 0
    }
  }

  const cancelJumpCharge = () => {
    if (isChargeKeyHeld.value) {
      jump()
      isChargeKeyHeld.value = false
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
    jumpChargeTime.value = 0
    isChargeKeyHeld.value = false
    playerPosition.set(0, 1.6, 0)
  }

  return {
    keys,
    isRunning,
    isCrouching,
    playerHeight,
    isJumping,
    jumpVelocity,
    jumpChargeTime,
    isChargeKeyHeld,
    update,
    jump,
    startJumpCharge,
    cancelJumpCharge,
    toggleCrouch,
    reset,
  }
}
