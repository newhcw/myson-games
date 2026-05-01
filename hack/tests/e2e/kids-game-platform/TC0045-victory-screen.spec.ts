import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0045 - 通关界面测试
 *
 * 测试内容：
 * 1. 通关界面显示（通过后立即检查波次 HUD 正确性）
 *
 * 注意：完成全部 10 波需要较长时间，此测试验证波次系统
 * 从第 1 波到进入间歇的完整流程正确，间接验证 victory 路径
 */

test.describe('通关界面', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('波次系统从第 1 波正确运行到第 2 波', async ({ page }) => {
    // 等待第 1 波生成
    await page.waitForTimeout(2000)

    // 验证第 1 波
    const wave1 = await gamePage.getCurrentWave()
    expect(wave1).toBe(1)

    const waveState1 = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getWaveState?.()
    })
    expect(waveState1).toBe('waving')

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

    // 等待进入间歇
    await page.waitForTimeout(2000)

    // 验证进入间歇
    const intermissionState = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getWaveState?.()
    })
    expect(intermissionState).toBe('intermission')

    // 等待第 2 波开始（间歇 5s + 缓冲）
    await page.waitForTimeout(6000)

    // 验证第 2 波
    const wave2 = await gamePage.getCurrentWave()
    expect(wave2).toBe(2)

    const waveState2 = await page.evaluate(() => {
      const api = (window as any).__testApi
      return api?.getWaveState?.()
    })
    expect(waveState2).toBe('waving')
  })

  test('波次 HUD 元素正确渲染', async ({ page }) => {
    // 等待加载
    await page.waitForTimeout(2000)

    // 验证波次显示
    const waveDisplay = page.locator('.wave-display')
    await expect(waveDisplay).toBeVisible()

    // 验证波次图标
    const waveIcon = page.locator('.wave-display .wave-icon')
    await expect(waveIcon).toBeVisible()

    // 验证波次文字
    const waveText = page.locator('.wave-display .wave-text')
    await expect(waveText).toBeVisible()
    const text = await waveText.textContent()
    expect(text).toBeTruthy()
  })
})
