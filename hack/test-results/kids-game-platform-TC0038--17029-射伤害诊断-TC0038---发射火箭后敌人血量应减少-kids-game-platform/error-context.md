# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kids-game-platform/TC0038-rpg-real-fire-damage.spec.ts >> RPG 真实发射伤害诊断 >> TC0038 - 发射火箭后敌人血量应减少
- Location: tests/e2e/kids-game-platform/TC0038-rpg-real-fire-damage.spec.ts:16:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 100
Received:   100
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3] [cursor=pointer]:
    - generic:
      - generic: BOOM!
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
          - generic: 火箭筒
          - generic: 0 / 6
      - generic:
        - paragraph: WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜
    - button "退出游戏" [ref=e6]
  - generic:
    - generic: 小兵
    - generic: 100/100
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
  5  |  * TC0038: RPG 实际发射火箭对敌人造成伤害（诊断）
  6  |  */
  7  | test.describe('RPG 真实发射伤害诊断', () => {
  8  |   let gamePage: GamePage
  9  | 
  10 |   test.beforeEach(async ({ page }) => {
  11 |     gamePage = new GamePage(page)
  12 |     await gamePage.goto()
  13 |     await gamePage.expectLoaded()
  14 |   })
  15 | 
  16 |   test('TC0038 - 发射火箭后敌人血量应减少', async ({ page }) => {
  17 |     const result = await page.evaluate(async () => {
  18 |       const api = (window as any).__testApi
  19 | 
  20 |       // 1. 切换到 RPG
  21 |       api.switchToRpg()
  22 |       const weaponType = api.getCurrentWeaponType()
  23 |       if (weaponType !== 'rpg') return { success: false, reason: `weapon type is ${weaponType}` }
  24 | 
  25 |       // 2. 获取敌人
  26 |       const enemiesBefore = api.getEnemies()
  27 |       if (enemiesBefore.length === 0) return { success: false, reason: 'no enemies' }
  28 | 
  29 |       const targetEnemy = enemiesBefore[0]
  30 |       const healthBefore = targetEnemy.health
  31 |       const enemyPos = targetEnemy.position
  32 |       const enemyId = targetEnemy.id
  33 | 
  34 |       // 3. 获取玩家位置确保在合理范围
  35 |       const playerPos = api.getPlayerPosition()
  36 | 
  37 |       // 4. 朝敌人方向发射火箭
  38 |       const fired = api.fireRpgToward(enemyPos.x, enemyPos.z)
  39 |       if (!fired) return { success: false, reason: 'fireRpgToward returned false' }
  40 | 
  41 |       // 6. 等待火箭爆炸
  42 |       const waitResult = await api.waitForRocketExplosion(5000)
  43 | 
  44 |       // 7. 重新获取敌人状态
  45 |       const enemiesAfter = api.getEnemies()
  46 |       const enemyAfter = enemiesAfter.find((e: any) => e.id === enemyId)
  47 | 
  48 |       return {
  49 |         success: true,
  50 |         healthBefore,
  51 |         healthAfter: enemyAfter?.health ?? null,
  52 |         enemyStillAlive: !!enemyAfter,
  53 |         enemyKilled: !enemyAfter,
  54 |         waitResult,
  55 |         playerPos,
  56 |         enemyPos: { x: enemyPos.x, z: enemyPos.z },
  57 |         dist: Math.sqrt((enemyPos.x - playerPos.x) ** 2 + (enemyPos.z - playerPos.z) ** 2),
  58 |       }
  59 |     })
  60 | 
  61 |     console.log('RPG real fire result:', JSON.stringify(result))
  62 | 
  63 |     if (!result.success) {
  64 |       console.log('Test setup failed:', result.reason)
  65 |       // 还是验证基本功能
  66 |       expect(result.success).toBe(true)
  67 |       return
  68 |     }
  69 | 
  70 |     // 成功条件：敌人被击杀（不在活跃列表）或血量减少
  71 |     if (result.enemyKilled) {
  72 |       // 敌人被击杀 = 伤害成功
  73 |       expect(result.enemyKilled).toBe(true)
  74 |     } else if (result.enemyStillAlive) {
  75 |       // 敌人仍在 = 血量应减少
> 76 |       expect(result.healthAfter).toBeLessThan(result.healthBefore!)
     |                                  ^ Error: expect(received).toBeLessThan(expected)
  77 |     }
  78 |   })
  79 | })
  80 | 
```