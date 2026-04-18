# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0025-enemy-patrol.spec.ts >> 敌人巡逻系统测试 >> TC0031 - 敌人应能正确切换巡逻状态
- Location: tests\e2e\kids-game-platform\TC0025-enemy-patrol.spec.ts:65:3

# Error details

```
ReferenceError: page is not defined
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
  1  | import { test, expect } from '@playwright/test';
  2  | import { GamePage } from '../../../pages/GamePage';
  3  | 
  4  | /**
  5  |  * TC0028: 敌人应能正确生成巡逻路径点
  6  |  * TC0029: 敌人应能正确在路径点间移动
  7  |  * TC0030: 敌人到达路径点后应正确等待
  8  |  * TC0031: 敌人应能正确切换巡逻状态
  9  |  */
  10 | test.describe('敌人巡逻系统测试', () => {
  11 |   let gamePage: GamePage;
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     gamePage = new GamePage(page);
  15 |     await gamePage.goto();
  16 |     await gamePage.waitForLoaded();
  17 |   });
  18 | 
  19 |   test('TC0028 - 敌人应能正确生成巡逻路径点', async ({ page }) => {
  20 |     // 等待游戏加载完成
  21 |     await gamePage.expectLoaded();
  22 | 
  23 |     // 验证游戏场景中存在敌人
  24 |     const enemies = await gamePage.getEnemies();
  25 |     expect(enemies.length).toBeGreaterThan(0);
  26 | 
  27 |     // 检查敌人数据
  28 |     const enemy = enemies[0];
  29 |     expect(enemy).toBeDefined()
  30 |     expect(enemy.id).toBeDefined()
  31 |     expect(enemy.state).toBeDefined()
  32 |   });
  33 | 
  34 |   test('TC0029 - 敌人应能正确在路径点间移动', async () => {
  35 |     // 等待游戏加载完成
  36 |     await gamePage.expectLoaded();
  37 | 
  38 |     // 验证敌人移动：当敌人在巡逻时，应该在不同的坐标上
  39 |     await page.waitForTimeout(3000);
  40 | 
  41 |     // 检查敌人是否在移动（位置发生变化）
  42 |     const enemies = await gamePage.getEnemies();
  43 |     expect(enemies.length).toBeGreaterThan(0);
  44 | 
  45 |     // 验证敌人能够移动（x z 坐标变化）
  46 |     const enemy = enemies[0];
  47 |     await expect(enemy).toBeVisible();
  48 |   });
  49 | 
  50 |   test('TC0030 - 敌人到达路径点后应正确等待', async () => {
  51 |     // 等待游戏加载完成
  52 |     await gamePage.expectLoaded();
  53 | 
  54 |     // 等待敌人到达路径点并等待
  55 |     await page.waitForTimeout(5000);
  56 | 
  57 |     // 验证敌人等待状态：可以通过检查状态或坐标变化来判断
  58 |     const enemies = await gamePage.getEnemies();
  59 |     expect(enemies.length).toBeGreaterThan(0);
  60 | 
  61 |     const enemy = enemies[0];
  62 |     await expect(enemy).toBeVisible();
  63 |   });
  64 | 
  65 |   test('TC0031 - 敌人应能正确切换巡逻状态', async () => {
  66 |     // 等待游戏加载完成
  67 |     await gamePage.expectLoaded();
  68 | 
  69 |     // 验证敌人在巡逻和等待状态之间切换
> 70 |     await page.waitForTimeout(4000);
     |     ^ ReferenceError: page is not defined
  71 | 
  72 |     // 检查敌人持续在巡逻状态
  73 |     const enemies = await gamePage.getEnemies();
  74 |     expect(enemies.length).toBeGreaterThan(0);
  75 | 
  76 |     const enemy = enemies[0];
  77 |     await expect(enemy).toBeVisible();
  78 |   });
  79 | });
```