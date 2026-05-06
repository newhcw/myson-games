## ADDED Requirements

### Requirement: HUD 子组件提取
系统 SHALL 提供 `GameHUD.vue` 子组件，封装当前 FPSGame.vue 模板中的所有 HUD 元素。

#### Scenario: 血条显示
- **WHEN** GameHUD 渲染
- **THEN** 显示生命值条，血量 <=50% 时显示 warning 样式，<=20% 时显示 danger 样式

#### Scenario: 弹药显示
- **WHEN** GameHUD 渲染
- **THEN** 显示当前武器名称和弹药数（当前/储备），换弹中显示"换弹中..."，弹药 <=5 时显示低弹药样式

#### Scenario: 波次显示
- **WHEN** GameHUD 渲染
- **THEN** 显示当前波次进度（第 X / N 波），Boss 波次显示皇冠图标

#### Scenario: Buff 状态显示
- **WHEN** 存在活跃 buff
- **THEN** 显示 buff 图标和剩余时间

#### Scenario: 屏息体力条
- **WHEN** 屏息体力 < 最大值
- **THEN** 显示体力条，体力 <20 时显示 low 样式，屏息中显示"屏息中..."

#### Scenario: 武器切换指示器
- **WHEN** GameHUD 渲染
- **THEN** 显示 6 个武器槽位，当前武器高亮

#### Scenario: Crosshair 显示
- **WHEN** GameHUD 渲染
- **THEN** 默认显示圆点准星，倍镜激活时显示十字准星

#### Scenario: 操作提示
- **WHEN** GameHUD 渲染
- **THEN** 显示键盘操作提示文本

#### Scenario: 间歇倒计时
- **WHEN** 波次处于间歇状态
- **THEN** 显示下一波倒计时和"按空格键跳过"提示

### Requirement: GameHUD 接口定义
GameHUD.vue SHALL 通过 props 接收所有展示数据，不依赖任何 store 直接访问。

#### Scenario: Props 传递
- **WHEN** 父组件渲染 GameHUD
- **THEN** 通过 props 传入 healthPercent、ammoDisplay、currentWeaponName、currentWeaponIndex、isReloading、waveProgressText、isBossWave、intermissionCountdown、waveState、activeBuffs、breathStamina、isHoldingBreath、scopeActive 等数据
