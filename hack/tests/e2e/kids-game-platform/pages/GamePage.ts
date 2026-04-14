import { type Page, type Locator, expect } from '@playwright/test'

export class GamePage {
  readonly page: Page
  readonly loadingOverlay: Locator
  readonly hud: Locator
  readonly healthBar: Locator
  readonly scoreDisplay: Locator
  readonly crosshair: Locator
  readonly weaponInfo: Locator
  readonly exitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.loadingOverlay = page.locator('.loading')
    this.hud = page.locator('.hud')
    this.healthBar = page.locator('.health-bar')
    this.scoreDisplay = page.locator('.score')
    this.crosshair = page.locator('.crosshair')
    this.weaponInfo = page.locator('.weapon-info')
    this.exitButton = page.locator('.exit-btn')
  }

  async goto() {
    await this.page.goto('/game')
  }

  async expectLoaded() {
    // 等待加载完成
    await expect(this.loadingOverlay).not.toBeVisible({ timeout: 10000 })
    await expect(this.hud).toBeVisible()
    await expect(this.healthBar).toBeVisible()
    await expect(this.crosshair).toBeVisible()
  }

  async clickExit() {
    await this.exitButton.click()
  }

  async getHealthValue(): Promise<number> {
    const fill = this.healthBar.locator('.fill')
    const style = await fill.getAttribute('style')
    const match = style?.match(/width:\s*(\d+)%/)
    return match ? parseInt(match[1]) : 0
  }

  async getScoreText(): Promise<string> {
    return this.scoreDisplay.textContent() || ''
  }
}