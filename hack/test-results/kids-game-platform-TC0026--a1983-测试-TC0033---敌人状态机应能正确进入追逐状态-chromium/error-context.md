# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0026-enemy-ai-state.spec.ts >> 敌人AI状态机测试 >> TC0033 - 敌人状态机应能正确进入追逐状态
- Location: tests\e2e\kids-game-platform\TC0026-enemy-ai-state.spec.ts:32:3

# Error details

```
TypeError: gamePage.movePlayerToEnemy is not a function
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
  5  |  * TC0032: 敌人状态机应能正确进入巡逻状态
  6  |  * TC0033: 敌人状态机应能正确进入追逐状态
  7  |  * TC0034: 敌人状态机应能正确进入丢失状态
  8  |  * TC0035: 敌人状态机应能正确在状态间切换
  9  |  */
  10 | test.describe('敌人AI状态机测试', () => {
  11 |   let gamePage: GamePage;
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     gamePage = new GamePage(page);
  15 |     await gamePage.goto();
  16 |     await gamePage.waitForLoaded();
  17 |   });
  18 | 
  19 |   test('TC0032 - 敌人状态机应能正确进入巡逻状态', async () => {
  20 |     // 等待游戏加载完成
  21 |     await gamePage.expectLoaded();
  22 | 
  23 |     // 验证敌人初始为巡逻状态
  24 |     const enemies = await gamePage.getEnemies();
  25 |     expect(enemies.length).toBeGreaterThan(0);
  26 | 
  27 |     // 通过存在的行为判断是否在巡逻
  28 |     const enemy = enemies[0];
  29 |     await expect(enemy).toBeVisible();
  30 |   });
  31 | 
  32 |   test('TC0033 - 敌人状态机应能正确进入追逐状态', async () => {
  33 |     // 等待游戏加载完成
  34 |     await gamePage.expectLoaded();
  35 | 
  36 |     // 移动玩家角色靠近敌人，触发追击状态
> 37 |     await gamePage.movePlayerToEnemy(0);
     |                    ^ TypeError: gamePage.movePlayerToEnemy is not a function
  38 | 
  39 |     // 验证敌人进入追逐状态
  40 |     await page.waitForTimeout(2000);
  41 | 
  42 |     const enemies = await gamePage.getEnemies();
  43 |     expect(enemies.length).toBeGreaterThan(0);
  44 | 
  45 |     const enemy = enemies[0];
  46 |     await expect(enemy).toBeVisible();
  47 |   });
  48 | 
  49 |   test('TC0034 - 敌人状态机应能正确进入丢失状态', async () => {
  50 |     // 等待游戏加载完成
  51 |     await gamePage.expectLoaded();
  52 | 
  53 |     // 让敌人发现玩家然后使其丢失
  54 |     await gamePage.movePlayerToEnemy(0);
  55 |     await page.waitForTimeout(3000);
  56 | 
  57 |     // 验证敌人进入搜索状态
  58 |     const enemies = await gamePage.getEnemies();
  59 |     expect(enemies.length).toBeGreaterThan(0);
  60 | 
  61 |     const enemy = enemies[0];
  62 |     await expect(enemy).toBeVisible();
  63 |   });
  64 | 
  65 |   test('TC0035 - 敌人状态机应能正确在状态间切换', async () => {
  66 |     // 等待游戏加载完成
  67 |     await gamePage.expectLoaded();
  68 | 
  69 |     // 验证进入不同状态的切换逻辑
  70 |     await gamePage.movePlayerToEnemy(0);
  71 |     await page.waitForTimeout(3000);
  72 | 
  73 |     // 检查状态是否正确切换（使用行为或位置变化验证）
  74 |     const enemies = await gamePage.getEnemies();
  75 |     expect(enemies.length).toBeGreaterThan(0);
  76 | 
  77 |     const enemy = enemies[0];
  78 |     await expect(enemy).toBeVisible();
  79 |   });
  80 | });
```