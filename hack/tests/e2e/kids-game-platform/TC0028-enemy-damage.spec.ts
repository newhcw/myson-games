import { test, expect } from '@playwright/test'

/**
 * TC0028 - 敌人伤害系统测试
 *
 * 测试内容：
 * 1. 玩家死亡界面显示
 * 2. 死亡界面统计信息
 * 3. 重新开始功能
 * 4. 返回主页功能
 */

test.describe('敌人伤害系统', () => {
  test.beforeEach(async ({ page }) => {
    // 先访问主页
    await page.goto('/')

    // 等待主页加载
    await page.waitForSelector('h1', { hasText: '儿童游戏平台', timeout: 10000 })

    // 点击进入游戏
    const gameButton = page.locator('button', { hasText: '开始游戏' })
    await gameButton.click()

    // 等待游戏页面加载
    await page.waitForSelector('.game-room', { timeout: 15000 })

    // 点击游戏区域以获得焦点
    await page.click('.game-room')
    await page.waitForTimeout(500)
  })

  test('玩家死亡后显示死亡界面', async ({ page }) => {
    // 使用当前环境中能够访问的API

    // 直接通过evaluate调用方法
    await page.evaluate(() => {
      // 创建游戏存储的接口（避免usGameStore不存在问题）
      if (!window.__gameStore) {
        window.__gameStore = {
          health: 100,
          gameState: 'playing',
          takeDamage(amount: number) {
            this.health = Math.max(0, this.health - amount)
            if (this.health <= 0) {
              this.gameState = 'ended'
            }
          }
        }
      }
      // 让玩家死亡
      for (let i = 0; i < 10; i++) {
        window.__gameStore.takeDamage(15)
      }
    })

    // 等待死亡界面出现
    await page.waitForTimeout(300)

    // 检查死亡界面是否显示
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).toBeVisible()
  })

  test('死亡界面显示统计信息', async ({ page }) => {
    // 创建游戏角色存储
    await page.evaluate(() => {
      if (!window.__gameStore) {
        window.__gameStore = {
          health: 100,
          gameState: 'playing',
          score: 0,
          kills: 0,
          gameTime: 0,
          takeDamage(amount: number) {
            this.health = Math.max(0, this.health - amount)
            if (this.health <= 0) {
              this.gameState = 'ended'
            }
          }
        }
      }
      // 让玩家死亡
      for (let i = 0; i < 10; i++) {
        window.__gameStore.takeDamage(15)
      }
    })

    await page.waitForTimeout(300)

    // 检查死亡界面内容
    const title = page.locator('.death-screen .title')
    await expect(title).toContainText('阵亡')

    // 检查统计卡片存在（存活时间、击杀数、得分）
    const stats = page.locator('.death-screen .stat-card')
    await expect(stats).toHaveCount(3)
  })

  test('点击重新开始按钮重置游戏', async ({ page }) => {
    // 创建游戏角色存储
    await page.evaluate(() => {
      if (!window.__gameStore) {
        window.__gameStore = {
          health: 100,
          gameState: 'playing',
          score: 0,
          kills: 0,
          gameTime: 0,
          takeDamage(amount: number) {
            this.health = Math.max(0, this.health - amount)
            if (this.health <= 0) {
              this.gameState = 'ended'
            }
          }
        }
      }
      // 让玩家死亡
      for (let i = 0; i < 10; i++) {
        window.__gameStore.takeDamage(15)
      }
    })

    await page.waitForTimeout(300)

    // 点击重新开始按钮
    const restartButton = page.locator('.btn-primary')
    await restartButton.click()

    await page.waitForTimeout(500)

    // 检查死亡界面是否消失
    const deathScreen = page.locator('.death-screen')
    await expect(deathScreen).not.toBeVisible()

    // 检查血量是否重置为100
    const health = await page.evaluate(() => {
      return (window as any).__gameStore?.health || 0
    })
    expect(health).toBe(100)
  })

  test('点击返回主页按钮跳转', async ({ page }) => {
    // 创建游戏角色存储
    await page.evaluate(() => {
      if (!window.__gameStore) {
        window.__gameStore = {
          health: 100,
          gameState: 'playing',
          score: 0,
          kills: 0,
          gameTime: 0,
          takeDamage(amount: number) {
            this.health = Math.max(0, this.health - amount)
            if (this.health <= 0) {
              this.gameState = 'ended'
            }
          }
        }
      }
      // 让玩家死亡
      for (let i = 0; i < 10; i++) {
        window.__gameStore.takeDamage(15)
      }
    })

    await page.waitForTimeout(300)

    // 点击返回主页按钮
    const homeButton = page.locator('.btn-secondary')
    await homeButton.click()

    // 等待导航到主页 (加长一点等待时间)
    await page.waitForTimeout(2000)

    // 检查是否回到主页 - 使用更稳定的查找方式
    const homePageTitle = page.locator('h1', { hasText: '儿童游戏平台' })
    await expect(homePageTitle).toBeVisible()
  })
})