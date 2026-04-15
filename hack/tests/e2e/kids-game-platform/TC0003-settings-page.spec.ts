import { test, expect } from '@playwright/test';
import { SettingsPage } from '../../../pages/SettingsPage';

/**
 * TC0007: 设置页面应正确加载
 * TC0008: 设置页面应显示所有设置选项
 * TC0009: 可以调整音量滑块
 * TC0010: 可以选择难度
 * TC0011: 保存设置后应返回首页
 */
test.describe('设置页面测试', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
  });

  test('TC0007 - 设置页面应正确加载', async () => {
    await settingsPage.goto();
    await settingsPage.expectLoaded();
    
    // 验证页面标题
    await expect(settingsPage.title).toHaveText('游戏设置');
    
    // 验证返回按钮存在
    await expect(settingsPage.backButton).toBeVisible();
    await expect(settingsPage.backButton).toHaveText('← 返回');
  });

  test('TC0008 - 设置页面应显示所有设置选项', async () => {
    await settingsPage.goto();
    await settingsPage.expectLoaded();
    
    // 验证声音设置区域
    await expect(settingsPage.content.locator('h2').first()).toHaveText('声音设置');
    await expect(settingsPage.volumeSlider).toBeVisible();
    
    // 验证游戏设置区域
    const gameSettingsTitle = settingsPage.content.locator('h2').nth(1);
    await expect(gameSettingsTitle).toHaveText('游戏设置');
    await expect(settingsPage.difficultySelect).toBeVisible();
    await expect(settingsPage.showDamageCheckbox).toBeVisible();
    await expect(settingsPage.autoAimCheckbox).toBeVisible();
    
    // 验证数据管理区域
    const dataManagementTitle = settingsPage.content.locator('h2').nth(2);
    await expect(dataManagementTitle).toHaveText('数据管理');
    await expect(settingsPage.resetButton).toBeVisible();
    
    // 验证保存按钮
    await expect(settingsPage.saveButton).toBeVisible();
    await expect(settingsPage.saveButton).toHaveText('保存设置');
  });

  test('TC0009 - 可以调整音量滑块', async () => {
    await settingsPage.goto();
    await settingsPage.expectLoaded();
    
    // 获取初始音量值
    const initialValue = await settingsPage.volumeSlider.inputValue();
    expect(initialValue).toBe('80'); // 默认值
    
    // 调整音量到50
    await settingsPage.setVolume(50);
    const newValue = await settingsPage.volumeSlider.inputValue();
    expect(newValue).toBe('50');
    
    // 调整音量到0
    await settingsPage.setVolume(0);
    const minValue = await settingsPage.volumeSlider.inputValue();
    expect(minValue).toBe('0');
    
    // 调整音量到100
    await settingsPage.setVolume(100);
    const maxValue = await settingsPage.volumeSlider.inputValue();
    expect(maxValue).toBe('100');
  });

  test('TC0010 - 可以选择难度', async () => {
    await settingsPage.goto();
    await settingsPage.expectLoaded();
    
    // 验证默认选中普通难度
    await expect(settingsPage.difficultySelect).toHaveValue('normal');
    
    // 选择简单难度
    await settingsPage.setDifficulty('easy');
    await expect(settingsPage.difficultySelect).toHaveValue('easy');
    
    // 选择困难难度
    await settingsPage.setDifficulty('hard');
    await expect(settingsPage.difficultySelect).toHaveValue('hard');
    
    // 再次选择普通难度
    await settingsPage.setDifficulty('normal');
    await expect(settingsPage.difficultySelect).toHaveValue('normal');
  });

  test('TC0011 - 保存设置后应返回首页', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.expectLoaded();
    
    // 修改一些设置
    await settingsPage.setVolume(60);
    await settingsPage.setDifficulty('hard');
    
    // 点击保存按钮
    await settingsPage.clickSaveButton();
    
    // 验证返回首页
    await expect(page).toHaveURL('/');
    
    // 验证首页加载
    const homePage = await import('../../../pages/HomePage').then(m => new m.HomePage(page));
    await homePage.expectLoaded();
  });
});
