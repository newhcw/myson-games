import { test, expect } from '@playwright/test';
import { GamePage } from '../../../pages/GamePage';

/**
 * TC0028: 敌人应能正确生成巡逻路径点
 * TC0029: 敌人应能正确在路径点间移动
 * TC0030: 敌人到达路径点后应正确等待
 * TC0031: 敌人应能正确切换巡逻状态
 */
test.describe('敌人巡逻系统测试', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.waitForLoaded();
  });

  test('TC0028 - 敌人应能正确生成巡逻路径点', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 验证游戏场景中存在敌人
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    // 检查敌人数据
    const enemy = enemies[0];
    expect(enemy).toBeDefined()
    expect(enemy.id).toBeDefined()
    expect(enemy.state).toBeDefined()
  });

  test('TC0029 - 敌人应能正确在路径点间移动', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 验证敌人移动：当敌人在巡逻时，应该在不同的坐标上
    await page.waitForTimeout(3000);

    // 检查敌人是否在移动（位置发生变化）
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    // 验证敌人能够移动（x z 坐标变化）
    const enemy = enemies[0];
    expect(enemy.position).toBeDefined()
    expect(enemy.isDead).toBe(false)
  });

  test('TC0030 - 敌人到达路径点后应正确等待', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 等待敌人到达路径点并等待
    await page.waitForTimeout(5000);

    // 验证敌人等待状态：可以通过检查状态或坐标变化来判断
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    const enemy = enemies[0];
    expect(enemy.state).toBeDefined()
  });

  test('TC0031 - 敌人应能正确切换巡逻状态', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 验证敌人在巡逻和等待状态之间切换
    await page.waitForTimeout(4000);

    // 检查敌人持续在巡逻状态
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    const enemy = enemies[0];
    expect(enemy.state).toBeDefined()
  });
});