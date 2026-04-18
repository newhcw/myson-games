# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0024-enemy-animation.spec.ts >> 敌人动画测试 >> TC0024 - 敌人待机动画应正确播放
- Location: tests\e2e\kids-game-platform\TC0024-enemy-animation.spec.ts:20:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "idle"
Received: undefined
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
  - button "退出游戏" [ref=e5]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GamePage } from '../../../pages/GamePage';
  3  | 
  4  | /**
  5  |  * TC0024: 敌人待机动画应正确播放
  6  |  * TC0025: 敌人行走动画应正确播放
  7  |  * TC0026: 敌人死亡动画应正确播放
  8  |  * TC0027: 敌人被击中时应显示闪烁和后仰效果
  9  |  */
  10 | test.describe('敌人动画测试', () => {
  11 |   let gamePage: GamePage;
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     gamePage = new GamePage(page);
  15 |     await gamePage.goto();
  16 |     await gamePage.waitForLoaded();
  17 |     await gamePage.gameRoom.click({ delay: 100 });
  18 |     await page.waitForTimeout(3000);
  19 |   });
  20 | test('TC0024 - 敌人待机动画应正确播放', async () => {
  21 |   const enemies = await gamePage.getEnemies();
  22 |   expect(enemies.length).toBeGreaterThan(0);
  23 | 
  24 |   const enemy = enemies[0];
  25 | 
  26 |   // ✅ 正确验证：敌人处于待机状态 + 存活
  27 |   expect(enemy).toBeTruthy();
  28 |   expect(enemy.isDead).toBe(false);
> 29 |   expect(enemy.currentState).toBe('idle'); // 待机状态
     |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  30 | 
  31 |   // ✅ 验证动画正在播放
  32 |   expect(enemy.isAnimating).toBe(true);
  33 | });
  34 | 
  35 |   test('TC0025 - 敌人行走动画应正确播放', async ({ page }) => {
  36 |     // 等待游戏加载完成
  37 |     await gamePage.expectLoaded();
  38 | 
  39 |     // 等待敌人开始巡逻
  40 |     await page.waitForTimeout(2000);
  41 | 
  42 |     // 验证敌人移动动画：腿部和手臂应该有摆动
  43 |     const enemies = await gamePage.getEnemies();
  44 |     expect(enemies.length).toBeGreaterThan(0);
  45 | 
  46 |     // 检查敌人是否在移动状态
  47 |     const enemy = enemies[0];
  48 |     await expect(enemy).toBeVisible();
  49 |   });
  50 | 
  51 |   test('TC0026 - 敌人死亡动画应正确播放', async ({ page }) => {
  52 |     // 等待游戏加载完成
  53 |     await gamePage.expectLoaded();
  54 | 
  55 |     // 使用射线检测击杀敌人
  56 |     await gamePage.shootEnemy(0);
  57 | 
  58 |     // 验证敌人是否真的死亡
  59 |     await page.waitForTimeout(1000);
  60 | 
  61 |     // 验证死亡动画和移除
  62 |     const enemies = await gamePage.getEnemies();
  63 |     await expect(enemies.length).toBeGreaterThanOrEqual(0);
  64 |   });
  65 | 
  66 |   test('TC0027 - 敌人被击中时应显示闪烁和后仰效果', async ({ page }) => {
  67 |     // 等待游戏加载完成
  68 |     await gamePage.expectLoaded();
  69 | 
  70 |     // 对敌人进行射击
  71 |     await gamePage.shootEnemy(0);
  72 | 
  73 |     // 验证击中效果：检查是否有红色闪烁
  74 |     const enemies = await gamePage.getEnemies();
  75 |     expect(enemies.length).toBeGreaterThan(0);
  76 | 
  77 |     // 检查击中反馈（动画）
  78 |     const enemy = enemies[0];
  79 |     await expect(enemy).toBeVisible();
  80 |   });
  81 | });
```