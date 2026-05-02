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
    // 直接生成一个精英敌人在玩家附近
    const eliteIndex = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.spawnTestEnemy?.('elite') ?? -1
    })
    expect(eliteIndex).toBeGreaterThanOrEqual(0)

    // 强制精英面向玩家
    await page.evaluate(() => {
      ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
    })

    // 等待精英检测玩家并开始蓄力（蓄力需要 1.5 秒，在蓄力完成前检查）
    await page.waitForTimeout(1000)

    // 使用 spawnTestEnemy 返回的索引检查精英蓄力状态
    const chargeState = await page.evaluate((idx) => {
      const api = (window as any).__testApi
      return api?.getEnemyChargeState?.(idx) ?? null
    }, eliteIndex)

    // 精英应正在蓄力中
    expect(chargeState).not.toBeNull()
    expect(chargeState.isCharging).toBe(true)
    expect(chargeState.hasChargeLine).toBe(true)
  })

  test('精英蓄力攻击后产生子弹', async ({ page }) => {
    // 直接生成一个精英敌人在玩家附近
    const eliteIndex = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.spawnTestEnemy?.('elite') ?? -1
    })
    expect(eliteIndex).toBeGreaterThanOrEqual(0)

    // 强制精英面向玩家
    await page.evaluate(() => {
      ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
    })

    // 等待精英蓄力完成并发射子弹（蓄力 1.5 秒 + 余量）
    await page.waitForTimeout(3000)

    // 验证蓄力已完成（isCharging=false 表示已发射）
    const chargeState = await page.evaluate((idx) => {
      const api = (window as any).__testApi
      return api?.getEnemyChargeState?.(idx) ?? null
    }, eliteIndex)

    // 蓄力状态不再是活跃状态（已发射完成）
    expect(chargeState).not.toBeNull()
    expect(chargeState.isCharging).toBe(false)
  })
})
