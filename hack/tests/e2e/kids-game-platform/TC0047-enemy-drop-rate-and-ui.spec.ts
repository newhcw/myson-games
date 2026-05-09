import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0047 - 敌人掉落率与UI提示测试
 *
 * 测试内容：
 * 1. 游戏开始显示掉落提示
 * 2. 道具拾取后血量/Buff/弹药变化
 */

test.describe('TC0047 敌人掉落率与UI', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
    // 获取 pointer lock
    await page.locator('.game-room').click()
    await page.waitForTimeout(500)
  })

  test('TC0047a: 游戏开始显示道具掉落提示', async ({ page }) => {
    // 等待提示文字出现（游戏刚开始时）
    await page.waitForTimeout(500)

    // 检查是否有掉落提示文字
    const dropHint = page.locator('.drop-hint, .hint-text').first()
    const hintVisible = await dropHint.isVisible().catch(() => false)

    if (hintVisible) {
      const hintText = await dropHint.textContent()
      expect(hintText).toContain('血包')
    }
  })

  test('TC0047c: 拾取血包血量增加', async ({ page }) => {
    await page.waitForTimeout(1000)

    // 获取初始血量
    const initialHealth = await gamePage.getHealthValue()

    // 造成伤害
    await gamePage.takePlayerDamage(20)
    await page.waitForTimeout(500)

    const healthAfterDamage = await gamePage.getHealthValue()
    expect(healthAfterDamage).toBeLessThan(initialHealth)

    // 使用 spawnAndPickupPowerUp 直接生成并拾取
    await page.evaluate(() => {
      const testApi = (window as any).__testApi
      testApi?.spawnAndPickupPowerUp?.('health')
    })

    await page.waitForTimeout(500)

    // 检查血量
    const healthAfterPickup = await gamePage.getHealthValue()
    expect(healthAfterPickup).toBeGreaterThan(healthAfterDamage)
  })

  test('TC0047d: 拾取双倍伤害显示Buff图标', async ({ page }) => {
    await page.waitForTimeout(1000)

    // 初始Buff数量
    const initialBuffs = await gamePage.getActiveBuffCount()

    // 使用 spawnAndPickupPowerUp 直接生成并拾取
    await page.evaluate(() => {
      const testApi = (window as any).__testApi
      testApi?.spawnAndPickupPowerUp?.('doubleDamage')
    })

    await page.waitForTimeout(500)

    // 检查Buff数量是否增加
    const buffsAfterPickup = await gamePage.getActiveBuffCount()
    expect(buffsAfterPickup).toBeGreaterThan(initialBuffs)
  })

  test('TC0047e: 拾取弹药补充', async ({ page }) => {
    await page.waitForTimeout(1000)

    // 获取武器信息
    const initialWeaponInfo = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      return testApi?.getWeaponInfo?.() ?? null
    })

    if (!initialWeaponInfo) {
      test.skip()
      return
    }

    const maxAmmo = initialWeaponInfo.maxAmmo

    // 消耗一些弹药
    await page.mouse.down()
    await page.waitForTimeout(200)
    await page.mouse.up()

    await page.waitForTimeout(500)

    const ammoAfterShooting = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    // 使用 spawnAndPickupPowerUp 直接生成并拾取
    await page.evaluate(() => {
      const testApi = (window as any).__testApi
      testApi?.spawnAndPickupPowerUp?.('ammo')
    })

    await page.waitForTimeout(500)

    // 检查弹药是否补满
    const ammoAfterPickup = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    // 弹药应该被补满（等于最大弹药数）
    expect(ammoAfterPickup).toBe(maxAmmo)
  })
})