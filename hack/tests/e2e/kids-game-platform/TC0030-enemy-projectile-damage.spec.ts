import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0030 - 子弹命中伤害反馈测试
 *
 * 测试内容：
 * 1. 系统 API 支持获取玩家血量
 * 2. 系统 API 可触发玩家伤害
 * 3. 死亡后弹出死亡界面
 */

test.describe('子弹命中伤害反馈', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('玩家血量 API 正常工作', async ({ page }) => {
    // 检查初始血量
    const initialHealth = await gamePage.getPlayerHealth()
    expect(initialHealth).toBe(100)

    // 通过 API 造成伤害
    await gamePage.takePlayerDamage(30)

    const healthAfter = await gamePage.getPlayerHealth()
    expect(healthAfter).toBe(70)
  })

  test('死亡后弹出死亡界面', async ({ page }) => {
    // 通过 API 直接致死
    await gamePage.takePlayerDamage(200)

    // 检查死亡界面
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible({ timeout: 5000 })

    // 关闭死亡界面回到主页
    const homeButton = page.locator('.death-screen button').filter({ hasText: '返回主页' })
    await homeButton.click({ force: true })

    // 检查是否回到主页
    await page.waitForTimeout(2000)
    const homePageTitle = page.locator('h1', { hasText: '肉肉森林大冒险' })
    await expect(homePageTitle).toBeVisible({ timeout: 10000 })
  })
})
