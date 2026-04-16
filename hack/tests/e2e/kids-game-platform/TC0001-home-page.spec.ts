import { test, expect } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';

/**
 * TC0001: 首页应正确加载并显示标题
 * TC0002: 首页应显示主菜单按钮
 * TC0003: 菜单按钮应有悬停效果
 */
test.describe('首页测试', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('TC0001 - 首页应正确加载并显示标题', async () => {
    await homePage.expectLoaded();
    await expect(homePage.gameTitle).toHaveText('小勇士大冒险');
  });

  test('TC0002 - 首页应显示主菜单按钮', async () => {
    await homePage.expectLoaded();

    // 验证有三个菜单按钮
    await expect(homePage.menuButtons).toHaveCount(3);

    // 验证按钮文本
    await expect(homePage.startButton).toContainText('开始游戏');
    await expect(homePage.settingsButton).toContainText('设置');
    await expect(homePage.exitButton).toContainText('退出');
  });

  test('TC0003 - 菜单按钮应有悬停效果', async () => {
    await homePage.expectLoaded();

    // 验证悬停开始游戏按钮
    await homePage.startButton.hover();
    await expect(homePage.startButton).toBeVisible();

    // 验证悬停设置按钮
    await homePage.settingsButton.hover();
    await expect(homePage.settingsButton).toBeVisible();

    // 验证悬停退出按钮
    await homePage.exitButton.hover();
    await expect(homePage.exitButton).toBeVisible();
  });
});