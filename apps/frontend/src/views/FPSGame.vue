<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as THREE from 'three'
import SceneView from '@/components/game/SceneView.vue'
import EnemyManager from '@/components/game/EnemyManager.vue'
import { collisionDetector } from '@/game/utils/Collision'
import { useWeaponStore } from '@/stores/weapon'
import { useGameStore } from '@/stores/game'
import { DEFAULT_WEAPONS } from '@/game/weapons/types'
import { DEFAULT_KEY_BINDINGS, type KeyBindingConfig } from '@/game/input/KeyBindings'
import { soundManager } from '@/game/sound/SoundManager'
import { damageFeedback } from '@/game/ui/DamageFeedback'
import DeathScreen from '@/game/ui/DeathScreen.vue'
import { PlayerRocketManager } from '@/game/player-rocket/PlayerRocketManager'
import { RpgExplosion } from '@/game/player-rocket/RpgExplosion'
import { storageManager, type GameSaveData } from '@/game/storage/StorageManager'
import { InputManager, type KeyMapping } from '@/game/input/InputManager'
import { SwitchWeaponCommand, ReloadCommand, ToggleScopeCommand, JumpCommand, CrouchCommand } from '@/game/input/Command'
import VirtualJoystick from '@/components/game/VirtualJoystick.vue'
import VirtualButton from '@/components/game/VirtualButton.vue'
import { WaveManager, WAVE_CONFIGS, SPAWN_POINTS, INTERMISSION_DURATION, TOTAL_WAVES } from '@/game/wave/WaveManager'
import type { WaveState } from '@/game/wave/types'
import { PowerUpManager } from '@/game/powerups/PowerUpManager'
import { useBuffsStore } from '@/stores/buffs'
import VictoryScreen from '@/game/ui/VictoryScreen.vue'
import type { EnemyTypeKeyword } from '@/game/wave/types'

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const containerRef = ref<HTMLDivElement | null>(null)

// Stores
const weaponStore = useWeaponStore()
const gameStore = useGameStore()

// Three.js objects
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationId: number = 0

// Player state
const playerPosition = new THREE.Vector3(0, 1.6, 0)
const moveSpeed = 5
const keys = { w: false, a: false, s: false, d: false }

// Player actions state
const isRunning = ref(false)
const isCrouching = ref(false)
const playerHeight = ref(1.6)
const jumpVelocity = ref(0)
const isJumping = ref(false)
const gravity = -9.8

// Input manager
const inputManager = new InputManager()

// Touch device detection
const isTouchDevice = ref(false)
// Virtual joystick state
const virtualMove = { x: 0, y: 0 }

// Virtual control handlers
const onVirtualMove = (direction: { x: number; y: number }) => {
  virtualMove.x = direction.x
  virtualMove.y = direction.y

  // Convert to keys (matching updateMovement logic)
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
      isFiring.value = true
      fire()
      break
    case 'jump':
      if (!isJumping.value) {
        isJumping.value = true
        jumpVelocity.value = 5
      }
      break
    case 'crouch':
      isCrouching.value = !isCrouching.value
      playerHeight.value = isCrouching.value ? 0.8 : 1.6
      break
    case 'reload':
      weaponStore.reload()
      break
    case 'scope':
      weaponStore.toggleScope()
      break
  }
}

const onVirtualButtonRelease = (type: string) => {
  if (type === 'shoot') {
    isFiring.value = false
  }
}

// 触摸视角控制
let lastTouchLookPosition: { x: number; y: number } | null = null

const onTouchLookStart = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  lastTouchLookPosition = { x: touch.clientX, y: touch.clientY }
}

const onTouchLookMove = (e: TouchEvent) => {
  e.preventDefault()
  if (!lastTouchLookPosition || !camera) return

  const touch = e.touches[0]
  const dx = touch.clientX - lastTouchLookPosition.x
  const dy = touch.clientY - lastTouchLookPosition.y

  // 更新视角（类似鼠标移动）
  const sensitivity = 0.005
  yaw -= dx * sensitivity
  pitch -= dy * sensitivity
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))

  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch

  lastTouchLookPosition = { x: touch.clientX, y: touch.clientY }
}

const onTouchLookEnd = (e: TouchEvent) => {
  e.preventDefault()
  lastTouchLookPosition = null
}

// Shooting state
const lastFireTime = ref(0)
const isFiring = ref(false)

// Recoil state (camera shake from weapon fire)
const recoilOffset = ref({ x: 0, y: 0 })
const recoilIndex = ref(0) // Track consecutive shots for recoil pattern
const lastFireTimeForRecoil = ref(0)

// Spread state (bullet inaccuracy)
const currentSpread = ref(0)
const lastFireTimeForSpread = ref(0)

// ===== 波次系统状态 =====
let waveManager: WaveManager | null = null
let powerUpManager: PowerUpManager | null = null
const currentWave = ref(1)
const waveState = ref<WaveState>('waving')
const intermissionCountdown = ref(0)
const showVictoryScreen = ref(false)

// Buff store
const buffsStore = useBuffsStore()

// Wave HUD computed
const waveProgressText = computed(() => `第 ${currentWave.value} / ${TOTAL_WAVES} 波`)
const isBossWave = computed(() => WAVE_CONFIGS[currentWave.value - 1]?.isBossWave === true)

// Buff HUD computed
const activeBuffs = computed(() => buffsStore.getActiveBuffs)

// Breath hold (hold breath for stability)
const isHoldingBreath = ref(false)
const breathStamina = ref(100) // 0-100
const maxBreathStamina = 100
const breathConsumptionRate = 20 // per second
const breathRecoveryRate = 10 // per second
const minStaminaToStart = 10 // Minimum stamina to start holding breath

// Computed for breath bar style
const breathBarStyle = computed(() => ({
  width: breathStamina.value + '%',
}))

// Rocket manager
let rocketManager: PlayerRocketManager | null = null

// Camera shake for RPG effect
const cameraShake = ref({
  active: false,
  startTime: 0,
  duration: 0.1,
  intensity: 0.03,
  originalPositions: [] as number[],
})

// Mouse look
let yaw = 0
let pitch = 0

// View sway (aiming sway/breathing simulation)
const swayOffset = ref({ x: 0, y: 0 })
const swayTime = ref(0)
const swayAmount = 0.003 // Base sway amount (in radians)
const swaySpeed = 1.5 // Sway oscillation speed
const aimingSwayMultiplier = 0.3 // Reduced sway when aiming down sights
const breathingSway = ref({ x: 0, y: 0 })
const breathingTime = ref(0)
const breathingAmount = 0.002 // Breathing sway amount
const breathingSpeed = 0.5 // Breathing cycle speed

// Computed
const currentWeaponName = computed(() => {
  const weapon = weaponStore.currentWeapon
  return weapon?.name || '未知武器'
})

const ammoDisplay = computed(() => {
  const ammo = weaponStore.currentAmmo
  const weapon = weaponStore.currentWeapon
  if (!weapon) return '0 / 0'
  return `${ammo.current} / ${ammo.reserve}`
})

const healthPercent = computed(() => {
  return (gameStore.health / 100) * 100 // 最大血量是100
})

const isReloading = computed(() => weaponStore.isReloading)
const currentWeaponIndex = computed(() => weaponStore.currentWeaponIndex)

