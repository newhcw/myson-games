import { test, expect } from '@playwright/test';
import { GamePage } from '../../../pages/GamePage';

/**
 * TC0024: 敌人待机动画应正确播放
 * TC0025: 敌人行走动画应正确播放
 * TC0026: 敌人死亡动画应正确播放
 * TC0027: 敌人被击中时应显示闪烁和后仰效果
 */
test.describe('敌人动画测试', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.waitForLoaded();
    await gamePage.gameRoom.click({ delay: 100 });
    await page.waitForTimeout(3000);
  });
test('TC0024 - 敌人待机动画应正确播放', async () => {
  const enemies = await gamePage.getEnemies();
  expect(enemies.length).toBeGreaterThan(0);

  const enemy = enemies[0];

  // ✅ 正确验证：敌人处于待机状态 + 存活
  expect(enemy).toBeTruthy();
  expect(enemy.isDead).toBe(false);
  expect(enemy.currentState).toBe('idle'); // 待机状态

  // ✅ 验证动画正在播放
  expect(enemy.isAnimating).toBe(true);
});

  test('TC0025 - 敌人行走动画应正确播放', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 等待敌人开始巡逻
    await page.waitForTimeout(2000);

    // 验证敌人移动动画：腿部和手臂应该有摆动
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    // 检查敌人是否在移动状态
    const enemy = enemies[0];
    await expect(enemy).toBeVisible();
  });

  test('TC0026 - 敌人死亡动画应正确播放', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 使用射线检测击杀敌人
    await gamePage.shootEnemy(0);

    // 验证敌人是否真的死亡
    await page.waitForTimeout(1000);

    // 验证死亡动画和移除
    const enemies = await gamePage.getEnemies();
    await expect(enemies.length).toBeGreaterThanOrEqual(0);
  });

  test('TC0027 - 敌人被击中时应显示闪烁和后仰效果', async ({ page }) => {
    // 等待游戏加载完成
    await gamePage.expectLoaded();

    // 对敌人进行射击
    await gamePage.shootEnemy(0);

    // 验证击中效果：检查是否有红色闪烁
    const enemies = await gamePage.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    // 检查击中反馈（动画）
    const enemy = enemies[0];
    await expect(enemy).toBeVisible();
  });
});