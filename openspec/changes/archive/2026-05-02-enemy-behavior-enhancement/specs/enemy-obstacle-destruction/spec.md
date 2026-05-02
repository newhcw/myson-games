## ADDED Requirements

### Requirement: 可破坏障碍物

系统SHALL支持可破坏障碍物，障碍物拥有血量，被攻击至0血时播放破碎动画并消失。

#### Scenario: 创建带有血量的障碍物

- **WHEN** 游戏场景初始化创建障碍物
- **THEN** 大型障碍物血量=100HP，中型=60HP，小型=30HP
- **AND** 障碍物网格的 `userData` 存储 `{ isDestructible: true, health: number, maxHealth: number, isDestroyed: false }`

#### Scenario: 障碍物被敌人射击命中

- **WHEN** 敌人发射的子弹击中障碍物
- **OR** 敌人的火箭弹在障碍物附近爆炸
- **THEN** 障碍物血量减去对应伤害值
- **AND** 障碍物闪红反馈（0.1秒）

#### Scenario: 障碍物血量归零

- **WHEN** 障碍物血量 ≤ 0
- **THEN** 播放破碎动画（缩放→0 + 透明度→0，持续0.5秒）
- **AND** 动画完成后从场景中移除
- **AND** 从碰撞检测器中移除该障碍物

### Requirement: 敌人射击障碍物

敌人在追逐玩家过程中，若路径被障碍物阻挡，系统SHALL使敌人优先射击障碍物。

#### Scenario: 敌人检测到障碍物阻挡

- **WHEN** 敌人处于追逐状态（chase）
- **AND** 敌人与玩家之间的射线被障碍物遮挡
- **AND** 障碍物血量 > 0
- **THEN** 敌人停止移动，转向障碍物
- **AND** 射击障碍物（使用普通攻击逻辑）

#### Scenario: 障碍物被破坏后继续追逐

- **WHEN** 障碍物被敌人摧毁
- **THEN** 敌人恢复追逐状态
- **AND** 继续向玩家最后已知位置移动

#### Scenario: 玩家重新出现在视野

- **WHEN** 敌人在射击障碍物过程中
- **AND** 玩家重新出现在敌人视野内且无遮挡
- **THEN** 敌人停止射击障碍物，转为攻击/追逐玩家

### Requirement: 障碍物碰撞检测增强

CollisionDetector系统SHALL支持对障碍物的血量管理和破坏检测。

#### Scenario: 注册可破坏障碍物

- **WHEN** 调用 `collisionDetector.addCollider(mesh, health)`
- **THEN** 碰撞体被存储，并关联血量数据
- **AND** 使用 `Map<meshUuid, ObstacleData>` 存储，key为 `mesh.uuid`

#### Scenario: 对障碍物造成伤害

- **WHEN** 调用 `collisionDetector.takeDamageAtPosition(position, damage)`
- **THEN** 查找position附近（半径1米内）的障碍物
- **AND** 若找到且未破坏，扣除对应血量
- **AND** 返回 `{ destroyed: boolean, obstacle: ObstacleData | null }`

#### Scenario: 移除被破坏的障碍物

- **WHEN** 障碍物血量 ≤ 0
- **THEN** 调用 `collisionDetector.removeCollider(mesh.uuid)`
- **AND** 该障碍物不再参与碰撞检测
