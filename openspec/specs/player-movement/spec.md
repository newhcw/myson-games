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
- **THEN** 给予向上初速度 5（轻按）到 8（长按蓄力 200ms），受重力 -14.7 影响下落，落地后重置高度为 playerHeight

#### Scenario: 可变跳跃高度
- **WHEN** 玩家按住跳跃键 200ms 内释放
- **THEN** 跳跃初速度在 5 到 8 之间线性增长，按住超过 200ms 触发最大初速度

#### Scenario: 空中碰撞检测
- **WHEN** 玩家处于跳跃状态且玩家底部高于障碍物顶部
- **THEN** 碰撞检测跳过该障碍物，玩家可从上方越过矮障碍物（树桩、灌木）

#### Scenario: 相机位置同步
- **WHEN** 每帧 updateMovement 执行
- **THEN** camera.position 更新为 playerPosition 的 x/y/z 值
