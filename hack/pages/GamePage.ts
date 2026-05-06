import { type Page, type Locator, expect } from '@playwright/test'

export class GamePage {
  readonly page: Page

  // 游戏容器
  readonly gameRoom: Locator

  // HUD 元素
  readonly hud: Locator
  readonly healthBar: Locator
  readonly healthFill: Locator
  readonly healthLabel: Locator
  readonly score: Locator
  readonly scoreDisplay: Locator
  readonly kills: Locator
  readonly crosshair: Locator
  readonly weaponInfo: Locator
  readonly weaponIndicator: Locator
  readonly weaponSlots: Locator
  readonly controlsHint: Locator

  // 退出按钮
  readonly exitButton: Locator

  // 加载界面
  readonly loading: Locator

  constructor(page: Page) {
    this.page = page

    // 游戏容器
    this.gameRoom = page.locator('.game-room')

    // HUD 元素
    this.hud = page.locator('.hud')
    this.healthBar = page.locator('.health-bar')
    this.healthFill = page.locator('.health-bar .fill')
    this.healthLabel = page.locator('.health-bar .health-icon')
    this.score = page.locator('.score span').first()
    this.scoreDisplay = page.locator('.score')
    this.kills = page.locator('.score .kills')
    this.crosshair = page.locator('.crosshair')
    this.weaponInfo = page.locator('.weapon-info')
    this.weaponIndicator = page.locator('.weapon-indicator')
    this.weaponSlots = page.locator('.weapon-slot')
    this.controlsHint = page.locator('.controls-hint')

    // 退出按钮
    this.exitButton = page.locator('.exit-btn')

    // 加载界面
    this.loading = page.locator('.loading')
  }

  /**
   * 导航到游戏页面
   */
  async goto(): Promise<void> {
    await this.page.goto('http://localhost:3000/game')
  }

  /**
   * 等待游戏加载
   */
  async waitForLoaded(): Promise<void> {
    // 等待加载界面不可见
    await this.loading.waitFor({ state: 'hidden', timeout: 30000 })
  }

  /**
   * 等待游戏加载完成并显示 HUD
   */
  async expectLoaded(): Promise<void> {
    // 等待加载界面消失
    await expect(this.loading).not.toBeVisible({ timeout: 30000 })

    // 验证 HUD 可见（增加重试逻辑）
    await expect(this.hud).toBeVisible({ timeout: 10000 })
  }

  /**
   * 获取所有敌人（简化版，避免序列化问题）
   */
  async getEnemiesSimple() {
    // 等待游戏加载完成
    await this.expectLoaded()

    // 通过测试API获取敌人信息（只获取基本属性）
    return await this.page.evaluate(() => {
      const testApi = window.__testApi
      if (testApi && testApi.getEnemies) {
        const enemies = testApi.getEnemies()
        // 只返回可序列化的基本属性
        return enemies.map((e: any) => ({
          id: e.id,
          type: e.type,
          health: e.health,
          isDead: e.isDead,
          state: e.state,
        }))
      }
      return []
    })
  }

  /**
   * 获取血量文字
   */
  async getHealthText(): Promise<string> {
    return this.healthBar.locator('.label, span').first().textContent() || ''
  }

  /**
   * 获取分数文字
   */
  async getScoreText(): Promise<string> {
    return this.scoreDisplay.textContent() || ''
  }

  /**
   * 点击退出按钮
   */
  async clickExit(): Promise<void> {
    await this.exitButton.click()
  }

  /**
   * 点击退出按钮 (别名)
   */
  async clickExitButton(): Promise<void> {
    await this.clickExit()
  }

  /**
   * 获取所有敌人元素
   */
  async getEnemies() {
    // 等待游戏加载完成
    await this.expectLoaded()

    // 通过测试API获取敌人信息
    return await this.page.evaluate(() => {
      // @ts-ignore - 测试API仅在开发环境可用
      const testApi = window.__testApi
      if (testApi && testApi.getEnemies) {
        return testApi.getEnemies()
      }
      return []
    })
  }

  /**
   * 射击敌人
   */
  async shootEnemy(index: number) {
    // 等待游戏加载完成
    await this.expectLoaded()

    // 通过测试API射击敌人
    return await this.page.evaluate((index: number) => {
      // @ts-ignore - 测试API仅在开发环境可用
      const testApi = window.__testApi
      if (testApi && testApi.shootEnemy) {
        return testApi.shootEnemy(index)
      }
      return false
    }, index)
  }

