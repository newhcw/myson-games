import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'

test.describe('退出游戏测试', () => {
  test('TC0012-退出游戏应返回首页', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.expectLoaded()

    // 进入游戏
    await homePage.clickGameCard('小小神枪手')
    await expect(page).toHaveURL(/.*\/game/)

    // 等待游戏加载
    const gamePage = new GamePage(page)
    await gamePage.expectLoaded()

    // 退出游戏
    await gamePage.clickExit()

    // 验证返回首页
    await homePage.expectLoaded()
  })

  test('TC0013-从设置页面返回首页', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.expectLoaded()

    // 进入设置
    await homePage.clickSettings()
    await expect(page).toHaveURL('/settings')

    // 点击返回
    await page.click('.back-btn')

    // 验证返回首页
    await homePage.expectLoaded()
  })
})