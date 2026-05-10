# 死亡界面用户体验

死亡界面的指针释放、光标显示与输入拦截规范。

## Purpose

玩家角色死亡后，系统需自动释放鼠标指针锁定、显示光标以便操作死亡界面按钮，并在死亡状态下阻止所有游戏输入。

## Requirements

### Requirement: 死亡时释放指针锁定

玩家角色死亡时，系统 SHALL 自动释放鼠标指针锁定（Pointer Lock），使鼠标恢复正常操作。

#### Scenario: 死亡时指针解锁
- **WHEN** 玩家角色死亡（`gameStore.isDead` 变为 `true`）
- **THEN** `document.exitPointerLock()` SHALL 被调用

#### Scenario: 死亡时倍镜关闭
- **WHEN** 玩家角色死亡
- **THEN** 倍镜 SHALL 自动关闭

### Requirement: 死亡时显示光标

死亡界面显示时，鼠标光标 SHALL 可见，形状为小手（`pointer`）。

#### Scenario: 死亡时光标变为小手
- **WHEN** 玩家角色死亡
- **THEN** 游戏容器的 cursor 样式 SHALL 被覆盖为 `pointer`

#### Scenario: 复活时恢复光标
- **WHEN** 玩家点击"再次挑战"���活后
- **THEN** 游戏容器的 cursor 样式 SHALL 恢复为 `none`

### Requirement: 死亡时阻止游戏输入

玩家死亡后，所有游戏输入 SHALL 被阻止。

#### Scenario: 死亡时键盘操作被拦截
- **WHEN** 玩家角色死亡
- **THEN** 按下 WASD、空格、Shift、R 等按键 SHALL NOT 触发任何游戏行为

#### Scenario: 死亡时鼠标射击被拦截
- **WHEN** 玩家角色死亡
- **THEN** 鼠标左键点击 SHALL NOT 触发射击

#### Scenario: 死亡时点击不重新锁定指针
- **WHEN** 玩家角色死亡后点击游戏区域
- **THEN** 系统 SHALL NOT 请求 Pointer Lock
