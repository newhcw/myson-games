import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0040 - 波次系统基础测试
 *
 * 测试内容：
 * 1. 第 1 波生成 3 个小兵
 * 2. 击杀完成后进入间歇
 */

test.describe('波次系统基础', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('第 1 波生成 3 个小兵', async ({ page }) => {
    // 等待第 1 波敌人完全生成
    await page.waitForTimeout(2000)

    // 获取敌人数量
    const enemies = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemies?.() ?? []
    })

    // 第 1 波应有 3 个敌人
    expect(enemies.length).toBe(3)

    // 验证波次显示
    const waveText = await gamePage.getWaveDisplayText()
    expect(waveText).toContain('第 1')
    expect(waveText).toContain('10')
  })

  test('击杀第 1 波所有敌人后进入间歇', async ({ page }) => {
    // 等待第 1 波敌人完全生成
    await page.waitForTimeout(2000)

    // 击杀所有敌人
    for (let i = 0; i < 3; i++) {
      const enemies = await page.evaluate(() => {
        const api = (window as any).__testApi
        return api?.getEnemies?.() ?? []
      })
      if (enemies.length === 0) break

      await page.evaluate((idx: number) => {
        const api = (window as any).__testApi
        api?.shootEnemy?.(idx)
      }, 0)
      await page.waitForTimeout(500)
    }

    // 等待间歇开始
    await page.waitForTimeout(1000)

    // 验证进入间歇状态
    const waveState = await gamePage.getWaveState()
    expect(waveState).toBe('intermission')

    // 验证间歇倒计时可见
    const isCountdownVisible = await gamePage.isIntermissionCountdownVisible()
    expect(isCountdownVisible).toBe(true)
  })
})
