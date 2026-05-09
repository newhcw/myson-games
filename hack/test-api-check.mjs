import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto('http://localhost:3003/game');
await page.waitForSelector('.loading', { state: 'hidden', timeout: 30000 });
await page.waitForSelector('.hud', { state: 'visible', timeout: 10000 });
await page.waitForTimeout(2000);

const apiCheck = await page.evaluate(() => {
  return {
    hasTestApi: !!window.__testApi,
    keys: window.__testApi ? Object.keys(window.__testApi) : [],
    hasPlayerPosition: !!(window.__testApi && window.__testApi.playerPosition),
    hasYaw: !!(window.__testApi && window.__testApi.yaw),
  };
});

console.log(JSON.stringify(apiCheck, null, 2));

await browser.close();
