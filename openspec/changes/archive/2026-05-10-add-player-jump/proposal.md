## Why

目前玩家只能在地面水平移动，遇到障碍物只能绕行。Q 版卡通射击游戏中，跳跃是基础且核心的操作能力，能大幅提升游戏的趣味性和操作深度。同时，跳跃可以让玩家越过矮障碍物（树桩、灌木、小岩石），开辟新的战术路径。

## What Changes

- 增强跳跃物理系统：调整跳跃高度和重力参数，使玩家能越过矮障碍物
- 实现空中碰撞检测：跳跃时能越过矮障碍物，不被水平碰撞阻挡
- 增加可变跳跃高度：按住跳跃键跳得更高，轻按跳得低
- 添加跳跃动画效果：起跳和落地时的相机位移/震动反馈
- 在虚拟摇杆 UI 中增加跳跃按钮
- 添加跳跃音效

## Capabilities

### New Capabilities
- `player-jump`: 玩家跳跃能力，包括跳跃物理、空中碰撞检测、可变高度、落地检测
- `jump-effects`: 跳跃相关的视觉和���效反馈

### Modified Capabilities

无

## Impact

- **apps/frontend/src/game/composables/usePlayerMovement.ts** — 增强跳跃物理（重力、速度、碰撞检测）
- **apps/frontend/src/game/utils/Collision.ts** — 添加 Y 轴碰撞检测支持
- **apps/frontend/src/game/composables/usePlayerInput.ts** — 确保空格键触发跳跃
- **apps/frontend/src/game/input/Command.ts** — 更新 JumpCommand
- **apps/frontend/src/components/game/TouchControls.vue** — 添加跳跃按钮
- **apps/frontend/src/game/sound/SoundManager.ts** — 添加跳跃音效
