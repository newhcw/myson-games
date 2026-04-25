## Why

当前游戏中的 5 把武器（手枪、冲锋枪、步枪、狙击枪、霰弹枪）均为传统 hitscan 射击武器，缺乏趣味性和差异性。儿童玩家需要一把视觉冲击强、操作手感独特、效果滑稽的武器来提升游戏乐趣。RPG 火箭筒的抛物线弹道 + AOE 范围伤害机制能带来完全不同的射击体验。

## What Changes

- 新增 RPG 火箭筒武器，作为第 6 把可用武器
- 引入玩家侧弹道投射物系统（区别于现有 hitscan），火箭飞行带物理轨迹
- 新增火箭飞行尾迹特效系统（彩色纸屑/星星）
- 新增 AOE 范围爆炸特效系统（礼花/彩带/彩虹环）
- 新增敌人受 AOE 影响时的弹飞动画
- 切换武器快捷键扩展至 6（数字键 6 切换 RPG）
- HUD 武器指示器扩展至 6 个槽位

## Capabilities

### New Capabilities
- `rpg-weapon`: RPG 火箭筒的武器数据、弹药管理、射击逻辑
- `player-rocket`: 玩家火箭弹的弹道飞行、摇摆动画、尾迹粒子
- `rpg-explosion`: AOE 爆炸特效、范围伤害检测、敌人弹飞效果

### Modified Capabilities

无。本次变更新增能力，不修改现有能力。

## Impact

- `apps/frontend/src/game/weapons/types.ts`：新增 RPG 武器数据定义
- `apps/frontend/src/stores/weapon.ts`：新增 RPG 弹药状态
- `apps/frontend/src/views/FPSGame.vue`：新增 RPG 射击分支逻辑、武器切换扩展
- `apps/frontend/src/game/`：新增 `player-rocket/` 目录，包含火箭弹道、尾迹、爆炸特效模块
- HUD 武器指示器需要增加第 6 个槽位
- 操作提示需要更新，说明数字键 6 切换到 RPG
