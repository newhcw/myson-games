# 死亡/重置/HUD 修复技术方案

## 架构关系

```
FPSGame.vue
├── gameLoop()              ← 需要支持暂停/恢复
├── onRestart()             ← 需要扩展重置逻辑
├── rocketManager           ← 需要 reset 方法
└── EnemyManager.vue        ← 需要 reset 方法
    ├── enemyAI.clear()
    ├── spawnInitialEnemies()
    ├── projectileManager.clear()
    └── enemySpawnData / enemies

EnemyHealthBar.ts           ← 需要重叠检测
└── update()               ← 独立定位 → 碰撞偏移

weaponStore                 ← 需要 resetAmmo 方法
```

## Bug 1+2: 死亡暂停 + 完整重置

### 方案：死亡暂停循环 + EnemyManager 暴露 reset 方法

**死亡暂停** (`FPSGame.vue`):
- `gameLoop` 中检测 `gameStore.isDead`：如果为 true，跳过 `updateMovement`、`updateAutoFire`、`enemyManagerRef.update()`、`rocketManager.update()`，只保留 `renderer.render()`（防止黑屏）

**完整重置** (`onRestart`):
```
onRestart:
  1. gameStore.fullReset()                    — 已有
  2. playerPosition.set(0, 1.6, 0)            — 已有
  3. yaw = 0, pitch = 0, camera.rotation      — 已有
  4. rocketManager.clear()                     — 新增：清理飞行中的火箭
  5. enemyManagerRef.reset()                   — 新增：清理敌人 + 重新生成
  6. weaponStore.resetAmmo()                   — 新增：重置所有武器弹药
  7. lastTime = performance.now()              — 新增：重置时间基准，避免首帧 delta 过大
```

**EnemyManager 新增 reset 方法**:
```
reset():
  1. enemyAI.clear()           — 清理所有敌人网格、血条、投射物
  2. projectileManager.clear()
  3. enemies = []              — 清空 ID 数组
  4. enemySpawnData.clear()    — 清空生成数据
  5. spawnInitialEnemies()     — 重新生成 5 个初始敌人
```

**weaponStore 新增 resetAmmo 方法**:
```
resetAmmo():
  - 将所有武器的弹药恢复到初始值
  - 关闭开镜状态
  - 取消换弹状态
```

## Bug 3: 血条重叠处理

### 方案：垂直偏移排列

在 `EnemyHealthBar.update()` 中增加后处理步骤：

```
updateAll(enemies):
  1. 先为所有敌人计算屏幕坐标 → 得到 (x, y) 列表
  2. 按 y 坐标排序（从上到下）
  3. 遍历检测：如果当前血条与上一个血条的 y 距离 < 血条高度阈值
     则将当前血条向下偏移到不重叠的位置
  4. 偏移后的血条仍然 clamp 在屏幕范围内
```

**关键参数**:
- 血条高度阈值：`type === 'boss' ? 50px : type === 'elite' ? 40px : 35px`（包含标签 + 条 + 数字）
- 偏移方向：仅垂直偏移（保持水平位置真实反映敌人方位）
- 最大偏移量 clamp 到屏幕底部 10px 以内

### 为什么选择垂直偏移而不是其他方案

| 方案 | 优缺点 |
|------|--------|
| **垂直偏移** | 实现简单，保持位置关联性，儿童友好 |
| 仅显示最近 N 个 | 信息不完整，玩家不知道远处还有敌人 |
| 紧凑列表排列 | 脱离敌人位置太远，关联性差 |
| 仅水平偏移 | 水平方向屏幕空间更宝贵（有武器/HUD） |

## 影响范围

| 文件 | 改动类型 |
|------|----------|
| `FPSGame.vue` | 修改 `gameLoop`、`onRestart` |
| `EnemyManager.vue` | 新增 `reset()` 方法 |
| `EnemyManager.vue` (模板) | 需添加 `gameStore.isDead` 响应式引用 |
| `EnemyHealthBar.ts` | 重写 `update` 方法，增加重叠检测 |
| `stores/weapon.ts` | 新增 `resetAmmo()` |
| `stores/game.ts` | 无需改动 |
