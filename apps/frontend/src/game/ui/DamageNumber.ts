import * as THREE from 'three'

// 伤害数字管理器
export class DamageNumberManager {
  private camera: THREE.Camera
  private container: HTMLElement
  private damageNumbers: DamageNumber[] = []
  private isAnimating = false

  constructor(camera: THREE.Camera) {
    this.camera = camera
    this.container = document.getElementById('game-ui') || document.body
    this.container.style.position = 'relative'
    this.startAnimationLoop()
  }

  // 创建伤害数字
  showDamage(position: THREE.Vector3, damage: number, isCritical: boolean = false) {
    const damageElement = this.createDamageElement(damage, isCritical)
    const screenPos = this.toScreenPosition(position)

    // 只在屏幕前方显示
    if (screenPos.z > 0 && screenPos.y < window.innerHeight - 100) {
      const damageNumber: DamageNumber = {
        element: damageElement,
        startY: screenPos.y,
        currentY: screenPos.y,
        opacity: 1,
        startTime: Date.now(),
        lifetime: 1500, // 1.5秒
        velocity: -1.5, // 向上飘的速度
        isCritical
      }

      this.damageNumbers.push(damageNumber)
      this.container.appendChild(damageElement)
    }
  }

  // 创建伤害元素
  private createDamageElement(damage: number, isCritical: boolean): HTMLDivElement {
    const element = document.createElement('div')
    element.style.position = 'absolute'
    element.style.fontSize = isCritical ? '28px' : '20px'
    element.style.fontWeight = 'bold'
    element.style.color = isCritical ? '#ff6b6b' : '#ffd93d'
    element.style.textShadow = isCritical
      ? '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,107,107,0.8)'
      : '2px 2px 4px rgba(0,0,0,0.8)'
    element.style.pointerEvents = 'none'
    element.style.zIndex = '1001'
    element.style.transform = 'translate(-50%, -50%)'
    element.style.transition = 'opacity 0.3s ease-out'
    element.style.fontFamily = 'Arial, sans-serif'

    // 添加动画类
    if (isCritical) {
      element.style.animation = 'damageCritical 0.5s ease-out'
    } else {
      element.style.animation = 'damagePop 0.3s ease-out'
    }

    element.textContent = `-${damage}`

    // 添加动画样式
    if (!document.getElementById('damage-animations')) {
      const style = document.createElement('style')
      style.id = 'damage-animations'
      style.textContent = `
        @keyframes damagePop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes damageCritical {
          0% { transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.4) rotate(5deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    return element
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

  // 动画循环
  private startAnimationLoop() {
    const animate = () => {
      const now = Date.now()

      this.damageNumbers = this.damageNumbers.filter(damage => {
        const elapsed = now - damage.startTime

        if (elapsed > damage.lifetime) {
          // 移除元素
          damage.element.remove()
          return false
        }

        // 更新位置
        damage.currentY = damage.startY + (damage.velocity * elapsed / 16) // 假设60fps

        // 更新透明度（最后0.3秒淡出）
        if (elapsed > damage.lifetime - 300) {
          damage.opacity = Math.max(0, (damage.lifetime - elapsed) / 300)
          damage.element.style.opacity = damage.opacity.toString()
        }

        // 更新位置
        const offsetX = Math.sin(elapsed / 200) * 10 // 轻微左右摆动
        damage.element.style.left = `${damage.element.offsetLeft + offsetX}px`
        damage.element.style.top = `${damage.currentY}px`

        return true
      })

      if (this.damageNumbers.length > 0 && !this.isAnimating) {
        this.isAnimating = true
        requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
      }
    }

    animate()
  }

  // 清理所有伤害数字
  clear() {
    this.damageNumbers.forEach(damage => {
      damage.element.remove()
    })
    this.damageNumbers = []
  }
}

// 伤害数字接口
interface DamageNumber {
  element: HTMLDivElement
  startY: number
  currentY: number
  opacity: number
  startTime: number
  lifetime: number
  velocity: number
  isCritical: boolean
}