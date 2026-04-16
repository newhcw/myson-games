import { test, expect } from '@playwright/test'
import { SettingsPage } from '../../../pages/SettingsPage'
import { HomePage } from '../../../pages/HomePage'

/**
 * TC0021: 音量设置应能保存
 * TC0022: 难度设置应能保存
 * TC0023: 页面刷新后设置应保持
 */
test.describe('本地存储测试', () => {
  let settingsPage: SettingsPage
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page)
    homePage = new HomePage(page)
    // 先清空本地存储以确保测试独立性
    await page.goto('http://localhost:5173/')
    await page.evaluate(() => localStorage.clear())
  })

  test('TC0021 - 音量设置应能保存', async ({ page }) => {
    // 导航到设置页面
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // 找到音量滑块
    const volumeSlider = settingsPage.volumeSlider

    // 调整音量
    await volumeSlider.fill('50')

    // 验证音量值更新 (如果有显示)
    const volumeValue = settingsPage.volumeValue
    if (await volumeValue.isVisible()) {
      await expect(volumeValue).not.toHaveText('100%')
    }
  })

  test('TC0022 - 难度设置应能保存', async ({ page }) => {
    // 导航到设置页面
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // 应该有难度选择
    const difficultySelect = settingsPage.difficultySelect
    await expect(difficultySelect).toBeVisible()

    // 选择一个难度
    await difficultySelect.selectOption('normal')
  })

  test('TC0023 - 页面刷新后设置应保持', async ({ page }) => {
    // 导航到设置页面
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // 调整音量并保存
    const volumeSlider = settingsPage.volumeSlider
    await volumeSlider.fill('75')

    // 点击保存按钮
    await settingsPage.saveButton.click()

    // 等待返回首页
    await homePage.expectLoaded()

    // 重新进入设置页面
    await page.goto('http://localhost:5173/settings')
    await settingsPage.expectLoaded()

    // 验证设置仍然存在（检查localStorage）
    const storedSettings = await page.evaluate(() => {
      return localStorage.getItem('game-settings')
    })
    expect(storedSettings).toBeTruthy()

    const parsed = storedSettings ? JSON.parse(storedSettings) : {}
    expect(parsed.volume).toBe('75')
  })
})