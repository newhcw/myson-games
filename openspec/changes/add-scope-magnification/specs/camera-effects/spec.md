## MODIFIED Requirements

### Requirement: 视角摇晃模拟
**原需求**: 生成 figure-8 图案的摇晃偏移（swayOffset），瞄准时幅度降至 30%

**修改为**: 生成 figure-8 图案的摇晃偏移（swayOffset），瞄准时幅度降至 30%，倍镜激活时幅度进一步降至 10%

#### Scenario: 倍镜激活时视角摇晃大幅减少
- **GIVEN** 倍镜处于激活状态（scope.isActive = true）
- **WHEN** updateSway 每帧调用
- **THEN** swayOffset 幅度为基础值的 10%

#### Scenario: 屏息且开镜时摇晃最小
- **GIVEN** 玩家处于屏息状态且倍镜激活
- **WHEN** updateSway 每帧调用
- **THEN** swayOffset 幅度为基础值的 5%（两者叠加）

### Requirement: 呼吸模拟
**原需求**: 生成垂直为主的呼吸摇晃（breathingSway），瞄准时幅度降至 30%

**修改为**: 生成垂直为主的呼吸摇晃（breathingSway），瞄准时幅度降至 30%，倍镜激活时幅度进一步降至 10%

#### Scenario: 倍���激活时呼吸摇晃大幅减少
- **GIVEN** 倍镜处于激活状态
- **WHEN** updateSway 每帧调用
- **THEN** breathingSway 幅度为基础值的 10%