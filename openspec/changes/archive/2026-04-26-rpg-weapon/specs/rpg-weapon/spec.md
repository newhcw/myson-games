## ADDED Requirements

### Requirement: RPG 武器数据定义

系统中 SHALL 包含 RPG 火箭筒的完整武器数据定义，包含武器 ID、名称、类型、伤害、射速、弹匣容量、换弹时间、描述和是否全自动。

| 属性 | 值 |
|------|-----|
| id | `rpg` |
| name | `火箭筒` |
| type | `rpg` |
| damage | 150（直击）/ AOE 衰减 |
| fireRate | 0.5 发/秒 |
| magazineSize | 1 |
| reloadTime | 3000ms |
| scope | false |
| description | `发射火箭，范围爆炸` |
| isAuto | false |

#### Scenario: RPG 武器数据显示在武器列表中

- **WHEN** 游戏初始化
- **THEN** 武器列表包含第 6 把武器 `rocket launcher`，类型为 `rpg`

#### Scenario: RPG 武器数据可被正常读取

- **WHEN** 玩家切换到 RPG
- **THEN** 武器数据显示正确的名称、伤害、弹匣容量

### Requirement: RPG 弹药管理

系统中 SHALL 维护 RPG 的弹药状态，包括当前弹匣余量、备弹量和最大备弹上限。初始弹匣 1 发，备弹 6 发，最大备弹 18 发。

#### Scenario: RPG 初始弹药

- **WHEN** 游戏初始化
- **THEN** RPG 弹药状态为 `current: 1, reserve: 6, maxReserve: 18`

#### Scenario: RPG 发射消耗弹药

- **WHEN** 玩家使用 RPG 射击
- **THEN** 弹匣子弹数减 1

#### Scenario: RPG 空弹匣换弹

- **WHEN** RPG 弹匣为空，玩家按 R 换弹
- **THEN** 经过 3000ms 换弹时间后，弹匣补充 1 发，备弹减 1

#### Scenario: RPG 备弹耗尽不可换弹

- **WHEN** RPG 备弹为 0，玩家尝试换弹
- **THEN** 换弹不执行，弹药保持为 0

### Requirement: RPG 武器切换

玩家 SHALL 能通过数字键 6 切换到 RPG，通过 Q 循环切换。RPG 作为第 6 把武器（索引 5）。

#### Scenario: 数字键 6 切换到 RPG

- **WHEN** 玩家按下数字键 6
- **THEN** 当前武器切换为 RPG（索引 5）

#### Scenario: Q 键循环切到 RPG

- **WHEN** 当前武器是第 5 把（霰弹枪，索引 4），玩家按 Q
- **THEN** 当前武器切换到 RPG（索引 5）

#### Scenario: RPG 切换到其他武器

- **WHEN** 当前武器是 RPG（索引 5），玩家按数字键 1
- **THEN** 当前武器切换到手枪（索引 0）
