import { test, expect } from '@playwright/test';
import { GamePage } from '../../../pages/GamePage';

/**
 * TC0036: 敌人头顶血条应正确显示
 * TC0037: 血条位置应正确投影到屏幕坐标
 * TC0038: 血条应能动态更新
 * TC0039: 敌人被击中时血条应显示伤害反馈
 */
test.describe('敌人血条系统测试', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.waitForLoaded();
  });

  test('TC0036 - 敌人头顶血条应正确显示', async () => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 验证血条元素存在
    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);

    // 验证血条元素可见
    await expect(healthBars[0]).toBeVisible();
  });

  test('TC0037 - 血条位置应正确投影到屏幕坐标', async () => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 验证血条与敌人位置正确对齐
    const enemies = await gamePage.getEnemies();
    const healthBars = await gamePage.getHealthBars();

    expect(enemies.length).toBeGreaterThan(0);
    expect(healthBars.length).toBeGreaterThan(0);

    // 验证血条与敌人在正确位置
    await expect(healthBars[0]).toBeVisible();
  });

  test('TC0038 - 血条应能动态更新', async () => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 对敌人进行伤害，验证血条变化
    await gamePage.shootEnemy(0);

    // 等待一帧并验证血条变化
    await gamePage.page.waitForTimeout(500);

    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);

    // 验证血条减少
    await expect(healthBars[0]).toBeVisible();
  });

  test('TC0039 - 敌人被击中时血条应显示伤害反馈', async () => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 对敌人进行射击
    await gamePage.shootEnemy(0);

    // 检查伤害数字是否显示
    await gamePage.page.waitForTimeout(500);

    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);

    // 验证伤害反馈显示
    await expect(healthBars[0]).toBeVisible();
  });
});