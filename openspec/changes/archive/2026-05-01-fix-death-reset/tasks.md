# Fix Death/Reset/HUD Tasks

## 1. 死亡时暂停游戏循环

- [x] 1.1 在 `gameLoop` 中检测 `gameStore.isDead`，为 true 时跳过所有 update 调用，只保留 `renderer.render`

## 2. 重新开始时完整重置

- [x] 2.1 `weaponStore` 新增 `resetAmmo()` 方法，重置所有武器弹药到初始值
- [x] 2.2 `EnemyManager.vue` 新增 `reset()` 方法（clear 敌人 + 重新生成）
- [x] 2.3 在 `FPSGame.vue` 的 `onRestart` 中调用 `rocketManager.clear()`、`enemyManagerRef.reset()`、`weaponStore.resetAmmo()`，并重置 `lastTime`

## 3. 血条重叠自动偏移

- [x] 3.1 重构 `EnemyHealthBar.update()`，增加后处理步骤：先计算所有敌人屏幕坐标，按 Y 排序，检测重叠并垂直偏移
- [x] 3.2 确保偏移后的血条不超出屏幕边界

## 4. E2E 测试

- [x] 4.1 创建死亡/重置 E2E 测试用例（死亡后敌人静止、重新开始敌人重置、血条不重叠验证）