## ADDED Requirements

### Requirement: 测试 API 独立模块化
系统 SHALL 将 window.__testApi 从 FPSGame.vue 提取为独立模块 `src/game/test/testApi.ts`，仅开发环境加载。

#### Scenario: 开发环境加载
- **WHEN** 应用以开发模式运行（import.meta.env.DEV === true）
- **THEN** testApi 模块被导入并在 onMounted 中安装到 window.__testApi

#### Scenario: 生产环境不加载
- **WHEN** 应用以生产模式运行
- **THEN** testApi 模块不被导入，window.__testApi 不存在

#### Scenario: 测试 API 功能完整
- **WHEN** testApi 安装完成
- **THEN** 所有原有测试方法可用（getEnemies、shootEnemy、hitEnemy、movePlayerToEnemy、takePlayerDamage、getGameState、restartGame 等 ~30 个方法）

### Requirement: 测试 API 依赖注入
testApi SHALL 通过参数接收游戏状态引用，不直接导入或访问组件内部状态。

#### Scenario: 依赖注入模式
- **WHEN** 安装 testApi
- **THEN** 传入 enemyManager ref、gameStore、weaponStore、playerPosition、waveManager 等必要引用，testApi 函数内部通过这些引用操作游戏状态
