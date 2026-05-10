## Why

当前玩家死亡后，鼠标指针仍被锁定在游戏中，玩家无法在死亡界面上看到鼠标光标来点击"再次挑战"或"返回营地"按钮，并且死亡后仍然可以发射子弹。

## What Changes

- 玩家死亡时自动释放鼠标指针锁定（`document.exitPointerLock()`）
- 死亡界面显示时将鼠标光标改为小手形状（`cursor: pointer`）
- 死亡时阻止所有键盘输入（WASD、射击、换弹、跳跃等）
- 死亡时阻止鼠标发射子弹
- 死亡时点击游戏区域不再重新锁定指针

## Capabilities

### New Capabilities

- `death-screen-ux`: 死亡界面的用户体验优化，包括指针释放、光标显示、输入拦截

### Modified Capabilities

<!-- 无现有规范需要修改 -->

## Impact

- `apps/frontend/src/game/composables/usePlayerInput.ts` — 键盘/鼠标事件处理增加死亡状态检查
- `apps/frontend/src/views/FPSGame.vue` — 死亡状态 watch 增加指针释放和光标恢复逻辑
