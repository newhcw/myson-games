## 1. 基础结构与存储

- [x] 1.1 新建 `game/wave/WaveManager.ts` — 波次核心逻辑类，包含状态机、配置表、事件回调
- [x] 1.2 新建 `game/wave/types.ts` — 波次相关类型定义（WaveConfig、WaveState 等）
- [x] 1.3 新建 `stores/buffs.ts` — Pinia store 管理 Buff 状态（激活、计时、过期）
- [x] 1.4 新建 `game/powerups/types.ts` — 道具类型定义（PowerUpType、PowerUpItem、PowerUpEffect 等）
- [x] 1.5 在 `game/wave/WaveManager.ts` 中定义 WAVE_CONFIGS 数据表（10 波配置）

## 2. 道具系统核心

- [x] 2.1 新建 `game/powerups/PowerUpManager.ts` — 道具管理器（生成、拾取检测、生命周期、上限控制）
- [x] 2.2 在 PowerUpManager 中实现道具 3D 模型创建（心形/立方体/八面体，含自发光材质）
- [x] 2.3 在 PowerUpManager 中实现道具动画（旋转、浮动、脉冲发光、超时淡出）
- [x] 2.4 在 PowerUpManager 中实现距离拾取检测（每帧遍历，阈值 1.5 单位）
- [x] 2.5 在 PowerUpManager 中实现同屏上限 8 个（FIFO 淘汰机制）
- [x] 2.6 实现 Buff 效果集成（双倍伤害写入 buffsStore，生命恢复调用 gameStore，弹药补满调用 weaponStore）

## 3. 波次系统集成

- [x] 3.1 在 WaveManager 中实现波次状态机（waving / intermission / victory）
- [x] 3.2 在 WaveManager 中实现波次敌人生成逻辑（读取配置 → 随机选刷新点 → 按类型数量生成）
- [x] 3.3 在 WaveManager 中实现波次间歇倒计时（5 秒，空格键可提前开始）
- [x] 3.4 在 WaveManager 中实现通关检测（第 10 波击杀完成 → victory 状态）
- [x] 3.5 在 WaveManager 中实现 reset() 方法（回到第 1 波，清理状态）
- [x] 3.6 在 WaveManager 中实现 dispose() 方法（清理所有引用）

## 4. EnemyManager 改造

- [x] 4.1 移除 EnemyManager 中的固定 5 敌人生成逻辑
- [x] 4.2 在 EnemyManager 中新增 spawnEnemies(config[]) 方法（按 WaveManager 指令生成）
- [x] 4.3 在 EnemyManager 的击杀事件中集成道具掉落判定（按敌人类型计算概率，调用 PowerUpManager.spawn）
- [x] 4.4 敌人死亡 30 秒重生逻辑改为仅在波次系统中移除（不再自动重生）

## 5. Buff Store 实现

- [x] 5.1 在 stores/buffs.ts 中定义 Buff 数据结构（type、endTime、active）
- [x] 5.2 实现 addBuff(type, duration) 方法（同类 Buff 刷新时间，不叠加）
- [x] 5.3 实现 update() 方法（每帧/每秒检查过期）
- [x] 5.4 实现 hasBuff(type) 和 getBuffRemaining(type) 方法（供 HUD 和武器伤害计算使用）
- [x] 5.5 在武器伤害计算中（FPSGame.vue fire / performRaycast）集成双倍伤害判定

## 6. 通关界面

- [x] 6.1 新建 `game/ui/VictoryScreen.vue` — 全屏遮罩组件
- [x] 6.2 在 VictoryScreen 中显示通关数据（波次 10/10、击杀数、得分、存活时间）
- [x] 6.3 实现"重新开始"按钮逻辑（重置 WaveManager、游戏状态、玩家位置，开始第 1 波）
- [x] 6.4 实现"返回主页"按钮逻辑（保存得分到 storageManager，跳转到 Home）

## 7. HUD 更新

- [x] 7.1 在 FPSGame.vue 的 HUD 中增加波次显示区域（当前波次 / 总波次，如"第 3 波 / 10 波"）
- [x] 7.2 在 HUD 中增加波次间歇倒计时显示（大号数字居中，显示"第 X 波即将开始"）
- [x] 7.3 在 HUD 中增加 Buff 状态图标区域（每个 Buff 显示图标 + 剩余秒数）
- [x] 7.4 为 HUD 新元素添加 Q 版卡通样式（与现有 HUD 风格一致）

## 8. FPSGame.vue 集成

- [x] 8.1 在 onSceneReady 中初始化 WaveManager 和 PowerUpManager
- [x] 8.2 注册 WaveManager 回调（onWaveStart 更新 HUD、onWaveClear 触发间歇、onAllWavesComplete 显示 VictoryScreen）
- [x] 8.3 在 gameLoop 中每帧调用 PowerUpManager.update(delta)
- [x] 8.4 在 gameLoop 中每帧调用 WaveManager.update(delta)
- [x] 8.5 在 onUnmounted 中调用 WaveManager.dispose() 和 PowerUpManager.dispose()
- [x] 8.6 处理 VictoryScreen 与暂停菜单的互斥（通关时强制退出暂停状态）

## 9. 资源与清理

- [x] 9.1 WaveManager dispose 清理所有引用
- [x] 9.2 PowerUpManager dispose 清理场景中所有活跃道具的 geometry/material
- [x] 9.3 确认 onUnmounted 中 renderer dispose 不会与新系统的 dispose 冲突
- [x] 9.4 波次重置时（重新开始）确认所有旧敌人和道具被正确清理

## 10. E2E 测试

- [x] 10.1 TC0040 — 波次系统基础：验证第 1 波生成 3 个小兵，击杀完成后进入间歇
- [x] 10.2 TC0041 — 波次递进：验证第 2 波敌人数量多于第 1 波
- [x] 10.3 TC0042 — 道具掉落：验证击杀敌人后道具出现在地面
- [x] 10.4 TC0043 — 道具拾取：验证靠近道具后道具消失且效果生效
- [x] 10.5 TC0044 — 双倍伤害 Buff：验证拾取后 Buff 系统正常工作
- [x] 10.6 TC0045 — 通关界面：验证波次 HUD 正确渲染和波次递进

