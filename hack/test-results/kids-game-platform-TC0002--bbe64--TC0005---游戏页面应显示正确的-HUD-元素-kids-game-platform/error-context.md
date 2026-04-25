# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0002-game-navigation.spec.ts >> 游戏导航测试 >> TC0005 - 游戏页面应显示正确的 HUD 元素
- Location: tests/e2e/kids-game-platform/TC0002-game-navigation.spec.ts:30:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.weapon-slot')
Expected: 5
Received: 6
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.weapon-slot')
    7 × locator resolved to 6 elements
      - unexpected value "6"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - generic: "6"
        - generic:
          - generic: 手枪
          - generic: 12 / 48
      - generic:
        - paragraph: WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜
    - button "退出游戏" [ref=e6]
  - generic:
    - generic: 小兵
    - generic: 100/100
  - generic:
    - generic: BOSS
    - generic: 500/500
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { HomePage } from '../../../pages/HomePage';
  3  | import { GamePage } from '../../../pages/GamePage';
  4  | 
  5  | /**
  6  |  * TC0004: 点击开始游戏按钮应能启动游戏
  7  |  * TC0005: 游戏页面应显示正确的 HUD 元素
  8  |  * TC0006: 游戏页面应显示初始生命值
  9  |  */
  10 | test.describe('游戏导航测试', () => {
  11 |   let homePage: HomePage;
  12 |   let gamePage: GamePage;
  13 | 
  14 |   test.beforeEach(async ({ page }) => {
  15 |     homePage = new HomePage(page);
  16 |     gamePage = new GamePage(page);
  17 |   });
  18 | 
  19 |   test('TC0004 - 点击开始游戏按钮应能启动游戏', async ({ page }) => {
  20 |     await homePage.goto();
  21 |     await homePage.expectLoaded();
  22 | 
  23 |     // 点击开始游戏按钮（验证按钮存在且可点击）
  24 |     await homePage.startButton.click();
  25 | 
  26 |     // 验证按钮被点击（目前只打印日志，没有实际导航）
  27 |     await expect(homePage.startButton).toBeVisible();
  28 |   });
  29 | 
  30 |   test('TC0005 - 游戏页面应显示正确的 HUD 元素', async () => {
  31 |     // 直接访问游戏页面
  32 |     await gamePage.goto();
  33 |     await gamePage.waitForLoaded();
  34 |     await gamePage.expectLoaded();
  35 | 
  36 |     // 验证HUD元素存在
  37 |     await expect(gamePage.healthBar).toBeVisible();
  38 |     await expect(gamePage.score).toBeVisible();
  39 |     await expect(gamePage.crosshair).toBeVisible();
  40 |     await expect(gamePage.weaponIndicator).toBeVisible();
  41 |     await expect(gamePage.weaponInfo).toBeVisible();
  42 |     await expect(gamePage.controlsHint).toBeVisible();
  43 | 
  44 |     // 验证武器槽位显示
> 45 |     await expect(gamePage.weaponSlots).toHaveCount(5);
     |                                        ^ Error: expect(locator).toHaveCount(expected) failed
  46 | 
  47 |     // 验证控制提示文字
  48 |     await expect(gamePage.controlsHint).toContainText('WASD 移动');
  49 |   });
  50 | 
  51 |   test('TC0006 - 游戏页面应显示初始生命值', async () => {
  52 |     await gamePage.goto();
  53 |     await gamePage.waitForLoaded();
  54 | 
  55 |     // 验证生命值标签
  56 |     await expect(gamePage.healthLabel).toHaveText('生命值');
  57 | 
  58 |     // 验证生命值条可见
  59 |     const healthFill = gamePage.healthFill;
  60 |     await expect(healthFill).toBeVisible();
  61 | 
  62 |     // 验证得分和击杀显示
  63 |     await expect(gamePage.score).toContainText('得分: 0');
  64 |     await expect(gamePage.kills).toContainText('击杀: 0');
  65 |   });
  66 | });
```