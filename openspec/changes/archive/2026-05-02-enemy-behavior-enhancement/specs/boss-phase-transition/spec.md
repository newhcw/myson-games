## ADDED Requirements

### Requirement: BOSS狂暴阶段触发

当BOSS血量低于50%时，系统SHALL自动将其切换至狂暴阶段（phase=2），并调整对应属性。

#### Scenario: BOSS血量首次低于50%

- **WHEN** BOSS当前血量 < 最大血量 × 50%
- **THEN** 系统设置 `enemy.phase = 2`
- **AND** 移速提升为 `moveSpeed × 1.5`
- **AND** 攻击间隔缩短为 `attackInterval × 0.6`
- **AND** 大招冷却缩短为 `specialAttack.cooldown × 0.5`
- **AND** 大招弹幕数量增加3发（`projectileCount + 3`）

#### Scenario: BOSS血量回升后不退出狂暴

- **WHEN** BOSS处于狂暴阶段（phase=2）
- **AND** 血量因某种原因回升至50%以上
- **THEN** BOSS保持狂暴阶段不变（phase仍为2）

### Requirement: BOSS狂暴阶段视觉效果

BOSS进入狂暴阶段时，系统SHALL在视觉上明显区分，让儿童玩家能直观感知。

#### Scenario: 身体颜色渐变

- **WHEN** BOSS进入狂暴阶段
- **THEN** 身体颜色在1秒内从原色渐变至深红色（0x8B0000）
- **AND** 颜色过渡平滑（使用线性插值）

#### Scenario: 粒子特效增强

- **WHEN** BOSS处于狂暴阶段
- **THEN** 粒子颜色从橙黄混合变为红+紫混合
- **AND** 底部光环旋转速度加快（从0.01提升至0.03弧度/帧）
- **AND** 新增红色火焰环特效（位于BOSS底部，持续旋转）

#### Scenario: 血条视觉变化

- **WHEN** BOSS进入狂暴阶段
- **THEN** 血条边框变为红色并闪烁
- **AND** 血条上方显示"狂暴!"文字提示

### Requirement: BOSS狂暴阶段攻击增强

BOSS在狂暴阶段时，系统SHALL提升攻击频率和伤害。

#### Scenario: 攻击间隔缩短

- **WHEN** BOSS处于狂暴阶段
- **AND** 尝试进行普通攻击
- **THEN** 使用缩短后的攻击间隔（原间隔 × 0.6）

#### Scenario: 大招冷却缩短

- **WHEN** BOSS处于狂暴阶段
- **AND** 大招进入冷却
- **THEN** 使用缩短后的冷却时间（原冷却 × 0.5）

#### Scenario: 大招弹幕增加

- **WHEN** BOSS处于狂暴阶段
- **AND** 释放扇形弹幕
- **THEN** 发射子弹数量 = 原数量 + 3
