## ADDED Requirements

### Requirement: 场景中展示卡通风格太阳
系统 SHALL 在游戏场景高空位置创建一个卡通风格的太阳，并带有柔和的光晕动画效果。

#### Scenario: 太阳在场景中正确显示
- **WHEN** 游戏场景初始化完成
- **THEN** 在场景高空位置（y ≥ 50）出现一个暖色（橙黄）球体，周围有光晕效果

#### Scenario: 太阳带光晕脉动动画
- **WHEN** 游戏持续运行
- **THEN** 太阳的光晕大小随时间缓慢脉动（周期约 2~3 秒），产生呼吸效果

### Requirement: 场景中展示飞行的小鸟
系统 SHALL 在场景高空区域创建 3~5 只由几何体组合成的卡通风格小鸟，沿圆形路径循环飞行，翅膀持续扇动。

#### Scenario: 小鸟在场景中生成
- **WHEN** 游戏场景初始化完成
- **THEN** 场景高空区域（y ≥ 15）出现 3~5 只卡通风格小鸟

#### Scenario: 小鸟沿路径飞行
- **WHEN** 游戏持续运行
- **THEN** 每只小鸟沿圆形路径持续飞行，飞行高度保持在高空区域

#### Scenario: 小鸟翅膀扇动动画
- **WHEN** 游戏持续运行
- **THEN** 每只小鸟的翅膀持续上下扇动，模拟飞行姿态

#### Scenario: 小鸟初始位置和速度随机化
- **WHEN** 场景初始化
- **THEN** 每只小鸟的初始角度、飞行半径、飞行速度在合理范围内随机取值，使鸟群运动自然不重复

### Requirement: 环境元素通过 EnvironmentManager 统一管理
系统 SHALL 提供 EnvironmentManager 类统一创建和管理太阳、小鸟等场景装饰元素。

#### Scenario: EnvironmentManager 初始化
- **WHEN** `EnvironmentManager.init(scene)` 被调用
- **THEN** 场景中创建太阳和指定数量的小鸟

#### Scenario: EnvironmentManager 更新
- **WHEN** `EnvironmentManager.update(delta)` 被调用
- **THEN** 太阳光晕和小鸟翅膀按 delta 时间推进动画

#### Scenario: EnvironmentManager 清理
- **WHEN** `EnvironmentManager.dispose()` 被调用
- **THEN** 所有环境元素从场景中移除，释放资源
