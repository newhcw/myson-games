/**
 * 输入管理器 - 命令模式实现
 * 负责：按键映射、输入缓冲、命令执行
 */
import type { Command } from './Command'

export interface KeyMapping {
  action: string
  commandFactory: (isPressed: boolean) => Command
  bufferable?: boolean // 是否可缓冲
}

export class InputManager {
  private keyMappings: Map<string, KeyMapping> = new Map()
  private commandHistory: Command[] = []
  private inputBuffer: { key: string; timestamp: number }[] = []
  private maxHistorySize = 100
  private maxBufferSize = 10
  private isEnabled = true

  /**
   * 注册按键映射
   */
  registerKey(key: string, mapping: KeyMapping): void {
    this.keyMappings.set(key.toLowerCase(), mapping)
  }

  /**
   * 注销按键映射
   */
  unregisterKey(key: string): void {
    this.keyMappings.delete(key.toLowerCase())
  }

  /**
   * 处理按键按下
   */
  handleKeyDown(key: string): void {
    if (!this.isEnabled) return

    const mapping = this.keyMappings.get(key.toLowerCase())
    if (!mapping) return

    // 添加到输入缓冲
    if (mapping.bufferable) {
      this.bufferInput(key.toLowerCase())
    }

    // 立即执行命令
    const command = mapping.commandFactory(true)
    this.executeCommand(command)
  }

  /**
   * 处理按键释放
   */
  handleKeyUp(key: string): void {
    if (!this.isEnabled) return

    const mapping = this.keyMappings.get(key.toLowerCase())
    if (!mapping) return

    const command = mapping.commandFactory(false)
    this.executeCommand(command)
  }

  /**
   * 添加输入到缓冲
   */
  private bufferInput(key: string): void {
    this.inputBuffer.push({ key, timestamp: Date.now() })

    // 限制缓冲大小
    if (this.inputBuffer.length > this.maxBufferSize) {
      this.inputBuffer.shift()
    }
  }

  /**
   * 处理缓冲的输入（由游戏循环调用）
   */
  processInputBuffer(): void {
    const now = Date.now()
    const maxAge = 100 // 最大缓冲时间（ms）

    // 处理所有未过期的缓冲输入
    while (this.inputBuffer.length > 0) {
      const input = this.inputBuffer[0]
      if (now - input.timestamp > maxAge) {
        this.inputBuffer.shift() // 过期，丢弃
        continue
      }

      // 重新执行缓冲的输入
      const mapping = this.keyMappings.get(input.key)
      if (mapping) {
        const command = mapping.commandFactory(true)
        this.executeCommand(command)
      }

      this.inputBuffer.shift()
    }
  }

  /**
   * 执行命令
   */
  private executeCommand(command: Command): void {
    command.execute()

    // 添加到历史记录
    this.commandHistory.push(command)
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift()
    }
  }

  /**
   * 撤销最后一个命令
   */
  undo(): boolean {
    const command = this.commandHistory.pop()
    if (command && command.undo) {
      command.undo()
      return true
    }
    return false
  }

  /**
   * 获取当前缓冲的输入数
   */
  getBufferSize(): number {
    return this.inputBuffer.length
  }

  /**
   * 清空输入缓冲
   */
  clearBuffer(): void {
    this.inputBuffer = []
  }

  /**
   * 启用/禁用输入
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * 获取所有已注册的按键
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.keyMappings.keys())
  }

  /**
   * 清空所有映射
   */
  clearMappings(): void {
    this.keyMappings.clear()
    this.commandHistory = []
    this.inputBuffer = []
  }
}
