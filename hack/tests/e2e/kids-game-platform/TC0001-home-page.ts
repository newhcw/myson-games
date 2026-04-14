import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('首页测试', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
  })

  test('TC0001-首页应正确加载并显示标题', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.expectLoaded()
    await expect(page.locator('.hero h2')).toContainText('欢迎来到游戏世界')
  })

  test('TC0002-首页应显示游戏卡片', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.expectLoaded()
    await expect(homePage.gameCards).toHaveCount(1)
    await expect(homePage.gameCards.first()).toContainText('小小神枪手')
  })

  test('TC0003-游戏卡片应有悬停效果', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.expectLoaded()
    const card = homePage.gameCards.first()
    await card.hover()
    // 悬停后应有 transform 变化
    await expect(card).toHaveCSS('transform', /matrix/)
  })
})