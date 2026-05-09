# Tasks: 修复障碍物高度

## 主线任务

- [x] 修改 `obstacles.ts` 中树木高度值（大树 12-18, 中树 7-10）
- [x] 修改 `obstacles.ts` 中岩石高度值（1.5-3）
- [x] 修改 `obstacles.ts` 中灌木高度值（1.5-2.5）和树桩高度值（1.2-1.5）
- [x] 修改 `createObstacles.ts` 中树干比例从 0.4 → 0.5
- [x] 修改 `createObstacles.ts` 中树冠半径倍数
- [x] 启动开发服务器，在浏览器中验证障碍物视觉效果
- [x] 验证碰撞检测仍然正常工作

## Feedback

- [x] FB-1: 玩家切换视角时出现多余的血条（敌人血条重复显示） ✓
  - **修复**：在 EnemyAI.ts 第 423 行和第 719 行添加 `this.healthBar?.remove(enemy.id)` 调用
  - **验证**：敌人死亡时血条 DOM 元素会从内存中移除

- [x] FB-2: 敌人出生时 3 个敌人出现 6 个血条（每个敌人重复创建血条）
  - **根因**：spawnEnemy 中调用 healthBar.update() 与 update() 中 updateAll() 重复创建
  - **修复1**：移除 spawnEnemy 中的 healthBar.update(enemy) 重复调用
  - **修复2**：修正 isInFront 判断条件 `z > 0` → `z <= 1 && z >= -1`，解决视角转换时血条错误显示
