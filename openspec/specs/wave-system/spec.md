## ADDED Requirements

### Requirement: 波次系统封装为 composable
系统 SHALL 提供 `useWaveSystem` composable，封装 WaveManager/PowerUpManager 的初始化、回调注册、敌人生成和间歇倒计时逻辑。

#### Scenario: 波次开始
- **WHEN** WaveManager 触发 onWaveStart 回调
- **THEN** 更新 currentWave 和 waveState，调用 spawnWaveEnemies 生成敌人

#### Scenario: 波次完成
- **WHEN** WaveManager 触发 onWaveClear 回调
- **THEN** 更新 waveState 为 intermission，设置间歇倒计时

#### Scenario: 全部通关
- **WHEN** WaveManager 触发 onAllWavesComplete 回调
- **THEN** 设置 victory 状态，显示 VictoryScreen，退出指针锁定

#### Scenario: 敌人生成
- **WHEN** spawnWaveEnemies 被调用
- **THEN** 从 WAVE_CONFIGS 读取配置，随机选择 2-3 个刷新点，通过 enemyManager 生成敌人并注册到 waveManager

#### Scenario: 道具拾取回调
- **WHEN** PowerUpManager 触发拾取回调
- **THEN** onHealthPickup 恢复生命值、onAmmoPickup 补满当前武器弹药、onDoubleDamagePickup 激活双倍伤害 buff

#### Scenario: 间歇倒计时同步
- **WHEN** 波次处于 intermission 状态且 gameLoop 更新
- **THEN** 从 waveManager.getIntermissionRemaining() 同步倒计时到 HUD 显示

#### Scenario: 跳过间歇
- **WHEN** 玩家按空格键且处于间歇状态
- **THEN** 调用 waveManager.skipIntermission()

### Requirement: 波次系统生命周期管理
useWaveSystem SHALL 在 onSceneReady 时初始化 WaveManager 和 PowerUpManager，在组件卸载时调用 dispose 清理。

#### Scenario: 组件卸载清理
- **WHEN** 游戏组件卸载
- **THEN** waveManager.dispose() 和 powerUpManager.dispose() 被调用
