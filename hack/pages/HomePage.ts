import { type Page, type Locator, expect } from '@playwright/test'

export class HomePage {
  readonly page: Page

  // 主页面元素
  readonly logoText: Locator
  readonly heroTitle: Locator
  readonly heroSubtitle: Locator
  readonly gameCards: Locator
  readonly gameCard: Locator

  // 导航元素
  readonly settingsLink: Locator

  constructor(page: Page) {
    this.page = page

    // 主页面元素定位器
    this.logoText = page.locator('h1').first()
    this.heroTitle = page.locator('h2').first()
    this.heroSubtitle = page.locator('p').first()
    this.gameCards = page.locator('.game-card')
    this.gameCard = page.locator('.game-card').first()

    // 导航
    this.settingsLink = page.locator('a[href*="settings"], a[href*="Settings"]')
  }

  /**
   * 导航到首页
   */
  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173')
  }

  /**
   * 等待页面加载完成
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/游戏|儿童/i)
    await expect(this.logoText).toBeVisible()
  }

  /**
   * 点击设置链接
   */
  async clickSettings(): Promise<void> {
    await this.settingsLink.click()
  }

  /**
   * 点击第一个游戏卡片
   */
  async clickFirstGame(): Promise<void> {
    const playBtn = this.gameCard.locator('.play-btn, button')
    await playBtn.click()
  }

  /**
   * 悬停在游戏卡片上
   */
  async hoverFirstGame(): Promise<void> {
    await this.gameCard.hover()
  }
}