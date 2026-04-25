## 1. 数据模型扩展

- [x] 1.1 扩展 `EnemyConfig` 接口，添加弹道参数字段（projectileSpeed、projectileSpread、attackInterval、projectileVisual、burstCount）
- [x] 1.2 更新 `ENEMY_CONFIGS` 中三种敌人类型的配置，填入差异化弹道参数
- [x] 1.3 为 BOSS 配置添加 specialAttack 字段（弹幕：6 发、60 度扇形、8 秒 CD、2 秒预警）

## 2. 子弹核心系统

- [x] 2.1 创建 `EnemyProjectile.ts`，定义 EnemyProjectile 接口和 ProjectilePool 类（预分配 100 实例）
- [x] 2.2 实现 ProjectilePool.acquire() 和 release() 方法
- [x] 2.3 创建 `ProjectileManager.ts`，实现 spawn()、update()（飞行运动 + 距离碰撞检测 + 生命周期管理）
- [x] 2.4 在 `FPSGame.vue` 的 gameLoop 中集成 ProjectileManager.update()

## 3. 子弹视觉特效

- [x] 3.1 创建 `ProjectileRenderer.ts`，实现三种子弹外观生成函数（createStarProjectile / createCrystalProjectile / createFireballProjectile）
- [x] 3.2 为精英和 BOSS 子弹实现尾迹粒子效果（3-5 个递减粒子）
- [x] 3.3 实现子弹命中玩家的爆炸粒子特效（8-12 个彩色粒子飞散，1 秒淡出）
- [x] 3.4 ProjectileManager 中集成命中特效触发逻辑

## 4. 敌人 AI 改造

- [x] 4.1 修改 `EnemyAI.tryShootPlayer()`，将 Raycaster 射击替换为 ProjectileManager.spawn()
- [x] 4.2 在 `EnemyAI` 中集成对象池引用，获取/回收子弹
- [x] 4.3 在 `EnemyManager.vue` 中初始化 ProjectileManager 并传递给 EnemyAI

## 5. 精英蓄力机制

- [x] 5.1 在 EnemyAI 中实现蓄力状态逻辑（1500ms 延迟 + 射程/角度持续检查）
- [x] 5.2 实现蓄力瞄准线渲染（`THREE.Line`，红色半透明，从敌人指向玩家方向）
- [x] 5.3 蓄力取消逻辑（玩家逃出射程、敌人死亡等中断情况）

## 6. BOSS 扇形弹幕

- [x] 6.1 在 EnemyAI 中实现 BOSS 大招冷却计时器（8 秒）
- [x] 6.2 实现大招预警效果（地面红色扩散圆环，`RingGeometry`，0.3 → 1.5 半径，2 秒）
- [x] 6.3 实现扇形弹幕发射（6 枚火球，60 度均匀分布，同时生成）
- [x] 6.4 BOSS 普通射击与弹幕大招并存（弹幕冷却期间仍可普通射击）

## 7. E2E 测试

- [x] 7.1 编写敌人弹道子弹生成与飞行测试用例
- [x] 7.2 编写子弹命中玩家与伤害反馈测试用例
- [x] 7.3 编写精英蓄力瞄准线预警测试用例
- [x] 7.4 编写 BOSS 扇形弹幕大招测试用例
- [x] 7.5 运行全部 E2E 测试并确认通过（8 个新测试 + 已有测试全部通过）

## 8. 验证修复

- [x] 8.1 修复最大射程检测：在 `ProjectileManager.update()` 中累计 `distanceTraveled`，检查 `maxRange`（25单位）
- [x] 8.2 修复BOSS预警圆环动画：每帧更新 `RingGeometry` 内径，从 0.3 扩散至 1.5
