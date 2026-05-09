# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0002-game-navigation.spec.ts >> 游戏导航测试 >> TC0006 - 游戏页面应显示初始生命值
- Location: tests/e2e/kids-game-platform/TC0002-game-navigation.spec.ts:54:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.health-bar .fill')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.health-bar .fill')
    4 × locator resolved to <div class="fill" data-v-22bfadbf=""></div>
      - unexpected value "hidden"

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
  - generic:
    - generic: 小兵
    - generic: 100/100
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { HomePage } from '../../../pages/HomePage';
  3  | import { GamePage } from '../../../pages/GamePage';
  4  | 
  5  | /**
  6  |  * TC0004: 点击开始冒险按钮应能启动游戏
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
  19 |   test('TC0004 - 点击开始冒险按钮应能启动游戏', async ({ page }) => {
  20 |     await homePage.goto();
  21 |     await homePage.expectLoaded();
  22 | 
  23 |     // 验证开始冒险按钮文本
  24 |     await expect(homePage.startButton).toContainText('⚔️开始冒险');
  25 | 
  26 |     // 点击开始冒险按钮
  27 |     await homePage.startButton.click();
  28 | 
  29 |     // 验证按钮被点击（目前只打印日志，没有实际导航）
  30 |     await expect(homePage.startButton).toBeVisible();
  31 |   });
  32 | 
  33 |   test('TC0005 - 游戏页面应显示正确的 HUD 元素', async () => {
  34 |     // 直接访问游戏页面
  35 |     await gamePage.goto();
  36 |     await gamePage.waitForLoaded();
  37 |     await gamePage.expectLoaded();
  38 | 
  39 |     // 验证HUD元素存在
  40 |     await expect(gamePage.healthBar).toBeVisible();
  41 |     await expect(gamePage.score).toBeVisible();
  42 |     await expect(gamePage.crosshair).toBeVisible();
  43 |     await expect(gamePage.weaponIndicator).toBeVisible();
  44 |     await expect(gamePage.weaponInfo).toBeVisible();
  45 |     await expect(gamePage.controlsHint).toBeVisible();
  46 | 
  47 |     // 验证武器槽位显示（6个武器：手枪、冲锋枪、步枪、狙击枪、霰弹枪、火箭筒）
  48 |     await expect(gamePage.weaponSlots).toHaveCount(6);
  49 | 
  50 |     // 验证控制提示文字
  51 |     await expect(gamePage.controlsHint).toContainText('WASD 移动');
  52 |   });
  53 | 
  54 |   test('TC0006 - 游戏页面应显示初始生命值', async () => {
  55 |     await gamePage.goto();
  56 |     await gamePage.waitForLoaded();
  57 | 
  58 |     // 验证生命值图标 (❤️)
  59 |     await expect(gamePage.healthLabel).toContainText('❤️');
  60 | 
  61 |     // 验证生命值条可见
  62 |     const healthFill = gamePage.healthFill;
> 63 |     await expect(healthFill).toBeVisible();
     |                              ^ Error: expect(locator).toBeVisible() failed
  64 | 
  65 |     // 验证得分和击杀显示
  66 |     await expect(gamePage.score).toContainText('得分: 0');
  67 |     await expect(gamePage.kills).toContainText('击杀: 0');
  68 |   });
  69 | });
```