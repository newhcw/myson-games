## 1. 创建环境元素模块

- [x] 1.1 创建 `src/game/environment/` 目录
- [x] 1.2 实现太阳模块（Sun.ts）：球体 + 光晕粒子动画
- [x] 1.3 实现小鸟模块（Bird.ts）：几何体组合 + 翅膀扇动 + 圆形路径飞行
- [x] 1.4 实现 EnvironmentManager（EnvironmentManager.ts）：统一管理创建、更新、清理

## 2. 集成到游戏场景

- [x] 2.1 在 FPSGame.vue 中引入 EnvironmentManager，在 `onSceneReady` 中初始化
- [x] 2.2 在 `gameLoop` 中调用 `environmentManager.update(delta)` 更新动画
- [x] 2.3 在 `onUnmounted` 中调用 `environmentManager.dispose()` 清理资源

## 3. 验证

- [x] 3.1 启动项目确认太阳和小鸟在场景中正确显示
- [x] 3.2 确认太阳光晕和小鸟翅膀动画正常运行
- [x] 3.3 确认场景切换/退出时资源正确释放，无内存泄漏
