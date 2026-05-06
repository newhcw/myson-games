## ADDED Requirements

### Requirement: 暂停菜单子组件提取
系统 SHALL 提供 `PauseMenu.vue` 子组件，封装暂停覆盖层和操作按钮。

#### Scenario: 暂停状态显示
- **WHEN** 游戏处于暂停状态且 PauseMenu 的 visible prop 为 true
- **THEN** 显示暂停覆盖层和菜单面板，包含"继续游戏"、"重新开始"、"退出游戏"按钮

#### Scenario: 继续游戏
- **WHEN** 玩家点击"继续游戏"按钮
- **THEN** 触发 resume 事件

#### Scenario: 重新开始
- **WHEN** 玩家点击"重新开始"按钮
- **THEN** 触发 restart 事件

#### Scenario: 退出游戏
- **WHEN** 玩家点击"退出游戏"按钮
- **THEN** 触发 exit 事件

#### Scenario: ESC 提示
- **WHEN** 暂停菜单显示
- **THEN** 底部显示"按 ESC 继续游戏"提示文本

### Requirement: PauseMenu 样式与动画
PauseMenu SHALL 使用 Vue transition 实现暂停菜单的进入/离开动画，保持与现有样式一致。

#### Scenario: 过渡动画
- **WHEN** 暂停状态切换
- **THEN** 使用 pause-menu transition 名称执行进入/离开动画
