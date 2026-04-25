# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0030-enemy-projectile-damage.spec.ts >> 子弹命中伤害反馈 >> 死亡后弹出死亡界面
- Location: tests/e2e/kids-game-platform/TC0030-enemy-projectile-damage.spec.ts:35:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - heading "小勇士大冒险" [level=1] [ref=e10]
  - generic [ref=e12]:
    - button "开始游戏" [ref=e13] [cursor=pointer]:
      - generic [ref=e14]: 开始游戏
    - button "设置" [ref=e15] [cursor=pointer]:
      - generic [ref=e16]: 设置
    - button "退出" [ref=e17] [cursor=pointer]:
      - generic [ref=e18]: 退出
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { GamePage } from '../../../pages/GamePage'
  3  | 
  4  | /**
  5  |  * TC0030 - 子弹命中伤害反馈测试
  6  |  *
  7  |  * 测试内容：
  8  |  * 1. 系统 API 支持获取玩家血量
  9  |  * 2. 系统 API 可触发玩家伤害
  10 |  * 3. 死亡后弹出死亡界面
  11 |  */
  12 | 
  13 | test.describe('子弹命中伤害反馈', () => {
  14 |   let gamePage: GamePage
  15 | 
  16 |   test.beforeEach(async ({ page }) => {
  17 |     gamePage = new GamePage(page)
  18 |     await gamePage.goto()
  19 |     await gamePage.waitForLoaded()
  20 |     await gamePage.expectLoaded()
  21 |   })
  22 | 
  23 |   test('玩家血量 API 正常工作', async ({ page }) => {
  24 |     // 检查初始血量
  25 |     const initialHealth = await gamePage.getPlayerHealth()
  26 |     expect(initialHealth).toBe(100)
  27 | 
  28 |     // 通过 API 造成伤害
  29 |     await gamePage.takePlayerDamage(30)
  30 | 
  31 |     const healthAfter = await gamePage.getPlayerHealth()
  32 |     expect(healthAfter).toBe(70)
  33 |   })
  34 | 
  35 |   test('死亡后弹出死亡界面', async ({ page }) => {
  36 |     // 通过 API 直接致死
  37 |     await gamePage.takePlayerDamage(200)
  38 | 
  39 |     // 检查死亡界面
  40 |     const deathScreen = page.locator('.death-screen')
  41 |     await expect(deathScreen).toBeVisible({ timeout: 5000 })
  42 | 
  43 |     // 关闭死亡界面回到主页
  44 |     const homeButton = page.locator('.death-screen button').filter({ hasText: '返回主页' })
  45 |     await homeButton.click({ force: true })
  46 | 
  47 |     // 检查是否回到主页
> 48 |     await page.waitForTimeout(2000)
     |                ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  49 |     const homePageTitle = page.locator('h1', { hasText: '小勇士大冒险' })
  50 |     await expect(homePageTitle).toBeVisible({ timeout: 10000 })
  51 |   })
  52 | })
  53 | 
```