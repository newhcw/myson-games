import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0041 - 波次递进测试
 *
 * 测试内容：
 * 1. 第 2 波敌人数量多于第 1 波
 * 2. 波次编号正确递增
 */

test.describe('波次递进', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('第 2 波敌人数量多于第 1 波', async ({ page }) => {
    // 等待第 1 波敌人完全生成
    await page.waitForTimeout(2000)

    // 击杀第 1 波所有敌人
    for (let i = 0; i < 5; i++) {
      const enemies = await page.evaluate(() => {
        const api = (window as any).__testApi
        return api?.getEnemies?.() ?? []
      })
      if (enemies.length === 0) break

      await page.evaluate(() => {
        const api = (window as any).__testApi
        api?.shootEnemy?.(0)
      })
      await page.waitForTimeout(500)
    }

    // 等待间歇结束，第 2 波开始
    // 等待间歇倒计时 (5s) + 缓冲
    await page.waitForTimeout(7000)

    // 获取第 2 波敌人数量
    const enemies = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemies?.() ?? []
    })

    // 第 2 波应有 5 个敌人（多于第 1 波的 3 个）
    expect(enemies.length).toBe(5)

    // 验证波次显示已更新
    const waveText = await gamePage.getWaveDisplayText()
    expect(waveText).toContain('第 2')
  })

  test('波次编号正确递增', async ({ page }) => {
    // 等待第 1 波生成
    await page.waitForTimeout(2000)

    // 验证第 1 波
    let currentWave = await gamePage.getCurrentWave()
    expect(currentWave).toBe(1)

    // 击杀第 1 波所有敌人
    for (let i = 0; i < 5; i++) {
      const enemies = await page.evaluate(() => {
        const api = (window as any).__testApi
        return api?.getEnemies?.() ?? []
      })
      if (enemies.length === 0) break

      await page.evaluate(() => {
        const api = (window as any).__testApi
        api?.shootEnemy?.(0)
      })
      await page.waitForTimeout(500)
    }

    // 等待第 2 波开始
    await page.waitForTimeout(7000)

    // 验证波次已递增
    currentWave = await gamePage.getCurrentWave()
    expect(currentWave).toBe(2)
  })
})
