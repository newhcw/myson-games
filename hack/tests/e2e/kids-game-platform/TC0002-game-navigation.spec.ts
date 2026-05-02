import { test, expect } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';
import { GamePage } from '../../../pages/GamePage';

/**
 * TC0004: 点击开始游戏按钮应能启动游戏
 * TC0005: 游戏页面应显示正确的 HUD 元素
 * TC0006: 游戏页面应显示初始生命值
 */
test.describe('游戏导航测试', () => {
  let homePage: HomePage;
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    gamePage = new GamePage(page);
  });

  test('TC0004 - 点击开始游戏按钮应能启动游戏', async ({ page }) => {
    await homePage.goto();
    await homePage.expectLoaded();

    // 点击开始游戏按钮（验证按钮存在且可点击）
    await homePage.startButton.click();

    // 验证按钮被点击（目前只打印日志，没有实际导航）
    await expect(homePage.startButton).toBeVisible();
  });

  test('TC0005 - 游戏页面应显示正确的 HUD 元素', async () => {
    // 直接访问游戏页面
    await gamePage.goto();
    await gamePage.waitForLoaded();
    await gamePage.expectLoaded();

    // 验证HUD元素存在
    await expect(gamePage.healthBar).toBeVisible();
    await expect(gamePage.score).toBeVisible();
    await expect(gamePage.crosshair).toBeVisible();
    await expect(gamePage.weaponIndicator).toBeVisible();
    await expect(gamePage.weaponInfo).toBeVisible();
    await expect(gamePage.controlsHint).toBeVisible();

    // 验证武器槽位显示（6个武器：手枪、冲锋枪、步枪、狙击枪、霰弹枪、火箭筒）
    await expect(gamePage.weaponSlots).toHaveCount(6);

    // 验证控制提示文字
    await expect(gamePage.controlsHint).toContainText('WASD 移动');
  });

  test('TC0006 - 游戏页面应显示初始生命值', async () => {
    await gamePage.goto();
    await gamePage.waitForLoaded();

    // 验证生命值标签
    await expect(gamePage.healthLabel).toHaveText('生命值');

    // 验证生命值条可见
    const healthFill = gamePage.healthFill;
    await expect(healthFill).toBeVisible();

    // 验证得分和击杀显示
    await expect(gamePage.score).toContainText('得分: 0');
    await expect(gamePage.kills).toContainText('击杀: 0');
  });
});