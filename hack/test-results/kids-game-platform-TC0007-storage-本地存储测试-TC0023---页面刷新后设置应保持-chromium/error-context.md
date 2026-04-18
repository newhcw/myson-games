# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform\TC0007-storage.spec.ts >> 本地存储测试 >> TC0023 - 页面刷新后设置应保持
- Location: tests\e2e\kids-game-platform\TC0007-storage.spec.ts:53:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "无法访问此网站" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: 拒绝了我们的连接请求。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请试试以下办法：
      - list [ref=e12]:
        - listitem [ref=e13]: 检查网络连接
        - listitem [ref=e14]:
          - link "检查代理服务器和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "重新加载" [ref=e19] [cursor=pointer]
    - button "详情" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { SettingsPage } from '../../../pages/SettingsPage'
  3  | import { HomePage } from '../../../pages/HomePage'
  4  | 
  5  | /**
  6  |  * TC0021: 音量设置应能保存
  7  |  * TC0022: 难度设置应能保存
  8  |  * TC0023: 页面刷新后设置应保持
  9  |  */
  10 | test.describe('本地存储测试', () => {
  11 |   let settingsPage: SettingsPage
  12 |   let homePage: HomePage
  13 | 
  14 |   test.beforeEach(async ({ page }) => {
  15 |     settingsPage = new SettingsPage(page)
  16 |     homePage = new HomePage(page)
  17 |     // 先清空本地存储以确保测试独立性
> 18 |     await page.goto('http://localhost:5173/')
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  19 |     await page.evaluate(() => localStorage.clear())
  20 |   })
  21 | 
  22 |   test('TC0021 - 音量设置应能保存', async ({ page }) => {
  23 |     // 导航到设置页面
  24 |     await settingsPage.goto()
  25 |     await settingsPage.expectLoaded()
  26 | 
  27 |     // 找到音量滑块
  28 |     const volumeSlider = settingsPage.volumeSlider
  29 | 
  30 |     // 调整音量
  31 |     await volumeSlider.fill('50')
  32 | 
  33 |     // 验证音量值更新 (如果有显示)
  34 |     const volumeValue = settingsPage.volumeValue
  35 |     if (await volumeValue.isVisible()) {
  36 |       await expect(volumeValue).not.toHaveText('100%')
  37 |     }
  38 |   })
  39 | 
  40 |   test('TC0022 - 难度设置应能保存', async ({ page }) => {
  41 |     // 导航到设置页面
  42 |     await settingsPage.goto()
  43 |     await settingsPage.expectLoaded()
  44 | 
  45 |     // 应该有难度选择
  46 |     const difficultySelect = settingsPage.difficultySelect
  47 |     await expect(difficultySelect).toBeVisible()
  48 | 
  49 |     // 选择一个难度
  50 |     await difficultySelect.selectOption('normal')
  51 |   })
  52 | 
  53 |   test('TC0023 - 页面刷新后设置应保持', async ({ page }) => {
  54 |     // 导航到设置页面
  55 |     await settingsPage.goto()
  56 |     await settingsPage.expectLoaded()
  57 | 
  58 |     // 调整音量并保存
  59 |     const volumeSlider = settingsPage.volumeSlider
  60 |     await volumeSlider.fill('75')
  61 | 
  62 |     // 点击保存按钮
  63 |     await settingsPage.saveButton.click()
  64 | 
  65 |     // 等待返回首页
  66 |     await homePage.expectLoaded()
  67 | 
  68 |     // 重新进入设置页面
  69 |     await page.goto('http://localhost:5173/settings')
  70 |     await settingsPage.expectLoaded()
  71 | 
  72 |     // 验证设置仍然存在（检查localStorage）
  73 |     const storedSettings = await page.evaluate(() => {
  74 |       return localStorage.getItem('game-settings')
  75 |     })
  76 |     expect(storedSettings).toBeTruthy()
  77 | 
  78 |     const parsed = storedSettings ? JSON.parse(storedSettings) : {}
  79 |     expect(parsed.volume).toBe('75')
  80 |   })
  81 | })
```