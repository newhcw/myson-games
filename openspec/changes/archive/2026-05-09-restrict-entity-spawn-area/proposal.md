## Why

当前敌人生成点固定在地图四个角落 (±20, ±20)，但地图有效绿地范围仅为半径约 15-20 单位的圆形区域。敌人可能生成在非绿色区域（岩石、树木等障碍物区域或地图边缘），导致生成位置不合理。同时玩家移动到非绿色区域也不符合游戏设计。需要限制实体活动范围只在绿色草地区域内。

## What Changes

- 新增绿地边界检测模块，定义安全活动区域的范围
- 修改敌人生成逻辑，确保生成位置在绿地范围内
- 修改玩家移动约束，阻止玩家离开绿地范围
- 当实体尝试进入非绿地区域时，将其推回边界内

## Capabilities

### New Capabilities
- `entity-area-restriction`: 实体活动区域限制系统
  - 定义绿地安全区域的几何范围（圆形区域）
  - 提供坐标点是否在安全区域内的检测函数
  - 提供将越界坐标修正到边界的方法

### Modified Capabilities
- `wave-system`: 波次系统中的敌人生成点选择逻辑需要修改为只在绿地区域内选择
- `player-movement`: 玩家移动 Composable 需要添加区域边界检测和限制

## Impact

- **受影响代码**：
  - `apps/frontend/src/game/wave/types.ts` - SPAWN_POINTS 配置需更新或重新设计
  - `apps/frontend/src/game/composables/useWaveSystem.ts` - 生成点选择逻辑
  - `apps/frontend/src/game/composables/usePlayerMovement.ts` - 玩家移动边界检测
  - `apps/frontend/src/components/game/SceneView.vue` - 可能需要导出绿地范围配置

- **边界情况**：
  - 玩家位于边界时如何处理（硬阻挡 vs 软阻挡）
  - 敌人生成时如果所有绿地区域点都被占用如何处理