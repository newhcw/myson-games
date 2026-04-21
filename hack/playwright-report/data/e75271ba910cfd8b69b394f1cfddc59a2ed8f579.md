# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0028-enemy-damage.spec.ts >> 敌人伤害系统 >> 点击返回主页按钮跳转
- Location: tests\e2e\kids-game-platform\TC0028-enemy-damage.spec.ts:143:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.btn-secondary')

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
  163 |         window.__gameStore.takeDamage(15)
  164 |       }
  165 |     })
  166 | 
  167 |     await page.waitForTimeout(300)
  168 | 
  169 |     // 点击返回主页按钮
  170 |     const homeButton = page.locator('.btn-secondary')
> 171 |     await homeButton.click()
      |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  172 | 
  173 |     // 等待导航到主页 (加长一点等待时间)
  174 |     await page.waitForTimeout(2000)
  175 | 
  176 |     // 检查是否回到主页 - 使用更稳定的查找方式
  177 |     const homePageTitle = page.locator('h1', { hasText: '儿童游戏平台' })
  178 |     await expect(homePageTitle).toBeVisible()
  179 |   })
  180 | })
```