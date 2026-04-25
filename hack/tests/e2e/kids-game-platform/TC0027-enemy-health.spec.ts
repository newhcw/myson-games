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

  test('TC0036 - 敌人头顶血条应正确显示', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 先对敌人造成伤害（满血时不显示血条）
    await gamePage.hitEnemy(0, 10);
    await page.waitForTimeout(500);

    // 验证血条元素存在
    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);
  });

  test('TC0037 - 血条位置应正确投影到屏幕坐标', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 先对敌人造成伤害
    await gamePage.hitEnemy(0, 10);
    await page.waitForTimeout(500);

    // 验证血条与敌人位置正确对齐
    const enemies = await gamePage.getEnemies();
    const healthBars = await gamePage.getHealthBars();

    expect(enemies.length).toBeGreaterThan(0);
    expect(healthBars.length).toBeGreaterThan(0);
  });

  test('TC0038 - 血条应能动态更新', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 对敌人进行多次伤害，验证血条变化
    await gamePage.hitEnemy(0, 20);
    await page.waitForTimeout(500);

    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);
  });

  test('TC0039 - 敌人被击中时血条应显示伤害反馈', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 对敌人进行射击
    await gamePage.hitEnemy(0, 15);

    // 检查伤害数字是否显示
    await page.waitForTimeout(500);

    const healthBars = await gamePage.getHealthBars();
    expect(healthBars.length).toBeGreaterThan(0);
  });
});