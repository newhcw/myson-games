/**
 * 音效管理器 - 使用 Web Audio API 合成简单音效
 */
export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private volume: number = 0.5

  constructor() {
    this.initContext()
  }

  private initContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = this.volume
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  /**
   * 恢复音频上下文（浏览器会自动暂停音频上下文，需要用户交互后恢复）
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * 射击音效 - 短促的爆炸声
   */
  playShoot() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    // 创建噪音作为基础
    const noise = this.createNoise(0.1)

    // 低通滤波器使声音更低沉
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.1)

    // 增益包络
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(now)
    noise.stop(now + 0.1)
  }

  /**
   * 换弹音效 - 金属声
   */
  playReload() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    // 短促的金属声
    const osc = this.audioContext.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.15)

    // 第二个音符 - 确认声
    const osc2 = this.audioContext.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1000, now + 0.15)
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.25)

    const gain2 = this.audioContext.createGain()
    gain2.gain.setValueAtTime(0.2, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc2.connect(gain2)
    gain2.connect(this.masterGain)

    osc2.start(now + 0.15)
    osc2.stop(now + 0.25)
  }

  /**
   * 击中敌人音效 - 短促的高频音
   */
  playHit() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * 敌人死亡音效 - 下降的音调
   */
  playDeath() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    const osc = this.audioContext.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.4)

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.4)
  }

  /**
   * 空弹射击音效 - 咔嗒声
   */
  playEmpty() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    const osc = this.audioContext.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, now)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  /**
   * 倍镜切换音效
   */
  playScope() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * 道具掉落音效 - 轻快的上升音调
   */
  playPowerUpDrop() {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    // 第一个音符 - 上升音
    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.15)

    // 第二个音符 - 确认声
    const osc2 = this.audioContext.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1000, now + 0.1)

    const gain2 = this.audioContext.createGain()
    gain2.gain.setValueAtTime(0.2, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc2.connect(gain2)
    gain2.connect(this.masterGain)

    osc2.start(now + 0.1)
    osc2.stop(now + 0.2)
  }

  /**
   * 创建噪音源
   */
  private createNoise(duration: number): AudioBufferSourceNode {
    if (!this.audioContext) throw new Error('Audio context not initialized')

    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    return noise
  }
}

// 单例实例
export const soundManager = new SoundManager()