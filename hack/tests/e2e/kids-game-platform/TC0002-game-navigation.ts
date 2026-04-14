import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'

test.describe('游戏导航测试', () => {
  test('TC0004-点击游戏卡片应进入游戏页面', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.expectLoaded()

    // 点击游戏卡片
    await homePage.clickGameCard('小小神枪手')

    // 验证 URL 变化
    await expect(page).toHaveURL(/.*\/game/)

    // 验证游戏页面加载
    const gamePage = new GamePage(page)
    await gamePage.expectLoaded()
  })

  test('TC0005-游戏页面应显示正确的 HUD 元素', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectLoaded()

    // 验证 HUD 元素
    await expect(gamePage.healthBar).toBeVisible()
    await expect(gamePage.crosshair).toBeVisible()
    await expect(gamePage.weaponInfo).toContainText('手枪')
  })

  test('TC0006-游戏页面应显示初始生命值', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectLoaded()

    const health = await gamePage.getHealthValue()
    expect(health).toBe(100)
  })
})