import { test, expect } from '@playwright/test';
import { GamePage } from '../../../pages/GamePage';
import { SettingsPage } from '../../../pages/SettingsPage';

/**
 * TC0012: 退出游戏应返回首页
 * TC0013: 从设置页面返回首页
 */
test.describe('游戏退出测试', () => {
  let gamePage: GamePage;
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    settingsPage = new SettingsPage(page);
  });

  test('TC0012 - 退出游戏应返回首页', async ({ page }) => {
    // 访问游戏页面
    await gamePage.goto();
    await gamePage.waitForLoaded();
    await gamePage.expectLoaded();
    
    // 点击退出按钮
    await gamePage.clickExitButton();
    
    // 验证返回首页
    await expect(page).toHaveURL('/');
    
    // 验证首页加载
    const homePage = await import('../../../pages/HomePage').then(m => new m.HomePage(page));
    await homePage.expectLoaded();
    
    // 确保游戏页面元素不再可见
    await expect(gamePage.hud).not.toBeVisible();
  });

  test('TC0013 - 从设置页面返回首页', async ({ page }) => {
    // 访问设置页面
    await settingsPage.goto();
    await settingsPage.expectLoaded();

    // 点击返回按钮
    await settingsPage.clickBackButton();

    // 验证返回首页
    await expect(page).toHaveURL('/');

    // 验证首页加载
    const homePage = await import('../../../pages/HomePage').then(m => new m.HomePage(page));
    await homePage.expectLoaded();

    // 验证设置页面元素不再可见 - 使用设置页面的保存按钮来验证
    await expect(settingsPage.saveButton).not.toBeVisible();
  });

  test('TC0012b - 游戏页面退出按钮存在且可点击', async () => {
    // 访问游戏页面
    await gamePage.goto();
    await gamePage.waitForLoaded();
    
    // 验证退出按钮存在
    await expect(gamePage.exitButton).toBeVisible();
    await expect(gamePage.exitButton).toHaveText('退出游戏');
    
    // 验证按钮可点击
    await gamePage.exitButton.click();
  });
});
