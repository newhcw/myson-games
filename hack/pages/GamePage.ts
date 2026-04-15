import { type Page, type Locator, expect } from '@playwright/test'

export class GamePage {
  readonly page: Page

  // 游戏容器
  readonly gameRoom: Locator

  // HUD 元素
  readonly hud: Locator
  readonly healthBar: Locator
  readonly healthFill: Locator
  readonly healthLabel: Locator
  readonly score: Locator
  readonly scoreDisplay: Locator
  readonly kills: Locator
  readonly crosshair: Locator
  readonly weaponInfo: Locator
  readonly weaponIndicator: Locator
  readonly weaponSlots: Locator
  readonly controlsHint: Locator

  // 退出按钮
  readonly exitButton: Locator

  // 加载界面
  readonly loading: Locator

  constructor(page: Page) {
    this.page = page

    // 游戏容器
    this.gameRoom = page.locator('.game-room')

    // HUD 元素
    this.hud = page.locator('.hud')
    this.healthBar = page.locator('.health-bar')
    this.healthFill = page.locator('.health-bar .fill')
    this.healthLabel = page.locator('.health-bar .label')
    this.score = page.locator('.score span').first()
    this.scoreDisplay = page.locator('.score')
    this.kills = page.locator('.score .kills')
    this.crosshair = page.locator('.crosshair')
    this.weaponInfo = page.locator('.weapon-info')
    this.weaponIndicator = page.locator('.weapon-indicator')
    this.weaponSlots = page.locator('.weapon-slot')
    this.controlsHint = page.locator('.controls-hint')

    // 退出按钮
    this.exitButton = page.locator('.exit-btn')

    // 加载界面
    this.loading = page.locator('.loading')
  }

  /**
   * 导航到游戏页面
   */
  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173/game')
  }

  /**
   * 等待游戏加载
   */
  async waitForLoaded(): Promise<void> {
    // 等待加载界面不可见
    await this.loading.waitFor({ state: 'hidden', timeout: 30000 })
  }

  /**
   * 等待游戏加载完成并显示 HUD
   */
  async expectLoaded(): Promise<void> {
    // 等待加载界面消失
    await expect(this.loading).not.toBeVisible({ timeout: 30000 })

    // 验证 HUD 可见
    await expect(this.hud).toBeVisible()
  }

  /**
   * 获取血量文字
   */
  async getHealthText(): Promise<string> {
    return this.healthBar.locator('.label, span').first().textContent() || ''
  }

  /**
   * 获取分数文字
   */
  async getScoreText(): Promise<string> {
    return this.scoreDisplay.textContent() || ''
  }

  /**
   * 点击退出按钮
   */
  async clickExit(): Promise<void> {
    await this.exitButton.click()
  }

  /**
   * 点击退出按钮 (别名)
   */
  async clickExitButton(): Promise<void> {
    await this.clickExit()
  }
}