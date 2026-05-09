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

#### Scenario: 敌人道具掉落概率
- **GIVEN** Soldier（小兵）被击杀并触发掉落判定
- **THEN** 50% 概率掉落一个随机道具

- **GIVEN** Elite（精英）被击杀并触发掉落判定
- **THEN** 50% 概率掉落一个随机道具

- **GIVEN** Boss 被击杀并触发掉落判定
- **THEN** 100% 概率掉落 2 个随机道具

- **GIVEN** 掉落判定通过
- **THEN** 随机选择道具类型：50% 血包（恢复 30 点生命）、30% 弹药（补满当前武器）、20% 双倍伤害（持续 10 秒）

#### Scenario: 游戏开始显示道具掉落提示
- **WHEN** 玩家首次开始游戏并进入游戏场景
- **THEN** 系统在屏幕中央显示文字"击败敌人可获得血包！"，持续 3 秒后自动淡出消失

- **WHEN** 提示文字正在显示
- **THEN** 游戏玩法不受影响，玩家可以正常移动、射击

#### Scenario: 道具掉落时播放音效
- **WHEN** 敌人被击杀且触发道具掉落（通过随机判定）
- **THEN** 系统播放道具掉落音效（音量适中，不刺耳）

- **WHEN** 敌人被击杀但随机判定未掉落道具
- **THEN** 系统不播放任何音效（避免频繁音效干扰）

#### Scenario: 拾取道具时显示 HUD 提示
- **WHEN** 玩家进入血包道具的拾取范围
- **THEN** 系统恢复 30 点血量，并在屏幕下方显示"血包 +30"，持续 1.5 秒后淡出

- **WHEN** 玩家进入双倍伤害道具的拾取范围
- **THEN** 系统激活双倍伤害Buff（持续 10 秒），并在屏幕下方显示"双倍伤害！"，持续 1.5 秒后淡出

- **WHEN** 玩家进入弹药道具的拾取范围
- **THEN** 系统补满当前武器弹药，并在屏幕下方显示"弹药已补充"，持续 1.5 秒后淡出

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
