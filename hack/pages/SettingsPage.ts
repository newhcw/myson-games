import { type Page, type Locator, expect } from '@playwright/test'

export class SettingsPage {
  readonly page: Page

  // 设置元素
  readonly volumeSlider: Locator
  readonly difficultySelect: Locator
  readonly showDamageCheckbox: Locator
  readonly autoAimCheckbox: Locator
  readonly saveButton: Locator
  readonly resetButton: Locator
  readonly backButton: Locator

  // 页面内容
  readonly content: Locator

  // 标题和结构
  readonly title: Locator
  readonly pageTitle: Locator
  readonly header: Locator

  constructor(page: Page) {
    this.page = page

    // 设置元素定位器
    this.volumeSlider = page.locator('input[type="range"]').first()
    this.difficultySelect = page.locator('select')
    this.showDamageCheckbox = page.locator('input[type="checkbox"]').first()
    this.autoAimCheckbox = page.locator('input[type="checkbox"]').nth(1)
    this.saveButton = page.locator('.save-btn, button:has-text("保存")')
    this.resetButton = page.locator('.reset-btn, button:has-text("重置")')
    this.backButton = page.locator('.back-btn, button:has-text("返回"), a:has-text("返回")')

    // 内容区域
    this.content = page.locator('.content, main')

    // 标题
    this.title = page.locator('h1')
    this.pageTitle = page.locator('h1')
    this.header = page.locator('header')
  }

  /**
   * 导航到设置页面
   */
  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173/settings')
  }

  /**
   * 等待页面加载完成
   */
  async expectLoaded(): Promise<void> {
    await expect(this.pageTitle).toContainText('设置')
    await expect(this.saveButton).toBeVisible()
  }

  /**
   * 调整音量
   */
  async setVolume(value: number): Promise<void> {
    await this.volumeSlider.fill(value.toString())
  }

  /**
   * 选择难度 (别名)
   */
  async setDifficulty(difficulty: 'easy' | 'normal' | 'hard'): Promise<void> {
    await this.selectDifficulty(difficulty)
  }

  /**
   * 选择难度
   */
  async selectDifficulty(difficulty: 'easy' | 'normal' | 'hard'): Promise<void> {
    await this.difficultySelect.selectOption(difficulty)
  }

  /**
   * 点击保存按钮
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click()
  }

  /**
   * 点击保存按钮 (别名)
   */
  async clickSaveButton(): Promise<void> {
    await this.clickSave()
  }

  /**
   * 点击重置按钮
   */
  async clickReset(): Promise<void> {
    // 处理确认对话框
    this.page.on('dialog', async (dialog) => {
      await dialog.accept()
    })
    await this.resetButton.click()
  }

  /**
   * 点击返回按钮
   */
  async clickBack(): Promise<void> {
    await this.backButton.click()
  }

  /**
   * 点击返回按钮 (别名)
   */
  async clickBackButton(): Promise<void> {
    await this.clickBack()
  }
}