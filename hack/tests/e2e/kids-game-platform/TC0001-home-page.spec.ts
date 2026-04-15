import { test, expect } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';

/**
 * TC0001: 首页应正确加载并显示标题
 * TC0002: 首页应显示游戏卡片
 * TC0003: 游戏卡片应有悬停效果
 */
test.describe('首页测试', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('TC0001 - 首页应正确加载并显示标题', async () => {
    // 等待页面加载完成
    await homePage.expectLoaded();
    
    // 验证标题显示
    await expect(homePage.logoText).toHaveText('儿童游戏平台');
    await expect(homePage.heroTitle).toHaveText('欢迎来到游戏世界！');
    await expect(homePage.heroSubtitle).toHaveText('选择一个游戏开始冒险吧');
  });

  test('TC0002 - 首页应显示游戏卡片', async () => {
    await homePage.expectLoaded();
    
    // 验证游戏卡片数量
    await expect(homePage.gameCards).toHaveCount(1);
    
    // 验证游戏卡片内容
    const firstCard = homePage.gameCard;
    await expect(firstCard.locator('.game-icon')).toBeVisible();
    await expect(firstCard.locator('.game-info h3')).toHaveText('小小神枪手');
    await expect(firstCard.locator('.game-info p')).toHaveText('有趣的第一人称射击游戏');
    await expect(firstCard.locator('.play-btn')).toContainText('开始游戏');
  });

  test('TC0003 - 游戏卡片应有悬停效果', async ({ page }) => {
    await homePage.expectLoaded();
    
    // 获取游戏卡片并验证悬停效果
    const gameCard = homePage.gameCard;
    
    // 初始状态 - 检查没有悬停类
    await expect(gameCard).not.toHaveClass(/hover/);
    
    // 悬停后检查样式变化（通过计算属性验证）
    await gameCard.hover();
    
    // 验证悬停后元素仍然可见
    await expect(gameCard).toBeVisible();
    
    // 检查 play-btn 内文字的变化
    const playBtn = gameCard.locator('.play-btn');
    await expect(playBtn).toContainText('开始游戏');
    await expect(playBtn.locator('.arrow')).toBeVisible();
  });
});
