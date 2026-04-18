# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0027-enemy-health.spec.ts >> 敌人血条系统测试 >> TC0036 - 敌人头顶血条应正确显示
- Location: tests\e2e\kids-game-platform\TC0027-enemy-health.spec.ts:19:3

# Error details

```
TypeError: gamePage.getHealthBars is not a function
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
  5  |  * TC0036: 敌人头顶血条应正确显示
  6  |  * TC0037: 血条位置应正确投影到屏幕坐标
  7  |  * TC0038: 血条应能动态更新
  8  |  * TC0039: 敌人被击中时血条应显示伤害反馈
  9  |  */
  10 | test.describe('敌人血条系统测试', () => {
  11 |   let gamePage: GamePage;
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     gamePage = new GamePage(page);
  15 |     await gamePage.goto();
  16 |     await gamePage.waitForLoaded();
  17 |   });
  18 | 
  19 |   test('TC0036 - 敌人头顶血条应正确显示', async () => {
  20 |     // 等待游戏加载完成
  21 |     await gamePage.expectLoaded();
  22 | 
  23 |     // 验证血条元素存在
> 24 |     const healthBars = await gamePage.getHealthBars();
     |                                       ^ TypeError: gamePage.getHealthBars is not a function
  25 |     expect(healthBars.length).toBeGreaterThan(0);
  26 | 
  27 |     // 验证血条元素可见
  28 |     await expect(healthBars[0]).toBeVisible();
  29 |   });
  30 | 
  31 |   test('TC0037 - 血条位置应正确投影到屏幕坐标', async () => {
  32 |     // 等待游戏加载完成
  33 |     await gamePage.expectLoaded();
  34 | 
  35 |     // 验证血条与敌人位置正确对齐
  36 |     const enemies = await gamePage.getEnemies();
  37 |     const healthBars = await gamePage.getHealthBars();
  38 | 
  39 |     expect(enemies.length).toBeGreaterThan(0);
  40 |     expect(healthBars.length).toBeGreaterThan(0);
  41 | 
  42 |     // 验证血条与敌人在正确位置
  43 |     await expect(healthBars[0]).toBeVisible();
  44 |   });
  45 | 
  46 |   test('TC0038 - 血条应能动态更新', async () => {
  47 |     // 等待游戏加载完成
  48 |     await gamePage.expectLoaded();
  49 | 
  50 |     // 对敌人进行伤害，验证血条变化
  51 |     await gamePage.shootEnemy(0);
  52 | 
  53 |     // 等待一帧并验证血条变化
  54 |     await page.waitForTimeout(500);
  55 | 
  56 |     const healthBars = await gamePage.getHealthBars();
  57 |     expect(healthBars.length).toBeGreaterThan(0);
  58 | 
  59 |     // 验证血条减少
  60 |     await expect(healthBars[0]).toBeVisible();
  61 |   });
  62 | 
  63 |   test('TC0039 - 敌人被击中时血条应显示伤害反馈', async () => {
  64 |     // 等待游戏加载完成
  65 |     await gamePage.expectLoaded();
  66 | 
  67 |     // 对敌人进行射击
  68 |     await gamePage.shootEnemy(0);
  69 | 
  70 |     // 检查伤害数字是否显示
  71 |     await page.waitForTimeout(500);
  72 | 
  73 |     const healthBars = await gamePage.getHealthBars();
  74 |     expect(healthBars.length).toBeGreaterThan(0);
  75 | 
  76 |     // 验证伤害反馈显示
  77 |     await expect(healthBars[0]).toBeVisible();
  78 |   });
  79 | });
```