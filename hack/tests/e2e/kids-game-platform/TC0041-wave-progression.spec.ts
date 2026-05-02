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

  /**
   * 辅助函数：快速清空当前波次
   */
  async function clearCurrentWave(page: any) {
    let attempts = 0
    while (attempts < 15) {
      const count = await page.evaluate(() => {
        const api = (window as any).__testApi
        const enemies = api?.getEnemies?.() ?? []
        if (enemies.length > 0) {
          api?.shootEnemy?.(0)
        }
        return enemies.length
      })
      if (count === 0) break
      await page.waitForTimeout(200)
      attempts++
    }
  }

  test('第 2 波敌人数量多于第 1 波', async ({ page }) => {
    // 等待第 1 波敌人完全生成
    await page.waitForTimeout(1500)

    // 获取第 1 波敌人数量
    const wave1Enemies = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemies?.() ?? []
    })
    expect(wave1Enemies.length).toBe(3) // 第 1 波有 3 个小兵

    // 击杀第 1 波所有敌人
    await clearCurrentWave(page)

    // 验证进入间歇状态
    const waveState = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getWaveState?.()
    })
    expect(waveState).toBe('intermission')

    // 跳过间歇，直接进入第 2 波
    await page.evaluate(() => {
      const api = (window as any).__testApi
      api?.skipIntermission?.()
    })
    await page.waitForTimeout(1000)

    // 获取第 2 波敌人数量
    const wave2Enemies = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getEnemies?.() ?? []
    })

    // 第 2 波应有 5 个敌人（多于第 1 波的 3 个）
    expect(wave2Enemies.length).toBe(5)

    // 验证波次显示已更新
    const waveText = await gamePage.getWaveDisplayText()
    expect(waveText).toContain('第 2')
  })

  test('波次编号正确递增', async ({ page }) => {
    // 等待第 1 波生成
    await page.waitForTimeout(1500)

    // 验证第 1 波
    let currentWave = await gamePage.getCurrentWave()
    expect(currentWave).toBe(1)

    // 击杀第 1 波所有敌人
    await clearCurrentWave(page)

    // 跳过间歇
    await page.evaluate(() => {
      const api = (window as any).__testApi
      api?.skipIntermission?.()
    })
    await page.waitForTimeout(1000)

    // 验证波次已递增
    currentWave = await gamePage.getCurrentWave()
    expect(currentWave).toBe(2)
  })
})
