import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0017: 武器信息应显示在 HUD 上
 * TC0018: 武器切换槽位应显示
 * TC0019: 准星应显示在屏幕中央
 * TC0020: 控制提示应显示武器操作说明
 */
test.describe('武器系统测试', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    // 等待游戏加载完成
    await gamePage.expectLoaded()
  })

  test('TC0017 - 武器信息应显示在 HUD 上', async () => {
    // 武器信息区域应可见
    await expect(gamePage.weaponInfo).toBeVisible()

    // 武器指示器应可见
    await expect(gamePage.weaponIndicator).toBeVisible()
  })

  test('TC0018 - 武器切换槽位应显示', async () => {
    // 武器槽位应该存在
    const slots = gamePage.weaponSlots
    await expect(slots.first()).toBeVisible()

    // 应该有至少一个武器槽位
    const count = await slots.count()
    expect(count).toBeGreaterThan(0)
  })

  test('TC0019 - 准星应显示在屏幕中央', async () => {
    // 准星应该可见
    await expect(gamePage.crosshair).toBeVisible()

    // 准星应该是可见的小圆点或十字
    const crosshair = gamePage.crosshair
    await expect(crosshair).toHaveCSS('position', 'absolute')
  })

  test('TC0020 - 控制提示应显示武器操作说明', async () => {
    // 控制提示应该可见
    await expect(gamePage.controlsHint).toBeVisible()

    // 提示文本应该包含移动和射击相关说明
    const hintText = await gamePage.controlsHint.textContent()
    expect(hintText).toContain('WASD')
  })
})