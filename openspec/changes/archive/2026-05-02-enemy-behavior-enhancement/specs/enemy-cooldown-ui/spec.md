## ADDED Requirements

### Requirement: 精英蓄力攻击冷却显示

系统SHALL在精英敌人蓄力攻击时，在其血条下方显示蓄力进度条。

#### Scenario: 精英开始蓄力

- **WHEN** 精英敌人进入蓄力状态（`enemy.isCharging = true`）
- **THEN** 显示蓄力进度条（红色，最大宽度对应1500ms）
- **AND** 进度条从0%增长到100%（持续1500ms）
- **AND** 蓄力完成后进度条消失

#### Scenario: 蓄力过程中玩家不可见

- **WHEN** 精英敌人在蓄力过程中
- **AND** 玩家离开视野或超出射程
- **THEN** 取消蓄力状态
- **AND** 蓄力进度条立即消失

### Requirement: BOSS大招冷却显示

系统SHALL在BOSS大招冷却期间，在其血条下方显示冷却进度条。

#### Scenario: BOSS大招进入冷却

- **WHEN** BOSS释放扇形弹幕大招
- **THEN** 设置 `enemy.lastSpecialAttackTime = now`
- **AND** 显示冷却进度条（黄色，最大宽度对应冷却时间）
- **AND** 进度条从0%增长到100%（持续冷却时间）

#### Scenario: BOSS大招冷却完成

- **WHEN** 冷却进度条达到100%
- **THEN** 进度条消失
- **AND** BOSS可以再次释放大招

#### Scenario: BOSS狂暴阶段冷却条加速

- **WHEN** BOSS处于狂暴阶段
- **THEN** 冷却进度条填充速度加快（对应冷却时间缩短）
- **AND** 进度条颜色变为橙红色

### Requirement: 冷却进度条视觉效果

冷却进度条SHALL采用儿童友好的视觉设计，清晰易读。

#### Scenario: 进度条样式

- **WHEN** 显示蓄力进度条
- **THEN** 条高度=4px，圆角2px
- **AND** 蓄力条颜色=红色渐变（#FF4444 → #FF0000）
- **AND** 大招冷却条颜色=黄色渐变（#FFD700 → #FFA500）

#### Scenario: 狂暴阶段特效

- **WHEN** BOSS处于狂暴阶段
- **THEN** 冷却进度条边框闪烁红色
- **AND** 血条上方显示"💫 狂暴!"文字（持续2秒后淡出）

#### Scenario: 血条重叠时冷却条偏移

- **WHEN** 多个敌人血条发生重叠偏移
- **THEN** 冷却进度条跟随血条一起偏移
- **AND** 保持位于血条正下方
