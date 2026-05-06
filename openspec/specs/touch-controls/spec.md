## ADDED Requirements

### Requirement: 触摸控制子组件提取
系统 SHALL 提供 `TouchControls.vue` 子组件，封装虚拟摇杆、虚拟按钮和触摸视角控制逻辑。

#### Scenario: 触摸设备检测
- **WHEN** TouchControls 渲染
- **THEN** 仅在触摸设备上显示虚拟控制元素

#### Scenario: 虚拟摇杆移动
- **WHEN** 玩家拖动虚拟摇杆
- **THEN** 触发 move 事件传递方向向量 {x, y}

#### Scenario: 虚拟按钮操作
- **WHEN** 玩家按下/释放虚拟按钮
- **THEN** 触发 press/release 事件传递按钮类型（shoot/jump/crouch/reload/scope）

#### Scenario: 触摸视角控制
- **WHEN** 玩家在触摸视角区域滑动
- **THEN** 根据触摸偏移量更新 yaw/pitch 并应用到相机旋转

### Requirement: TouchControls 接口
TouchControls SHALL 通过 props 接收是否为触摸设备，通过 emit 向外发送控制事件。

#### Scenario: Props 和 Events
- **WHEN** 父组件渲染 TouchControls
- **THEN** 通过 props 传入 isTouchDevice，通过 emit 接收 virtual-move、virtual-stop、virtual-button-press、virtual-button-release、touch-look 事件
