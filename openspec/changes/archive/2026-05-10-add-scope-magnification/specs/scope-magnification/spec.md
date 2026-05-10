## ADDED Requirements

### Requirement: 倍镜系统封装为 composable
系统 SHALL 提供 `useScopeMagnification` composable，封装 FOV 调整、过渡动画、暗角效果和准星管理功能。

#### Scenario: 倍镜激活时 FOV 缩小
- **WHEN** 玩家切换到支持倍镜的武器并开启倍镜
- **THEN** 相机 FOV 从当前值动态缩小至 目标值（baseFov / magnification）
- **AND** 过渡过程在 200ms 内完成，视觉上平滑过渡

#### Scenario: 倍镜关闭时 FOV 恢复
- **WHEN** 玩家关闭倍镜
- **THEN** 相机 FOV 从当前值平滑恢复至原始值（baseFov）
- **AND** 过渡过程在 200ms 内完成

#### Scenario: 倍镜状态切换时无闪烁
- **WHEN** 玩家快速连续切换倍镜（间隔 < 100ms）
- **THEN** 系统 SHALL 忽略后续切换请求，确保动画完整播放

#### Scenario: 武器切换时自动关闭倍镜
- **WHEN** 玩家切换到不支持倍镜的武器
- **THEN** 倍镜自动关闭，FOV 恢复原始值

#### Scenario: 倍镜开启时视角摇晃减少
- **WHEN** 倍镜处于激活状态
- **THEN** 视角摇晃幅度减少至 30%，呼吸模拟幅度减少至 30%

### Requirement: 暗角效果
系统 SHALL 在倍镜激活时显示暗角效果，提示玩家当前处于瞄准状态。

#### Scenario: 倍镜激活时显示暗角
- **WHEN** 倍镜激活
- **THEN** 屏幕边缘显示渐变暗角，中心区域保持清晰

#### Scenario: 倍镜关闭时移除暗角
- **WHEN** 倍镜关闭
- **AND** FOV 过渡动画完成
- **THEN** 暗角效果消失

#### Scenario: 暗角效果可配置
- **GIVEN** 系统提供暗角强度配置选项
- **WHEN** 玩家在设置中调整暗角强度
- **THEN** 暗角效果按新强度显示

### Requirement: 准星替换
系统 SHALL 在倍镜激活时将默认准星替换为精确瞄准十字准星。

#### Scenario: 倍镜激活时准星变化
- **WHEN** 倍镜激活
- **THEN** 默认准星隐藏，显示精细十字准星
- **AND** 十字准星线条更细、颜色更亮

#### Scenario: 倍镜关闭时恢复默认准星
- **WHEN** 倍镜关闭
- **THEN** 精细十字准星隐藏，恢复显示默认准星

### Requirement: 倍镜状态与游戏状态同步
系统 SHALL 在游戏暂停、死亡、胜利等状态变化时正确处理倍镜状态。

#### Scenario: 游戏暂停时倍镜状态保持
- **WHEN** 游戏进入暂停状态
- **THEN** 倍镜状态保持不变

#### Scenario: 玩家死亡时倍镜重置
- **WHEN** 玩家死亡
- **THEN** 倍镜自动关闭，FOV 恢复原始值

#### Scenario: 游戏重新开始时倍镜重置
- **WHEN** 游戏重新开始
- **THEN** 倍镜默认关闭状态，FOV 为默认值 75

### Requirement: 倍镜倍率支持
系统 SHALL 支持不同的倍镜倍率配置，当前武器决定使用的倍率。

#### Scenario: 狙击枪使用 4 倍镜
- **GIVEN** 玩家装备狙击枪（scopeMultiplier = 4）
- **WHEN** 开启倍镜
- **THEN** FOV 调整为 75 / 4 = 18.75 度

#### Scenario: 红点瞄准镜使用 1.5 倍镜
- **GIVEN** 玩家装备红点瞄准镜（magnification = 1.5）
- **WHEN** 开启倍镜
- **THEN** FOV 调整为 75 / 1.5 = 50 度

#### Scenario: 最大倍率为 8 倍
- **GIVEN** 武器配置了 8 倍倍率
- **WHEN** 开启倍镜
- **THEN** FOV 调整为 75 / 8 = 9.375 度（最低不低于 10 度）