## Why

当前游戏场景虽然有小鸟、太阳等环境装饰，但地面层缺乏生命气息。加入小羊、小兔等卡通动物在森林中活动，能增强森林主题的沉浸感，让游戏世界更生动有趣，符合儿童用户的审美期待。

## What Changes

- 新增 4 种卡通森林动物：小羊、小兔、小鹿、小狐狸
- 动物在场景地面层随机漫步，走走停停，表现自然行为
- 动物纯装饰，不与玩家和敌人产生碰撞或交互
- 动物有简单的待机动画（耳朵晃动、尾巴摇摆）和行走动画
- 动物避开场景障碍物和战斗中心区域
- 在 `EnvironmentManager` 中集成动物管理

## Capabilities

### New Capabilities
- `forest-animal`: 森林装饰动物的创建、行为AI、动画和生命周期管理

### Modified Capabilities

<!-- 无现有规范变更 -->

## Impact

- 新增文件：`src/game/environment/ForestAnimal.ts`（动物类）
- 修改文件：`src/game/environment/EnvironmentManager.ts`（集成动物管理）
- 无外部依赖新增
- 无性能隐患（动物���量少，几何体简单）
