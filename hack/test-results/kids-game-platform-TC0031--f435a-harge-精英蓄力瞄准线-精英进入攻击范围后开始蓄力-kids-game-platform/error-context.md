# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0031-enemy-elite-charge.spec.ts >> 精英蓄力瞄准线 >> 精英进入攻击范围后开始蓄力
- Location: tests/e2e/kids-game-platform/TC0031-enemy-elite-charge.spec.ts:22:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
    - button "退出游戏" [ref=e6]
  - generic:
    - generic: 小兵
    - generic: 100/100
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { GamePage } from '../../../pages/GamePage'
  3  | 
  4  | /**
  5  |  * TC0031 - 精英蓄力瞄准线测试
  6  |  *
  7  |  * 测试内容：
  8  |  * 1. 精英进入攻击范围后开始蓄力
  9  |  * 2. 蓄力完成后有子弹生成
  10 |  */
  11 | 
  12 | test.describe('精英蓄力瞄准线', () => {
  13 |   let gamePage: GamePage
  14 | 
  15 |   test.beforeEach(async ({ page }) => {
  16 |     gamePage = new GamePage(page)
  17 |     await gamePage.goto()
  18 |     await gamePage.waitForLoaded()
  19 |     await gamePage.expectLoaded()
  20 |   })
  21 | 
  22 |   test('精英进入攻击范围后开始蓄力', async ({ page }) => {
  23 |     // 直接生成一个精英敌人在玩家附近
  24 |     const eliteIndex = await page.evaluate(() => {
  25 |       const api = (window as any).__testApi
  26 |       return api?.spawnTestEnemy?.('elite') ?? -1
  27 |     })
  28 |     expect(eliteIndex).toBeGreaterThanOrEqual(0)
  29 | 
  30 |     // 强制精英面向玩家
  31 |     await page.evaluate(() => {
  32 |       ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
  33 |     })
  34 | 
  35 |     // 等待精英检测玩家并开始蓄力（蓄力需要 1.5 秒，在蓄力完成前检查）
  36 |     await page.waitForTimeout(1000)
  37 | 
  38 |     // 使用 spawnTestEnemy 返回的索引检查精英蓄力状态
  39 |     const chargeState = await page.evaluate((idx) => {
  40 |       const api = (window as any).__testApi
  41 |       return api?.getEnemyChargeState?.(idx) ?? null
  42 |     }, eliteIndex)
  43 | 
  44 |     // 精英应正在蓄力中
  45 |     expect(chargeState).not.toBeNull()
> 46 |     expect(chargeState.isCharging).toBe(true)
     |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  47 |     expect(chargeState.hasChargeLine).toBe(true)
  48 |   })
  49 | 
  50 |   test('精英蓄力攻击后产生子弹', async ({ page }) => {
  51 |     // 直接生成一个精英敌人在玩家附近
  52 |     const eliteIndex = await page.evaluate(() => {
  53 |       const api = (window as any).__testApi
  54 |       return api?.spawnTestEnemy?.('elite') ?? -1
  55 |     })
  56 |     expect(eliteIndex).toBeGreaterThanOrEqual(0)
  57 | 
  58 |     // 强制精英面向玩家
  59 |     await page.evaluate(() => {
  60 |       ;(window as any).__testApi?.forceEnemiesToFacePlayer?.()
  61 |     })
  62 | 
  63 |     // 等待精英蓄力完成并发射子弹（蓄力 1.5 秒 + 余量）
  64 |     await page.waitForTimeout(3000)
  65 | 
  66 |     // 验证蓄力已完成（isCharging=false 表示已发射）
  67 |     const chargeState = await page.evaluate((idx) => {
  68 |       const api = (window as any).__testApi
  69 |       return api?.getEnemyChargeState?.(idx) ?? null
  70 |     }, eliteIndex)
  71 | 
  72 |     // 蓄力状态不再是活跃状态（已发射完成）
  73 |     expect(chargeState).not.toBeNull()
  74 |     expect(chargeState.isCharging).toBe(false)
  75 |   })
  76 | })
  77 | 
```