import type { InjectionKey, ShallowRef } from 'vue'
import type * as THREE from 'three'

export interface ViewAngles {
  yaw: number
  pitch: number
}

export interface GameContext {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.PerspectiveCamera | null>
  renderer: ShallowRef<THREE.WebGLRenderer | null>
  playerPosition: THREE.Vector3
}

export const GAME_CONTEXT_KEY: InjectionKey<GameContext> = Symbol('game-context')
