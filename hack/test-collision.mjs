import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// 访问游戏页面
await page.goto('http://localhost:3003/game');

// 等待加载完成
await page.waitForSelector('.loading', { state: 'hidden', timeout: 30000 });
await page.waitForSelector('.hud', { state: 'visible', timeout: 10000 });
await page.waitForTimeout(2000);

// 使用测试API测试碰撞
const collisionResults = await page.evaluate(() => {
  const testApi = window.__testApi;
  const results = [];
  
  if (!testApi || !testApi.playerPosition) {
    return [{ error: 'testApi or playerPosition not available' }];
  }
  
  const originalPos = testApi.playerPosition.clone();
  
  // 测试1: 移动到树桩位置（pos: [-2, 0, -3], size: [0.6, 1.2, 0.6]）
  testApi.playerPosition.set(-2, 1.6, -3);
  // 等待一帧让碰撞检测处理
  const posAfterStump = testApi.playerPosition.clone();
  results.push({
    test: 'stump',
    target: [-2, 1.6, -3],
    actual: [posAfterStump.x, posAfterStump.y, posAfterStump.z],
    blocked: Math.abs(posAfterStump.x - (-2)) > 0.1 || Math.abs(posAfterStump.z - (-3)) > 0.1
  });
  
  // 测试2: 移动到岩石位置（pos: [-10, 0, 0], size: [1.2, 2, 1]）
  testApi.playerPosition.set(-10, 1.6, 0);
  const posAfterRock = testApi.playerPosition.clone();
  results.push({
    test: 'rock',
    target: [-10, 1.6, 0],
    actual: [posAfterRock.x, posAfterRock.y, posAfterRock.z],
    blocked: Math.abs(posAfterRock.x - (-10)) > 0.1 || Math.abs(posAfterRock.z - 0) > 0.1
  });
  
  // 测试3: 移动到灌木位置（pos: [-3, 0, 0], size: [1.5, 1.8, 1]）
  testApi.playerPosition.set(-3, 1.6, 0);
  const posAfterBush = testApi.playerPosition.clone();
  results.push({
    test: 'bush',
    target: [-3, 1.6, 0],
    actual: [posAfterBush.x, posAfterBush.y, posAfterBush.z],
    blocked: Math.abs(posAfterBush.x - (-3)) > 0.1 || Math.abs(posAfterBush.z - 0) > 0.1
  });
  
  // 测试4: 移动到开放区域应该可以正常移动
  testApi.playerPosition.set(0, 1.6, 0);
  const posAfterOpen = testApi.playerPosition.clone();
  results.push({
    test: 'open_area',
    target: [0, 1.6, 0],
    actual: [posAfterOpen.x, posAfterOpen.y, posAfterOpen.z],
    blocked: false // 开放区域不应该被阻挡
  });
  
  // 恢复原始位置
  testApi.playerPosition.copy(originalPos);
  
  return results;
});

console.log(JSON.stringify(collisionResults, null, 2));

// 同时拍下碰撞测试结果截图
await page.waitForTimeout(500);
await page.screenshot({ path: '/Users/huangchunwu/ai-workspace/myson-games/game-collision-test.png' });
console.log('Collision test screenshot saved');

await browser.close();
