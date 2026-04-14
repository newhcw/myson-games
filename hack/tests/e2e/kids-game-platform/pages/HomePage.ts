import { type Page, type Locator, expect } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly header: Locator
  readonly logo: Locator
  readonly gameCards: Locator
  readonly settingsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('.header')
    this.logo = page.locator('.logo')
    this.gameCards = page.locator('.game-card')
    this.settingsButton = page.locator('.nav-btn')
  }

  async goto() {
    await this.page.goto('/')
  }

  async expectLoaded() {
    await expect(this.header).toBeVisible()
    await expect(this.logo).toContainText('儿童游戏平台')
  }

  async clickGameCard(gameName: string) {
    const card = this.gameCards.filter({ hasText: gameName })
    await card.click()
  }

  async clickSettings() {
    await this.settingsButton.click()
  }
}