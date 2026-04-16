import * as THREE from 'three'
import type { Enemy } from './types'
import { DamageNumberManager } from '../ui/DamageNumber'

// 血条类
export class EnemyHealthBar {
  private camera: THREE.Camera
  private container: HTMLElement
  private healthBars: Map<string, HealthBarElement> = new Map()
  private damageManager: DamageNumberManager

  constructor(camera: THREE.Camera) {
    this.camera = camera
    this.container = document.getElementById('game-ui') || document.body
    this.container.style.position = 'relative'
    this.damageManager = new DamageNumberManager(camera)
  }

  // 创建血条元素
  private createHealthBarElement(enemy: Enemy): HealthBarElement {
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.transform = 'translate(-50%, -50%)'
    wrapper.style.zIndex = '1000'
    wrapper.style.pointerEvents = 'none'

    const background = document.createElement('div')
    background.style.width = '60px'
    background.style.height = '6px'
    background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    background.style.borderRadius = '3px'
    background.style.overflow = 'hidden'
    background.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)'

    const fill = document.createElement('div')
    fill.style.width = '100%'
    fill.style.height = '100%'
    fill.style.transition = 'width 0.3s ease, background-color 0.3s ease'
    fill.style.backgroundColor = this.getHealthColor(enemy.health / enemy.maxHealth)

    background.appendChild(fill)
    wrapper.appendChild(background)

    // 血量数字
    const healthText = document.createElement('div')
    healthText.style.position = 'absolute'
    healthText.style.top = '-20px'
    healthText.style.left = '50%'
    healthText.style.transform = 'translateX(-50%)'
    healthText.style.fontSize = '12px'
    healthText.style.fontWeight = 'bold'
    healthText.style.color = 'white'
    healthText.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)'
    healthText.textContent = `${enemy.health}/${enemy.maxHealth}`

    wrapper.appendChild(healthText)

    this.container.appendChild(wrapper)

    return {
      wrapper,
      background,
      fill,
      healthText,
      visible: false
    }
  }

  // 根据血量百分比获取颜色
  private getHealthColor(percentage: number): string {
    if (percentage > 0.5) {
      return '#4CAF50' // 绿色
    } else if (percentage > 0.2) {
      return '#FF9800' // 橙色
    } else {
      return '#F44336' // 红色
    }
  }

  // 更新血条位置和状态
  update(enemy: Enemy) {
    if (!enemy.mesh) return

    let healthBar = this.healthBars.get(enemy.id)
    if (!healthBar) {
      healthBar = this.createHealthBarElement(enemy)
      this.healthBars.set(enemy.id, healthBar)
    }

    // 只在非满血且非死亡时显示血条
    const shouldShow = enemy.health < enemy.maxHealth && !enemy.isDead

    if (shouldShow) {
      // 获取敌人头顶位置
      const enemyTop = new THREE.Vector3(
        enemy.mesh.position.x,
        enemy.mesh.position.y + 2, // 头顶上方
        enemy.mesh.position.z
      )

      // 3D坐标转2D屏幕坐标
      const screenPosition = this.toScreenPosition(enemyTop)

      // 检查是否在屏幕前方
      const isInFront = screenPosition.z > 0
      const isInScreen =
        screenPosition.x >= 0 &&
        screenPosition.x <= window.innerWidth &&
        screenPosition.y >= 0 &&
        screenPosition.y <= window.innerHeight

      if (isInFront && isInScreen) {
        healthBar.wrapper.style.display = 'block'
        healthBar.wrapper.style.left = `${screenPosition.x}px`
        healthBar.wrapper.style.top = `${screenPosition.y}px`

        // 更新血条填充
        const healthPercentage = enemy.health / enemy.maxHealth
        healthBar.fill.style.width = `${healthPercentage * 100}%`
        healthBar.fill.style.backgroundColor = this.getHealthColor(healthPercentage)

        // 更新血量文字
        healthBar.healthText.textContent = `${enemy.health}/${enemy.maxHealth}`

        // 根据距离调整大小
        const distance = this.camera.position.distanceTo(enemy.position)
        const scale = Math.max(0.5, Math.min(1, 20 / distance))
        healthBar.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`

        healthBar.visible = true
      } else {
        healthBar.wrapper.style.display = 'none'
        healthBar.visible = false
      }
    } else {
      healthBar.wrapper.style.display = 'none'
      healthBar.visible = false
    }
  }

  // 3D坐标转屏幕坐标
  private toScreenPosition(position: THREE.Vector3): { x: number; y: number; z: number } {
    const vector = position.clone()
    vector.project(this.camera)

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
      z: vector.z
    }
  }

  // 移除敌人的血条
  remove(enemyId: string) {
    const healthBar = this.healthBars.get(enemyId)
    if (healthBar) {
      healthBar.wrapper.remove()
      this.healthBars.delete(enemyId)
    }
  }

  // 显示伤害数字
  showDamage(enemy: Enemy, damage: number, isCritical: boolean = false) {
    const enemyTop = new THREE.Vector3(
      enemy.mesh?.position.x || enemy.position.x,
      (enemy.mesh?.position.y || enemy.position.y) + 1.8,
      enemy.mesh?.position.z || enemy.position.z
    )
    this.damageManager.showDamage(enemyTop, damage, isCritical)
  }

  // 清理所有血条
  clear() {
    this.healthBars.forEach((healthBar) => {
      healthBar.wrapper.remove()
    })
    this.healthBars.clear()
    this.damageManager.clear()
  }
}

// 血条元素接口
interface HealthBarElement {
  wrapper: HTMLDivElement
  background: HTMLDivElement
  fill: HTMLDivElement
  healthText: HTMLDivElement
  visible: boolean
}