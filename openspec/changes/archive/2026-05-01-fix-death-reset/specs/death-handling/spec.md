## ADDED Requirements

### Requirement: 死亡时暂停游戏循环

当玩家生命值归零时，游戏循环 SHALL 暂停所有动态更新，保持最后一帧画面静态显示。

- 游戏循环中检测 `gameStore.isDead`，为 true 时跳过以下更新：
  - 玩家移动（`updateMovement`）
  - 自动射击（`updateAutoFire`）
  - 敌人 AI（`enemyAI.update`）
  - 火箭管理器（`rocketManager.update`）
  - 投射物管理器（`projectileManager.update`）
  - 屏幕震动更新
- 渲染（`renderer.render`）SHALL 继续执行，保持画面可见
- 键盘和鼠标事件 SHALL 照常监听但不会影响游戏状态（已有 pointer lock 控制）

#### Scenario: 死亡后敌人停止移动

- **WHEN** `gameStore.isDead` 为 true
- **THEN** 敌人停止移动和攻击
- **AND** 飞行中的火箭和投射物保持静止

#### Scenario: 死亡后玩家无法操作

- **WHEN** `gameStore.isDead` 为 true
- **THEN** 玩家移动（WASD）和射击无效
- **AND** 死亡界面覆盖在静态游戏画面上方

#### Scenario: 死亡后画面保持显示

- **WHEN** `gameStore.isDead` 为 true
- **THEN** 渲染循环继续执行，画面不黑屏
