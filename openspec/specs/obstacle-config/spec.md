## ADDED Requirements

### Requirement: 障碍物预设数据提取为配置文件
系统 SHALL 将 createObstacles() 中的硬编码障碍物预设数据提取为独立的配置文件 `src/game/config/obstacles.ts`。

#### Scenario: 配置文件导出
- **WHEN** 其他模块导入 obstacle 配置
- **THEN** 可获取类型化的障碍物预设数组，包含 type、size、pos、color、castShadow、health 字段

#### Scenario: 障碍物创建使用配置
- **WHEN** 场景初始化时创建障碍物
- **THEN** 从配置文件读取预设数据，遍历创建 Three.js mesh 并添加到场景和碰撞检测器

#### Scenario: 配置数据与原代码一致
- **WHEN** 提取完成后
- **THEN** 障碍物类型、位置、尺寸、颜色、阴影和血量值与原 createObstacles 完全一致
