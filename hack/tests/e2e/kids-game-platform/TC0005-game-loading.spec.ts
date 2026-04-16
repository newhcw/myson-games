import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'
import { HomePage } from '../../../pages/HomePage'

/**
 * TC0014: 游戏加载后应显示游戏场景（替代TC0014）
 * TC0015: 游戏加载完成后应显示 HUD
 * TC0016: 3D 场景元素应正确渲染
 */
test.describe('游戏加载测试', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
  })

  test('TC0014 - 游戏加载后应显示游戏场景', async ({ page }) => {
    // 由于加载很快完成，验证加载完成后场景可见
    // 等待足够时间让加载完成
    await page.waitForTimeout(1000)

    // 验证游戏房间容器存在
    const gameRoom = page.locator('.game-room')
    await expect(gameRoom).toBeVisible()

    // 验证场景容器内部有内容
    const sceneView = page.locator('.game-room .scene-view')
    const hasScene = await sceneView.count() > 0 || await page.locator('canvas').count() > 0
    expect(hasScene).toBe(true)
  })

  test('TC0015 - 游戏加载完成后应显示 HUD', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded()

    // 验证 HUD 元素可见
    await expect(gamePage.hud).toBeVisible()
    await expect(gamePage.healthBar).toBeVisible()
    await expect(gamePage.scoreDisplay).toBeVisible()
  })

  test('TC0016 - 游戏场景应正确渲染', async () => {
    // 等待游戏加载完成
    await expect(gamePage.loading).not.toBeVisible({ timeout: 30000 })

    // 验证游戏房间容器存在
    await expect(gamePage.gameRoom).toBeVisible()

    // 验证控制提示可见
    await expect(gamePage.controlsHint).toBeVisible()
  })
})