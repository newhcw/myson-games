## Why

目前游戏中的敌人具备近战攻击能力，但由于攻击范围过小（1.5单位）且缺乏远程射击机制，玩家几乎感受不到来自敌人的威胁。敌人只是被动地被玩家击杀，无法对玩家造成有效伤害。这严重影响了游戏的挑战性和紧张感。

## What Changes

- **新增敌人远程射击系统**：敌人在视野范围内可对玩家进行远程射线检测射击
- **新增伤害反馈系统**：玩家受伤时屏幕边缘闪红、血条平滑过渡、伤害数字显示
- **新增死亡与重生系统**：玩家死亡后显示统计界面，通过按钮手动重生
- **改进敌人攻击逻辑**：移除原有的近距离近战攻击，改为统一的远程射击机制

## Capabilities

### New Capabilities

- `enemy-ranged-attack`：敌人远程射击能力，包括射击间隔、精度偏移、射程等参数配置
- `damage-feedback`：玩家受伤时的视觉反馈，包括屏幕闪红效果、血条动画
- `player-death`：玩家死亡处理，包括死亡界面、统计展示、手动重生机制

### Modified Capabilities

- `enemy-ai`：现有敌人AI状态机需要扩展，增加 `attack` 状态的射击行为实现

## Impact

- **新增文件**：`src/game/enemies/EnemyShooter.ts`、`src/game/ui/DamageFeedback.ts`、`src/game/ui/DeathScreen.vue`
- **修改文件**：`src/game/enemies/EnemyAI.ts`、`src/stores/game.ts`、`src/views/FPSGame.vue`
- **无外部依赖**：纯前端实现，不涉及后端或第三方库
