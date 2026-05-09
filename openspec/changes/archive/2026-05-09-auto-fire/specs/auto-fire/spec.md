## ADDED Requirements

### Requirement: 自动连发武器支持按住射击
当玩家按住射击键（鼠标左键或虚拟射击按钮）且当前装备的武器 `isAuto` 属性为 `true` 时，系统 SHALL 按照武器配置的 `fireRate`（发/秒）自动连续发射子弹，直至玩家松开射击键或弹药耗尽。

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
