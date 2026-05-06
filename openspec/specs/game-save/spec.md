## ADDED Requirements

### Requirement: 游戏存档封装为 composable
系统 SHALL 提供 `useGameSave` composable，封装游戏状态保存、加载和继续游戏逻辑。

#### Scenario: 自动存档
- **WHEN** 调用 saveCurrentGame 且游戏处于 playing 或 paused 状态
- **THEN** 收集玩家位置/旋转、游戏分数/击杀/时间/状态、武器索引/弹药数据，通过 storageManager 保存到 IndexedDB

#### Scenario: 手动存档
- **WHEN** 玩家按 F9 键
- **THEN** 调用 saveCurrentGame 并弹出存档成功提示

#### Scenario: 从存档恢复
- **WHEN** 路由参数 continue=true 且存档存在
- **THEN** 恢复玩家位置/旋转、游戏状态、武器弹药，如果游戏暂停则退出指针锁定

#### Scenario: 存档不存在
- **WHEN** 路由参数 continue=true 但存档恢复失败
- **THEN** 在控制台输出警告并开始新游戏

#### Scenario: 退出时自动存档
- **WHEN** 玩家点击退出游戏
- **THEN** 在路由跳转前自动调用 saveCurrentGame
