import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// 访问游戏页面
await page.goto('http://localhost:3003/game');

// 等待加载完成
await page.waitForSelector('.loading', { state: 'hidden', timeout: 30000 });
await page.waitForSelector('.hud', { state: 'visible', timeout: 10000 });
await page.waitForTimeout(2000);

// 清理敌人
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.getEnemies) {
    const enemies = testApi.getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (testApi.shootEnemy) testApi.shootEnemy(i);
    }
  }
});
await page.waitForTimeout(1000);

// 飞到高空俯瞰
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.playerPosition) {
    testApi.playerPosition.set(0, 40, 0);
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(0);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(-1.45); // 正下方
  }
});
await page.waitForTimeout(2000);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-overhead.png' });
console.log('Overhead view saved');

// 低空侧面观察高度
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.playerPosition) {
    testApi.playerPosition.set(-20, 5, 0);
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(1.57);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(0);
  }
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-side.png' });
console.log('Side view saved');

// 另一侧观察
await page.evaluate(() => {
  const testApi = window.__testApi;
  if (testApi && testApi.playerPosition) {
    testApi.playerPosition.set(0, 5, -20);
    if (testApi.yaw && testApi.yaw.set) testApi.yaw.set(3.14);
    if (testApi.pitch && testApi.pitch.set) testApi.pitch.set(0);
  }
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-side2.png' });
console.log('Side2 view saved');

await browser.close();
console.log('All done');
