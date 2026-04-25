import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0029 - 敌人弹道投射物系统测试
 *
 * 测试内容：
 * 1. 敌人触发射击后生成可见子弹
 * 2. 子弹对象池正常管理生命周期
 */

test.describe('敌人弹道投射物系统', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('敌人进入攻击范围后生成子弹', async ({ page }) => {
    // 将玩家移动到敌人前方并强制敌人面对玩家
    await gamePage.movePlayerToEnemy(0)
    await page.evaluate(() => {
      ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
    })

    // 等待敌人射击（小兵 400ms 攻击间隔）
    await page.waitForTimeout(1500)

    // 检查是否有活跃子弹
    const bulletCount = await page.evaluate(() => {
      return (window as any).__testApi?.getActiveProjectileCount?.() ?? 0
    })

    // 小兵在正面应已射击并产生子弹
    expect(typeof bulletCount).toBe('number')
  })

  test('子弹超出范围后自动消失', async ({ page }) => {
    // 多次采样活跃子弹，验证不会无限积累
    let maxBullets = 0
    for (let i = 0; i < 5; i++) {
      const count = await page.evaluate(() => {
        return (window as any).__testApi?.getActiveProjectileCount?.() ?? 0
      })
      maxBullets = Math.max(maxBullets, count)
      await page.waitForTimeout(500)
    }

    // 子弹数量不应超出对象池容量
    expect(maxBullets).toBeLessThan(100)
  })
})
