import { test, expect } from '@playwright/test'
import { SettingsPage } from './pages/SettingsPage'
import { HomePage } from './pages/HomePage'

test.describe('设置页面测试', () => {
  test.beforeEach(async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
  })

  test('TC0007-设置页面应正确加载', async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.expectLoaded()
    await expect(page.locator('h1')).toContainText('游戏设置')
  })

  test('TC0008-设置页面应显示所有设置选项', async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.expectLoaded()

    // 验证设置选项存在
    await expect(settingsPage.volumeSlider).toBeVisible()
    await expect(settingsPage.difficultySelect).toBeVisible()
    await expect(settingsPage.showDamageCheckbox).toBeVisible()
    await expect(settingsPage.resetButton).toBeVisible()
  })

  test('TC0009-可以调整音量滑块', async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.expectLoaded()

    // 调整音量
    await settingsPage.setVolume(50)
    await expect(settingsPage.volumeSlider).toHaveValue('50')
  })

  test('TC0010-可以选择难度', async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.expectLoaded()

    // 选择困难难度
    await settingsPage.selectDifficulty('hard')
    await expect(settingsPage.difficultySelect).toHaveValue('hard')
  })

  test('TC0011-保存设置后应返回首页', async ({ page }) => {
    const settingsPage = new SettingsPage(page)
    await settingsPage.expectLoaded()

    // 保存设置
    await settingsPage.clickSave()

    // 验证返回首页
    const homePage = new HomePage(page)
    await homePage.expectLoaded()
  })
})