## Why

当前游戏敌人固定 5 个、击杀后 30 秒原地重生，缺乏节奏感、目标感和成长感。玩家不知道"赢"的条件，地图也始终是静态的，导致游戏容易乏味。需要通过波次系统赋予玩家明确的目标和阶段感，通过道具掉落系统增加惊喜感和策略深度。

## What Changes

- **新增波次系统**：10 波循环配置，每波递增敌人数量和类型（小兵 → 精英 → BOSS），第 10 波通关后显示通关界面
- **新增波次间歇**：每波之间 5 秒倒计时，显示"第 X 波即将开始"，可按键提前开始
- **新增道具掉落**：击杀敌人有概率掉落 3 种道具（生命药水 / 弹药补给 / 双倍伤害），BOSS 必掉、精英高概率掉
- **新增 Buff 状态管理**：道具效果有时效性（双倍伤害 10 秒等），Buff 图标显示在 HUD
- **新增通关界面**：第 10 波全部击杀后显示通关结算，可选择重新开始或返回主页
- **HUD 更新**：显示当前波次、波次间歇倒计时、Buff 状态图标

## Capabilities

### New Capabilities

- `wave-system`：波次管理核心逻辑，包括波次配置、敌人生成、波次状态机（战斗中/间歇/通关）、波次间倒计时
- `powerup-system`：道具掉落、3D 模型渲染、拾取检测、Buff 效果应用与计时
- `victory-screen`：通关界面，显示本局数据（波次、击杀、得分），提供重新开始/返回主页选项

### Modified Capabilities

- `fps-game-3d`：FPSGame.vue 需要集成波次管理器、道具管理器、通关界面，HUD 增加波次和 Buff 显示

## Impact

- `apps/frontend/src/views/FPSGame.vue`：集成波次/道具系统，HUD 增加波次显示和 Buff 图标
- `apps/frontend/src/components/game/EnemyManager.vue`：从固定生成改为按波次配置生成敌人，击杀时触发道具掉落
- `apps/frontend/src/stores/game.ts`：增加波次状态、Buff 状态管理
- `apps/frontend/src/game/wave/`（新增）：WaveManager 核心逻辑
- `apps/frontend/src/game/powerups/`（新增）：PowerUpManager、BuffManager、道具 3D 模型
- `apps/frontend/src/game/ui/VictoryScreen.vue`（新增）：通关界面组件
