## 1. BOSS阶段转换

- [x] 1.1 修改 `apps/frontend/src/game/enemies/types.ts`：在 `Enemy` 接口添加 `phase: number` 字段（1=正常，2=狂暴），在 `EnemyConfig` 添加可选字段 `phase2Multiplier: number`
- [x] 1.2 修改 `apps/frontend/src/game/enemies/EnemyAI.ts`：在 `update()` 方法中检测BOSS血量，低于50%时触发阶段转换（设置phase=2，提升移速×1.5，缩短攻击间隔×0.6，缩短大招冷却×0.5，增加弹幕数量+3）
- [x] 1.3 修改 `apps/frontend/src/game/enemies/EnemyRenderer.ts`：在 `updateBossEffects()` 中添加狂暴阶段视觉效果（血量<50%时身体颜色渐变到深红，粒子颜色变红紫混合，光环旋转速度加快至0.03，新增红色火焰环特效）
- [x] 1.4 修改 `apps/frontend/src/game/enemies/EnemyHealthBar.ts`：检测BOSS阶段，狂暴时血条边框变红闪烁，新增 `updateBossPhaseVisual()` 方法处理平滑过渡，显示"💫 狂暴!"文字提示

## 2. 障碍物破坏系统

- [x] 2.1 修改 `apps/frontend/src/game/utils/Collision.ts`：新增 `ObstacleData` 接口，修改 `addCollider()` 支持血量参数，新增 `takeDamageAtPosition()` 和 `getObstacleAt()` 方法，使用 `Map<meshUuid, ObstacleData>` 存储
- [x] 2.2 修改 `apps/frontend/src/views/FPSGame.vue`：在 `createObstacles()` 中为可破坏障碍物添加血量（大型100HP/中型60HP/小型30HP），在 `userData` 存储破坏状态，被破坏时播放破碎动画（缩放→0 + 透明度→0），新增 `onObstacleDestroyed()` 回调
- [x] 2.3 修改 `apps/frontend/src/game/enemies/EnemyShooter.ts`：新增 `findTargetToAttack()` 方法（优先攻击玩家，若被遮挡则攻击障碍物），新增 `damageObstacle()` 方法
- [x] 2.4 修改 `apps/frontend/src/game/enemies/EnemyAI.ts`：在 `updateEnemyBehavior()` 的 `chase` 状态中检测路径障碍物，若阻挡且血量>50%则尝试射击障碍物，障碍物破坏后更新路径

## 3. 技能冷却显示UI

- [x] 3.1 修改 `apps/frontend/src/game/enemies/EnemyHealthBar.ts`：在血条下方新增冷却进度条DOM元素（仅对精英和BOSS显示），精英蓄力显示红色进度条（1.5秒），BOSS大招显示黄色进度条（8秒），新增 `updateCooldownBar()` 方法
- [x] 3.2 修改 `apps/frontend/src/components/game/EnemyManager.vue`：在 `update()` 中计算并传递冷却进度到 `EnemyHealthBar`，新增 `getCooldownProgress(enemy)` 方法返回 `{ type: string, progress: number } | null`
- [x] 3.3 修改 `apps/frontend/src/game/enemies/EnemyHealthBar.ts`：实现狂暴阶段冷却条颜色变红并加快动画速度

## 4. 新增自爆兵敌人

- [x] 4.1 修改 `apps/frontend/src/game/enemies/types.ts`：在 `EnemyConfig.type` 联合类型添加 `'exploder'`，新增自爆兵配置（血量80，移速6，视野12，伤害40，爆炸半径3，触发距离2，预警1秒）
- [x] 4.2 修改 `apps/frontend/src/game/enemies/EnemyRenderer.ts`：在 `createEnemyMesh()` 添加 `exploder` 类型渲染逻辑（橙色身体+黑色头部+红色脉冲光晕），新增 `updateExploderEffects()` 函数处理预警动画
- [x] 4.3 修改 `apps/frontend/src/game/enemies/EnemyAI.ts`：在 `updateEnemyBehavior()` 处理自爆兵逻辑（追逐状态正常移动，距离<2米进入attack状态播放预警1秒，预警结束触发爆炸），新增 `triggerExplosion()` 方法（爆炸特效+对玩家伤害+敌人死亡）
- [x] 4.4 修改 `apps/frontend/src/game/enemies/EnemyHealthBar.ts`：自爆兵血条使用橙色，预警时闪烁效果

## 5. 新增治疗者敌人

- [x] 5.1 修改 `apps/frontend/src/game/enemies/types.ts`：添加 `'healer'` 类型，新增治疗者配置（血量60，移速2，视野360°，治疗量20，治疗半径8，治疗间隔3秒，伤害0）
- [x] 5.2 修改 `apps/frontend/src/game/enemies/EnemyRenderer.ts`：添加治疗者外观（绿色身体+白色十字标记+绿色脉冲光晕），治疗时有绿色粒子向上飘散效果
- [x] 5.3 修改 `apps/frontend/src/game/enemies/EnemyAI.ts`：在 `update()` 中处理治疗逻辑（不主动追逐，每3秒检测周围8米内友军，对血量不满的友军恢复20HP，播放绿色粒子特效）
- [x] 5.4 修改 `apps/frontend/src/game/enemies/EnemyHealthBar.ts`：治疗者血条使用绿色主题，类型标签显示"治疗者"

## 6. 波次配置更新

- [x] 6.1 修改 `apps/frontend/src/game/wave/WaveManager.ts`：在 `WAVE_CONFIGS` 中适当波次添加新敌人类型（第4波开始自爆兵，第6波开始治疗者）
- [x] 6.2 更新波次配置：第4波（1自爆+4小兵），第6波（1治疗者+5小兵+1精英），第7波（2自爆+3精英），第9波（2治疗者+3精英+2BOSS）

## 7. 测试与验证

- [x] 7.1 启动开发服务器 `cd apps/frontend && npm run dev`，验证BOSS阶段转换（血量<50%时外观变红、攻击频率提升）
- [x] 7.2 验证敌人破坏障碍物（敌人射击障碍物后障碍物消失，路径更新）
- [x] 7.3 验证冷却显示UI（精英蓄力时显示红色进度条，BOSS大招冷却显示黄色进度条）
- [x] 7.4 验证自爆兵行为（快速冲锋，距离<2米预警1秒后自爆）
- [x] 7.5 验证治疗者行为（为周围友军恢复生命，玩家优先击杀压力）
- [x] 7.6 使用 `window.__testApi` 测试API验证敌人状态正确性
- [x] 7.7 运行E2E测试（如有）确认无回归：`cd hack && pnpm test`
