import * as THREE from 'three'
import { Sun } from './Sun'
import { Bird, type BirdConfig } from './Bird'
import { ForestAnimal } from './ForestAnimal'

export class EnvironmentManager {
  private sun: Sun | null = null
  private birds: Bird[] = []
  private animals: ForestAnimal[] = []
  private scene: THREE.Scene | null = null

  /** 小鸟数量 */
  private readonly birdCount = 4
  /** 动物数量 */
  private readonly animalCount = 7

  /** 生成动物初始位置 */
  private generateAnimalPosition(): THREE.Vector3 {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 10 // 5~15，绿地范围内
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      // 检查是否与其他动物距离过近
      let tooClose = false
      for (const animal of this.animals) {
        const dx = animal.group.position.x - x
        const dz = animal.group.position.z - z
        if (dx * dx + dz * dz < 16) {
          tooClose = true
          break
        }
      }
      if (!tooClose) return new THREE.Vector3(x, 0, z)
    }
    const angle = Math.random() * Math.PI * 2
    const radius = 5 + Math.random() * 8
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
  }

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

    // 创建动物
    for (let i = 0; i < this.animalCount; i++) {
      const pos = this.generateAnimalPosition()
      const animal = new ForestAnimal({
        type: ForestAnimal.randomType(),
        position: pos,
      })
      this.animals.push(animal)
      scene.add(animal.group)
    }
  }

  update(delta: number, playerPosition?: THREE.Vector3): void {
    this.sun?.update(delta)

    for (const bird of this.birds) {
      bird.update(delta)
    }

    for (const animal of this.animals) {
      animal.update(delta, playerPosition)
    }
  }

  dispose(): void {
    this.sun?.dispose()
    this.birds.forEach((bird) => bird.dispose())
    this.birds = []
    this.animals.forEach((animal) => animal.dispose())
    this.animals = []
    this.sun = null
    this.scene = null
  }
}
