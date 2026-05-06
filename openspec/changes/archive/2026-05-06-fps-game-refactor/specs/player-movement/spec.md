## ADDED Requirements

### Requirement: 玩家移动逻辑封装为 composable
系统 SHALL 提供 `usePlayerMovement` composable，封装 WASD 移动、跑步加速、蹲下减速、跳跃物理和碰撞检测逻辑。

#### Scenario: WASD 移动与碰撞检测
- **WHEN** 玩家按下 W/A/S/D 键并调用 `updateMovement(delta)`
- **THEN** 系统根据方向、速度和 delta 时间计算新位置，并通过 collisionDetector 检测碰撞后更新 playerPosition

#### Scenario: 跑步加速
- **WHEN** 玩家处于跑步状态（isRunning = true）
- **THEN** 移动速度为基础速度的 1.5 倍

#### Scenario: 蹲下减速
- **WHEN** 玩家处于蹲下状态（isCrouching = true）
- **THEN** 移动速度为基础速度的 0.5 倍，玩家高度降至 0.8

#### Scenario: 跳跃物理
- **WHEN** 玩家触发跳跃且当前不在跳跃中
- **THEN** 给予向上初速度 5，受重力 -9.8 影响下落，落地后重置高度为 playerHeight

#### Scenario: 相机位置同步
- **WHEN** 每帧 updateMovement 执行
- **THEN** camera.position 更新为 playerPosition 的 x/y/z 值
