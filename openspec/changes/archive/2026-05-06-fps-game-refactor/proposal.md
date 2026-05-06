## Why

FPSGame.vue 是一个 2620 行的 God Component，承载了场景初始化、游戏循环、输入处理、射击系统、波次管理、存档/读档、HUD 渲染、测试 API 等 11 个独立职责。代码难以维护、测试和协作开发，新增功能时极易引入回归问题。当前 `src/game/composables/` 目录为空，项目已有 composable 架构意图但未落地。

## What Changes

- 将 FPSGame.vue 的 `<script setup>` 逻辑拆分为 6 个独立的 composable：`usePlayerMovement`、`usePlayerInput`、`useShooting`、`useCameraEffects`、`useWaveSystem`、`useGameSave`
- 将模板中的 HUD 部分提取为 `GameHUD.vue` 子组件
- 将暂停菜单提取为 `PauseMenu.vue` 子组件
- 将触摸控制提取为 `TouchControls.vue` 子组件（封装现有 VirtualJoystick/VirtualButton + 触摸视角逻辑）
- 将 `window.__testApi` 测试接口提取为独立的 `testApi.ts` 模块，通过环境变量条件加载
- 将 `createObstacles()` 中的 20+ 障碍物预设数据提取为 JSON 配置文件
- 通过 Provide/Inject 共享 Three.js 对象（scene/camera/renderer），避免子组件反向传递
- 修复重复 `onMounted` 块的问题
- FPSGame.vue 最终缩减为协调器角色（~250 行），仅负责组合 composables 和渲染子组件

## Capabilities

### New Capabilities
- `player-movement`: 玩家移动、跳跃、蹲下、跑步、碰撞检测逻辑（composable: usePlayerMovement）
- `player-input`: 键盘、鼠标、触摸输入处理与命令分发（composable: usePlayerInput）
- `shooting-system`: 射击、raycast、RPG 发射、后坐力、自动开火、弹药管理（composable: useShooting）
- `camera-effects`: 相机摇晃、屏息、呼吸模拟、镜头震动效果（composable: useCameraEffects）
- `wave-system`: 波次管理、敌人生成、道具拾取回调、间歇倒计时（composable: useWaveSystem）
- `game-save`: 游戏存档、读档、继续游戏逻辑（composable: useGameSave）
- `game-hud`: HUD 子组件（血条、弹药、波次、crosshair、buff 状态、屏息条）
- `pause-menu`: 暂停菜单子组件（继续、重启、退出）
- `touch-controls`: 触摸控制子组件（虚拟摇杆、按钮、触摸视角）
- `obstacle-config`: 障碍物预设数据配置文件
- `test-api`: 独立测试 API 模块，环境变量条件加载

### Modified Capabilities
（无现有 spec 需要修改，此次为纯重构）

## Impact

- **核心文件**：`apps/frontend/src/views/FPSGame.vue` — 从 2620 行缩减至 ~250 行
- **新增文件**：6 个 composable（`src/game/composables/`）、3 个子组件（`src/components/game/`）、1 个配置文件（`src/game/config/`）、1 个测试模块（`src/game/test/`）
- **依赖关系**：子组件通过 Provide/Inject 获取 Three.js 对象，不再通过 props 反向传递
- **E2E 测试**：需要验证拆分后游戏功能无回归
- **无 API 变更**：纯内部重构，不影响外部接口
