## ADDED Requirements

### Requirement: 敌人发射可见弹道子弹

系统 SHALL 支持敌人生成可见的子弹对象，子弹在 3D 场景中沿直线飞向玩家当前位置，替代原有的即时射线命中机制。

子弹对象 MUST 包含以下属性：3D 网格（mesh）、位置（position）、速度向量（velocity）、伤害值（damage）、存活时间（lifetime）、所属敌人 ID（ownerId）、存活状态（alive）。

#### Scenario: 敌人生成子弹

- **WHEN** 敌人在追逐或攻击状态下触发 tryShootPlayer()
- **THEN** 系统从对象池中获取一个子弹实例，设置其初始位置为敌人位置上方偏移（0, 1, 0），速度方向指向玩家当前位置，并标记为活跃

#### Scenario: 子弹飞行运动

- **WHEN** 子弹处于活跃状态
- **THEN** 每帧更新子弹位置（position += velocity × deltaTime），并同步更新其 3D 网格的 world position

#### Scenario: 子弹命中玩家

- **WHEN** 活跃子弹位置到玩家位置的欧氏距离小于 0.5 单位
- **THEN** 系统触发 onPlayerHit(damage) 回调，创建命中粒子特效，并将子弹回收到对象池

#### Scenario: 子弹超时销毁

- **WHEN** 子弹存活时间（lifetime）降至 0 或以下
- **THEN** 子弹被自动回收到对象池，其 3D 网格设为不可见

#### Scenario: 子弹超出射程销毁

- **WHEN** 子弹从发射位置飞行的总距离超过 25 单位
- **THEN** 子弹被自动回收到对象池

### Requirement: 子弹对象池

系统 SHALL 实现对象池模式管理子弹实例，预分配 100 个 EnemyProjectile 实例，避免运行时频繁创建和销毁导致的 GC 抖动。

对象池 MUST 支持 acquire() 获取空闲子弹、release() 回收活跃子弹。当池耗尽时 SHALL 优雅降级（不发射新子弹）。

#### Scenario: 从池中获取子弹

- **WHEN** 敌人需要发射子弹且池中有空闲实例
- **THEN** acquire() 返回一个活跃状态的子弹，其 3D 网格设为可见

#### Scenario: 池耗尽降级

- **WHEN** 敌人需要发射子弹但池中 100 个实例全部活跃
- **THEN** acquire() 返回 null，系统跳过本次射击，不抛出错误

#### Scenario: 回收子弹到池

- **WHEN** 子弹命中玩家、超时或超出射程
- **THEN** release() 将子弹标记为非活跃，3D 网格设为不可见，重置内部状态

### Requirement: 子弹与玩家距离碰撞检测

系统 SHALL 在每帧检查所有活跃子弹与玩家位置的距离，检测碰撞。玩家在 FPS 模式下没有 3D 网格，因此使用位置距离检测替代射线碰撞。

碰撞阈值 MUST 为 0.5 单位（子弹半径 + 玩家近似半径）。

#### Scenario: 子弹进入碰撞范围

- **WHEN** 活跃子弹位置到 playerPosition 的欧氏距离 < 0.5 单位
- **THEN** 判定为命中，触发玩家受伤流程

#### Scenario: 子弹未进入碰撞范围

- **WHEN** 活跃子弹位置到 playerPosition 的欧氏距离 >= 0.5 单位
- **THEN** 子弹继续飞行，不触发任何伤害
