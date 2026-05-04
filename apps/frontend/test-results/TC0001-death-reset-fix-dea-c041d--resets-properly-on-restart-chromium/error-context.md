# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: TC0001-death-reset.spec.ts >> fix-death-reset (TC0001-TC0006) >> TC0002: Game resets properly on restart
- Location: tests/TC0001-death-reset.spec.ts:62:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.game-room') to be visible

```

# Test source

```ts
  1   | /**
  2   |  * E2E Tests for fix-death-reset (TC0001-TC0006)
  3   |  *
  4   |  * Test Cases:
  5   |  * - TC0001: Enemies freeze on player death
  6   |  * - TC0002: Game resets properly on restart
  7   |  * - TC0003: Health bars don't overlap
  8   |  * - TC0004: Player cannot operate after death (move/shoot)
  9   |  * - TC0005: Non-overlapping health bars remain unchanged
  10  |  * - TC0006: Health bars respect screen bottom boundary
  11  |  */
  12  | 
  13  | import { test, expect } from '@playwright/test';
  14  | 
  15  | // Helper: wait for game to be ready (loaded + pointer locked + enemies spawned)
  16  | async function waitForGameReady(page: any) {
  17  |   await page.goto('/game', { waitUntil: 'networkidle' });
  18  |   // Wait for loading screen to disappear
> 19  |   await page.waitForSelector('.game-room', { timeout: 10000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  20  |   await page.waitForFunction(() => !document.querySelector('.loading'), { timeout: 10000 });
  21  |   // Click to lock pointer
  22  |   await page.click('.game-room');
  23  |   // Wait for test API and enemies to be ready
  24  |   await page.waitForFunction(
  25  |     () => {
  26  |       const api = (window as any).__testApi;
  27  |       return api && api.getEnemies && api.getEnemies().length > 0;
  28  |     },
  29  |     { timeout: 10000 }
  30  |   );
  31  |   // Extra wait for enemies to fully initialize
  32  |   await page.waitForTimeout(1000);
  33  | }
  34  | 
  35  | test.describe('fix-death-reset (TC0001-TC0006)', () => {
  36  |   test('TC0001: Enemies freeze on player death', async ({ page }) => {
  37  |     await waitForGameReady(page);
  38  | 
  39  |     // Verify enemies exist
  40  |     const enemyCount = await page.evaluate(() => (window as any).__testApi.getEnemies().length);
  41  |     expect(enemyCount).toBeGreaterThan(0);
  42  | 
  43  |     // Kill the player
  44  |     await page.evaluate(() => (window as any).__testApi.takePlayerDamage(100));
  45  | 
  46  |     // Wait a moment for death to register
  47  |     await page.waitForTimeout(500);
  48  | 
  49  |     // Verify game state is 'ended' (dead)
  50  |     const gameState = await page.evaluate(() => (window as any).__testApi.getGameState());
  51  |     expect(gameState).toBe('ended');
  52  | 
  53  |     // Wait 2 seconds — if enemies weren't frozen, they'd have generated projectiles
  54  |     await page.waitForTimeout(2000);
  55  | 
  56  |     const projectileCount = await page.evaluate(() =>
  57  |       (window as any).__testApi.getActiveProjectileCount()
  58  |     );
  59  |     expect(projectileCount).toBe(0);
  60  |   });
  61  | 
  62  |   test('TC0002: Game resets properly on restart', async ({ page }) => {
  63  |     await waitForGameReady(page);
  64  | 
  65  |     // Damage the player
  66  |     await page.evaluate(() => (window as any).__testApi.takePlayerDamage(50));
  67  | 
  68  |     // Kill the first enemy to verify enemy count before restart
  69  |     await page.evaluate(() => (window as any).__testApi.shootEnemy(0));
  70  | 
  71  |     // Wait a bit for enemy death to process
  72  |     await page.waitForTimeout(300);
  73  | 
  74  |     // Verify player took damage
  75  |     const healthAfterDamage = await page.evaluate(() =>
  76  |       (window as any).__testApi.getPlayerHealth()
  77  |     );
  78  |     expect(healthAfterDamage).toBe(50);
  79  | 
  80  |     // Restart the game
  81  |     await page.evaluate(() => (window as any).__testApi.restartGame());
  82  | 
  83  |     // Wait for restart to complete (enemies respawn etc.)
  84  |     await page.waitForTimeout(1000);
  85  | 
  86  |     // Verify health is fully restored to 100
  87  |     const health = await page.evaluate(() => (window as any).__testApi.getPlayerHealth());
  88  |     expect(health).toBe(100);
  89  | 
  90  |     // Verify enemies respawned (should have 5 enemies: 3 soldier, 1 elite, 1 boss)
  91  |     const enemies = await page.evaluate(() => (window as any).__testApi.getEnemies());
  92  |     expect(enemies.length).toBe(5);
  93  | 
  94  |     // Verify game state is 'playing'
  95  |     const gameState = await page.evaluate(() => (window as any).__testApi.getGameState());
  96  |     expect(gameState).toBe('playing');
  97  | 
  98  |     // Verify RPG ammo is fully reset
  99  |     const rpgAmmo = await page.evaluate(() => (window as any).__testApi.getRpgAmmo());
  100 |     expect(rpgAmmo).toEqual({ current: 1, reserve: 6 });
  101 |   });
  102 | 
  103 |   test('TC0003: Health bars do not overlap', async ({ page }) => {
  104 |     await waitForGameReady(page);
  105 | 
  106 |     // Position player at origin, look at enemies, force them to face player
  107 |     await page.evaluate(() => {
  108 |       const api = (window as any).__testApi;
  109 |       // Move player to first enemy's front
  110 |       api.movePlayerToEnemyFront(0);
  111 |       // Look at the enemy cluster area
  112 |       api.lookAtTarget(0, 10);
  113 |       // Force enemies to face player so they become visible
  114 |       api.forceEnemiesToFacePlayer();
  115 |     });
  116 | 
  117 |     // Wait for health bars to render
  118 |     await page.waitForTimeout(2000);
  119 | 
```