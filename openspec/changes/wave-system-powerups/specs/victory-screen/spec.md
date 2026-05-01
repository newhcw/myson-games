## ADDED Requirements

### Requirement: 通关界面展示条件
系统 MUST 在第 10 波最后一个敌人被击杀后，立即显示通关界面（VictoryScreen）。通关界面不受暂停状态影响，但必须在指针锁定退出后显示。

#### Scenario: 第 10 波击杀完成
- **WHEN** 第 10 波最后一个敌人被击杀
- **THEN** 退出指针锁定（若处于锁定状态），显示 VictoryScreen

### Requirement: 通关界面内容
通关界面 MUST 展示以下数据：
- 标题：🎉 通关！
- 波次进度：10 / 10 波
- 总击杀数（gameStore.kills）
- 总得分（gameStore.score）
- 存活时间（gameStore.gameTime，格式：分:秒）

界面底部提供两个按钮：
- "🔄 重新开始"：重置所有游戏状态，从第 1 波开始新游戏
- "🏠 返回主页"：保存得分到进度，跳转到 Home 页面

#### Scenario: 查看通关数据
- **WHEN** VictoryScreen 显示
- **THEN** 正确显示本局击杀数、得分和存活时间

### Requirement: 重新开始功能
系统 MUST 实现"重新开始"按钮逻辑：
1. 隐藏 VictoryScreen
2. 调用 gameStore.fullReset() 重置游戏状态
3. 调用 WaveManager.reset() 回到第 1 波
4. 重置玩家位置和视角
5. 清理所有活跃道具
6. 开始第 1 波（直接进入 waving 状态，无间歇倒计时）
7. 请求指针锁定

#### Scenario: 点击重新开始
- **WHEN** 玩家在 VictoryScreen 点击"重新开始"
- **THEN** 游戏重置为第 1 波初始状态，开始第 1 波

### Requirement: 返回主页功能
系统 MUST 实现"返回主页"按钮逻辑：
1. 保存本次得分到全局进度（storageManager.addScore）
2. 跳转到 Home 路由
3. 清理 WaveManager 和所有计时器

#### Scenario: 点击返回主页
- **WHEN** 玩家在 VictoryScreen 点击"返回主页"
- **THEN** 游戏得分存入 localStorage，跳转到主页
