## Why

当前游戏中击杀敌人后有概率掉落道具（包括血包、弹药、双倍伤害），但玩家无法感知这一游戏机制。原因是：1）小兵掉落概率仅 20%，2）游戏中没有任何 UI 提示告知玩家可以通过拾取道具补充血量。这导致玩家在战斗中没有有效的血量补充渠道，游戏体验较差。

## What Changes

1. **提高敌人道具掉落率**
   - Soldier（小兵）掉落率：20% → 50%
   - Elite（精英）保持 50%
   - Boss 保持 100%
2. **添加游戏内 UI 提示**
   - 在游戏开始时显示提示："击败敌人可获得血包！"
   - 敌人掉落道具时播放音效提示
   - 在 HUD 中添加道具拾取提示文字

## Capabilities

### New Capabilities
- `enemy-drop-ui`: 游戏内道具掉落相关 UI 提示功能

### Modified Capabilities
- `enemy-drop-rate`: 调整敌人道具掉落概率配置（原 specs/enemy-drop-rate/spec.md）

## Impact

- 修改文件：`apps/frontend/src/game/powerups/types.ts`（掉落率配置）
- 新增文件：`apps/frontend/src/game/ui/DropHint.ts`（掉落提示 UI）
- 修改文件：`apps/frontend/src/components/game/GameHUD.vue`（添加提示文案）
- 修改文件：`apps/frontend/src/game/sound/SoundManager.ts`（添加道具掉落音效）