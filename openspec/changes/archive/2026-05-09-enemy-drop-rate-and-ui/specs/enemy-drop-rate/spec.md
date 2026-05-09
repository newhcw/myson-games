## MODIFIED Requirements

### Requirement: 敌人道具掉落概率配置
系统 SHALL 根据敌人类型配置不同的道具掉落概率，确保玩家在游戏过程中能够获得足够的血量补充机会。

#### Scenario: Soldier 掉落判定
- **WHEN** Soldier（小兵）被击杀并触发掉落判定
- **THEN** 50% 概率掉落一个随机道具

#### Scenario: Elite 掉落判定
- **WHEN** Elite（精英）被击杀并触发掉落判定
- **THEN** 50% 概率掉落一个随机道具

#### Scenario: Boss 掉落判定
- **WHEN** Boss 被击杀并触发掉落判定
- **THEN** 100% 概率掉落 2 个随机道具

#### Scenario: 道具类型随机选择
- **WHEN** 掉落判定通过，随机选择一种道具类型
- **THEN** 50% 概率为血包（恢复 30 点生命）、30% 概率为弹药（补满当前武器）、20% 概率为双倍伤害（持续 10 秒）

---

**原需求来源**：openspec/specs/wave-system/spec.md 中的"道具拾取回调"场景

**Reason**: 原配置中 Soldier 掉落率仅 20%，导致玩家难以获得血量补充，游戏体验不佳。新配置提升了 Soldier 掉落率到 50%，与 Elite 保持一致。

**Migration**: 无需迁移，此为纯配置变更，不影响现有代码逻辑。