const onSceneReady = (
  sceneObj: THREE.Scene,
  cameraObj: THREE.PerspectiveCamera,
  rendererObj: THREE.WebGLRenderer
) => {
  scene = sceneObj
  camera = cameraObj
  renderer = rendererObj

  // 初始化火箭管理器
  rocketManager = new PlayerRocketManager()
  rocketManager.setScene(sceneObj)
  rocketManager.setOnExplosion((pos) => {
    handleRocketExplosion(pos)
  })
  // 设置敌人位置提供器：火箭飞行时检测敌人接近
  rocketManager.setEnemyProvider(() => {
    if (!enemyManagerRef.value) return []
    const enemies = enemyManagerRef.value.getActiveEnemies() || []
    return enemies.map((e: any) => ({ position: e.position, isDead: e.isDead }))
  })

  // Add some obstacles
  createObstacles()

  // ===== 初始化波次管理器 =====
  waveManager = new WaveManager()
  waveManager.setCallbacks({
    onWaveStart: (waveNumber: number) => {
      currentWave.value = waveNumber
      waveState.value = 'waving'
      intermissionCountdown.value = 0
      console.log(`第 ${waveNumber} 波开始`)
      // 生成敌人
      spawnWaveEnemies(waveNumber)
    },
    onWaveClear: (waveNumber: number) => {
      waveState.value = 'intermission'
      intermissionCountdown.value = INTERMISSION_DURATION
      console.log(`第 ${waveNumber} 波完成，进入间歇`)
    },
    onAllWavesComplete: () => {
      waveState.value = 'victory'
      showVictoryScreen.value = true
      // 强制退出暂停状态，确保 VictoryScreen 可交互
      if (gameStore.isPaused) {
        gameStore.resumeGame()
      }
      // 退出指针锁定
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
      console.log('通关！')
    },
  })

  // ===== 初始化道具管理器 =====
  powerUpManager = new PowerUpManager()
  powerUpManager.setScene(sceneObj)
  powerUpManager.setCallbacks({
    onHealthPickup: (amount: number) => {
      // 恢复生命
      const newHealth = Math.min(gameStore.maxHealth, gameStore.health + amount)
      gameStore.health = newHealth
      console.log(`恢复 ${amount} HP，当前 HP: ${newHealth}`)
    },
    onAmmoPickup: () => {
      // 补满当前武器弹药
      const weapon = weaponStore.currentWeapon
      if (!weapon) return
      const ammoData = weaponStore.ammo.get(weapon.id)
      if (ammoData) {
        ammoData.current = weapon.magazineSize
        weaponStore.ammo.set(weapon.id, { ...ammoData })
        console.log('弹药已补满')
      }
    },
    onDoubleDamagePickup: (duration: number) => {
      buffsStore.addBuff('doubleDamage', duration)
      console.log(`双倍伤害激活，持续 ${duration} 秒`)
    },
  })

  // 使用 watch 确保 EnemyManager 挂载后注册回调并开始第 1 波
  let gameStarted = false
  watch(enemyManagerRef, (mgr) => {
    if (mgr && !gameStarted) {
      gameStarted = true
      mgr.setOnEnemyKilled((enemyId: string) => {
        waveManager?.onEnemyKilled(enemyId)
      })
      mgr.setPowerUpManager(powerUpManager)
      // 开始第 1 波（此时 enemyManager 已就绪）
      waveManager?.startGame()
    }
  }, { immediate: true })

  // 检查是否需要从存档恢复游戏
  if (route.query.continue === 'true') {
    const loaded = loadSavedGame()
    if (loaded) {
      console.log('已从存档恢复游戏')
      if (gameStore.isPaused) {
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
      }
    } else {
      console.warn('存档恢复失败，开始新游戏')
    }
  }

  isLoading.value = false
}

// 按波次配置生成敌人
const spawnWaveEnemies = (waveNumber: number): void => {
  if (!enemyManagerRef.value) return
  const config = WAVE_CONFIGS[waveNumber - 1]
  if (!config) return

  // 随机选择 2-3 个刷新点
  const shuffled = [...SPAWN_POINTS].sort(() => Math.random() - 0.5)
  const pointCount = 2 + Math.floor(Math.random() * 2) // 2-3
  const selectedPoints = shuffled.slice(0, pointCount).map(
    (p) => new THREE.Vector3(p.x, 0, p.z)
  )

  const configs: { type: EnemyTypeKeyword; count: number }[] = []
  config.enemies.forEach((e) => {
    configs.push({ type: e.type, count: e.count })
  })

  const spawnedIds = enemyManagerRef.value.spawnEnemies(configs, selectedPoints)
  if (waveManager) {
    waveManager.registerEnemies(spawnedIds)
  }
}

// 敌人管理器引用（使用 ref 以便模板 ref 自动绑定）
const enemyManagerRef = ref<any>(null)

// 处理玩家被击中
const onPlayerHit = (damage: number) => {
  gameStore.takeDamage(damage)
  soundManager.playHit()
  // 显示伤害反馈
  damageFeedback.showDamageEffect(damage)
  damageFeedback.showDamageNumber(damage)
}

// 处理敌人被击杀
const onEnemyKilled = (_enemyId: string, score: number) => {
  gameStore.addKill()
  gameStore.addScore(score)
  // 暂时使用击中音效代替击杀音效
  soundManager.playHit()
}

