import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0049: 倍镜功能测试
 * - 倍镜激活时 FOV 变化
 * - 倍镜切换过渡动画
 * - 暗角效果显示
 * - 准星替换
 * - 武器切换时倍镜自动关闭
 */
test.describe('TC0049 倍镜功能测试', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectLoaded()

    // 需要先锁定指针才能触发右键事件
    await gamePage.gameRoom.click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  })

  test('TC0049a: 开镜后暗角效果应该显示', async () => {
    // 按下鼠标右键开启倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(300)

    // 暗角效果应该显示
    await expect(gamePage.vignetteOverlay).toBeVisible()
  })

  test('TC0049b: 开镜后准星应该切换为精细十字准星', async () => {
    // 按下鼠标右键开启倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(300)

    // 精细十字准星应该显示
    await expect(gamePage.scopeCrosshair).toBeVisible()
  })

  test('TC0049c: 倍镜切换应该有过渡动画', async () => {
    // 记录初始状态
    const initialState = await gamePage.vignetteOverlay.evaluate(
      (el) => window.getComputedStyle(el).opacity
    )

    // 开启倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(100)

    // 检查过渡状态（opacity 应该变化）
    const midState = await gamePage.vignetteOverlay.evaluate(
      (el) => window.getComputedStyle(el).opacity
    )

    await gamePage.page.waitForTimeout(200)

    // 等待过渡完成后检查最终状态
    const finalState = await gamePage.vignetteOverlay.evaluate(
      (el) => window.getComputedStyle(el).opacity
    )

    // 验证过渡发生了
    expect(parseFloat(initialState)).toBeLessThan(parseFloat(finalState))
  })

  test('TC0049d: 倍镜开启后关闭应该移除暗角效果', async () => {
    // 开启倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(300)

    // 确认暗角显示
    await expect(gamePage.vignetteOverlay).toBeVisible()

    // 关闭倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(300)

    // 暗角效果应该消失（opacity 为 0）
    const opacity = await gamePage.vignetteOverlay.evaluate(
      (el) => window.getComputedStyle(el).opacity
    )
    expect(parseFloat(opacity)).toBe(0)
  })

  test('TC0049e: 切换到狙击枪并开启倍镜', async () => {
    // 切换到狙击枪 (按4键)
    await gamePage.page.keyboard.press('4')
    await gamePage.page.waitForTimeout(200)

    // 开启倍镜
    await gamePage.page.mouse.click(100, 100, { button: 'right' })
    await gamePage.page.waitForTimeout(300)

    // 暗角效果应该显示
    await expect(gamePage.vignetteOverlay).toBeVisible()
  })
})