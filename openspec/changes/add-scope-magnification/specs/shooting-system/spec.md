## MODIFIED Requirements

### Requirement: Raycast 命中检测
**原需求**: 从相机位置发射射线，考虑 currentSpread 扩散，屏息状态下扩散减少，命中敌人时触发伤害和命中效果

**修改为**: 从相机位置发射射线，考虑 currentSpread 扩散，屏息状态下扩散减少 70%，倍镜激活状态下 spread 减少 90%（使用 weapon.spreadMultiplier），命中敌人时触发伤害和命中效果

#### Scenario: 倍镜激活时弹道散布大幅减少
- **GIVEN** 玩家已开启倍镜（scope.isActive = true）
- **WHEN** 执行 performRaycast
- **THEN** spread 计算时应用 weapon.spreadMultiplier（狙击枪为 0.1，即减少 90%）

#### Scenario: 屏息且开镜时散布叠加减少
- **GIVEN** 玩家已开启倍镜且处于屏息状态
- **WHEN** 执行 performRaycast
- **THEN** spread 减少效果叠加（先应用 spreadMultiplier，再应用 30% 屏息系数）