## ADDED Requirements

### Requirement: 射击系统封装为 composable
系统 SHALL 提供 `useShooting` composable，封装射击逻辑、raycast 检测、RPG 发射、后坐力系统和自动开火。

#### Scenario: 常规武器射击
- **WHEN** 调用 fire() 且当前武器有弹药且不在换弹中
- **THEN** 扣减弹药、应用后坐力、执行 raycast 命中检测、播放射击音效

#### Scenario: RPG 发射
- **WHEN** 调用 fire() 且当前武器类型为 rpg
- **THEN** 通过 rocketManager 发射火箭弹并触发屏幕震动效果

#### Scenario: 后坐力系统
- **WHEN** 射击触发 applyRecoil
- **THEN** 根据武器 recoilPattern 更新 recoilOffset，屏息状态下后坐力减少 70%，spread 随射击累积

#### Scenario: 自动开火
- **WHEN** isFiring 为 true 且当前武器为自动模式
- **THEN** 按武器射率间隔持续调用 fire()

#### Scenario: Raycast 命中检测
- **WHEN** performRaycast 执行
- **THEN** 从相机位置发射射线，考虑 currentSpread 扩散，屏息状态下扩散减少，命中敌人时触发伤害和命中效果

### Requirement: RPG 爆炸伤害处理
系统 SHALL 在 useShooting 中处理 RPG 爆炸的范围伤害和击退效果。

#### Scenario: 爆炸范围伤害
- **WHEN** RPG 火箭爆炸
- **THEN** 对爆炸半径内的敌人造成伤害（距离衰减），并对玩家造成自伤

### Requirement: 射击系统依赖注入
useShooting SHALL 接受相机、场景、玩家位置和 enemyManager 引用作为依赖，通过参数或 GameContext 注入。

#### Scenario: 依赖缺失保护
- **WHEN** camera 或 scene 为 null
- **THEN** fire/fireRocket/performRaycast 等操作安全返回，不抛出异常
