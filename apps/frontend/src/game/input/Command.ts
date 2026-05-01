/**
 * 命令接口 - 命令模式基础接口
 */
export interface Command {
  execute(): void
  undo?(): void
}

/**
 * 移动命令
 */
export class MoveCommand implements Command {
  private startPosition: { x: number; z: number }
  public readonly direction: { x: number; z: number }

  constructor(
    private playerPosition: { x: number; z: number },
    direction: { x: number; z: number }
  ) {
    this.direction = { ...direction }
    this.startPosition = { x: playerPosition.x, z: playerPosition.z }
  }

  execute(): void {
    // 移动逻辑由游戏循环处理，这里只是记录意图
    this.startPosition = { x: this.playerPosition.x, z: this.playerPosition.z }
  }

  undo(): void {
    // 回退到起始位置（用于调试/回放）
    this.playerPosition.x = this.startPosition.x
    this.playerPosition.z = this.startPosition.z
  }
}

/**
 * 射击命令
 */
export class ShootCommand implements Command {
  constructor(
    private onShoot: () => void
  ) {}

  execute(): void {
    this.onShoot()
  }

  undo(): void {
    // 射击不可撤销（但可以记录用于回放）
  }
}

/**
 * 切换武器命令
 */
export class SwitchWeaponCommand implements Command {
  private previousIndex: number = 0

  constructor(
    private currentIndex: { value: number },
    private newIndex: number,
    private onSwitch: (index: number) => void
  ) {}

  execute(): void {
    this.previousIndex = this.currentIndex.value
    this.currentIndex.value = this.newIndex
    this.onSwitch(this.newIndex)
  }

  undo(): void {
    this.currentIndex.value = this.previousIndex
    this.onSwitch(this.previousIndex)
  }
}

/**
 * 换弹命令
 */
export class ReloadCommand implements Command {
  constructor(
    private onReload: () => void
  ) {}

  execute(): void {
    this.onReload()
  }

  undo(): void {
    // 换弹不可撤销
  }
}

/**
 * 跳跃命令
 */
export class JumpCommand implements Command {
  private jumpStartHeight: number = 0

  constructor(
    private playerPosition: { y: number },
    private jumpHeight: number = 1.5
  ) {}

  execute(): void {
    this.jumpStartHeight = this.playerPosition.y
    // 跳跃逻辑由物理系统处理
  }

  undo(): void {
    this.playerPosition.y = this.jumpStartHeight
  }
}

/**
 * 下蹲命令
 */
export class CrouchCommand implements Command {
  private isCrouching: boolean = false
  private originalHeight: number = 1.6

  constructor(
    private playerHeight: { value: number },
    private crouchHeight: number = 0.8
  ) {
    this.originalHeight = playerHeight.value
  }

  execute(): void {
    if (!this.isCrouching) {
      this.originalHeight = this.playerHeight.value
      this.playerHeight.value = this.crouchHeight
      this.isCrouching = true
    }
  }

  undo(): void {
    if (this.isCrouching) {
      this.playerHeight.value = this.originalHeight
      this.isCrouching = false
    }
  }
}

/**
 * 倍镜切换命令
 */
export class ToggleScopeCommand implements Command {
  private previousState: boolean = false

  constructor(
    private scopeActive: { value: boolean },
    private onToggle: () => void
  ) {}

  execute(): void {
    this.previousState = this.scopeActive.value
    this.onToggle()
  }

  undo(): void {
    if (this.scopeActive.value !== this.previousState) {
      this.onToggle() // 再次切换回到原状态
    }
  }
}
