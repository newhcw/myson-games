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

#### Scenario: 冲锋枪按住连射
- **GIVEN** 玩家装备冲锋枪（fireRate=10，isAuto=true），弹药充足
- **WHEN** 玩家按住鼠标左键不放
- **THEN** 系统 SHALL 以每秒 10 发的速率自动连续射击
- **AND** 松开鼠标左键后立即停止射击

#### Scenario: 步枪按住连射
- **GIVEN** 玩家装备步枪（fireRate=5，isAuto=true），弹药充足
- **WHEN** 玩家按住鼠标左键不放
- **THEN** 系统 SHALL 以每秒 5 发的速率自动连续射击

#### Scenario: 半自动武器按住不连发
- **GIVEN** 玩家持有手枪（isAuto=false）
- **WHEN** 玩家按住鼠标左键不放
- **THEN** 系统 SHALL NOT 自动连射
- **AND** 仅在第一帧发射一发子弹

#### Scenario: 松开鼠标停止射击
- **GIVEN** 玩家正在使用自动武器连射中
- **WHEN** 玩家松开鼠标左键
- **THEN** 系统 SHALL 立即停止射击

#### Scenario: 弹药耗尽停止射击
- **GIVEN** 玩家正在使用自动武器连射中，弹药仅剩最后一发
- **WHEN** 最后一发子弹射出
- **THEN** 系统 SHALL 停止射击并播放空仓音效

#### Scenario: 换弹期间暂停射击
- **GIVEN** 玩家正在连射中
- **WHEN** 弹药耗尽触发自动换弹或玩家手动换弹
- **THEN** 系统 SHALL 暂停射击直到换弹完成

#### Scenario: 触摸屏虚拟按钮按住连发
- **GIVEN** 触屏设备上玩家装备自动武器
- **WHEN** 玩家按住虚拟射击按钮不放
- **THEN** 系统 SHALL 以武器射速自动连射
- **AND** 松开虚拟按钮后立即停止

#### Scenario: 鼠标在画布外释放时停止射击
- **GIVEN** 玩家正在使用自动武器连射中
- **WHEN** 鼠标指针移动到游戏画布外并释放
- **THEN** 系统 SHALL 检测到 pointer lock 状态变化并停止射击

#### Scenario: Raycast 命中检测
- **WHEN** performRaycast 执行
- **THEN** 从相机位置发射射线，考虑 currentSpread 扩散，屏息状态下扩散减少 70%，倍镜激活状态下 spread 减少 90%（使用 weapon.spreadMultiplier），命中敌人时触发伤害和命中效果

#### Scenario: 倍镜激活时弹道散布大幅减少
- **GIVEN** 玩家已开启倍镜（scope.isActive = true）
- **WHEN** 执行 performRaycast
- **THEN** spread 计算时应用 weapon.spreadMultiplier（狙击枪为 0.1，即减少 90%）

#### Scenario: 屏息且开镜时散布叠加减少
- **GIVEN** 玩家已开启倍镜且处于屏息状态
- **WHEN** 执行 performRaycast
- **THEN** spread 减少效果叠加（先应用 spreadMultiplier，再应用 30% 屏息系数）

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
