import { type Page, type Locator, expect } from '@playwright/test'

export class SettingsPage {
  readonly page: Page
  readonly header: Locator
  readonly backButton: Locator
  readonly volumeSlider: Locator
  readonly difficultySelect: Locator
  readonly showDamageCheckbox: Locator
  readonly autoAimCheckbox: Locator
  readonly resetButton: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('.header')
    this.backButton = page.locator('.back-btn')
    this.volumeSlider = page.locator('input[type="range"]')
    this.difficultySelect = page.locator('select')
    this.showDamageCheckbox = page.locator('input[type="checkbox"]').first()
    this.autoAimCheckbox = page.locator('input[type="checkbox"]').nth(1)
    this.resetButton = page.locator('.reset-btn')
    this.saveButton = page.locator('.save-btn')
  }

  async goto() {
    await this.page.goto('/settings')
  }

  async expectLoaded() {
    await expect(this.header).toBeVisible()
    await expect(this.backButton).toBeVisible()
    await expect(this.saveButton).toBeVisible()
  }

  async setVolume(value: number) {
    await this.volumeSlider.fill(value.toString())
  }

  async selectDifficulty(difficulty: 'easy' | 'normal' | 'hard') {
    await this.difficultySelect.selectOption(difficulty)
  }

  async clickSave() {
    await this.saveButton.click()
  }

  async clickReset() {
    await this.resetButton.click()
  }
}