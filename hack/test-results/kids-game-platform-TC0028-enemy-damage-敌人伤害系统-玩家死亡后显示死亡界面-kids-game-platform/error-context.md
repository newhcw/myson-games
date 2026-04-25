# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0028-enemy-damage.spec.ts >> 敌人伤害系统 >> 玩家死亡后显示死亡界面
- Location: tests\e2e\kids-game-platform\TC0028-enemy-damage.spec.ts:33:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.death-screen')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.death-screen')

```

# Page snapshot

```yaml
- generic [ref=e3] [cursor=pointer]:
  - generic:
    - generic:
      - generic:
        - generic: 生命值
      - generic:
        - generic: "得分: 0"
        - generic: "击杀: 0"
    - generic:
      - generic:
        - generic: "1"
        - generic: "2"
        - generic: "3"
        - generic: "4"
        - generic: "5"
      - generic:
        - generic: 手枪
        - generic: 12 / 48
    - generic:
      - paragraph: WASD 移动 | 鼠标控制视角 | 1-5/Q 切换武器 | R 换弹 | 右键倍镜
  - button "退出游戏" [ref=e6]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * TC0028 - 敌人伤害系统测试
  5   |  *
  6   |  * 测试内容：
  7   |  * 1. 玩家死亡界面显示
  8   |  * 2. 死亡界面统计信息
  9   |  * 3. 重新开始功能
  10  |  * 4. 返回主页功能
  11  |  */
  12  | 
  13  | test.describe('敌人伤害系统', () => {
  14  |   test.beforeEach(async ({ page }) => {
  15  |     // 先访问主页
  16  |     await page.goto('/')
  17  | 
  18  |     // 等待主页加载
  19  |     await page.waitForSelector('h1', { hasText: '儿童游戏平台', timeout: 10000 })
  20  | 
  21  |     // 点击进入游戏
  22  |     const gameButton = page.locator('button', { hasText: '开始游戏' })
  23  |     await gameButton.click()
  24  | 
  25  |     // 等待游戏页面加载
  26  |     await page.waitForSelector('.game-room', { timeout: 15000 })
  27  | 
  28  |     // 点击游戏区域以获得焦点
  29  |     await page.click('.game-room')
  30  |     await page.waitForTimeout(500)
  31  |   })
  32  | 
  33  |   test('玩家死亡后显示死亡界面', async ({ page }) => {
  34  |     // 使用当前环境中能够访问的API
  35  | 
  36  |     // 直接通过evaluate调用方法
  37  |     await page.evaluate(() => {
  38  |       // 创建游戏存储的接口（避免usGameStore不存在问题）
  39  |       if (!window.__gameStore) {
  40  |         window.__gameStore = {
  41  |           health: 100,
  42  |           gameState: 'playing',
  43  |           takeDamage(amount: number) {
  44  |             this.health = Math.max(0, this.health - amount)
  45  |             if (this.health <= 0) {
  46  |               this.gameState = 'ended'
  47  |             }
  48  |           }
  49  |         }
  50  |       }
  51  |       // 让玩家死亡
  52  |       for (let i = 0; i < 10; i++) {
  53  |         window.__gameStore.takeDamage(15)
  54  |       }
  55  |     })
  56  | 
  57  |     // 等待死亡界面出现
  58  |     await page.waitForTimeout(300)
  59  | 
  60  |     // 检查死亡界面是否显示
  61  |     const deathScreen = page.locator('.death-screen')
> 62  |     await expect(deathScreen).toBeVisible()
      |                               ^ Error: expect(locator).toBeVisible() failed
  63  |   })
  64  | 
  65  |   test('死亡界面显示统计信息', async ({ page }) => {
  66  |     // 创建游戏角色存储
  67  |     await page.evaluate(() => {
  68  |       if (!window.__gameStore) {
  69  |         window.__gameStore = {
  70  |           health: 100,
  71  |           gameState: 'playing',
  72  |           score: 0,
  73  |           kills: 0,
  74  |           gameTime: 0,
  75  |           takeDamage(amount: number) {
  76  |             this.health = Math.max(0, this.health - amount)
  77  |             if (this.health <= 0) {
  78  |               this.gameState = 'ended'
  79  |             }
  80  |           }
  81  |         }
  82  |       }
  83  |       // 让玩家死亡
  84  |       for (let i = 0; i < 10; i++) {
  85  |         window.__gameStore.takeDamage(15)
  86  |       }
  87  |     })
  88  | 
  89  |     await page.waitForTimeout(300)
  90  | 
  91  |     // 检查死亡界面内容
  92  |     const title = page.locator('.death-screen .title')
  93  |     await expect(title).toContainText('阵亡')
  94  | 
  95  |     // 检查统计卡片存在（存活时间、击杀数、得分）
  96  |     const stats = page.locator('.death-screen .stat-card')
  97  |     await expect(stats).toHaveCount(3)
  98  |   })
  99  | 
  100 |   test('点击重新开始按钮重置游戏', async ({ page }) => {
  101 |     // 创建游戏角色存储
  102 |     await page.evaluate(() => {
  103 |       if (!window.__gameStore) {
  104 |         window.__gameStore = {
  105 |           health: 100,
  106 |           gameState: 'playing',
  107 |           score: 0,
  108 |           kills: 0,
  109 |           gameTime: 0,
  110 |           takeDamage(amount: number) {
  111 |             this.health = Math.max(0, this.health - amount)
  112 |             if (this.health <= 0) {
  113 |               this.gameState = 'ended'
  114 |             }
  115 |           }
  116 |         }
  117 |       }
  118 |       // 让玩家死亡
  119 |       for (let i = 0; i < 10; i++) {
  120 |         window.__gameStore.takeDamage(15)
  121 |       }
  122 |     })
  123 | 
  124 |     await page.waitForTimeout(300)
  125 | 
  126 |     // 点击重新开始按钮
  127 |     const restartButton = page.locator('.btn-primary')
  128 |     await restartButton.click()
  129 | 
  130 |     await page.waitForTimeout(500)
  131 | 
  132 |     // 检查死亡界面是否消失
  133 |     const deathScreen = page.locator('.death-screen')
  134 |     await expect(deathScreen).not.toBeVisible()
  135 | 
  136 |     // 检查血量是否重置为100
  137 |     const health = await page.evaluate(() => {
  138 |       return (window as any).__gameStore?.health || 0
  139 |     })
  140 |     expect(health).toBe(100)
  141 |   })
  142 | 
  143 |   test('点击返回主页按钮跳转', async ({ page }) => {
  144 |     // 创建游戏角色存储
  145 |     await page.evaluate(() => {
  146 |       if (!window.__gameStore) {
  147 |         window.__gameStore = {
  148 |           health: 100,
  149 |           gameState: 'playing',
  150 |           score: 0,
  151 |           kills: 0,
  152 |           gameTime: 0,
  153 |           takeDamage(amount: number) {
  154 |             this.health = Math.max(0, this.health - amount)
  155 |             if (this.health <= 0) {
  156 |               this.gameState = 'ended'
  157 |             }
  158 |           }
  159 |         }
  160 |       }
  161 |       // 让玩家死亡
  162 |       for (let i = 0; i < 10; i++) {
```