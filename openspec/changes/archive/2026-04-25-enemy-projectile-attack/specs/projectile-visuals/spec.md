## ADDED Requirements

### Requirement: 差异化子弹外观

系统 SHALL 根据敌人类型生成不同外观的子弹 3D 模型。

- 小兵（soldier）子弹 MUST 为黄色星星形状，使用 OctahedronGeometry（0.15 半径）+ 尖角装饰，颜色 #FFD700
- 精英（elite）子弹 MUST 为紫色菱形水晶，使用旋转的 OctahedronGeometry（0.25 半径），颜色 #9B59B6
- BOSS（boss）子弹 MUST 为红色大火球，使用 SphereGeometry（0.5 半径）+ 发光光环，颜色 #E74C3C

所有子弹 MUST 使用 `MeshBasicMaterial` 确保在无光照条件下依然可见。

#### Scenario: 小兵子弹外观

- **WHEN** 小兵类型敌人发射子弹
- **THEN** 生成一颗金黄色小星星形状的子弹

#### Scenario: 精英子弹外观

- **WHEN** 精英类型敌人发射子弹
- **THEN** 生成一颗紫色菱形水晶形状的子弹

#### Scenario: BOSS 子弹外观

- **WHEN** BOSS 类型敌人发射子弹
- **THEN** 生成一颗红色大火球，带有脉动发光光环

### Requirement: 子弹尾迹粒子

系统 SHALL 为精英和 BOSS 的子弹生成拖尾粒子效果。尾迹粒子沿子弹飞行路径后方分布，数量 3-5 个，大小递减，透明度从 0.6 渐降到 0。

小兵子弹可选尾迹（因其飞行速度快，尾迹不明显）。

#### Scenario: 精英水晶弹尾迹

- **WHEN** 精英子弹处于活跃飞行状态
- **THEN** 子弹后方显示 3-4 个紫色小粒子，呈递减排列

#### Scenario: BOSS 火球尾迹

- **WHEN** BOSS 子弹处于活跃飞行状态
- **THEN** 子弹后方显示 5 个橙色到红色渐变粒子，带有火焰感

### Requirement: 命中爆炸粒子特效

系统 SHALL 在子弹命中玩家时生成卡通化的爆炸粒子特效。粒子 MUST 使用彩色（金色、橙色、白色混合），数量 8-12 个，从命中点向随机方向飞散，1 秒内淡出消失。

粒子特效 MUST NOT 使用红色血液效果，必须适配儿童游戏定位。

#### Scenario: 子弹命中产生爆炸粒子

- **WHEN** 子弹与玩家发生碰撞
- **THEN** 在碰撞位置生成 8-12 个彩色粒子，向四周飞散并逐渐淡出

#### Scenario: 粒子自动清理

- **WHEN** 爆炸粒子特效播放完毕（1 秒后）
- **THEN** 所有粒子和相关几何体/材质从场景移除并释放内存
