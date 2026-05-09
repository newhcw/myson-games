## ADDED Requirements

### Requirement: 跳跃相机反馈

跳跃时 SHALL 有相机位移和震动反馈。

#### Scenario: 起跳相机下沉
- **WHEN** 玩家按下跳跃键
- **THEN** 相机轻微下沉（约 0.05m）后快速恢复，模拟腿部发力

#### Scenario: 落地相机震动
- **WHEN** 玩家从跳跃中落地且下落速度超过阈值
- **THEN** 触发相机轻微震动效果

### Requirement: 跳跃音效

跳跃 SHALL 有对应的音效反馈。

#### Scenario: 起跳播放音效
- **WHEN** 玩家执行跳跃动作
- **THEN** 播放跳跃音效

#### Scenario: 落地播放音效
- **WHEN** 玩家跳跃落地且速度较大
- **THEN** 播放落地音效

### Requirement: 跳跃触屏按钮

触屏虚拟摇杆界面 SHALL 包含跳跃按钮。

#### Scenario: 触屏显示跳跃按钮
- **WHEN** 在触屏设备上进入游戏
- **THEN** 屏幕右侧显示跳跃按钮

#### Scenario: 触屏跳跃按钮可点击
- **WHEN** 玩家点击触屏跳跃按钮
- **THEN** 玩家执行跳跃，效果与键盘空格相同
