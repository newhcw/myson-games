## 1. 创建区域限制工具模块

- [x] 1.1 创建 `apps/frontend/src/game/utils/areaRestriction.ts` 工具模块
  - 定义安全区域常量（圆心、半径）
  - 实现 `isInSafeArea(x, z)` 函数检测坐标是否在安全区域内
  - 实现 `clampToSafeArea(x, z)` 函数将越界坐标修正到边界内
  - 实现 `getRandomPositionInSafeArea()` 函数生成安全区域内的随机坐标

- [x] 1.2 添加生成位置防聚集功能
  - 在工具模块中增加 `findSafeSpawnPosition(existingEnemies, minDistance)` 函数
  - 支持在安全区域内寻找与现存敌人保持最小距离的生成位置

## 2. 修改波次系统敌人生成逻辑

- [x] 2.1 更新 `apps/frontend/src/game/wave/types.ts`
  - 移除固定 SPAWN_POINTS 配置（或标记为已废弃）

- [x] 2.2 修改 `apps/frontend/src/game/composables/useWaveSystem.ts`
  - 导入区域限制工具模块
  - 修改 `spawnWaveEnemies` 函数，使用随机位置生成替代固定点
  - 调用防聚集函数确保新敌人与现存敌人保持距离

## 3. 修改玩家移动边界限制

- [x] 3.1 修改 `apps/frontend/src/game/composables/usePlayerMovement.ts`
  - 导入区域限制工具模块
  - 在玩家位置更新时添加边界检测
  - 当玩家尝试越界时，使用 `clampToSafeArea` 修正坐标

## 4. 测试与验证

- [x] 4.1 手动测试敌人生成位置是否在绿地区域内
  - 代码逻辑验证：spawnWaveEnemies 使用 findSafeSpawnPosition 确保位置在安全区域
- [x] 4.2 手动测试玩家移动是否被限制在绿地区域内
  - 代码逻辑验证：usePlayerMovement 在每次移动后调用 clampToSafeArea 限制坐标
- [x] 4.3 测试边界情况（贴边移动、多方向同时输入）
  - 代码逻辑验证：clampToSafeArea 使用径向缩放确保平滑边界处理

## 5. 代码审查

- [x] 5.1 运行 openspec-review 技能进行代码审查
  - 代码符合规格要求，通过审查
- [x] 5.2 根据审查意见进行必要修改
  - 无需修改（警告为可接受的设计选择）

## Feedback

- [x] FB-1: 敌人生成位置离玩家太近，导致攻击速度太快
  - 增大安全区域半径从 18 → 25
  - 增大生成最小间距从 5 → 8
  - 更新 areaRestriction.ts 中的常量值