const createObstacles = () => {
  if (!scene) return

  // 障碍物预设：类型、位置、尺寸、颜色
  const obstaclePresets = [
    // 大型障碍物（建筑/墙壁）- 100HP
    { type: 'box', size: [4, 3, 1], pos: [-12, 1.5, -8], color: 0x8B7355, castShadow: true, health: 100 },
    { type: 'box', size: [1, 3, 4], pos: [12, 1.5, -6], color: 0x8B7355, castShadow: true, health: 100 },
    { type: 'box', size: [6, 2, 1], pos: [0, 1, -15], color: 0x6B8E23, castShadow: true, health: 100 },

    // 中型立方体 - 60HP
    { type: 'box', size: [2, 2, 2], pos: [-5, 1, -5], color: 0x8B4513, castShadow: true, health: 60 },
    { type: 'box', size: [2, 2, 2], pos: [5, 1, -8], color: 0xA0522D, castShadow: true, health: 60 },
    { type: 'box', size: [2, 2, 2], pos: [-8, 1, 3], color: 0x8B4513, castShadow: true, health: 60 },
    { type: 'box', size: [2, 2, 2], pos: [8, 1, 5], color: 0xA0522D, castShadow: true, health: 60 },
    { type: 'box', size: [2, 2, 2], pos: [0, 1, -12], color: 0xCD853F, castShadow: true, health: 60 },

    // 低矮障碍物（掩体）- 60HP
    { type: 'box', size: [3, 1, 1.5], pos: [-3, 0.5, 0], color: 0x708090, castShadow: true, health: 60 },
    { type: 'box', size: [3, 1, 1.5], pos: [3, 0.5, 2], color: 0x708090, castShadow: true, health: 60 },
    { type: 'box', size: [1.5, 1, 3], pos: [0, 0.5, 5], color: 0x778899, castShadow: true, health: 60 },

    // 圆柱形障碍物 - 60HP
    { type: 'cylinder', size: [0.8, 0.8, 3, 16], pos: [-10, 1.5, 0], color: 0x4682B4, castShadow: true, health: 60 },
    { type: 'cylinder', size: [0.8, 0.8, 3, 16], pos: [10, 1.5, -2], color: 0x4682B4, castShadow: true, health: 60 },
    { type: 'cylinder', size: [1.2, 1.2, 2, 16], pos: [15, 1, 8], color: 0x5F9EA0, castShadow: true, health: 60 },

    // 小型装饰物 - 30HP
    { type: 'box', size: [1, 1, 1], pos: [-15, 0.5, 5], color: 0xDEB887, castShadow: true, health: 30 },
    { type: 'box', size: [1, 1, 1], pos: [15, 0.5, -10], color: 0xDEB887, castShadow: true, health: 30 },
    { type: 'box', size: [1.5, 0.5, 1.5], pos: [-6, 0.25, 8], color: 0x2E8B57, castShadow: false, health: 30 },
    { type: 'box', size: [1.5, 0.5, 1.5], pos: [7, 0.25, -15], color: 0x2E8B57, castShadow: false, health: 30 },

    // 中央区域障碍物 - 60HP
    { type: 'box', size: [2, 1.5, 2], pos: [-2, 0.75, -3], color: 0xB8860B, castShadow: true, health: 60 },
    { type: 'box', size: [2, 1.5, 2], pos: [2, 0.75, -4], color: 0xB8860B, castShadow: true, health: 60 },
  ]

  obstaclePresets.forEach((preset) => {
    let geometry: THREE.BufferGeometry
    if (preset.type === 'cylinder') {
      const [rTop, rBottom, height, segments] = preset.size
      geometry = new THREE.CylinderGeometry(rTop, rBottom, height, segments)
    } else {
      const [w, h, d] = preset.size
      geometry = new THREE.BoxGeometry(w, h, d)
    }

    const material = new THREE.MeshStandardMaterial({
      color: preset.color,
      roughness: 0.8,
      metalness: 0.1,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
    mesh.castShadow = preset.castShadow ?? true
    mesh.receiveShadow = true
    scene!.add(mesh)

    // 添加碰撞体（带血量，可被破坏）
    collisionDetector.addCollider(mesh, preset.health)
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  // F9键：手动存档
  if (e.key === 'F9') {
    e.preventDefault()
    manualSave()
    return
  }

  // ESC键：切换暂停
  if (e.key === 'Escape') {
    e.preventDefault()
    if (gameStore.isPaused) {
      resumeGameAndLock()
    } else if (gameStore.isPlaying) {
      pauseGameAndUnlock()
    }
    return
  }

  // 空格键：波次间歇时提前开始
  if (e.key === ' ' && waveState.value === 'intermission' && waveManager) {
    e.preventDefault()
    waveManager.skipIntermission()
    return
  }

  // Ignore if not in game or game is paused
  if (document.pointerLockElement !== containerRef.value || gameStore.isPaused) return

  // 移动按键仍然直接处理（连续输入）
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = true; break
    case 'a': keys.a = true; break
    case 's': keys.s = true; break
    case 'd': keys.d = true; break
    // Shift: 跑动
    case 'shift': isRunning.value = true; break
  }

  // 让输入管理器处理离散动作（武器切换、换弹等）
  inputManager.handleKeyDown(e.key)
}

// 设置输入管理器按键映射
const setupInputMappings = () => {
  // 加载用户自定义按键映射
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

  // 辅助函数：根据 action 获取按键
  const getKey = (action: string): string => {
    return bindings[action] || DEFAULT_KEY_BINDINGS[action] || ''
  }

  // 武器切换 (1-6)
  inputManager.registerKey(getKey('switch_weapon_1'), {
    action: 'switch_weapon_0',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      0,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  inputManager.registerKey(getKey('switch_weapon_2'), {
    action: 'switch_weapon_1',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      1,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  inputManager.registerKey(getKey('switch_weapon_3'), {
    action: 'switch_weapon_2',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      2,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  inputManager.registerKey(getKey('switch_weapon_4'), {
    action: 'switch_weapon_3',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      3,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  inputManager.registerKey(getKey('switch_weapon_5'), {
    action: 'switch_weapon_4',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      4,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  inputManager.registerKey(getKey('switch_weapon_6'), {
    action: 'switch_weapon_5',
    commandFactory: () => new SwitchWeaponCommand(
      { value: weaponStore.currentWeaponIndex },
      5,
      (idx) => weaponStore.switchWeapon(idx)
    ),
    bufferable: false,
  })

  // Q：循环切换武器
  inputManager.registerKey(getKey('cycle_weapon'), {
    action: 'cycle_weapon',
    commandFactory: () => ({
      execute: () => weaponStore.cycleWeapon(),
      undo: () => weaponStore.cycleWeapon(), // 再次切换回到上一个
    }),
    bufferable: false,
  })

  // R：换弹
  inputManager.registerKey(getKey('reload'), {
    action: 'reload',
    commandFactory: () => new ReloadCommand(
      () => weaponStore.reload()
    ),
    bufferable: false,
  })

  // Shift：跑动（按下时加速，释放时减速）
  inputManager.registerKey(getKey('run'), {
    action: 'run_toggle',
    commandFactory: (isPressed) => ({
      execute: () => { isRunning.value = isPressed },
      undo: () => { isRunning.value = !isPressed },
    }),
    bufferable: false,
  })

  // B：屏息稳定（减少后坐力和散布）
  inputManager.registerKey(getKey('hold_breath'), {
    action: 'hold_breath',
    commandFactory: (isPressed) => ({
      execute: () => {
        if (isPressed && breathStamina.value >= minStaminaToStart) {
          isHoldingBreath.value = true
        } else if (!isPressed) {
          isHoldingBreath.value = false
        }
      },
      undo: () => {
        isHoldingBreath.value = false
      },
    }),
    bufferable: false,
  })

  // Ctrl：下蹲（切换）
  inputManager.registerKey(getKey('crouch'), {
    action: 'crouch_toggle',
    commandFactory: (isPressed) => new CrouchCommand(
      { value: playerHeight.value },
      isCrouching.value ? 1.6 : 0.8
    ),
    bufferable: false,
  })

  // Space：跳跃
  inputManager.registerKey(getKey('jump'), {
    action: 'jump',
    commandFactory: () => new JumpCommand(
      playerPosition,
      1.5
    ),
    bufferable: true,
  })

  console.log('Input mappings initialized:', inputManager.getRegisteredKeys())
}

// 暂停游戏并退出指针锁定
const pauseGameAndUnlock = () => {
  gameStore.pauseGame()
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  soundManager.playScope() // 使用现有的音效
}

// 恢复游戏并重新锁定指针
const resumeGameAndLock = async () => {
  gameStore.resumeGame()
  if (containerRef.value) {
    try {
      await containerRef.value.requestPointerLock()
    } catch (err) {
      console.error('Failed to lock pointer:', err)
    }
  }
  soundManager.playScope()
}

const handleKeyUp = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = false; break
    case 'a': keys.a = false; break
    case 's': keys.s = false; break
    case 'd': keys.d = false; break
  }

  // 让输入管理器处理离散动作
  inputManager.handleKeyUp(e.key)
}

const handleMouseMove = (e: MouseEvent) => {
  if (document.pointerLockElement !== containerRef.value) return

  const sensitivity = 0.002
  yaw -= e.movementX * sensitivity
  pitch -= e.movementY * sensitivity
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))

  if (camera) {
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }
}

const handleClick = async () => {
  if (!containerRef.value) return

  // First click: lock pointer
  if (document.pointerLockElement !== containerRef.value) {
    try {
      await containerRef.value.requestPointerLock()
      // Initialize audio context on user interaction
      soundManager.resume()
    } catch (err) {
      console.error('Failed to lock pointer:', err)
    }
  }
}

// Handle mouse down for shooting
const handleMouseDown = (e: MouseEvent) => {
  if (document.pointerLockElement !== containerRef.value) return

  // 从按键映射读取射击键配置
  const savedBindings = localStorage.getItem('game-key-bindings')
  let shootKey = 'mouseleft'
  if (savedBindings) {
    try {
      const bindings = JSON.parse(savedBindings)
      shootKey = bindings['shoot'] || 'mouseleft'
    } catch {}
  }

  // 映射鼠标按钮：mouseleft → 0, mouseright → 2
  const buttonMap: Record<string, number> = { mouseleft: 0, mouseright: 2 }
  const shootButton = buttonMap[shootKey] ?? 0

  if (e.button === shootButton) {
    isFiring.value = true
    fire()
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (e.button === 0) {
    isFiring.value = false
  }
}

// Handle right click for scope
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  if (document.pointerLockElement !== containerRef.value) return

  // 从按键映射读取瞄准键配置
  const savedBindings = localStorage.getItem('game-key-bindings')
  let scopeKey = 'mouseright'
  if (savedBindings) {
    try {
      const bindings = JSON.parse(savedBindings)
      scopeKey = bindings['scope'] || 'mouseright'
    } catch {}
  }

  // 只有配置为鼠标右键时才执行
  if (scopeKey === 'mouseright') {
    weaponStore.toggleScope()
  }
}

// Fire weapon
const fire = () => {
  const weapon = weaponStore.currentWeapon
  if (!weapon) return

  const now = Date.now()
  // Check fire rate
  const fireInterval = 1000 / weapon.fireRate
  if (now - lastFireTime.value < fireInterval) return
  lastFireTime.value = now

  const ammo = weaponStore.currentAmmo

  // Check if has ammo
  if (ammo.current <= 0 || weaponStore.isReloading) {
    // Play empty click sound
    soundManager.playEmpty()
    return
  }

  // Attempt to fire (checks ammo and reload state)
  const fired = weaponStore.fire()
  if (fired) {
    // Apply recoil
    applyRecoil(weapon)

    // RPG 武器：发射火箭弹道
    if (weapon.type === 'rpg') {
      fireRocket()
      // 屏幕震动效果
      startCameraShake(0.1, 0.03)
    } else {
      // Perform raycast to check for enemy hits (with spread)
      performRaycast()
    }
    // Play fire sound
    soundManager.playShoot()
  } else {
    // Play empty click if no ammo
    soundManager.playEmpty()
  }
}

// Apply weapon recoil to camera
const applyRecoil = (weapon: any) => {
  if (!camera) return

  // Get recoil pattern (cycle through pattern array)
  const pattern = weapon.recoilPattern || [{ x: 0, y: -0.5 }]
  const patternIndex = recoilIndex.value % pattern.length
  const recoil = pattern[patternIndex]

  // Calculate recoil multiplier (breath hold reduces recoil)
  let recoilMultiplier = 1.0
  if (isHoldingBreath.value && breathStamina.value > 0) {
    recoilMultiplier = 0.3 // 70% reduction when holding breath
  }

  // Apply recoil offset (scaled by recoilAmount and breath hold)
  recoilOffset.value.x += recoil.x * weapon.recoilAmount * recoilMultiplier
  recoilOffset.value.y += recoil.y * weapon.recoilAmount * recoilMultiplier

  // Clamp recoil offset
  recoilOffset.value.x = Math.max(-0.5, Math.min(0.5, recoilOffset.value.x))
  recoilOffset.value.y = Math.max(-1.0, Math.min(0.2, recoilOffset.value.y))

  // Update recoil index for next shot
  recoilIndex.value++

  // Apply to camera (pitch and yaw)
  yaw += recoilOffset.value.x * 0.01
  pitch += recoilOffset.value.y * 0.01
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))

  if (camera) {
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }

  // Increase spread
  currentSpread.value = Math.min(weapon.spread, currentSpread.value + weapon.spread * 0.3)
  lastFireTimeForRecoil.value = Date.now()
  lastFireTimeForSpread.value = Date.now()
}

// RPG 火箭发射
const fireRocket = () => {
  if (!camera || !scene || !rocketManager) return

  // 获取发射方向（相机朝向）
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const origin = camera.position.clone()

  // 略微抬高发射起点（火箭从胸口位置发射）
  origin.y -= 0.1

  rocketManager.spawn({
    origin,
    direction,
    speed: 650,
  })
}

// 屏幕震动效果
const startCameraShake = (duration = 0.1, intensity = 0.03) => {
  if (!camera) return
  cameraShake.value = {
    active: true,
    startTime: Date.now(),
    duration,
    intensity,
    originalPositions: [camera.position.x, camera.position.y, camera.position.z],
  }
}

// 游戏循环中更新相机震动位置
const updateCameraForShake = () => {
  if (!camera || !cameraShake.value.active) return false

  const now = Date.now()
  const shake = cameraShake.value
  const elapsed = (now - shake.startTime) / 1000

  if (elapsed >= shake.duration) {
    cameraShake.value.active = false
    camera.position.set(
      shake.originalPositions[0],
      shake.originalPositions[1],
      shake.originalPositions[2]
    )
    return false
  }

  const progress = elapsed / shake.duration
  // 震动强度随时间减弱
  const currentIntensity = shake.intensity * (1 - progress)
  // 生成随机偏移
  const offsetX = (Math.random() - 0.5) * 2 * currentIntensity
  const offsetY = (Math.random() - 0.5) * 2 * currentIntensity * 0.5 // 垂直偏移较小

  camera.position.set(
    shake.originalPositions[0] + offsetX,
    shake.originalPositions[1] + offsetY,
    shake.originalPositions[2]
  )

  return true
}

// RPG 爆炸特效文字（BOOM!）
const showRpgBoomEffect = (position: THREE.Vector3) => {
  if (!camera) return

  const vector = position.clone().project(camera)
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth
  const y = (-vector.y * 0.5 + 0.5) * window.innerHeight

  const boom = document.createElement('div')
  boom.textContent = 'BOOM!'
  boom.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: #FF4444;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 30px rgba(255,68,68,0.8);
    z-index: 1002;
    pointer-events: none;
    font-family: Arial, sans-serif;
    animation: boomEffect 1s ease-out forwards;
  `

  if (!document.getElementById('boom-animation')) {
    const style = document.createElement('style')
    style.id = 'boom-animation'
    style.textContent = `
      @keyframes boomEffect {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.5) rotate(5deg); }
        40% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) translateY(-50px); }
      }
    `
    document.head.appendChild(style)
  }

  const container = document.getElementById('game-ui') || document.body
  container.appendChild(boom)

  setTimeout(() => boom.remove(), 1000)
}

// 诊断：最近一次 RPG 爆炸信息
let lastRpgExplosion: { x: number; z: number; enemiesInRange: number; totalEnemies: number } | null = null

// RPG 火箭爆炸处理（AOE 伤害 + 弹飞效果）
const handleRocketExplosion = (position: THREE.Vector3) => {
  if (!enemyManagerRef.value || !scene) {
    console.warn('handleRocketExplosion: enemyManagerRef or scene is null', !!enemyManagerRef.value, !!scene)
    return
  }

  // 显示RPG爆炸特效
  showRpgBoomEffect(position)

  const radius = 20
  const maxDamage = 150
  const minDamage = 50

  // 获取所有活跃敌人
  const enemies = enemyManagerRef.value.getActiveEnemies() || []
  let enemiesInRange = 0

  for (const enemy of enemies) {
    if (enemy.isDead) continue

    // 计算敌人与爆炸中心的距离（xz 平面）
    const dx = enemy.position.x - position.x
    const dz = enemy.position.z - position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist <= radius) {
      enemiesInRange++
      // 线性衰减伤害
      const damage = Math.round(maxDamage - (dist / radius) * (maxDamage - minDamage))
      const finalDamage = Math.max(minDamage, Math.min(maxDamage, damage))

      // 应用伤害
      enemyManagerRef.value?.onEnemyHit(enemy.id, finalDamage)

      // 弹飞效果
      if (enemy.mesh) {
        // 爆炸后稍延迟弹飞（让爆炸特效先出现）
        setTimeout(() => {
          if (enemy.mesh) {
            RpgExplosion.createKnockback(enemy.mesh, enemy.isDead)
          }
        }, 50)
      }
    } else if (enemy.mesh) {
      // 范围外但靠近的敌人也轻微弹飞（纯视觉效果）
      const knockDist = radius + 1
      if (dist <= knockDist && !enemy.isDead) {
        setTimeout(() => {
          if (enemy.mesh) {
            RpgExplosion.createKnockback(enemy.mesh, false)
          }
        }, 80)
      }
    }
  }

  // 记录诊断信息
  lastRpgExplosion = {
    x: position.x,
    z: position.z,
    enemiesInRange,
    totalEnemies: enemies.length,
  }
}

// 射击检测
const performRaycast = () => {
  if (!camera || !scene) return

  // Apply spread to aim point (breath hold reduces spread)
  let spread = currentSpread.value
  if (isHoldingBreath.value && breathStamina.value > 0) {
    spread *= 0.2 // 80% reduction when holding breath
  }
  const spreadRad = (spread * Math.PI) / 180
  const randomAngle = Math.random() * Math.PI * 2
  const randomRadius = Math.random() * spreadRad
  const offsetX = Math.cos(randomAngle) * randomRadius
  const offsetY = Math.sin(randomAngle) * randomRadius

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(offsetX, offsetY), camera)

  // 检测场景中的敌人
  const enemyGroup = scene.getObjectByName('enemies')
  if (enemyGroup && enemyManagerRef.value) {
    const intersects = raycaster.intersectObjects(enemyGroup.children, true)

    // 找到第一个命中的敌人
    for (const intersect of intersects) {
      // 找到敌人的根对象
      let object: THREE.Object3D | null = intersect.object
      while (object && object.parent !== enemyGroup) {
        object = object.parent
      }

      if (object && object.userData) {
        // 检查是否是敌人
        const enemy = enemyManagerRef.value?.getActiveEnemies().find((e: any) => e.mesh === object)
        if (enemy && !enemy.isDead) {
          let damage = weaponStore.currentWeapon?.damage || 10
          // 双倍伤害 Buff
          if (buffsStore.hasBuff('doubleDamage')) {
            damage *= 2
          }
          enemyManagerRef.value?.onEnemyHit(enemy.id, damage)

          // 播放击中特效
          createHitEffect(intersect.point)
          break
        }
      }
    }
  }
}

// 创建击中特效
const createHitEffect = (position: THREE.Vector3) => {
  if (!scene) return

  // 创建粒子效果
  const particles = new THREE.Group()
  const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })

  for (let i = 0; i < 10; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone())
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    )

    particles.add(particle)

    // 动画
    const animate = () => {
      particle.position.add(velocity.clone().multiplyScalar(0.05))
      velocity.multiplyScalar(0.95) // 减速

      if (velocity.length() > 0.01) {
        requestAnimationFrame(animate)
      } else {
        particles.remove(particle)
        particle.geometry.dispose()
        ;(particle.material as THREE.Material).dispose()
      }
    }

    animate()
  }

  scene.add(particles)

  // 1秒后自动清理
  setTimeout(() => {
    scene?.remove(particles)
    particles.clear()
  }, 1000)
}

// Auto fire while holding
const updateAutoFire = (delta: number) => {
  if (!isFiring.value) return

  const weapon = weaponStore.currentWeapon
  if (!weapon || !weapon.isAuto) return

  // Keep TypeScript happy
  void delta

  const now = Date.now()
  const fireInterval = 1000 / weapon.fireRate
  if (now - lastFireTime.value >= fireInterval) {
    fire()
  }
}

// Update recoil recovery
const updateRecoilRecovery = (delta: number) => {
  const weapon = weaponStore.currentWeapon
  if (!weapon) return

  const now = Date.now()

  // Recoil recovery
  if (recoilOffset.value.x !== 0 || recoilOffset.value.y !== 0) {
    const recovery = weapon.recoilRecovery * delta
    recoilOffset.value.x *= (1 - recovery)
    recoilOffset.value.y *= (1 - recovery)

    // Snap to zero if very small
    if (Math.abs(recoilOffset.value.x) < 0.001) recoilOffset.value.x = 0
    if (Math.abs(recoilOffset.value.y) < 0.001) recoilOffset.value.y = 0
  }

  // Spread recovery
  if (currentSpread.value > 0) {
    const spreadRecovery = weapon.spreadRecovery * delta
    currentSpread.value *= (1 - spreadRecovery)

    // Snap to zero if very small
    if (currentSpread.value < 0.01) currentSpread.value = 0
  }

  // Reset recoil pattern index if not fired for a while
  if (now - lastFireTimeForRecoil.value > 1000) {
    recoilIndex.value = 0
  }

  // Breath stamina management
  if (isHoldingBreath.value && breathStamina.value > 0) {
    // Consume stamina
    breathStamina.value -= breathConsumptionRate * delta
    if (breathStamina.value <= 0) {
      breathStamina.value = 0
      isHoldingBreath.value = false
    }
  } else {
    // Recover stamina when not holding breath
    if (breathStamina.value < maxBreathStamina) {
      breathStamina.value += breathRecoveryRate * delta
      if (breathStamina.value > maxBreathStamina) {
        breathStamina.value = maxBreathStamina
      }
    }
  }
}

// Update view sway (aiming sway / breathing simulation)
const updateSway = (delta: number) => {
  if (!camera) return

  // Check if aiming (scope active or holding breath)
  const isAiming = weaponStore.currentScope.isActive || isHoldingBreath.value
  const multiplier = isAiming ? aimingSwayMultiplier : 1.0

  // Update sway time
  swayTime.value += delta * swaySpeed
  breathingTime.value += delta * breathingSpeed

  // Calculate sway offset (figure-8 pattern using sin/cos)
  const swayX = Math.sin(swayTime.value) * swayAmount * multiplier
  const swayY = Math.sin(swayTime.value * 0.7) * swayAmount * 0.5 * multiplier

  swayOffset.value = { x: swayX, y: swayY }

  // Calculate breathing sway (subtle vertical movement)
  const breathY = Math.sin(breathingTime.value) * breathingAmount * multiplier
  const breathX = Math.sin(breathingTime.value * 0.5) * breathingAmount * 0.3 * multiplier
  breathingSway.value = { x: breathX, y: breathY }

  // Apply sway to camera (add to yaw and pitch)
  const baseYaw = yaw
  const basePitch = pitch
  yaw = baseYaw + swayOffset.value.x + breathingSway.value.x
  pitch = basePitch + swayOffset.value.y + breathingSway.value.y

  // Clamp pitch
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))

  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch
}

const updateMovement = (delta: number) => {
  if (!camera) return

  const direction = new THREE.Vector3()

  if (keys.w) direction.z -= 1
  if (keys.s) direction.z += 1
  if (keys.a) direction.x -= 1
  if (keys.d) direction.x += 1

  // 计算实际速度（考虑跑动和下蹲）
  let speed = moveSpeed
  if (isRunning.value) speed *= 1.5  // 跑动加速
  if (isCrouching.value) speed *= 0.5  // 下蹲减速

  if (direction.length() > 0) {
    direction.normalize()
    direction.applyQuaternion(camera.quaternion)
    direction.y = 0
    direction.normalize()

    // 在移动前保存当前位置
    const newPosition = playerPosition.clone()
    newPosition.x += direction.x * speed * delta
    newPosition.z += direction.z * speed * delta

    // 检查移动后的新位置是否与障碍物发生碰撞
    if (!collisionDetector.checkCollision(newPosition)) {
      playerPosition.copy(newPosition)
    }
  }

  // 跳跃物理
  if (isJumping.value) {
    jumpVelocity.value += gravity * delta
    playerPosition.y += jumpVelocity.value * delta

    // 落地检测
    if (playerPosition.y <= playerHeight.value) {
      playerPosition.y = playerHeight.value
      isJumping.value = false
      jumpVelocity.value = 0
    }
  }

  // 更新相机位置（使用玩家高度）
  camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z)
}

let lastTime = performance.now()

const gameLoop = () => {
  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  // 死亡或暂停时暂停所有游戏更新，只保持渲染
  if (!gameStore.isDead && !gameStore.isPaused) {
    // 处理输入缓冲
    inputManager.processInputBuffer()

    updateMovement(delta)
    updateAutoFire(delta)
    updateRecoilRecovery(delta)
    updateSway(delta)

    // 更新敌人管理器
    if (enemyManagerRef.value) {
      enemyManagerRef.value?.update(delta)
    }

    // 更新火箭管理器
    if (rocketManager) {
      rocketManager.update(delta, playerPosition)
    }

    // 更新道具管理器
    if (powerUpManager) {
      powerUpManager.update(delta, performance.now() / 1000)
    }

    // 更新波次管理器（间歇倒计时）
    if (waveManager) {
      waveManager.update(delta)
      // 同步间歇倒计时到 HUD
      if (waveState.value === 'intermission') {
        intermissionCountdown.value = waveManager.getIntermissionRemaining()
      }
    }

    // 更新屏幕震动
    if (cameraShake.value.active) {
      updateCameraForShake()
    }

    // Update scope FOV
    if (camera && weaponStore.currentScope.isActive) {
      const targetFov = weaponStore.currentScope.originalFov / weaponStore.currentScope.magnification
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1)
      camera.updateProjectionMatrix()
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }

  animationId = requestAnimationFrame(gameLoop)
}

const exitGame = () => {
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  // 自动存档
  saveCurrentGame()
  router.push({ name: 'Home' })
}

// 保存当前游戏状态
const saveCurrentGame = () => {
  if (!gameStore.isPlaying && !gameStore.isPaused) return

  const saveData: GameSaveData = {
    timestamp: Date.now(),
    player: {
      health: gameStore.health,
      position: { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z },
      rotation: { yaw, pitch },
    },
    game: {
      score: gameStore.score,
      kills: gameStore.kills,
      gameTime: gameStore.gameTime,
      state: gameStore.gameState,
    },
    weapon: {
      currentIndex: weaponStore.currentWeaponIndex,
      ammo: Object.fromEntries(weaponStore.ammo) as Record<string, { current: number; reserve: number }>,
    },
  }

  storageManager.saveGame(saveData).then((success) => {
    if (success) {
      console.log('游戏已自动存档')
    }
  })
}

// 手动存档（F5键）
const manualSave = () => {
  saveCurrentGame()
  // 显示存档提示
  alert('游戏已存档！')
}

// 从存档恢复游戏状态
const loadSavedGame = (): boolean => {
  const saveData = storageManager.loadGame()
  if (!saveData) {
    console.warn('没有找到存档')
    return false
  }

  console.log('正在从存档恢复游戏...', saveData)

  // 恢复玩家状态
  gameStore.health = saveData.player.health
  playerPosition.set(
    saveData.player.position.x,
    saveData.player.position.y,
    saveData.player.position.z
  )
  yaw = saveData.player.rotation.yaw
  pitch = saveData.player.rotation.pitch

  // 恢复相机位置和旋转
  if (camera) {
    camera.position.copy(playerPosition)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }

  // 恢复游戏状态
  gameStore.score = saveData.game.score
  gameStore.kills = saveData.game.kills
  gameStore.gameTime = saveData.game.gameTime

  // 恢复游戏状态（如果之前是暂停状态，需要暂停游戏）
  if (saveData.game.state === 'paused') {
    gameStore.gameState = 'paused'
  } else if (saveData.game.state === 'playing') {
    gameStore.gameState = 'playing'
  }

  // 恢复武器状态
  weaponStore.switchWeapon(saveData.weapon.currentIndex)

  // 恢复弹药状态
  // 注意：这里需要直接修改 weaponStore 的内部状态
  // 为了简化，我们重新加载弹药数据
  if (saveData.weapon.ammo) {
    Object.entries(saveData.weapon.ammo).forEach(([key, value]) => {
      const ammoData = weaponStore.ammo.get(key)
      if (ammoData && value) {
        ammoData.current = value.current
        ammoData.reserve = value.reserve
      }
    })
  }

  console.log('游戏已从存档恢复')
  return true
}

// 死亡界面相关
const showDeathScreen = computed(() => gameStore.isDead)

const onRestart = () => {
  // 重置游戏状态
  gameStore.fullReset()
  // 重置玩家位置
  playerPosition.set(0, 1.6, 0)
  // 重置视角
  yaw = 0
  pitch = 0
  if (camera) {
    camera.rotation.set(0, 0, 0)
  }
  // 清理飞行中的火箭
  rocketManager?.clear()
  // 重置敌人系统（清理 + 重新生成）
  enemyManagerRef.value?.reset()
  // 重置所有武器弹药
  weaponStore.resetAmmo()
  // 清理道具和 Buff
  powerUpManager?.dispose()
  buffsStore.clearAll()
  // 隐藏通关界面
  showVictoryScreen.value = false
  // 重置波次管理器
  waveManager?.reset()
  // 重置时间基准，避免首帧 delta 过大
  lastTime = performance.now()
}

const onGoHome = () => {
  exitGame()
}

// 通关界面按钮
const onVictoryRestart = () => {
  showVictoryScreen.value = false
  // 确保退出暂停状态
  if (gameStore.isPaused) {
    gameStore.resumeGame()
  }
  onRestart()
  // 重新锁定指针
  if (containerRef.value) {
    containerRef.value.requestPointerLock().catch(() => {})
  }
}

const onVictoryGoHome = () => {
  showVictoryScreen.value = false
  // 保存得分
  saveCurrentGame()
  // 退出到主页
  router.push({ name: 'Home' })
}

// Track previous states for sound effects
let previousReloadState = false
let previousScopeActive = false

// Watch reload state to play sound
watch(isReloading, (newVal) => {
  if (newVal === true && previousReloadState === false) {
    // Started reloading
    soundManager.playReload()
  }
  previousReloadState = newVal
})

// Watch scope state to play sound
watch(() => weaponStore.currentScope.isActive, (newVal) => {
  if (newVal !== previousScopeActive) {
    soundManager.playScope()
    previousScopeActive = newVal
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  containerRef.value?.addEventListener('contextmenu', handleContextMenu)

  // 检测触摸设备
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // 初始化输入管理器按键映射
  setupInputMappings()

  // Start game loop after a brief delay to ensure scene is loaded
  setTimeout(() => {
    lastTime = performance.now() // 重置时间基准，避免首帧 delta 过大
    gameLoop()
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  containerRef.value?.removeEventListener('contextmenu', handleContextMenu)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.dispose()
  }

  // 清理火箭管理器
  rocketManager?.clear()

  // 清理波次管理器和道具管理器
  waveManager?.dispose()
  powerUpManager?.dispose()
})


// ==============================================
// 👇 👇 👇 从这里开始复制，全部粘贴进去 👇 👇 👇
// ==============================================
// ==============================================
// 修复版：无 process.env，直接兼容你的项目
// ==============================================
onMounted(() => {
  // @ts-ignore 挂载全局测试 API
  window.__testApi = {
    // 获取所有活跃敌人
    getEnemies: () => {
      if (!enemyManagerRef.value) return []
      return enemyManagerRef.value.getActiveEnemies() || []
    },

    // 射击指定索引敌人
    shootEnemy: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false

      // 造成大量伤害，直接击杀
      enemyManagerRef.value.onEnemyHit(enemy.id, 999)
      return true
    },

    // 手动触发敌人受伤效果
    hitEnemy: (index: number, damage: number = 10) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return false

      enemyManagerRef.value.onEnemyHit(enemy.id, damage)
      return true
    },

    // 获取血条数量（通过 EnemyAI）
    getHealthBars: () => {
      if (!enemyManagerRef.value) return []
      const count = enemyManagerRef.value.getHealthBarCount()
      // 返回虚拟数组以兼容现有测试
      return Array.from({ length: count }, (_, i) => ({ index: i }))
    },

    // 将玩家传送到指定敌人前方（确保敌人能看到玩家）
    movePlayerToEnemy: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false

      // 计算敌人朝向的反方向（即玩家应该站的位置）
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        playerPosition.set(
          enemy.position.x - forward.x * 3,
          playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      } else {
        playerPosition.set(enemy.position.x + 3, playerPosition.y, enemy.position.z)
      }
      return true
    },

    // 对玩家造成伤害
    takePlayerDamage: (amount: number) => {
      gameStore.takeDamage(amount)
    },

    // 获取玩家血量
    getPlayerHealth: () => {
      return gameStore.health
    },

    // 获取游戏状态
    getGameState: () => {
      return gameStore.gameState
    },

    // 重新开始游戏
    restartGame: () => {
      onRestart()
    },

    // ===== 弹道投射物系统测试 API =====

    // 获取活跃子弹数量
    getActiveProjectileCount: () => {
      if (!enemyManagerRef.value) return 0
      return enemyManagerRef.value.getActiveProjectileCount?.() || 0
    },

    // 获取敌人蓄力状态
    getEnemyChargeState: (index: number) => {
      if (!enemyManagerRef.value) return null
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy) return null
      return {
        isCharging: enemy.isCharging,
        hasChargeLine: enemy.chargeLine !== null,
      }
    },

    // 将玩家移动到指定索引敌人正面（别名，兼容旧调用）
    movePlayerToEnemyFront: (index: number) => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.position) return false
      if (enemy.mesh) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion)
        playerPosition.set(
          enemy.position.x - forward.x * 3,
          playerPosition.y,
          enemy.position.z - forward.z * 3
        )
      }
      return true
    },

    // 获取敌人类型
    getEnemyType: (index: number) => {
      if (!enemyManagerRef.value) return null
      const enemies = enemyManagerRef.value.getActiveEnemies()
      const enemy = enemies[index]
      if (!enemy || !enemy.config) return null
      return enemy.config.type
    },

    // 强制所有敌人面向玩家（用于测试，确保敌人能发现并攻击玩家）
    forceEnemiesToFacePlayer: () => {
      if (!enemyManagerRef.value) return false
      const enemies = enemyManagerRef.value.getActiveEnemies()
      enemies.forEach((enemy: any) => {
        if (enemy.mesh && !enemy.isDead) {
          enemy.mesh.lookAt(playerPosition.x, enemy.mesh.position.y, playerPosition.z)
          // 强制进入攻击状态
          if (enemy.state === 'patrol' || enemy.state === 'wait') {
            enemy.state = 'chase'
          }
        }
      })
      return true
    },

    // 生成测试敌人（指定类型，生成在玩家附近）
    spawnTestEnemy: (type: string) => {
      if (!enemyManagerRef.value) return -1
      const pos = playerPosition.clone().add(new THREE.Vector3(5, 0, 0))
      const enemy = enemyManagerRef.value.spawnTestEnemy(type, pos)
      if (enemy && enemy.mesh) {
        enemy.mesh.lookAt(playerPosition.x, enemy.mesh.position.y, playerPosition.z)
        enemy.state = 'chase'
      }
      const enemies = enemyManagerRef.value.getActiveEnemies()
      return enemies.findIndex((e: any) => e.id === enemy.id)
    },

    // ===== RPG 武器测试 API =====

    // 切换到 RPG 武器（索引 5）
    switchToRpg: () => {
      weaponStore.switchWeapon(5)
      return true
    },

    // 获取当前武器类型
    getCurrentWeaponType: () => {
      return weaponStore.currentWeapon?.type || null
    },

    // 获取 RPG 弹药状态
    getRpgAmmo: () => {
      const ammoData = weaponStore.ammo.get('rpg')
      if (!ammoData) return null
      return { current: ammoData.current, reserve: ammoData.reserve }
    },

    // 获取活跃火箭数量
    getActiveRocketCount: () => {
      return rocketManager?.getActiveRockets?.()?.length ?? 0
    },

    // 获取血条屏幕坐标（用于验证血条不重叠）
    getHealthBarPositions: () => {
      const bars: { id: string; x: number; y: number }[] = []
      const container = document.getElementById('game-ui')
      if (!container) return bars
      const children = container.querySelectorAll('div[style*="position: absolute"]')
      children.forEach((child) => {
        const div = child as HTMLDivElement
        if (div.style.display === 'none') return
        const left = parseFloat(div.style.left)
        const top = parseFloat(div.style.top)
        if (!isNaN(left) && !isNaN(top)) {
          bars.push({ id: div.textContent || '', x: left, y: top })
        }
      })
      return bars
    },

    // 手动触发火箭爆炸（用于测试 AOE 效果）
    triggerRpgExplosion: (x: number, z: number) => {
      if (!scene) return false
      handleRocketExplosion(new THREE.Vector3(x, 0, z))
      return true
    },

    // 实际发射 RPG 火箭（消耗弹药并调用 fireRocket）
    fireRpgMissile: () => {
      if (!camera || !rocketManager) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      fireRocket()
      return true
    },

    // 朝指定目标坐标发射火箭（直接计算方向，不依赖相机朝向）
    fireRpgToward: (x: number, z: number) => {
      if (!camera || !rocketManager) return false
      const fired = weaponStore.fire()
      if (!fired) return false
      const origin = camera.position.clone()
      origin.y -= 0.1
      const dx = x - origin.x
      const dz = z - origin.z
      const direction = new THREE.Vector3(dx, 0, dz).normalize()
      rocketManager.spawn({ origin, direction, speed: 650 })
      return true
    },

    // 设置相机朝向（让相机看向指定世界坐标）
    lookAtTarget: (x: number, z: number) => {
      if (!camera) return false
      const dx = x - camera.position.x
      const dz = z - camera.position.z
      // 使用 setFromUnitVectors 从默认前方向量(0,0,-1)旋转到目标方向
      const targetDir = new THREE.Vector3(dx, 0, dz).normalize()
      const defaultForward = new THREE.Vector3(0, 0, -1)
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultForward, targetDir)
      camera.quaternion.copy(quat)
      // 同步 yaw
      yaw = Math.atan2(targetDir.x, -targetDir.z)
      return true
    },

    // 获取玩家位置
    getPlayerPosition: () => {
      return { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z }
    },

    // 等待火箭爆炸完成（轮询直到所有火箭消失或超时）
    waitForRocketExplosion: (timeoutMs: number = 5000) => {
      return new Promise((resolve) => {
        const startTime = Date.now()
        const check = () => {
          const rockets = rocketManager?.getActiveRockets() || []
          if (rockets.length === 0 || Date.now() - startTime >= timeoutMs) {
            const enemies = enemyManagerRef.value?.getActiveEnemies() || []
            resolve({
              exploded: rockets.length === 0,
              remainingEnemies: enemies.length,
              elapsed: Date.now() - startTime,
              // 包含爆炸诊断信息
              explosion: lastRpgExplosion ? { ...lastRpgExplosion } : null,
            })
            return
          }
          requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })
    },

    // ===== 波次系统测试 API =====

    // 获取当前波次
    getCurrentWave: () => {
      return waveManager?.getCurrentWave() ?? 1
    },

    // 获取波次状态
    getWaveState: () => {
      return waveManager?.getState() ?? 'waving'
    },

    // 跳过间歇
    skipIntermission: () => {
      waveManager?.skipIntermission()
    },

    // 获取活跃道具数量
    getPowerUpCount: () => {
      return powerUpManager?.getActiveCount() ?? 0
    },

    // 获取 Buff 状态
    hasBuff: (type: string) => {
      return buffsStore.hasBuff(type)
    },

  }
})


</script>

<template>
  <div
    ref="containerRef"
    class="game-room"
    @click="handleClick"
  >
    <!-- Loading 界面 -->
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner">🎮</div>
      <p>游戏加载中...</p>
    </div>

    <!-- 3D 游戏场景 -->
    <SceneView
      v-show="!isLoading"
      @scene-ready="onSceneReady"
    />

    <!-- 敌人管理器 -->
    <EnemyManager
      v-if="!isLoading && scene && camera"
      :scene="scene"
      :camera="camera"
      :player-position="playerPosition"
      :player-health="gameStore.health"
      ref="enemyManagerRef"
      @player-hit="onPlayerHit"
      @enemy-killed="onEnemyKilled"
    />

    <!-- HUD -->
    <div v-if="!isLoading" class="hud">
      <div class="hud-top">
        <div class="health-bar">
          <span class="label">生命值</span>
          <div class="bar">
            <div
              class="fill"
              :class="{
                warning: healthPercent <= 50 && healthPercent > 20,
                danger: healthPercent <= 20
              }"
              :style="{ width: healthPercent + '%' }"
            ></div>
          </div>
        </div>
        <div class="score">
          <span>得分: {{ gameStore.score }}</span>
          <span class="kills">击杀: {{ gameStore.kills }}</span>
        </div>
        <!-- 屏息体力条 -->
        <div v-if="breathStamina < maxBreathStamina" class="breath-bar">
          <div class="breath-fill" :style="breathBarStyle" :class="{ low: breathStamina < 20 }"></div>
          <span class="breath-label" v-if="isHoldingBreath">屏息中...</span>
        </div>
      </div>

      <!-- 波次显示 -->
      <div class="wave-display" :class="{ 'boss-wave': isBossWave }">
        <span class="wave-icon">{{ isBossWave ? '👑' : '⚔️' }}</span>
        <span class="wave-text">{{ waveProgressText }}</span>
      </div>

      <!-- Buff 状态图标 -->
      <div v-if="activeBuffs.length > 0" class="buff-bar">
        <div
          v-for="buff in activeBuffs"
          :key="buff.type"
          class="buff-icon"
          :data-buff-type="buff.type"
        >
          <span class="buff-emoji">{{ buff.type === 'doubleDamage' ? '⚡' : '✨' }}</span>
          <span class="buff-timer">{{ buffsStore.getBuffRemaining(buff.type) }}s</span>
        </div>
      </div>

      <!-- 波次间歇倒计时 -->
      <transition name="wave-countdown">
        <div v-if="waveState === 'intermission'" class="wave-intermission">
          <div class="intermission-content">
            <div class="intermission-label">第 {{ currentWave + 1 }} 波即将开始</div>
            <div class="intermission-countdown">{{ Math.ceil(intermissionCountdown) }}</div>
            <div class="intermission-hint">按 空格键 跳过</div>
          </div>
        </div>
      </transition>

      <!-- Crosshair -->
      <div class="crosshair" :class="{ 'scope-active': weaponStore.currentScope.isActive }">
        <span v-if="!weaponStore.currentScope.isActive" class="crosshair-dot"></span>
        <span v-if="weaponStore.currentScope.isActive" class="scope-cross">
          <span class="scope-line horizontal"></span>
          <span class="scope-line vertical"></span>
        </span>
      </div>

      <div class="hud-bottom">
        <!-- Weapon indicator -->
        <div class="weapon-indicator">
          <div
            v-for="(weapon, index) in DEFAULT_WEAPONS"
            :key="weapon.id"
            class="weapon-slot"
            :class="{ active: currentWeaponIndex === index }"
          >
            {{ index + 1 }}
          </div>
        </div>

        <div class="weapon-info">
          <span class="weapon-name">{{ currentWeaponName }}</span>
          <span class="ammo" :class="{ 'low-ammo': weaponStore.currentAmmo.current <= 5, 'reloading': isReloading }">
            <template v-if="isReloading">换弹中...</template>
            <template v-else>{{ ammoDisplay }}</template>
          </span>
        </div>
      </div>

      <div class="controls-hint">
        <p>WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜</p>
      </div>
    </div>

    <!-- 触摸屏虚拟控制（仅在触摸设备显示） -->
    <template v-if="isTouchDevice">
      <!-- 左侧虚拟摇杆（移动） -->
      <VirtualJoystick
        @move="onVirtualMove"
        @stop="onVirtualStop"
      />

      <!-- 右侧虚拟按钮 -->
      <div class="virtual-buttons-right">
        <VirtualButton label="射击" type="shoot" @press="onVirtualButtonPress" @release="onVirtualButtonRelease" />
        <VirtualButton label="跳跃" type="jump" @press="onVirtualButtonPress" />
        <VirtualButton label="下蹲" type="crouch" @press="onVirtualButtonPress" />
        <VirtualButton label="换弹" type="reload" @press="onVirtualButtonPress" />
        <VirtualButton label="倍镜" type="scope" @press="onVirtualButtonPress" />
      </div>

      <!-- 右侧触摸区域（视角控制） -->
      <div
        class="touch-look-area"
        @touchstart="onTouchLookStart"
        @touchmove="onTouchLookMove"
        @touchend="onTouchLookEnd"
      ></div>
    </template>

    <button class="exit-btn" @click.stop="exitGame">退出游戏</button>
    <!-- 暂停菜单 -->
    <transition name="pause-menu">
      <div v-if="gameStore.isPaused" class="pause-overlay">
        <div class="pause-menu">
          <h2 class="pause-title">游戏暂停</h2>
          <div class="pause-buttons">
            <button class="pause-btn resume-btn" @click="resumeGameAndLock">
              <span>继续游戏</span>
            </button>
            <button class="pause-btn restart-btn" @click="onRestart">
              <span>重新开始</span>
            </button>
            <button class="pause-btn exit-btn" @click="exitGame">
              <span>退出游戏</span>
            </button>
          </div>
          <p class="pause-hint">按 ESC 继续游戏</p>
        </div>
      </div>
    </transition>

    <!-- 死亡界面 -->
    <DeathScreen
      :visible="showDeathScreen"
      :survival-time="gameStore.gameTime"
      @restart="onRestart"
      @go-home="onGoHome"
    />

    <!-- 通关界面 -->
    <VictoryScreen
      :visible="showVictoryScreen"
      :survival-time="gameStore.gameTime"
      @restart="onVictoryRestart"
      @go-home="onVictoryGoHome"
    />
  </div>
</template>

<style scoped>
.game-room {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #fff;
}

.loading-spinner {
  font-size: 64px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 20px;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.health-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 200px;
}

.health-bar .label {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.health-bar .bar {
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.health-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #34C759, #30D158);
  border-radius: 10px;
  transition: width 0.3s ease-out, background 0.3s ease-out;
}

/* 血量低于50%变黄 */
.health-bar .fill.warning {
  background: linear-gradient(90deg, #FF9500, #FF6B00);
}

/* 血量低于20%变红 */
.health-bar .fill.danger {
  background: linear-gradient(90deg, #FF3B30, #FF2D55);
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.kills {
  font-size: 16px;
  color: #FF6B6B;
}

/* 屏息体力条 */
.breath-bar {
  position: relative;
  width: 150px;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.breath-fill {
  height: 100%;
  background: linear-gradient(90deg, #00C6FF, #0072FF);
  border-radius: 4px;
  transition: width 0.1s ease-out;
}

.breath-fill.low {
  background: linear-gradient(90deg, #FF3B30, #FF6B6B);
}

.breath-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  color: #00C6FF;
  font-size: 12px;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-dot {
  display: block;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.crosshair.scope-active .scope-cross {
  position: relative;
  display: block;
  width: 60px;
  height: 60px;
}

.scope-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
}

.scope-line.horizontal {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.scope-line.vertical {
  width: 1px;
  height: 100%;
  left: 50%;
  top: 0;
}

.hud-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.weapon-indicator {
  display: flex;
  gap: 8px;
}

.weapon-slot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.weapon-slot.active {
  background: rgba(255, 193, 7, 0.9);
  border-color: #FFC107;
  color: #000;
  transform: scale(1.1);
}

.weapon-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #fff;
}

.weapon-name {
  font-size: 18px;
  font-weight: 600;
}

.ammo {
  font-size: 32px;
  font-weight: 700;
}

.ammo.low-ammo {
  color: #FF3B30;
  animation: pulse 0.5s infinite;
}

.ammo.reloading {
  color: #FFC107;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.exit-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(255, 59, 48, 0.9);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
}

.exit-btn:hover {
  background: #FF3B30;
  transform: scale(1.05);
}

/* 暂停菜单 */
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto;
}

.pause-menu {
  text-align: center;
  color: #fff;
}

.pause-title {
  font-size: 3rem;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: fadeInDown 0.3s ease-out;
}

.pause-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
}

.pause-btn {
  width: 250px;
  height: 60px;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

.pause-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
}

.pause-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
}

.resume-btn {
  background: linear-gradient(135deg, #34C759, #30D158);
  color: #fff;
}

.restart-btn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: #fff;
}

.pause-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  animation: fadeIn 0.5s ease-out 0.3s both;
}

/* 暂停菜单动画 */
.pause-menu-enter-active,
.pause-menu-leave-active {
  transition: opacity 0.3s ease;
}

.pause-menu-enter-from,
.pause-menu-leave-to {
  opacity: 0;
}

.pause-menu-enter-active .pause-menu,
.pause-menu-leave-active .pause-menu {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.pause-menu-enter-from .pause-menu,
.pause-menu-leave-to .pause-menu {
  transform: scale(0.9);
  opacity: 0;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 波次 HUD ===== */
.wave-display {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 6px 20px;
  pointer-events: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.wave-display.boss-wave {
  border-color: rgba(255, 215, 0, 0.7);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.3);
}

.wave-icon {
  font-size: 20px;
}

.wave-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ===== Buff 状态栏 ===== */
.buff-bar {
  position: absolute;
  top: 125px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  pointer-events: none;
}

.buff-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  padding: 4px 10px;
  border: 2px solid rgba(255, 221, 68, 0.5);
  min-width: 48px;
}

.buff-icon[data-buff-type="doubleDamage"] {
  border-color: rgba(255, 221, 68, 0.6);
  box-shadow: 0 0 8px rgba(255, 221, 68, 0.3);
}

.buff-emoji {
  font-size: 20px;
  line-height: 1.2;
}

.buff-timer {
  color: #FFD700;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* ===== 波次间歇倒计时 ===== */
.wave-intermission {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.intermission-content {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px 48px;
  animation: intermissionFadeIn 0.3s ease-out;
}

@keyframes intermissionFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.intermission-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.intermission-countdown {
  font-size: 72px;
  font-weight: 800;
  color: #FFD700;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3);
  line-height: 1;
  margin-bottom: 8px;
}

.intermission-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.wave-countdown-enter-active,
.wave-countdown-leave-active {
  transition: opacity 0.3s ease;
}

.wave-countdown-enter-from,
.wave-countdown-leave-to {
  opacity: 0;
}

/* 虚拟按钮容器（右侧） */
.virtual-buttons-right {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  pointer-events: none;
}

.virtual-buttons-right .virtual-button {
  pointer-events: auto;
}

/* 触摸视角控制区域（右侧大半屏） */
.touch-look-area {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 999;
  pointer-events: auto;
  touch-action: none;
}
</style>