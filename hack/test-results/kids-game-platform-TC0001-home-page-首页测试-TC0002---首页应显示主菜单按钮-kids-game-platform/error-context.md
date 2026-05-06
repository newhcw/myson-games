# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0001-home-page.spec.ts >> 首页测试 >> TC0002 - 首页应显示主菜单按钮
- Location: tests/e2e/kids-game-platform/TC0001-home-page.spec.ts:22:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.start-button')
Expected substring: "开始游戏"
Received string:    "⚔️开始冒险"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.start-button')
    9 × locator resolved to <button data-v-f4b87ee6="" class="menu-button start-button">…</button>
      - unexpected value "⚔️开始冒险"

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic: 🌿
  - generic: 🍁
  - generic: 🍃
  - generic: 🍃
  - generic: 🌿
  - generic: 🌱
  - generic: 🌿
  - generic: 🍂
  - generic: 🍁
  - generic: 🍁
  - generic: 🍃
  - generic: 🍃
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]: 🌿
      - heading "肉肉 森林大冒险 森林大冒险" [level=1] [ref=e9]:
        - generic [ref=e10]: 肉肉
        - generic [ref=e11]: 森林大冒险 森林大冒险
      - generic [ref=e12]: 🌿
    - generic [ref=e13]:
      - generic [ref=e14]: ✦
      - generic [ref=e15]: ✦
      - generic [ref=e16]: ✦
  - generic [ref=e17]:
    - button "⚔️ 开始冒险" [ref=e18] [cursor=pointer]:
      - generic [ref=e19]: ⚔️
      - generic [ref=e20]: 开始冒险
    - button "🔮 魔法设置" [ref=e22] [cursor=pointer]:
      - generic [ref=e23]: 🔮
      - generic [ref=e24]: 魔法设置
    - button "🏰 离开森林" [ref=e26] [cursor=pointer]:
      - generic [ref=e27]: 🏰
      - generic [ref=e28]: 离开森林
  - generic:
    - generic: 🍄
    - generic: 🌸
    - generic: 🍄
    - generic: 🌼
    - generic: 🍄
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { HomePage } from '../../../pages/HomePage';
  3  | 
  4  | /**
  5  |  * TC0001: 首页应正确加载并显示标题
  6  |  * TC0002: 首页应显示主菜单按钮
  7  |  * TC0003: 菜单按钮应有悬停效果
  8  |  */
  9  | test.describe('首页测试', () => {
  10 |   let homePage: HomePage;
  11 | 
  12 |   test.beforeEach(async ({ page }) => {
  13 |     homePage = new HomePage(page);
  14 |     await homePage.goto();
  15 |   });
  16 | 
  17 |   test('TC0001 - 首页应正确加载并显示标题', async () => {
  18 |     await homePage.expectLoaded();
  19 |     await expect(homePage.gameTitle).toHaveText('肉肉森林大冒险');
  20 |   });
  21 | 
  22 |   test('TC0002 - 首页应显示主菜单按钮', async () => {
  23 |     await homePage.expectLoaded();
  24 | 
  25 |     // 验证有三个菜单按钮
  26 |     await expect(homePage.menuButtons).toHaveCount(3);
  27 | 
  28 |     // 验证按钮文本
> 29 |     await expect(homePage.startButton).toContainText('开始游戏');
     |                                        ^ Error: expect(locator).toContainText(expected) failed
  30 |     await expect(homePage.settingsButton).toContainText('设置');
  31 |     await expect(homePage.exitButton).toContainText('退出');
  32 |   });
  33 | 
  34 |   test('TC0003 - 菜单按钮应有悬停效果', async () => {
  35 |     await homePage.expectLoaded();
  36 | 
  37 |     // 验证悬停开始游戏按钮
  38 |     await homePage.startButton.hover();
  39 |     await expect(homePage.startButton).toBeVisible();
  40 | 
  41 |     // 验证悬停设置按钮
  42 |     await homePage.settingsButton.hover();
  43 |     await expect(homePage.settingsButton).toBeVisible();
  44 | 
  45 |     // 验证悬停退出按钮
  46 |     await homePage.exitButton.hover();
  47 |     await expect(homePage.exitButton).toBeVisible();
  48 |   });
  49 | });
```