/**
 * 伤害反馈配置
 */
export const DAMAGE_FEEDBACK_CONFIG = {
  // 普通伤害
  normal: {
    overlayColor: 'rgba(255, 0, 0, 0.3)',
    fadeOutDuration: 500, // 毫秒
  },
  // 严重伤害（20点及以上）
  severe: {
    overlayColor: 'rgba(255, 0, 0, 0.5)',
    fadeOutDuration: 800, // 毫秒
  },
}

/**
 * 伤害反馈管理类
 * 负责管理屏幕闪红效果和伤害数字显示
 */
export class DamageFeedback {
  private overlayElement: HTMLDivElement | null = null
  private damageNumberContainer: HTMLDivElement | null = null

  constructor() {
    this.createOverlay()
    this.createDamageNumberContainer()
  }

  /**
   * 创建屏幕闪红遮罩层
   */
  private createOverlay() {
    this.overlayElement = document.createElement('div')
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.5s ease-out;
      background: radial-gradient(ellipse at center, transparent 40%, ${DAMAGE_FEEDBACK_CONFIG.normal.overlayColor} 100%);
    `
    document.body.appendChild(this.overlayElement)
  }

  /**
   * 创建伤害数字容器
   */
  private createDamageNumberContainer() {
    this.damageNumberContainer = document.createElement('div')
    this.damageNumberContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(this.damageNumberContainer)
  }

  /**
   * 显示受伤效果
   * @param damage 伤害值
   */
  showDamageEffect(damage: number) {
    if (!this.overlayElement) return

    const config = damage >= 20 ? DAMAGE_FEEDBACK_CONFIG.severe : DAMAGE_FEEDBACK_CONFIG.normal

    // 设置颜色和透明度
    this.overlayElement.style.background = `radial-gradient(ellipse at center, transparent 40%, ${config.overlayColor} 100%)`
    this.overlayElement.style.opacity = '1'

    // 渐变消失
    setTimeout(() => {
      if (this.overlayElement) {
        this.overlayElement.style.opacity = '0'
      }
    }, 50)
  }

  /**
   * 显示伤害数字
   * @param damage 伤害值
   */
  showDamageNumber(damage: number) {
    if (!this.damageNumberContainer) return

    const damageEl = document.createElement('div')
    damageEl.textContent = `-${damage}`
    damageEl.style.cssText = `
      position: absolute;
      font-size: 36px;
      font-weight: bold;
      color: #FF3B30;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      animation: damageFloat 1s ease-out forwards;
    `

    // 添加动画样式
    if (!document.getElementById('damage-animation-style')) {
      const style = document.createElement('style')
      style.id = 'damage-animation-style'
      style.textContent = `
        @keyframes damageFloat {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.8);
          }
        }
      `
      document.head.appendChild(style)
    }

    // 随机水平偏移
    const offsetX = (Math.random() - 0.5) * 60
    damageEl.style.left = `${offsetX}px`
    damageEl.style.top = '-100px'

    this.damageNumberContainer.appendChild(damageEl)

    // 1秒后移除
    setTimeout(() => {
      if (damageEl.parentNode) {
        damageEl.parentNode.removeChild(damageEl)
      }
    }, 1000)
  }

  /**
   * 清理所有效果
   */
  clear() {
    if (this.overlayElement) {
      this.overlayElement.style.opacity = '0'
    }
    if (this.damageNumberContainer) {
      this.damageNumberContainer.innerHTML = ''
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement)
      this.overlayElement = null
    }
    if (this.damageNumberContainer && this.damageNumberContainer.parentNode) {
      this.damageNumberContainer.parentNode.removeChild(this.damageNumberContainer)
      this.damageNumberContainer = null
    }
  }
}

export const damageFeedback = new DamageFeedback()