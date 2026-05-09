import { ref, watch, type ShallowRef } from 'vue'
import * as THREE from 'three'
import { useWeaponStore } from '@/stores/weapon'

export interface ScopeMagnificationConfig {
  transitionDuration: number
  debounceDelay: number
  swayMultiplier: number
  breathingSwayMultiplier: number
  minFov: number
  maxFov: number
}

const DEFAULT_CONFIG: ScopeMagnificationConfig = {
  transitionDuration: 200,
  debounceDelay: 100,
  swayMultiplier: 0.3,
  breathingSwayMultiplier: 0.3,
  minFov: 10,
  maxFov: 75,
}

export function useScopeMagnification(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  config: Partial<ScopeMagnificationConfig> = {}
) {
  const weaponStore = useWeaponStore()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const isScopeActive = ref(false)
  const targetFov = ref(75)
  const currentFov = ref(75)
  const isTransitioning = ref(false)

  let lastToggleTime = 0
  let animationFrameId: number | null = null

  const calculateTargetFov = (): number => {
    const weapon = weaponStore.currentWeapon
    if (!weapon?.scope || !isScopeActive.value) {
      return finalConfig.maxFov
    }

    const magnification = weapon.scopeMultiplier || 1
    const baseFov = finalConfig.maxFov
    const calculatedFov = baseFov / magnification

    return Math.max(calculatedFov, finalConfig.minFov)
  }

  const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t
  }

  const animateFovTransition = () => {
    if (!camera.value) return

    const target = targetFov.value
    const diff = Math.abs(currentFov.value - target)

    if (diff > 0.1) {
      const speed = finalConfig.transitionDuration / 16.67
      currentFov.value = lerp(currentFov.value, target, 1 / Math.max(speed, 1))
      camera.value.fov = currentFov.value
      camera.value.updateProjectionMatrix()

      animationFrameId = requestAnimationFrame(animateFovTransition)
    } else {
      currentFov.value = target
      camera.value.fov = target
      camera.value.updateProjectionMatrix()
      isTransitioning.value = false
    }
  }

  const activateScope = () => {
    if (isScopeActive.value) return

    isScopeActive.value = true
    targetFov.value = calculateTargetFov()
    isTransitioning.value = true

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    animationFrameId = requestAnimationFrame(animateFovTransition)
  }

  const deactivateScope = () => {
    if (!isScopeActive.value) return

    isScopeActive.value = false
    targetFov.value = finalConfig.maxFov
    isTransitioning.value = true

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    animationFrameId = requestAnimationFrame(animateFovTransition)
  }

  const toggleScope = (): boolean => {
    const now = Date.now()

    if (now - lastToggleTime < finalConfig.debounceDelay) {
      return false
    }

    lastToggleTime = now
    const weapon = weaponStore.currentWeapon

    if (!weapon?.scope) {
      return false
    }

    weaponStore.toggleScope()

    return true
  }

  const handleWeaponSwitch = () => {
    const weapon = weaponStore.currentWeapon
    if (!weapon?.scope && isScopeActive.value) {
      deactivateScope()
      weaponStore.currentScope.isActive = false
    }
  }

  watch(() => weaponStore.currentScope.isActive, (newVal) => {
    if (newVal) {
      activateScope()
    } else {
      deactivateScope()
    }
  })

  watch(() => weaponStore.currentWeaponIndex, () => {
    handleWeaponSwitch()
  })

  const getSwayMultiplier = (): number => {
    return isScopeActive.value ? finalConfig.swayMultiplier : 1.0
  }

  const getBreathingSwayMultiplier = (): number => {
    return isScopeActive.value ? finalConfig.breathingSwayMultiplier : 1.0
  }

  const reset = () => {
    isScopeActive.value = false
    currentFov.value = finalConfig.maxFov
    targetFov.value = finalConfig.maxFov
    isTransitioning.value = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    if (camera.value) {
      camera.value.fov = finalConfig.maxFov
      camera.value.updateProjectionMatrix()
    }
  }

  const dispose = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  return {
    isScopeActive,
    currentFov,
    targetFov,
    isTransitioning,
    toggleScope,
    activateScope,
    deactivateScope,
    getSwayMultiplier,
    getBreathingSwayMultiplier,
    reset,
    dispose,
  }
}