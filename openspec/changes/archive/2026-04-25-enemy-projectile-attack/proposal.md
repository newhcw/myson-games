## Why

当前敌人对玩家造成伤害的方式只有一种：即时命中射线（hitscan）。所有敌人类型（小兵、精英、BOSS）共享完全相同的射击逻辑，区别仅在于伤害数值。对于一款面向儿童的游戏来说，这种机制缺乏视觉趣味性和游戏性——小朋友看不到子弹飞来，无法主动躲避，只能被动挨打，体验单调。

## What Changes

- **BREAKING**: 将敌人攻击方式从即时射线命中（hitscan）改为可见弹道投射物（projectile）系统
- 为每种敌人类型设计不同的子弹外观：小兵 = 黄色星星弹，精英 = 紫色水晶弹，BOSS = 红色大火球
- 每种敌人拥有差异化弹道参数：射速、子弹速度、散布精度、攻击间隔
- BOSS 新增扇形弹幕大招技能，每隔一段时间释放多枚火球
- 精英新增蓄力射击机制：射击前有激光瞄准线预警，给玩家躲避窗口
- 引入子弹对象池（ProjectilePool）确保大量子弹同时存在时的性能
- 子弹与玩家之间使用距离碰撞检测
- 子弹命中玩家时产生卡通化的爆炸粒子特效（星星/彩色粒子，非血腥效果）

## Capabilities

### New Capabilities

- `enemy-projectile-system`: 弹道投射物核心系统，包括子弹类、对象池、飞行运动、碰撞检测和生命周期管理
- `projectile-visuals`: 子弹视觉特效，包括三种敌人类型的差异化子弹外观、尾迹粒子、命中爆炸特效
- `enemy-attack-patterns`: 差异化攻击模式，包括小兵连射、精英蓄力射击、BOSS 扇形弹幕大招和预警机制

### Modified Capabilities

<!-- 无现有 specs，均为新增能力 -->

## Impact

- **新增文件**: `EnemyProjectile.ts`（子弹类+对象池）、`ProjectileRenderer.ts`（子弹模型创建）、`ProjectileManager.ts`（子弹管理器）
- **修改文件**: `types.ts`（EnemyConfig 扩展弹道参数）、`EnemyAI.ts`（将 tryShootPlayer 从射线改为生成子弹）、`EnemyManager.vue`（初始化 ProjectileManager）、`FPSGame.vue`（gameLoop 中更新子弹）
- **可保留文件**: `EnemyShooter.ts`（保留但不再用于玩家伤害，其射线检测能力可用于障碍物遮挡判断）
- **不涉及**: 后端、路由、store、武器系统
