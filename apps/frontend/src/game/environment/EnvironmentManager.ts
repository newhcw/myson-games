import * as THREE from 'three'
import { Sun } from './Sun'
import { Bird, type BirdConfig } from './Bird'

export class EnvironmentManager {
  private sun: Sun | null = null
  private birds: Bird[] = []
  private scene: THREE.Scene | null = null

  /** 小鸟数量 */
  private readonly birdCount = 4

  init(scene: THREE.Scene): void {
    this.scene = scene

    // 创建太阳
    this.sun = new Sun()
    scene.add(this.sun.group)

    // 创建小鸟
    for (let i = 0; i < this.birdCount; i++) {
      const config: BirdConfig = Bird.randomConfig()
      const bird = new Bird(config)
      this.birds.push(bird)
      scene.add(bird.group)
    }
  }

  update(delta: number): void {
    this.sun?.update(delta)

    for (const bird of this.birds) {
      bird.update(delta)
    }
  }

  dispose(): void {
    this.sun?.dispose()
    this.birds.forEach((bird) => bird.dispose())
    this.birds = []
    this.sun = null
    this.scene = null
  }
}
