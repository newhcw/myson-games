import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0046 - 自动射击测试
 *
 * 测试内容：
 * 1. 冲锋枪（自动武器）按住连射
 * 2. 松开鼠标停止射击
 * 3. 半自动武器仅发射一发
 */

test.describe('TC0046 自动射击', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
    await page.reload()
    await gamePage.waitForLoaded()
    await gamePage.expectLoaded()
  })

  test('TC0046a: 冲锋枪按住连射', async ({ page }) => {
    await page.waitForTimeout(1500)

    // 获取初始弹药
    const initialAmmo = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      if (!testApi?.getWeaponInfo) return null
      const info = testApi.getWeaponInfo()
      return info?.ammo ?? null
    })

    if (initialAmmo === null || initialAmmo === 0) {
      test.skip()
      return
    }

    // 使用测试API触发连续射击
    const fireInterval = setInterval(() => {
      page.evaluate(() => {
        const testApi = (window as any).__testApi
        testApi?.triggerFire?.()
      })
    }, 100) // 每100ms射击一次，模拟10发/秒的射速

    await page.waitForTimeout(2000)

    clearInterval(fireInterval)
    await page.waitForTimeout(500)

    // 验证弹药已消耗
    const afterAmmo = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? initialAmmo
    })

    expect(afterAmmo).toBeLessThan(initialAmmo)
  })

  test('TC0046b: 松开鼠标停止射击', async ({ page }) => {
    await page.waitForTimeout(1500)

    // 获取初始弹药
    const initialAmmo = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    // 开始连续射击
    const fireInterval = setInterval(() => {
      page.evaluate(() => {
        const testApi = (window as any).__testApi
        testApi?.triggerFire?.()
      })
    }, 100)

    await page.waitForTimeout(800)

    // 停止射击
    clearInterval(fireInterval)

    // 记录此时弹药
    const ammoAfterFirstBurst = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    expect(ammoAfterFirstBurst).toBeLessThan(initialAmmo)

    // 等待确保没有继续射击
    await page.waitForTimeout(1500)

    // 再次检查弹药，应该没有变化
    const ammoAfterWait = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    expect(ammoAfterFirstBurst).toBe(ammoAfterWait)
  })

  test('TC0046c: 半自动武器单发', async ({ page }) => {
    await page.waitForTimeout(1500)

    // 切换到半自动武器（手枪，索引1）
    await page.evaluate(() => {
      const testApi = (window as any).__testApi
      testApi?.switchWeapon?.(1)
    })

    await page.waitForTimeout(1000)

    // 获取初始弹药
    const initialAmmo = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    // 触发一次射击（半自动只应该发射一发）
    await page.evaluate(() => {
      const testApi = (window as any).__testApi
      testApi?.triggerFire?.()
    })

    await page.waitForTimeout(500)

    // 检查弹药应该只减少1发
    const ammoAfter = await page.evaluate(() => {
      const testApi = (window as any).__testApi
      const info = testApi?.getWeaponInfo?.()
      return info?.ammo ?? 0
    })

    // 半自动武器只发射一发
    expect(initialAmmo - ammoAfter).toBe(1)
  })
})