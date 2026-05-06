## ADDED Requirements

### Requirement: 键盘输入处理封装为 composable
系统 SHALL 提供 `usePlayerInput` composable，封装键盘事件监听、InputManager 按键映射注册、鼠标事件处理和指针锁定控制。

#### Scenario: 键盘事件分发
- **WHEN** 玩家按下/释放键盘按键
- **THEN** 系统更新 keys 状态（WASD）、切换跑步/蹲下状态、触发 InputManager 命令（武器切换/换弹/倍镜/跳跃）

#### Scenario: 鼠标视角控制
- **WHEN** 鼠标移动事件触发且指针已锁定
- **THEN** 系统根据鼠标偏移量更新 yaw/pitch 值并应用到相机旋转

#### Scenario: 鼠标射击控制
- **WHEN** 鼠标左键按下
- **THEN** 设置 isFiring 为 true 并调用 fire 回调

#### Scenario: 指针锁定管理
- **WHEN** 点击游戏容器
- **THEN** 请求指针锁定；ESC 键在已暂停时恢复游戏并重新锁定

#### Scenario: InputManager 按键映射
- **WHEN** composable 初始化
- **THEN** 从 localStorage 加载自定义按键配置并注册所有按键映射（1-6 武器切换、Q 循环、R 换弹等）

### Requirement: ESC 键和 F9 键处理
系统 SHALL 在 usePlayerInput 中处理 ESC（暂停/恢复切换）和 F9（手动存档）特殊按键。

#### Scenario: ESC 暂停切换
- **WHEN** 玩家按下 ESC 键
- **THEN** 若游戏进行中则暂停并解锁指针，若已暂停则恢复并锁定指针

#### Scenario: F9 手动存档
- **WHEN** 玩家按下 F9 键
- **THEN** 调用存档回调函数

### Requirement: 事件监听器生命周期管理
系统 SHALL 在 onMounted 时注册所有事件监听器，在 onUnmounted 时移除所有事件监听器。

#### Scenario: 组件卸载清理
- **WHEN** 组件卸载
- **THEN** 所有 window/document 级别的事件监听器被正确移除
