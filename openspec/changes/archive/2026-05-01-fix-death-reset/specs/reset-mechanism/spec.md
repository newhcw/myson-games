## ADDED Requirements

### Requirement: 重新开始时清理所有游戏实体

当玩家在死亡界面点击"重新开始"时，系统 SHALL 完整重置所有游戏状态，包括敌人系统、飞行物、武器弹药。

#### Scenario: 重新开始清理飞行物

- **WHEN** 玩家点击重新开始
- **THEN** `rocketManager.clear()` 被调用，所有飞行中的火箭被销毁

#### Scenario: 重新开始重置敌人

- **WHEN** 玩家点击重新开始
- **THEN** `enemyAI.clear()` 清理所有敌人网格、血条、投射物
- **AND** 在初始位置重新生成 5 个敌人（3 小兵、1 精英、1 BOSS）

#### Scenario: 重新开始重置弹药

- **WHEN** 玩家点击重新开始
- **THEN** 所有武器的弹药恢复到初始值
- **AND** 开镜状态关闭
- **AND** 换弹状态取消

#### Scenario: 重新开始重置游戏时间基准

- **WHEN** 玩家点击重新开始
- **THEN** `lastTime` 重置为 `performance.now()`，避免首帧 delta 过大

### Requirement: EnemyManager 暴露 reset 方法

EnemyManager SHALL 暴露一个 `reset()` 方法，用于在重新开始时重置敌人系统。

#### Scenario: reset 清理敌人并重新生成

- **WHEN** `enemyManagerRef.reset()` 被调用
- **THEN** `enemyAI.clear()` 清理所有敌人
- **AND** `projectileManager.clear()` 清理所有投射物
- **AND** 内部 `enemies` 数组和 `enemySpawnData` 清空
- **AND** `spawnInitialEnemies()` 重新生成初始敌人

### Requirement: weaponStore 暴露 resetAmmo 方法

weaponStore SHALL 新增 `resetAmmo()` 方法，将所有武器弹药恢复到初始值。

| 武器 | 初始弹药 (current/reserve/maxReserve) |
|------|--------------------------------------|
| pistol | 12/48/120 |
| smg | 50/150/300 |
| rifle | 30/90/180 |
| sniper | 5/15/30 |
| shotgun | 6/24/48 |
| rpg | 1/6/18 |

#### Scenario: resetAmmo 恢复弹药

- **WHEN** `weaponStore.resetAmmo()` 被调用
- **THEN** 所有武器的弹药恢复到上表初始值
- **AND** `isReloading` 设为 false
- **AND** `currentScope.isActive` 设为 false
