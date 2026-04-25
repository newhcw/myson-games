import { test, expect } from '@playwright/test'
import { GamePage } from '../../../pages/GamePage'

/**
 * TC0038: RPG 实际发射火箭对敌人造成伤害（诊断）
 */
test.describe('RPG 真实发射伤害诊断', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectLoaded()
  })

  test('TC0038 - 发射火箭后敌人血量应减少', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const api = (window as any).__testApi

      // 1. 切换到 RPG
      api.switchToRpg()
      const weaponType = api.getCurrentWeaponType()
      if (weaponType !== 'rpg') return { success: false, reason: `weapon type is ${weaponType}` }

      // 2. 获取敌人
      const enemiesBefore = api.getEnemies()
      if (enemiesBefore.length === 0) return { success: false, reason: 'no enemies' }

      const targetEnemy = enemiesBefore[0]
      const healthBefore = targetEnemy.health
      const enemyPos = targetEnemy.position
      const enemyId = targetEnemy.id

      // 3. 获取玩家位置确保在合理范围
      const playerPos = api.getPlayerPosition()

      // 4. 朝敌人方向发射火箭
      const fired = api.fireRpgToward(enemyPos.x, enemyPos.z)
      if (!fired) return { success: false, reason: 'fireRpgToward returned false' }

      // 6. 等待火箭爆炸
      const waitResult = await api.waitForRocketExplosion(5000)

      // 7. 重新获取敌人状态
      const enemiesAfter = api.getEnemies()
      const enemyAfter = enemiesAfter.find((e: any) => e.id === enemyId)

      return {
        success: true,
        healthBefore,
        healthAfter: enemyAfter?.health ?? null,
        enemyStillAlive: !!enemyAfter,
        enemyKilled: !enemyAfter,
        waitResult,
        playerPos,
        enemyPos: { x: enemyPos.x, z: enemyPos.z },
        dist: Math.sqrt((enemyPos.x - playerPos.x) ** 2 + (enemyPos.z - playerPos.z) ** 2),
      }
    })

    console.log('RPG real fire result:', JSON.stringify(result))

    if (!result.success) {
      console.log('Test setup failed:', result.reason)
      // 还是验证基本功能
      expect(result.success).toBe(true)
      return
    }

    // 成功条件：敌人被击杀（不在活跃列表）或血量减少
    if (result.enemyKilled) {
      // 敌人被击杀 = 伤害成功
      expect(result.enemyKilled).toBe(true)
    } else if (result.enemyStillAlive) {
      // 敌人仍在 = 血量应减少
      expect(result.healthAfter).toBeLessThan(result.healthBefore!)
    }
  })
})
