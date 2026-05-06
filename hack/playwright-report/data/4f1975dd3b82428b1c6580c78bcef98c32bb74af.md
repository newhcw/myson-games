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
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.death-screen button').filter({ hasText: '返回主页' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic: ❤️
        - generic:
          - generic:
            - generic: ⭐
            - generic: "0"
          - generic:
            - generic: ⚔️
            - generic: "0"
      - generic:
        - generic: ⚔️
        - generic: 第 1 / 10 波
      - generic:
        - generic:
          - generic: "1"
          - generic: "2"
          - generic: "3"
          - generic: "4"
          - generic: "5"
          - generic: "6"
        - generic:
          - generic: 手枪
          - generic: 12 / 48
      - generic:
        - paragraph: WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜
    - button "退出游戏" [ref=e6] [cursor=pointer]
    - generic [ref=e7]:
      - generic:
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
        - generic: 🍂
      - generic [ref=e9]:
        - generic [ref=e10]: 🌿 💀 🌿
        - heading "勇者倒下了..." [level=1] [ref=e11]
        - paragraph [ref=e12]: 但森林会记住你的勇气
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e16]: ⏱️
            - generic [ref=e17]: 存活时间
            - generic [ref=e18]: 0:00
          - generic [ref=e19]:
            - generic [ref=e21]: ⚔️
            - generic [ref=e22]: 击败敌人
            - generic [ref=e23]: "0"
          - generic [ref=e24]:
            - generic [ref=e26]: ⭐
            - generic [ref=e27]: 获得星星
            - generic [ref=e28]: "0"
        - generic [ref=e29]:
          - button "🌱 再次挑战" [ref=e30] [cursor=pointer]:
            - generic [ref=e31]: 🌱
            - generic [ref=e32]: 再次挑战
          - button "🏕️ 返回营地" [ref=e33] [cursor=pointer]:
            - generic [ref=e34]: 🏕️
            - generic [ref=e35]: 返回营地
  - generic:
    - generic: 小兵
    - generic: 100/100
  - generic:
    - generic: 小兵
    - generic: 100/100
  - generic:
    - generic: 小兵
    - generic: 100/100
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
> 45 |     await homeButton.click({ force: true })
     |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  46 | 
  47 |     // 检查是否回到主页
  48 |     await page.waitForTimeout(2000)
  49 |     const homePageTitle = page.locator('h1', { hasText: '肉肉森林大冒险' })
  50 |     await expect(homePageTitle).toBeVisible({ timeout: 10000 })
  51 |   })
  52 | })
  53 | 
```