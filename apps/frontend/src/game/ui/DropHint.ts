/**
 * 道具拾取提示管理类
 * 负责在屏幕中央显示道具拾取提示文字
 */

export class DropHint {
  private containerElement: HTMLDivElement | null = null

  constructor() {
    this.createContainer()
  }

  /**
   * 创建提示文字容器
   */
  private createContainer() {
    this.containerElement = document.createElement('div')
    this.containerElement.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 9997;
      text-align: center;
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `
    this.containerElement.style.opacity = '0'
    document.body.appendChild(this.containerElement)
  }

  /**
   * 显示提示文字
   * @param text 提示文字内容
   * @param color 文字颜色
   * @param duration 显示时长（毫秒）
   * @param fontSize 字体大小
   */
  show(
    text: string,
    color: string = '#FF69B4',
    duration: number = 1500,
    fontSize: string = '28px'
  ) {
    if (!this.containerElement) return

    this.containerElement.innerHTML = ''

    const hintEl = document.createElement('div')
    hintEl.textContent = text
    hintEl.style.cssText = `
      font-size: ${fontSize};
      font-weight: bold;
      color: ${color};
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px ${color}40;
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      border: 2px solid ${color};
      animation: dropHintPop 0.3s ease-out;
    `

    if (!document.getElementById('drop-hint-animation-style')) {
      const style = document.createElement('style')
      style.id = 'drop-hint-animation-style'
      style.textContent = `
        @keyframes dropHintPop {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes dropHintFade {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
        }
      `
      document.head.appendChild(style)
    }

    this.containerElement.appendChild(hintEl)

    // 显示
    this.containerElement.style.opacity = '1'

    // 持续显示后淡出
    setTimeout(() => {
      if (this.containerElement) {
        this.containerElement.style.transition = 'opacity 0.5s ease-out'
        this.containerElement.style.opacity = '0'
      }
    }, duration)
  }

  /**
   * 显示血包拾取提示
   */
  showHealthPickup() {
    this.show('血包 +30', '#FF69B4', 1500)
  }

  /**
   * 显示双倍伤害拾取提示
   */
  showDoubleDamage() {
    this.show('双倍伤害！', '#FFDD44', 1500)
  }

  /**
   * 显示弹药补充提示
   */
  showAmmoPickup() {
    this.show('弹药已补充', '#4488FF', 1500)
  }

  /**
   * 显示游戏开始提示
   */
  showGameStartHint() {
    this.show('击败敌人可获得血包！', '#FFFFFF', 3000, '32px')
  }

  /**
   * 显示倍镜切换失败提示（当前武器不支持倍镜）
   */
  showScopeNotSupported() {
    this.show('该武器不支持倍镜，按3切换步枪，按4切换狙击枪', '#FF8844', 2000, '24px')
  }

  /**
   * 隐藏提示
   */
  hide() {
    if (this.containerElement) {
      this.containerElement.style.opacity = '0'
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement)
      this.containerElement = null
    }
  }
}

export const dropHint = new DropHint()