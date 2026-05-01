## ADDED Requirements

### Requirement: 波次配置数据
系统 MUST 提供 10 波的静态配置数据，每波定义生成的敌人类型和数量。配置数据独立于波次逻辑，以纯数据表形式存储。

波次配置如下：
- 第 1 波：3×小兵
- 第 2 波：5×小兵
- 第 3 波：4×小兵 + 1×精英
- 第 4 波：6×小兵 + 2×精英
- 第 5 波：1×BOSS + 3×小兵（BOSS 波）
- 第 6 波：8×小兵
- 第 7 波：5×小兵 + 3×精英
- 第 8 波：10×小兵
- 第 9 波：4×精英 + 2×BOSS
- 第 10 波：2×BOSS + 5×精英（终极波）

#### Scenario: 读取波次配置
- **WHEN** WaveManager 初始化时
- **THEN** 系统加载 WAVE_CONFIGS 数据表，共 10 波配置

#### Scenario: 查询指定波次的敌人配置
- **WHEN** 查询第 N 波配置（1 ≤ N ≤ 10）
- **THEN** 返回该波次的敌人类型数组和对应数量

### Requirement: 波次状态机
系统 MUST 管理波次的三种状态：`waving`（战斗中）、`intermission`（波次间歇）、`victory`（通关）。状态转换由游戏事件驱动。

状态转换规则：
- `waving` → `intermission`：当前波次所有敌人被全部击杀
- `intermission` → `waving`：5 秒倒计时结束，或玩家按下空格键提前开始
- `waving` → `victory`：第 10 波所有敌人被全部击杀
- `intermission` → `victory`：第 10 波间歇不应存在（第 10 波击杀后直接进入 victory）

#### Scenario: 波次击杀完成触发间歇
- **WHEN** 当前波次最后一个敌人被击杀
- **THEN** 状态从 waving 转为 intermission，开始 5 秒倒计时，触发 onWaveClear 回调

#### Scenario: 波次间歇倒计时结束进入下一波
- **WHEN** intermission 状态倒计时达到 0
- **THEN** 状态转为 waving，波次编号 +1，按配置生成新敌人，触发 onWaveStart 回调

#### Scenario: 玩家按键提前开始
- **WHEN** intermission 状态中玩家按下空格键
- **THEN** 立即结束倒计时，状态转为 waving，波次编号 +1，按配置生成新敌人

#### Scenario: 第 10 波通关
- **WHEN** 第 10 波最后一个敌人被击杀
- **THEN** 状态直接转为 victory，不进入 intermission，触发 onAllWavesComplete 回调

### Requirement: 波次敌人生成
系统 MUST 按当前波次配置，在指定的刷新点位置生成敌人。刷新点为地图 4 个角落（坐标 ±20, ±20），每波随机选择 2-3 个刷新点。

敌人生成高度 Y = 0（地面）。同波次的所有敌人在同一帧内生成（不做依次延迟生成）。

#### Scenario: 第二波开始生成敌人
- **WHEN** 第 2 波开始（从 intermission 转入 waving）
- **THEN** 在随机选中的刷新点生成 5 个小兵

#### Scenario: BOSS 波生成敌人
- **WHEN** 第 5 波开始
- **THEN** 在随机选中的刷新点生成 1 个 BOSS + 3 个小兵，BOSS 和小兵不在同一刷新点

### Requirement: 波次事件回调
系统 MUST 提供以下回调接口，供 FPSGame.vue 注册：
- `onWaveStart(waveNumber)`：新波次开始时触发
- `onWaveClear(waveNumber)`：波次所有敌人被击杀时触发
- `onAllWavesComplete()`：第 10 波通关时触发

#### Scenario: 注册并触发回调
- **WHEN** FPSGame 注册了 onWaveStart 回调后，第 3 波开始
- **THEN** onWaveStart(3) 被调用

### Requirement: 资源清理
系统 MUST 提供 dispose() 方法，清理所有活跃计时器、事件监听和引用。

#### Scenario: 游戏退出时清理
- **WHEN** FPSGame onUnmounted 时调用 WaveManager.dispose()
- **THEN** 所有 setInterval/setTimeout 被清除，无内存泄漏

### Requirement: 与 EnemyManager 的集成
系统 MUST 通过回调通知 EnemyManager 生成对应类型和数量的敌人。WaveManager 不直接操作 Three.js 场景。

#### Scenario: 第 1 波生成
- **WHEN** WaveManager 触发 spawnEnemies([{type:'soldier', count:3}])
- **THEN** EnemyManager 在随机刷新点创建 3 个小兵
