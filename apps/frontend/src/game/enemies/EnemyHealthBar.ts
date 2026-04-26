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

  // 敌人类型名称和颜色映射
  private getTypeLabel(type: string): { text: string; color: string } {
    switch (type) {
      case 'boss': return { text: 'BOSS', color: '#FF4444' }
      case 'elite': return { text: '精英', color: '#BB86FC' }
      default: return { text: '小兵', color: '#64B5F6' }
    }
  }

  // 创建血条元素
  private createHealthBarElement(enemy: Enemy): HealthBarElement {
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.transform = 'translate(-50%, -50%)'
    wrapper.style.zIndex = '1000'
    wrapper.style.pointerEvents = 'none'
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.alignItems = 'center'

    // 类型标签
    const typeLabel = document.createElement('div')
    const typeInfo = this.getTypeLabel(enemy.config.type)
    typeLabel.textContent = typeInfo.text
    typeLabel.style.fontSize = enemy.config.type === 'boss' ? '16px' : enemy.config.type === 'elite' ? '13px' : '11px'
    typeLabel.style.fontWeight = 'bold'
    typeLabel.style.color = typeInfo.color
    typeLabel.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.9)'
    typeLabel.style.marginBottom = '2px'
    typeLabel.style.letterSpacing = '1px'
    wrapper.appendChild(typeLabel)

    // 血条背景
    const barWidth = enemy.config.type === 'boss' ? '90px' : enemy.config.type === 'elite' ? '72px' : '54px'
    const background = document.createElement('div')
    background.style.width = barWidth
    background.style.height = enemy.config.type === 'boss' ? '8px' : '6px'
    background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    background.style.borderRadius = '4px'
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
    healthText.style.fontSize = enemy.config.type === 'boss' ? '13px' : '11px'
    healthText.style.fontWeight = 'bold'
    healthText.style.color = 'white'
    healthText.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)'
    healthText.style.marginTop = '1px'
    healthText.textContent = `${enemy.health}/${enemy.maxHealth}`

    wrapper.appendChild(healthText)

    this.container.appendChild(wrapper)

    return {
      wrapper,
      background,
      fill,
      healthText,
      typeLabel,
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

  // 获取血条高度阈值（用于重叠检测）
  private getBarHeight(enemy: Enemy): number {
    return enemy.config.type === 'boss' ? 50 : enemy.config.type === 'elite' ? 40 : 35
  }

  // 更新血条位置和状态
  update(enemy: Enemy) {
    if (!enemy.mesh) return

    let healthBar = this.healthBars.get(enemy.id)
    if (!healthBar) {
      healthBar = this.createHealthBarElement(enemy)
      this.healthBars.set(enemy.id, healthBar)
    }

    // 只要没死就显示血条（包括满血状态，方便儿童玩家了解敌人状态）
    const shouldShow = !enemy.isDead

    if (shouldShow) {
      // 根据敌人体型计算头顶偏移量
      const headOffset = enemy.config.type === 'boss' ? 3.2 : enemy.config.type === 'elite' ? 2.3 : 2.0
      const enemyTop = new THREE.Vector3(
        enemy.mesh.position.x,
        enemy.mesh.position.y + headOffset,
        enemy.mesh.position.z
      )

      // 3D坐标转2D屏幕坐标
      const screenPosition = this.toScreenPosition(enemyTop)
      healthBar.screenY = screenPosition.y

      // 检查是否在屏幕前方
      const isInFront = screenPosition.z > 0
      const isInScreen =
        screenPosition.x >= 0 &&
        screenPosition.x <= window.innerWidth &&
        screenPosition.y >= 0 &&
        screenPosition.y <= window.innerHeight

      if (isInFront && isInScreen) {
        healthBar.wrapper.style.display = 'flex'
        healthBar.wrapper.style.left = `${screenPosition.x}px`
        healthBar.wrapper.style.top = `${screenPosition.y}px`

        // 更新血条填充
        const healthPercentage = enemy.health / enemy.maxHealth
        healthBar.fill.style.width = `${healthPercentage * 100}%`
        healthBar.fill.style.backgroundColor = this.getHealthColor(healthPercentage)

        // 更新血量文字
        healthBar.healthText.textContent = `${enemy.health}/${enemy.maxHealth}`

        // 根据距离和敌人体型调整大小
        const distance = this.camera.position.distanceTo(enemy.position)
        const baseScale = Math.max(0.6, Math.min(1.2, 25 / distance))
        const typeScale = enemy.config.type === 'boss' ? 1.3 : enemy.config.type === 'elite' ? 1.1 : 1.0
        const scale = baseScale * typeScale
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

  /** 批量更新所有敌人血条，带重叠检测 */
  updateAll(enemies: Enemy[]) {
    // 第一遍：先单独更新每个敌人（创建/更新 DOM，计算屏幕坐标）
    for (const enemy of enemies) {
      this.update(enemy)
    }

    // 第二遍：检测可见血条的重叠并垂直偏移
    const visibleBars: { id: string; y: number; height: number; el: HealthBarElement }[] = []
    for (const enemy of enemies) {
      const bar = this.healthBars.get(enemy.id)
      if (!bar || !bar.visible) continue
      visibleBars.push({
        id: enemy.id,
        y: bar.screenY,
        height: this.getBarHeight(enemy),
        el: bar,
      })
    }

    // 按 Y 坐标从上到下排序
    visibleBars.sort((a, b) => a.y - b.y)

    // 检测重叠并垂直偏移
    // 血条使用 transform: translate(-50%, -50%)，所以底部 = y + height/2，顶部 = y - height/2
    const margin = 5 // 额外间距
    for (let i = 1; i < visibleBars.length; i++) {
      const prev = visibleBars[i - 1]
      const curr = visibleBars[i]
      const prevBottom = prev.y + prev.height / 2 + margin
      const currTop = curr.y - curr.height / 2

      if (currTop < prevBottom) {
        // 将当前血条下移到前一个血条底部以下
        const offset = prevBottom - currTop
        const newY = curr.y + offset
        curr.el.wrapper.style.top = `${newY}px`
        curr.y = newY // 更新缓存 Y 以便后续链式累积
      }
    }

    // 边界保护：确保血条不超出屏幕底部
    const bottomLimit = window.innerHeight - 10
    for (const item of visibleBars) {
      const bottom = item.y + item.height / 2
      if (bottom > bottomLimit) {
        const clampedY = bottomLimit - item.height / 2
        item.el.wrapper.style.top = `${clampedY}px`
        item.y = clampedY
      }
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
  typeLabel: HTMLDivElement
  visible: boolean
  screenY: number   // 缓存屏幕 Y 坐标，用于重叠检测
}