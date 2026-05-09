# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0049-scope-magnification.spec.ts >> TC0049 倍镜功能测试 >> TC0049c: 倍镜切换应该有过渡动画
- Location: tests/e2e/kids-game-platform/TC0049-scope-magnification.spec.ts:44:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 0
Received:   0
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
                - generic: "100"
                - generic: "%"
        - generic:
          - generic:
            - generic: ⭐
            - generic: "0"
          - generic:
            - generic: ⚔️
            - generic: "0"
          - button "退出游戏" [ref=e6] [cursor=pointer]
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
  - generic:
    - generic: 击败敌人可获得血包！
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { GamePage } from '../../../pages/GamePage'
  3   | 
  4   | /**
  5   |  * TC0049: 倍镜功能测试
  6   |  * - 倍镜激活时 FOV 变化
  7   |  * - 倍镜切换过渡动画
  8   |  * - 暗角效果显示
  9   |  * - 准星替换
  10  |  * - 武器切换时倍镜自动关闭
  11  |  */
  12  | test.describe('TC0049 倍镜功能测试', () => {
  13  |   let gamePage: GamePage
  14  | 
  15  |   test.beforeEach(async ({ page }) => {
  16  |     gamePage = new GamePage(page)
  17  |     await gamePage.goto()
  18  |     await gamePage.expectLoaded()
  19  | 
  20  |     // 需要先锁定指针才能触发右键事件
  21  |     await gamePage.gameRoom.click()
  22  |     await page.keyboard.press('Escape')
  23  |     await page.waitForTimeout(100)
  24  |   })
  25  | 
  26  |   test('TC0049a: 开镜后暗角效果应该显示', async () => {
  27  |     // 按下鼠标右键开启倍镜
  28  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  29  |     await gamePage.page.waitForTimeout(300)
  30  | 
  31  |     // 暗角效果应该显示
  32  |     await expect(gamePage.vignetteOverlay).toBeVisible()
  33  |   })
  34  | 
  35  |   test('TC0049b: 开镜后准星应该切换为精细十字准星', async () => {
  36  |     // 按下鼠标右键开启倍镜
  37  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  38  |     await gamePage.page.waitForTimeout(300)
  39  | 
  40  |     // 精细十字准星应该显示
  41  |     await expect(gamePage.scopeCrosshair).toBeVisible()
  42  |   })
  43  | 
  44  |   test('TC0049c: 倍镜切换应该有过渡动画', async () => {
  45  |     // 记录初始状态
  46  |     const initialState = await gamePage.vignetteOverlay.evaluate(
  47  |       (el) => window.getComputedStyle(el).opacity
  48  |     )
  49  | 
  50  |     // 开启倍镜
  51  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  52  |     await gamePage.page.waitForTimeout(100)
  53  | 
  54  |     // 检查过渡状态（opacity 应该变化）
  55  |     const midState = await gamePage.vignetteOverlay.evaluate(
  56  |       (el) => window.getComputedStyle(el).opacity
  57  |     )
  58  | 
  59  |     await gamePage.page.waitForTimeout(200)
  60  | 
  61  |     // 等待过渡完成后检查最终状态
  62  |     const finalState = await gamePage.vignetteOverlay.evaluate(
  63  |       (el) => window.getComputedStyle(el).opacity
  64  |     )
  65  | 
  66  |     // 验证过渡发生了
> 67  |     expect(parseFloat(initialState)).toBeLessThan(parseFloat(finalState))
      |                                      ^ Error: expect(received).toBeLessThan(expected)
  68  |   })
  69  | 
  70  |   test('TC0049d: 倍镜开启后关闭应该移除暗角效果', async () => {
  71  |     // 开启倍镜
  72  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  73  |     await gamePage.page.waitForTimeout(300)
  74  | 
  75  |     // 确认暗角显示
  76  |     await expect(gamePage.vignetteOverlay).toBeVisible()
  77  | 
  78  |     // 关闭倍镜
  79  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  80  |     await gamePage.page.waitForTimeout(300)
  81  | 
  82  |     // 暗角效果应该消失（opacity 为 0）
  83  |     const opacity = await gamePage.vignetteOverlay.evaluate(
  84  |       (el) => window.getComputedStyle(el).opacity
  85  |     )
  86  |     expect(parseFloat(opacity)).toBe(0)
  87  |   })
  88  | 
  89  |   test('TC0049e: 切换到狙击枪并开启倍镜', async () => {
  90  |     // 切换到狙击枪 (按4键)
  91  |     await gamePage.page.keyboard.press('4')
  92  |     await gamePage.page.waitForTimeout(200)
  93  | 
  94  |     // 开启倍镜
  95  |     await gamePage.page.mouse.click(100, 100, { button: 'right' })
  96  |     await gamePage.page.waitForTimeout(300)
  97  | 
  98  |     // 暗角效果应该显示
  99  |     await expect(gamePage.vignetteOverlay).toBeVisible()
  100 |   })
  101 | })
```