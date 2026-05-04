## 1. 基础设施与低耦合模块

- [x] 1.1 创建 GameContext 类型定义和 Provide/Inject 工具（`src/game/composables/useGameContext.ts`），定义 scene、camera、renderer、playerPosition、yaw、pitch 等共享对象的 InjectionKey 和类型
- [x] 1.2 创建障碍物配置文件（`src/game/config/obstacles.ts`），将 createObstacles 中的 20+ 预设数据提取为类型化导出数组
- [x] 1.3 实现障碍物创建工具函数（`src/game/utils/createObstacles.ts`），从配置文件读取预设数据创建 Three.js mesh
- [x] 1.4 实现 useGameSave composable（`src/game/composables/useGameSave.ts`），封装 saveCurrentGame、manualSave、loadSavedGame 逻辑
- [x] 1.5 提取测试 API 模块（`src/game/test/testApi.ts`），将 window.__testApi 的 ~30 个方法提取为独立函数，通过依赖注入接收游戏状态引用
- [x] 1.6 在 FPSGame.vue 中用 GameContext provide scene/camera/renderer，替换直接 let 变量持有方式
- [x] 1.7 在 FPSGame.vue 中集成障碍物配置和创建工具函数，替换原 createObstacles 内联代码
- [x] 1.8 在 FPSGame.vue 中集成 useGameSave，替换原存档/读档内联逻辑
- [x] 1.9 在 FPSGame.vue 中集成 testApi 模块（仅 DEV 环境），删除原第二个 onMounted 块
- [x] 1.10 验证阶段 1：运行 E2E 测试确认游戏功能正常，手动验证存档/读档和障碍物创建

## 2. 核心 Composable 提取

- [x] 2.1 实现 usePlayerMovement composable（`src/game/composables/usePlayerMovement.ts`），封装 WASD 移动、跑步、蹲下、跳跃物理、碰撞检测和相机位置同步
- [x] 2.2 实现 usePlayerInput composable（`src/game/composables/usePlayerInput.ts`），封装键盘/鼠标/触摸事件监听、InputManager 映射、指针锁定控制和 ESC/F9 特殊键处理
- [x] 2.3 实现 useCameraEffects composable（`src/game/composables/useCameraEffects.ts`），封装屏息体力、视角摇晃、呼吸模拟、后坐力恢复和 RPG 镜头震动
- [x] 2.4 实现 useShooting composable（`src/game/composables/useShooting.ts`），封装射击逻辑、raycast、RPG 发射、后坐力应用、自动开火和爆炸伤害处理
- [x] 2.5 实现 useWaveSystem composable（`src/game/composables/useWaveSystem.ts`），封装 WaveManager/PowerUpManager 初始化、回调注册、敌人生成和间歇倒计时
- [x] 2.6 重构 FPSGame.vue gameLoop，改为调用各 composable 的 update(delta) 方法
- [x] 2.7 重构 FPSGame.vue onSceneReady，改为调用 useWaveSystem 的初始化方法并设置 GameContext
- [x] 2.8 重构 FPSGame.vue onMounted/onUnmounted，集成 usePlayerInput 的事件注册/清理和各 composable 的生命周期
- [ ] 2.9 验证阶段 2：运行 E2E 测试确认移动、射击、波次、波次间歇跳过、道具拾取、屏息、镜头效果等功能正常

## 3. 子组件拆分与最终清理

- [ ] 3.1 实现 GameHUD.vue 子组件（`src/components/game/GameHUD.vue`），提取 HUD 模板和样式（血条、弹药、波次、crosshair、buff、屏息条、武器指示器、操作提示、间歇倒计时）
- [ ] 3.2 实现 PauseMenu.vue 子组件（`src/components/game/PauseMenu.vue`），提取暂停覆盖层和菜单按钮
- [ ] 3.3 实现 TouchControls.vue 子组件（`src/components/game/TouchControls.vue`），封装虚拟摇杆、虚拟按钮和触摸视角控制
- [ ] 3.4 重构 FPSGame.vue 模板，替换内联 HUD/暂停/触摸控制为子组件标签，通过 props/emit 传递数据
- [ ] 3.5 清理 FPSGame.vue，移除所有已提取到 composable 和子组件中的代码，确保最终文件为 ~250 行的协调器
- [ ] 3.6 验证阶段 3：运行全量 E2E 测试，确认所有游戏功能无回归，包括键盘/鼠标/触摸控制、暂停/恢复、死亡/胜利界面、波次系统、存档/读档
