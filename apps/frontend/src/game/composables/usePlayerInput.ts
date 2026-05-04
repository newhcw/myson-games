import { ref, type Ref, type ShallowRef } from 'vue'
import * as THREE from 'three'
import { InputManager } from '@/game/input/InputManager'
import { SwitchWeaponCommand, ReloadCommand, JumpCommand, CrouchCommand } from '@/game/input/Command'
import { DEFAULT_KEY_BINDINGS, type KeyBindingConfig } from '@/game/input/KeyBindings'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { soundManager } from '@/game/sound/SoundManager'
import type { ViewAngles } from './useGameContext'

export interface PlayerInputCallbacks {
  onShoot: () => void
  onJump: () => void
  onToggleCrouch: () => void
  onReload: () => void
  onToggleScope: () => void
  onPause: () => void
  onResume: () => void
  onManualSave: () => void
  onSkipIntermission: () => void
}

export function usePlayerInput(
  containerRef: Ref<HTMLDivElement | null>,
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  viewAngles: ViewAngles,
  keys: { w: boolean; a: boolean; s: boolean; d: boolean },
  isRunning: Ref<boolean>,
  waveState: Ref<string>,
  callbacks: PlayerInputCallbacks,
) {
  const weaponStore = useWeaponStore()
  const gameStore = useGameStore()
  const inputManager = new InputManager()

  const isTouchDevice = ref(false)
  const virtualMove = { x: 0, y: 0 }

  let lastTouchLookPosition: { x: number; y: number } | null = null

  // ========== Virtual control handlers ==========
  const onVirtualMove = (direction: { x: number; y: number }) => {
    virtualMove.x = direction.x
    virtualMove.y = direction.y
    keys.w = direction.y < -0.5
    keys.s = direction.y > 0.5
    keys.a = direction.x < -0.5
    keys.d = direction.x > 0.5
  }

  const onVirtualStop = () => {
    virtualMove.x = 0
    virtualMove.y = 0
    keys.w = false
    keys.s = false
    keys.a = false
    keys.d = false
  }

  const onVirtualButtonPress = (type: string) => {
    switch (type) {
      case 'shoot':
        callbacks.onShoot()
        break
      case 'jump':
        callbacks.onJump()
        break
      case 'crouch':
        callbacks.onToggleCrouch()
        break
      case 'reload':
        callbacks.onReload()
        break
      case 'scope':
        callbacks.onToggleScope()
        break
    }
  }

  const onVirtualButtonRelease = () => {
    // No-op for now
  }

  const onTouchLookStart = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    lastTouchLookPosition = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchLookMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!lastTouchLookPosition || !camera.value) return

    const touch = e.touches[0]
    const dx = touch.clientX - lastTouchLookPosition.x
    const dy = touch.clientY - lastTouchLookPosition.y
    const sensitivity = 0.005

    viewAngles.yaw -= dx * sensitivity
    viewAngles.pitch -= dy * sensitivity
    viewAngles.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, viewAngles.pitch))

    camera.value.rotation.order = 'YXZ'
    camera.value.rotation.y = viewAngles.yaw
    camera.value.rotation.x = viewAngles.pitch

    lastTouchLookPosition = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchLookEnd = (e: TouchEvent) => {
    e.preventDefault()
    lastTouchLookPosition = null
  }

  // ========== Keyboard / Mouse handlers ==========
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F9') {
      e.preventDefault()
      callbacks.onManualSave()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      if (gameStore.isPaused) {
        callbacks.onResume()
      } else if (gameStore.isPlaying) {
        callbacks.onPause()
      }
      return
    }

    if (e.key === ' ' && waveState.value === 'intermission') {
      e.preventDefault()
      callbacks.onSkipIntermission()
      return
    }

    if (document.pointerLockElement !== containerRef.value || gameStore.isPaused) return

    switch (e.key.toLowerCase()) {
      case 'w': keys.w = true; break
      case 'a': keys.a = true; break
      case 's': keys.s = true; break
      case 'd': keys.d = true; break
      case 'shift': isRunning.value = true; break
    }

    inputManager.handleKeyDown(e.key)
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'w': keys.w = false; break
      case 'a': keys.a = false; break
      case 's': keys.s = false; break
      case 'd': keys.d = false; break
    }
    inputManager.handleKeyUp(e.key)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== containerRef.value) return

    const sensitivity = 0.002
    viewAngles.yaw -= e.movementX * sensitivity
    viewAngles.pitch -= e.movementY * sensitivity
    viewAngles.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, viewAngles.pitch))

    if (camera.value) {
      camera.value.rotation.order = 'YXZ'
      camera.value.rotation.y = viewAngles.yaw
      camera.value.rotation.x = viewAngles.pitch
    }
  }

  const handleClick = async () => {
    if (!containerRef.value) return
    if (document.pointerLockElement !== containerRef.value) {
      try {
        await containerRef.value.requestPointerLock()
        soundManager.resume()
      } catch (err) {
        console.error('Failed to lock pointer:', err)
      }
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (document.pointerLockElement !== containerRef.value) return

    const savedBindings = localStorage.getItem('game-key-bindings')
    let shootKey = 'mouseleft'
    if (savedBindings) {
      try {
        const bindings = JSON.parse(savedBindings)
        shootKey = bindings['shoot'] || 'mouseleft'
      } catch { /* ignore */ }
    }

    const buttonMap: Record<string, number> = { mouseleft: 0, mouseright: 2 }
    const shootButton = buttonMap[shootKey] ?? 0

    if (e.button === shootButton) {
      callbacks.onShoot()
    }
  }

  const handleMouseUp = (_e: MouseEvent) => {
    // No-op for now
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    if (document.pointerLockElement !== containerRef.value) return

    const savedBindings = localStorage.getItem('game-key-bindings')
    let scopeKey = 'mouseright'
    if (savedBindings) {
      try {
        const bindings = JSON.parse(savedBindings)
        scopeKey = bindings['scope'] || 'mouseright'
      } catch { /* ignore */ }
    }

    if (scopeKey === 'mouseright') {
      callbacks.onToggleScope()
    }
  }

  // ========== Input mapping setup ==========
  const setupInputMappings = () => {
    const savedBindings = localStorage.getItem('game-key-bindings')
    let bindings: KeyBindingConfig
    if (savedBindings) {
      try {
        bindings = JSON.parse(savedBindings)
      } catch {
        bindings = { ...DEFAULT_KEY_BINDINGS }
      }
    } else {
      bindings = { ...DEFAULT_KEY_BINDINGS }
    }

    const getKey = (action: string): string => {
      return bindings[action] || DEFAULT_KEY_BINDINGS[action] || ''
    }

    for (let i = 1; i <= 6; i++) {
      const idx = i - 1
      inputManager.registerKey(getKey(`switch_weapon_${i}`), {
        action: `switch_weapon_${idx}`,
        commandFactory: () => new SwitchWeaponCommand(
          { value: weaponStore.currentWeaponIndex },
          idx,
          (i) => weaponStore.switchWeapon(i),
        ),
        bufferable: false,
      })
    }

    inputManager.registerKey(getKey('cycle_weapon'), {
      action: 'cycle_weapon',
      commandFactory: () => ({
        execute: () => weaponStore.cycleWeapon(),
        undo: () => weaponStore.cycleWeapon(),
      }),
      bufferable: false,
    })

    inputManager.registerKey(getKey('reload'), {
      action: 'reload',
      commandFactory: () => new ReloadCommand(() => weaponStore.reload()),
      bufferable: false,
    })

    inputManager.registerKey(getKey('run'), {
      action: 'run_toggle',
      commandFactory: (isPressed) => ({
        execute: () => { isRunning.value = isPressed },
        undo: () => { isRunning.value = !isPressed },
      }),
      bufferable: false,
    })
  }

  // ========== Lifecycle ==========
  const mount = () => {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setupInputMappings()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    containerRef.value?.addEventListener('contextmenu', handleContextMenu)
  }

  const unmount = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mouseup', handleMouseUp)
    containerRef.value?.removeEventListener('contextmenu', handleContextMenu)
  }

  const processInputBuffer = () => {
    inputManager.processInputBuffer()
  }

  return {
    isTouchDevice,
    virtualMove,
    onVirtualMove,
    onVirtualStop,
    onVirtualButtonPress,
    onVirtualButtonRelease,
    onTouchLookStart,
    onTouchLookMove,
    onTouchLookEnd,
    handleClick,
    mount,
    unmount,
    processInputBuffer,
  }
}
