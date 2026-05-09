import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// 访问游戏页面
await page.goto('http://localhost:3003/game');

// 等待加载界面消失
await page.waitForSelector('.loading', { state: 'hidden', timeout: 30000 });

// 等待 HUD 可见
await page.waitForSelector('.hud', { state: 'visible', timeout: 10000 });

// 等待 2 秒让场景稳定
await page.waitForTimeout(2000);

// 杀掉所有敌人，避免遮挡障碍物
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.getEnemies) {
    const enemies = testApi.getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (testApi.shootEnemy) {
        testApi.shootEnemy(i);
      }
    }
  }
});

// 等待敌人死亡动画
await page.waitForTimeout(1000);

// 将玩家移动到场景中央，面向障碍物区域
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi) {
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(0);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(0.2);
    if (testApi.playerPosition) {
      testApi.playerPosition.set(0, 1.6, 8);
    }
  }
});

// 等待场景更新
await page.waitForTimeout(1000);

// 截图 - 正面
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-obstacles-front.png' });
console.log('Front view saved');

// 看左侧大树
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.playerPosition) {
    testApi.playerPosition.set(-8, 1.6, 8);
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(0.8);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(0.1);
  }
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-obstacles-left.png' });
console.log('Left view saved');

// 看右侧
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.playerPosition) {
    testApi.playerPosition.set(8, 1.6, 8);
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(-0.8);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(0.1);
  }
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-obstacles-right.png' });
console.log('Right view saved');

await browser.close();
console.log('All done');
