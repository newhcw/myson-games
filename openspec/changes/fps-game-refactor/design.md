## Context

FPSGame.vue（2620行）是一个 God Component，承担了场景初始化、游戏循环、输入处理、射击系统、波次管理、存档/读档、HUD 渲染、触摸控制、相机效果和测试 API 等 11 个职责。当前 `src/game/composables/` 目录为空，项目已有 composable 架构意图但未落地。

关键技术约束：
- Three.js 对象（scene/camera/renderer）在 SceneView 子组件中创建，通过回调传回 FPSGame，再通过 props 传给 EnemyManager —— 这是反向所有权模式
- `enemyManagerRef` 使用 `ref<any>` 类型，缺乏类型安全
- 两个 `onMounted` 块：一个注册事件监听，一个安装 `window.__testApi`
- 波次管理器/道具管理器/火箭管理器均为 class 实例，通过 `let` 变量持有

## Goals / Non-Goals

**Goals:**
- 将 FPSGame.vue 缩减至 ~250 行的协调器角色
- 每个独立职责提取为可独立测试的 composable 或子组件
- 通过 Provide/Inject 解决 Three.js 对象共享问题，消除反向 props 传递
- 测试 API 从生产代码中分离，仅开发环境加载
- 障碍物数据从代码中提取为配置文件
- 分阶段实施，每个阶段完成后游戏可正常运行
- 保持所有现有功能不变，纯重构

**Non-Goals:**
- 不改变游戏玩法或行为逻辑
- 不引入新的状态管理库（继续使用 Pinia）
- 不重构 SceneView/EnemyManager 等已有子组件
- 不修改 game store / weapon store 的接口
- 不重写 TypeScript 类型系统（类型改进作为后续迭代）

## Decisions

### D1: Provide/Inject 共享 Three.js 上下文

**选择**：通过 Vue 的 Provide/Inject 机制共享 scene/camera/renderer 对象

**备选方案**：
- A. Composable 参数传递 —— 初始化顺序复杂，参数爆炸
- B. Pinia Store 扩展 —— Three.js 对象不该进响应式系统
- C. 全局单例 —— 不利于测试和复用

**理由**：Provide/Inject 是 Vue 原生模式，依赖关系显式化，Three.js 对象不需要响应式包装。创建一个 `GameContext` 接口定义共享对象类型。

### D2: Composable 拆分粒度

6 个 composable，保持职责单一：

| Composable | 职责 | 行数估计 |
|------------|------|---------|
| `usePlayerMovement` | 移动/跳跃/蹲下/跑步/碰撞 | ~80 |
| `usePlayerInput` | 键盘/鼠标/触摸事件 → 命令分发 | ~200 |
| `useShooting` | 射击/raycast/RPG/后坐力/自动开火 | ~250 |
| `useCameraEffects` | 屏息/摇晃/呼吸模拟/镜头震动 | ~150 |
| `useWaveSystem` | 波次管理/道具/敌人生成/间歇 | ~100 |
| `useGameSave` | 存档/读档/继续游戏 | ~100 |

### D3: 子组件拆分

| 子组件 | 来源 | 行数估计 |
|--------|------|---------|
| `GameHUD.vue` | HUD 血条/弹药/波次/crosshair/buff/屏息 | ~300 |
| `PauseMenu.vue` | 暂停覆盖层/继续/重启/退出 | ~80 |
| `TouchControls.vue` | 虚拟摇杆/按钮/触摸视角 | ~60 |

### D4: 测试 API 处置

提取为 `src/game/test/testApi.ts`，通过 `import.meta.env.DEV` 条件加载。仅在开发模式下在 `onMounted` 中调用安装函数。

### D5: 障碍物配置提取

将 `createObstacles()` 中的预设数据提取到 `src/game/config/obstacles.ts`，导出类型化的障碍物配置数组。

### D6: 分阶段策略

分 3 个阶段，每阶段完成后游戏可正常运行：

**阶段 1 — 基础设施与低耦合模块**
- 创建 GameContext (Provide/Inject)
- 提取 obstacle 配置
- 提取 useGameSave
- 提取 testApi

**阶段 2 — 核心 Composable**
- 提取 usePlayerMovement
- 提取 usePlayerInput
- 提取 useCameraEffects
- 提取 useShooting
- 提取 useWaveSystem

**阶段 3 — 子组件拆分与清理**
- 提取 GameHUD.vue
- 提取 PauseMenu.vue
- 提取 TouchControls.vue
- 精简 FPSGame.vue 为协调器

## Risks / Trade-offs

- **[Composable 间共享状态]** → 通过 GameContext provide/inject 和 Pinia store 双通道解决。局部状态（yaw/pitch、recoilOffset）通过 composable 返回值在 FPSGame 中传递
- **[拆分期间功能回归]** → 每阶段完成后运行 E2E 测试验证，阶段内逐步替换而非一次性重写
- **[Composable 初始化顺序]** → usePlayerInput 依赖 usePlayerMovement 的 keys 对象，useShooting 依赖 camera/playerPosition。通过 composable 返回接口显式声明依赖
- **[游戏循环与 composable 的 update 调度]** → gameLoop 保留在 FPSGame 中，每个 composable 暴露 `update(delta)` 方法，由 gameLoop 统一调度。这是当前架构的自然延伸
