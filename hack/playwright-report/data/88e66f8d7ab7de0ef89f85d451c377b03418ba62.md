# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0028-enemy-damage.spec.ts >> 敌人伤害系统 >> 点击返回主页按钮跳转
- Location: tests/e2e/kids-game-platform/TC0028-enemy-damage.spec.ts:89:3

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
  4   | /**
  5   |  * TC0028 - 敌人伤害系统测试
  6   |  *
  7   |  * 测试内容：
  8   |  * 1. 玩家死亡界面显示
  9   |  * 2. 死亡界面统计信息
  10  |  * 3. 重新开始功能
  11  |  * 4. 返回主页功能
  12  |  */
  13  | 
  14  | test.describe('敌人伤害系统', () => {
  15  |   let gamePage: GamePage
  16  | 
  17  |   test.beforeEach(async ({ page }) => {
  18  |     gamePage = new GamePage(page)
  19  |     await gamePage.goto()
  20  |     await gamePage.waitForLoaded()
  21  |     await gamePage.expectLoaded()
  22  |   })
  23  | 
  24  |   test('玩家死亡后显示死亡界面', async ({ page }) => {
  25  |     // 通过 testApi 对玩家造成致命伤害
  26  |     await page.evaluate(() => {
  27  |       const api = (window as any).__testApi
  28  |       if (api) {
  29  |         // 造成 200 伤害确保玩家死亡
  30  |         api.takePlayerDamage(200)
  31  |       }
  32  |     })
  33  | 
  34  |     // 等待死亡界面出现
  35  |     const deathScreen = page.locator('.death-screen')
  36  |     await expect(deathScreen).toBeVisible({ timeout: 10000 })
  37  |   })
  38  | 
  39  |   test('死亡界面显示统计信息', async ({ page }) => {
  40  |     // 对玩家造成致命伤害
  41  |     await page.evaluate(() => {
  42  |       const api = (window as any).__testApi
  43  |       if (api) {
  44  |         api.takePlayerDamage(200)
  45  |       }
  46  |     })
  47  | 
  48  |     // 等待死亡界面出现
  49  |     const deathScreen = page.locator('.death-screen')
  50  |     await expect(deathScreen).toBeVisible({ timeout: 10000 })
  51  | 
  52  |     // 检查标题
  53  |     const title = page.locator('.death-screen .title')
  54  |     await expect(title).toBeVisible()
  55  | 
  56  |     // 检查统计卡片存在（存活时间、击杀数、得分）
  57  |     const stats = page.locator('.death-screen .stat-card')
  58  |     await expect(stats).toHaveCount(3)
  59  |   })
  60  | 
  61  |   test('点击重新开始按钮重置游戏', async ({ page }) => {
  62  |     // 对玩家造成致命伤害
  63  |     await page.evaluate(() => {
  64  |       const api = (window as any).__testApi
  65  |       if (api) {
  66  |         api.takePlayerDamage(200)
  67  |       }
  68  |     })
  69  | 
  70  |     // 等待死亡界面出现
  71  |     const deathScreen = page.locator('.death-screen')
  72  |     await expect(deathScreen).toBeVisible({ timeout: 10000 })
  73  | 
  74  |     // 点击重新开始按钮 (使用 button 选择器更可靠)
  75  |     const restartButton = page.locator('.death-screen button').filter({ hasText: '重新开始' })
  76  |     await restartButton.click()
  77  | 
  78  |     // 检查死亡界面是否消失
  79  |     await expect(deathScreen).not.toBeVisible({ timeout: 5000 })
  80  | 
  81  |     // 检查血量已重置（> 0 即可，因为敌人可能立即攻击造成少量伤害）
  82  |     const health = await page.evaluate(() => {
  83  |       const api = (window as any).__testApi
  84  |       return api?.getPlayerHealth?.() ?? 100
  85  |     })
  86  |     expect(health).toBeGreaterThan(0)
  87  |   })
  88  | 
  89  |   test('点击返回主页按钮跳转', async ({ page }) => {
  90  |     // 对玩家造成致命伤害
  91  |     await page.evaluate(() => {
  92  |       const api = (window as any).__testApi
  93  |       if (api) {
  94  |         api.takePlayerDamage(200)
  95  |       }
  96  |     })
  97  | 
  98  |     // 等待死亡界面出现
  99  |     const deathScreen = page.locator('.death-screen')
  100 |     await expect(deathScreen).toBeVisible({ timeout: 10000 })
  101 | 
  102 |     // 点击返回主页按钮 (force: true 避免被 stats 遮挡)
  103 |     const homeButton = page.locator('.death-screen button').filter({ hasText: '返回主页' })
> 104 |     await homeButton.click({ force: true })
      |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  105 | 
  106 |     // 等待导航到主页
  107 |     await page.waitForTimeout(2000)
  108 | 
  109 |     // 检查是否回到主页
  110 |     const homePageTitle = page.locator('h1', { hasText: '肉肉森林大冒险' })
  111 |     await expect(homePageTitle).toBeVisible({ timeout: 10000 })
  112 |   })
  113 | })
  114 | 
```