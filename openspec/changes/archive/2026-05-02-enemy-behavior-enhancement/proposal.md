## Why

当前游戏已有3种敌人类型（小兵/精英/BOSS）和基础AI状态机，但玩家反馈战斗体验单一，缺乏策略性。需要增强敌人的行为多样性，让战斗更有挑战性和趣味性，同时保持儿童友好的视觉风格。

## What Changes

- **BOSS阶段转换**：BOSS血量低于50%时进入"狂暴阶段"，外观变红、攻击频率提升、大招冷却缩短
- **敌人破坏障碍物**：敌人可以射击障碍物，改变战场格局，增加策略性
- **技能冷却显示UI**：为精英蓄力攻击和BOSS大招添加冷却进度条，让玩家有明确应对时机
- **新增自爆兵**：冲锋到玩家附近后自爆，增加紧张感和躲避策略
- **新增治疗者**：周期性为周围友军恢复生命值，迫使玩家优先击杀

## Capabilities

### New Capabilities

- `boss-phase-transition`: BOSS血量低于50%时进入狂暴阶段，改变外观和攻击模式
- `enemy-obstacle-destruction`: 敌人可以检测并射击障碍物，破坏后改变战场格局
- `enemy-cooldown-ui`: 为精英蓄力攻击和BOSS大招添加冷却进度条显示
- `enemy-exploder`: 新增自爆兵敌人类型，快速冲锋并在玩家附近自爆
- `enemy-healer`: 新增治疗者敌人类型，周期性为周围友军恢复生命值

### Modified Capabilities

（无现有能力需要修改）

## Impact

- **修改文件**：
  - `apps/frontend/src/game/enemies/types.ts` - 新增敌人类型配置和接口字段
  - `apps/frontend/src/game/enemies/EnemyAI.ts` - 新增AI行为逻辑（阶段转换、自爆、治疗、障碍物破坏）
  - `apps/frontend/src/game/enemies/EnemyRenderer.ts` - 新增敌人渲染和动画（自爆兵、治疗者、狂暴特效）
  - `apps/frontend/src/game/enemies/EnemyHealthBar.ts` - 新增冷却进度条显示
  - `apps/frontend/src/game/enemies/EnemyShooter.ts` - 新增障碍物射击逻辑
  - `apps/frontend/src/game/utils/Collision.ts` - 新增可破坏障碍物支持
  - `apps/frontend/src/game/wave/WaveManager.ts` - 波次配置添加新敌人类型
  - `apps/frontend/src/views/FPSGame.vue` - 障碍物创建逻辑修改

- **依赖**：无新增外部依赖，纯前端逻辑增强
- **性能影响**：新增特效需要考虑同屏多敌人场景，需控制粒子数量
- **儿童友好**：所有视觉效果色彩鲜艳、动画流畅，避免恐怖或过度暴力表现
