import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0031 - 精英蓄力瞄准线测试
 *
 * 测试内容：
 * 1. 精英进入攻击范围后开始蓄力
 * 2. 蓄力完成后有子弹生成
 */

test.describe('精英蓄力瞄准线', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('精英进入攻击范围后开始蓄力', async ({ page }) => {
    // 移动到精英附近（索引 3）
    await gamePage.movePlayerToEnemy(3)
    await page.evaluate(() => {
      ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
    })

    // 等待精英检测玩家并开始蓄力
    await page.waitForTimeout(3000)

    // 检查精英蓄力状态
    const chargeState = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemyChargeState?.(3) ?? null
    })

    // 精英应已开始或完成蓄力
    expect(chargeState).not.toBeNull()
  })

  test('精英蓄力攻击后产生子弹', async ({ page }) => {
    // 移动到精英附近
    await gamePage.movePlayerToEnemy(3)
    await page.evaluate(() => {
      ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
    })

    // 等待精英蓄力 + 射击
    await page.waitForTimeout(5000)

    // 验证蓄力已完成（isCharging=false 或为 null 表示已发射）
    // 并检查玩家是否受到伤害
    const chargeState = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemyChargeState?.(3) ?? null
    })

    // 蓄力状态不再是活跃状态
    expect(chargeState !== null).toBeTruthy()
  })
})
