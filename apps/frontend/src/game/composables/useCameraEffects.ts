import { ref, type ShallowRef } from 'vue'
import * as THREE from 'three'
import type { ViewAngles } from './useGameContext'
import { useWeaponStore } from '@/stores/weapon'

export function useCameraEffects(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  viewAngles: ViewAngles,
) {
  const weaponStore = useWeaponStore()

  // Recoil state
  const recoilOffset = ref({ x: 0, y: 0 })
  const recoilIndex = ref(0)
  const lastFireTimeForRecoil = ref(0)

  // Spread state
  const currentSpread = ref(0)
  const lastFireTimeForSpread = ref(0)

  // Breath hold state
  const isHoldingBreath = ref(false)
  const breathStamina = ref(100)
  const maxBreathStamina = 100
  const breathConsumptionRate = 20
  const breathRecoveryRate = 10
  const minStaminaToStart = 10

  // Sway state
  const swayOffset = ref({ x: 0, y: 0 })
  const swayTime = ref(0)
  const swayAmount = 0.003
  const swaySpeed = 1.5
  const aimingSwayMultiplier = 0.3
  const breathingSway = ref({ x: 0, y: 0 })
  const breathingTime = ref(0)
  const breathingAmount = 0.002
  const breathingSpeed = 0.5

  // Camera shake state
  const cameraShake = ref({
    active: false,
    startTime: 0,
    duration: 0.1,
    intensity: 0.03,
    originalPositions: [] as number[],
  })

  const updateSway = (delta: number) => {
    if (!camera.value) return

    const isAiming = weaponStore.currentScope.isActive || isHoldingBreath.value
    const multiplier = isAiming ? aimingSwayMultiplier : 1.0

    swayTime.value += delta * swaySpeed
    breathingTime.value += delta * breathingSpeed

    const swayX = Math.sin(swayTime.value) * swayAmount * multiplier
    const swayY = Math.sin(swayTime.value * 0.7) * swayAmount * 0.5 * multiplier
    swayOffset.value = { x: swayX, y: swayY }

    const breathY = Math.sin(breathingTime.value) * breathingAmount * multiplier
    const breathX = Math.sin(breathingTime.value * 0.5) * breathingAmount * 0.3 * multiplier
    breathingSway.value = { x: breathX, y: breathY }

    viewAngles.yaw += swayOffset.value.x + breathingSway.value.x
    viewAngles.pitch += swayOffset.value.y + breathingSway.value.y
    viewAngles.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, viewAngles.pitch))

    camera.value.rotation.order = 'YXZ'
    camera.value.rotation.y = viewAngles.yaw
    camera.value.rotation.x = viewAngles.pitch
  }

  const updateRecoilRecovery = (delta: number) => {
    const weapon = weaponStore.currentWeapon
    if (!weapon) return

    const now = Date.now()

    if (recoilOffset.value.x !== 0 || recoilOffset.value.y !== 0) {
      const recovery = weapon.recoilRecovery * delta
      recoilOffset.value.x *= (1 - recovery)
      recoilOffset.value.y *= (1 - recovery)

      if (Math.abs(recoilOffset.value.x) < 0.001) recoilOffset.value.x = 0
      if (Math.abs(recoilOffset.value.y) < 0.001) recoilOffset.value.y = 0
    }

    if (currentSpread.value > 0) {
      const spreadRecovery = weapon.spreadRecovery * delta
      currentSpread.value *= (1 - spreadRecovery)

      if (currentSpread.value < 0.01) currentSpread.value = 0
    }

    if (now - lastFireTimeForRecoil.value > 1000) {
      recoilIndex.value = 0
    }

    // Breath stamina management
    if (isHoldingBreath.value && breathStamina.value > 0) {
      breathStamina.value -= breathConsumptionRate * delta
      if (breathStamina.value <= 0) {
        breathStamina.value = 0
        isHoldingBreath.value = false
      }
    } else {
      if (breathStamina.value < maxBreathStamina) {
        breathStamina.value += breathRecoveryRate * delta
        if (breathStamina.value > maxBreathStamina) {
          breathStamina.value = maxBreathStamina
        }
      }
    }
  }

  const updateCameraForShake = () => {
    if (!camera.value || !cameraShake.value.active) return false

    const now = Date.now()
    const shake = cameraShake.value
    const elapsed = (now - shake.startTime) / 1000

    if (elapsed >= shake.duration) {
      cameraShake.value.active = false
      camera.value.position.set(
        shake.originalPositions[0],
        shake.originalPositions[1],
        shake.originalPositions[2],
      )
      return false
    }

    const progress = elapsed / shake.duration
    const currentIntensity = shake.intensity * (1 - progress)
    const offsetX = (Math.random() - 0.5) * 2 * currentIntensity
    const offsetY = (Math.random() - 0.5) * 2 * currentIntensity * 0.5

    camera.value.position.set(
      shake.originalPositions[0] + offsetX,
      shake.originalPositions[1] + offsetY,
      shake.originalPositions[2],
    )

    return true
  }

  const applyRecoil = (weapon: any) => {
    if (!camera.value) return

    const pattern = weapon.recoilPattern || [{ x: 0, y: -0.5 }]
    const patternIndex = recoilIndex.value % pattern.length
    const recoil = pattern[patternIndex]

    let recoilMultiplier = 1.0
    if (isHoldingBreath.value && breathStamina.value > 0) {
      recoilMultiplier = 0.3
    }

    recoilOffset.value.x += recoil.x * weapon.recoilAmount * recoilMultiplier
    recoilOffset.value.y += recoil.y * weapon.recoilAmount * recoilMultiplier

    recoilOffset.value.x = Math.max(-0.5, Math.min(0.5, recoilOffset.value.x))
    recoilOffset.value.y = Math.max(-1.0, Math.min(0.2, recoilOffset.value.y))

    recoilIndex.value++

    viewAngles.yaw += recoilOffset.value.x * 0.01
    viewAngles.pitch += recoilOffset.value.y * 0.01
    viewAngles.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, viewAngles.pitch))

    camera.value.rotation.order = 'YXZ'
    camera.value.rotation.y = viewAngles.yaw
    camera.value.rotation.x = viewAngles.pitch

    currentSpread.value = Math.min(weapon.spread, currentSpread.value + weapon.spread * 0.3)
    lastFireTimeForRecoil.value = Date.now()
    lastFireTimeForSpread.value = Date.now()
  }

  const startCameraShake = (duration = 0.1, intensity = 0.03) => {
    if (!camera.value) return
    cameraShake.value = {
      active: true,
      startTime: Date.now(),
      duration,
      intensity,
      originalPositions: [camera.value.position.x, camera.value.position.y, camera.value.position.z],
    }
  }

  const update = (delta: number) => {
    updateSway(delta)
    updateRecoilRecovery(delta)
    updateCameraForShake()
  }

  const reset = () => {
    recoilOffset.value = { x: 0, y: 0 }
    recoilIndex.value = 0
    currentSpread.value = 0
    isHoldingBreath.value = false
    breathStamina.value = maxBreathStamina
    swayTime.value = 0
    breathingTime.value = 0
    cameraShake.value.active = false
  }

  return {
    isHoldingBreath,
    breathStamina,
    maxBreathStamina,
    recoilOffset,
    currentSpread,
    applyRecoil,
    startCameraShake,
    update,
    reset,
  }
}