  /**
   * 对敌人造成指定伤害（不击杀）
   */
  async hitEnemy(index: number, damage: number = 10) {
    await this.expectLoaded()
    return await this.page.evaluate(({ index, damage }: { index: number, damage: number }) => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.hitEnemy) {
        return testApi.hitEnemy(index, damage)
      }
      return false
    }, { index, damage })
  }

  /**
   * 获取当前分数
   */
  async getCurrentScore(): Promise<number> {
    const scoreText = await this.getScoreText()
    const match = scoreText.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  /**
   * 获取当前击杀数
   */
  async getCurrentKills(): Promise<number> {
    const killsText = await this.kills.textContent()
    const match = killsText?.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  /**
   * 获取生命值数字
   */
  async getHealthValue(): Promise<number> {
    const healthText = await this.getHealthText()
    const match = healthText.match(/\d+/)
    return match ? parseInt(match[0], 10) : 100
  }

  /**
   * 获取所有血条元素
   */
  async getHealthBars() {
    await this.expectLoaded()
    return await this.page.evaluate(() => {
      // @ts-ignore - 测试API仅在开发环境可用
      const testApi = window.__testApi
      if (testApi && testApi.getHealthBars) {
        return testApi.getHealthBars()
      }
      return []
    })
  }

  /**
   * 将玩家移动到指定敌人附近
   */
  async movePlayerToEnemy(index: number) {
    await this.expectLoaded()
    return await this.page.evaluate((idx: number) => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.movePlayerToEnemy) {
        return testApi.movePlayerToEnemy(idx)
      }
      return false
    }, index)
  }

  /**
   * 对玩家造成伤害
   */
  async takePlayerDamage(amount: number) {
    return await this.page.evaluate((dmg: number) => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.takePlayerDamage) {
        testApi.takePlayerDamage(dmg)
      }
    }, amount)
  }

  /**
   * 获取玩家血量
   */
  async getPlayerHealth(): Promise<number> {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.getPlayerHealth) {
        return testApi.getPlayerHealth()
      }
      return 100
    })
  }

  /**
   * 获取游戏状态
   */
  async getGameState(): Promise<string> {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.getGameState) {
        return testApi.getGameState()
      }
      return 'idle'
    })
  }

  /**
   * 重新开始游戏
   */
  async restartGame() {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      if (testApi && testApi.restartGame) {
        testApi.restartGame()
      }
    })
  }

  /**
   * 等待死亡界面出现
   */
  async waitForDeathScreen() {
    const deathScreen = this.page.locator('.death-screen')
    await deathScreen.waitFor({ state: 'visible', timeout: 10000 })
  }

  // ===== 波次系统测试 API =====

  /**
   * 获取当前波次
   */
  async getCurrentWave(): Promise<number> {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      return testApi?.getCurrentWave?.() ?? 1
    })
  }

  /**
   * 获取波次状态 (waving / intermission / victory)
   */
  async getWaveState(): Promise<string> {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      return testApi?.getWaveState?.() ?? 'waving'
    })
  }

  /**
   * 获取波次 HUD 文字
   */
  async getWaveDisplayText(): Promise<string> {
    const waveDisplay = this.page.locator('.wave-display .wave-text')
    return await waveDisplay.textContent() || ''
  }

  /**
   * 检查波次间歇倒计时是否可见
   */
  async isIntermissionCountdownVisible(): Promise<boolean> {
    const countdown = this.page.locator('.wave-intermission')
    return await countdown.isVisible().catch(() => false)
  }

  /**
   * 获取间歇倒计时数字
   */
  async getIntermissionCountdownNumber(): Promise<number> {
    const countdown = this.page.locator('.wave-intermission .intermission-countdown')
    const text = await countdown.textContent() || '0'
    return parseInt(text, 10) || 0
  }

  /**
   * 跳过间歇
   */
  async skipIntermission() {
    await this.page.keyboard.press('Space')
    await this.page.waitForTimeout(500)
  }

  /**
   * 获取活跃 Buff 数量
   */
  async getActiveBuffCount(): Promise<number> {
    const buffIcons = this.page.locator('.buff-icon')
    return await buffIcons.count()
  }

  /**
   * 检查是否存在双倍伤害 Buff
   */
  async hasDoubleDamageBuff(): Promise<boolean> {
    const buff = this.page.locator('.buff-icon[data-buff-type="doubleDamage"]')
    return await buff.isVisible().catch(() => false)
  }

  /**
   * 等待通关界面出现
   */
  async waitForVictoryScreen() {
    const victory = this.page.locator('.victory-screen')
    await victory.waitFor({ state: 'visible', timeout: 120000 })
  }

  /**
   * 检查通关界面是否可见
   */
  async isVictoryScreenVisible(): Promise<boolean> {
    const victory = this.page.locator('.victory-screen')
    return await victory.isVisible().catch(() => false)
  }

  /**
   * 获取道具数量（通过测试 API）
   */
  async getPowerUpCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const testApi = (window as any).__testApi
      return testApi?.getPowerUpCount?.() ?? 0
    })
  }
}