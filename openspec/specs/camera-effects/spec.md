## ADDED Requirements

### Requirement: 相机效果封装为 composable
系统 SHALL 提供 `useCameraEffects` composable，封装屏息稳定性、视角摇晃、呼吸模拟、后坐力恢复和镜头震动效果。

#### Scenario: 屏息稳定性
- **WHEN** 玩家按住屏息键且体力值 > 0
- **THEN** 消耗体力（20/秒），减少摇晃和后坐力至 30%，扩散减少

#### Scenario: 屏息体力耗尽
- **WHEN** 屏息体力降至 0
- **THEN** 自动停止屏息，体力开始恢复

#### Scenario: 体力恢复
- **WHEN** 玩家未屏息且体力 < 100
- **THEN** 以 10/秒 恢复体力，恢复至 100 时停止

#### Scenario: 视角摇晃模拟
- **WHEN** updateSway 每帧调用
- **THEN** 生成 figure-8 图案的摇晃偏移（swayOffset），瞄准时幅度降至 30%，倍镜激活时幅度进一步降至 10%

#### Scenario: 倍镜激活时视角摇晃大幅减少
- **GIVEN** 倍镜处于激活状态（scope.isActive = true）
- **WHEN** updateSway 每帧调用
- **THEN** swayOffset 幅度为基础值的 10%

#### Scenario: 屏息且开镜时摇晃最小
- **GIVEN** 玩家处于屏息状态且倍镜激活
- **WHEN** updateSway 每帧调用
- **THEN** swayOffset 幅度为基础值的 5%（两者叠加）

#### Scenario: 呼吸模拟
- **WHEN** updateSway 每帧调用
- **THEN** 生成垂直为主的呼吸摇晃（breathingSway），瞄准时幅度降至 30%，倍镜激活时幅度进一步降至 10%

#### Scenario: 后坐力恢复
- **WHEN** updateRecoilRecovery 每帧调用
- **THEN** recoilOffset 按 weapon.recoilRecovery 衰减，currentSpread 按 weapon.spreadRecovery 衰减，超过 1 秒未射击重置 recoilIndex

#### Scenario: RPG 镜头震动
- **WHEN** RPG 发射触发 startCameraShake
- **THEN** 在指定持续时间内对相机施加随机偏移，结束后恢复

### Requirement: 跳跃相机反馈
跳跃时 SHALL 有相机位移和震动反馈。

#### Scenario: 起跳相机下沉
- **WHEN** 玩家按下跳跃键
- **THEN** 相机轻微下沉（约 0.05m）后快速恢复，模拟腿部发力

#### Scenario: 落地相机震动
- **WHEN** 玩家从跳跃中落地且下落速度超过 5
- **THEN** 触发相机轻微震动效果并播放落地音效

### Requirement: 跳跃音效
跳跃 SHALL 有对应的音效反馈。

#### Scenario: 起跳播放音效
- **WHEN** 玩家执行跳跃动作
- **THEN** 播放跳跃上升音效

#### Scenario: 落地播放音效
- **WHEN** 玩家跳跃落地且速度较大
- **THEN** 播放沉闷撞击音效

### Requirement: 相机效果 update 调度
useCameraEffects SHALL 暴露 `update(delta)` 方法供游戏循环统一调用，内部调度 sway、recoilRecovery 和 cameraShake 的更新。

#### Scenario: 游戏循环调用
- **WHEN** gameLoop 每帧调用 useCameraEffects 的 update(delta)
- **THEN** 按顺序执行 updateSway、updateRecoilRecovery、updateCameraForShake
