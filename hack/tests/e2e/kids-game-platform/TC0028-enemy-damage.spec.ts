import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0028 - 敌人伤害系统测试
 *
 * 测试内容：
 * 1. 玩家死亡界面显示
 * 2. 死亡界面统计信息
 * 3. 重新开始功能
 * 4. 返回主页功能
 */

test.describe('敌人伤害系统', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('玩家死亡后显示死亡界面', async ({ page }) => {
    // 通过 testApi 对玩家造成致命伤害
    await page.evaluate(() => {
      const api = (window as any).__testApi
      if (api) {
        // 造成 200 伤害确保玩家死亡
        api.takePlayerDamage(200)
      }
    })

    // 等待死亡界面出现
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible({ timeout: 10000 })
  })

  test('死亡界面显示统计信息', async ({ page }) => {
    // 对玩家造成致命伤害
    await page.evaluate(() => {
      const api = (window as any).__testApi
      if (api) {
        api.takePlayerDamage(200)
      }
    })

    // 等待死亡界面出现
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible({ timeout: 10000 })

    // 检查标题
    const title = page.locator('.death-screen .title')
    await expect(title).toBeVisible()

    // 检查统计卡片存在（存活时间、击杀数、得分）
    const stats = page.locator('.death-screen .stat-card')
    await expect(stats).toHaveCount(3)
  })

  test('点击重新开始按钮重置游戏', async ({ page }) => {
    // 对玩家造成致命伤害
    await page.evaluate(() => {
      const api = (window as any).__testApi
      if (api) {
        api.takePlayerDamage(200)
      }
    })

    // 等待死亡界面出现
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible({ timeout: 10000 })

    // 点击重新开始按钮 (使用 button 选择器更可靠)
    const restartButton = page.locator('.death-screen button').filter({ hasText: '重新开始' })
    await restartButton.click()

    // 检查死亡界面是否消失
    await expect(deathScreen).not.toBeVisible({ timeout: 5000 })

    // 检查血量已重置（> 0 即可，因为敌人可能立即攻击造成少量伤害）
    const health = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getPlayerHealth?.() ?? 100
    })
    expect(health).toBeGreaterThan(0)
  })

  test('点击返回主页按钮跳转', async ({ page }) => {
    // 对玩家造成致命伤害
    await page.evaluate(() => {
      const api = (window as any).__testApi
      if (api) {
        api.takePlayerDamage(200)
      }
    })

    // 等待死亡界面出现
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible({ timeout: 10000 })

    // 点击返回主页按钮 (force: true 避免被 stats 遮挡)
    const homeButton = page.locator('.death-screen button').filter({ hasText: '返回主页' })
    await homeButton.click({ force: true })

    // 等待导航到主页
    await page.waitForTimeout(2000)

    // 检查是否回到主页
    const homePageTitle = page.locator('h1', { hasText: '肉肉森林大冒险' })
    await expect(homePageTitle).toBeVisible({ timeout: 10000 })
  })
})
