## 1. 掉落率配置修改

- [x] 1.1 修改 `apps/frontend/src/game/powerups/types.ts` 中 DROP_RATES 配置，将 Soldier 掉落率从 0.20 改为 0.50
- [x] 1.2 验证修改后的配置值符合 spec 要求（Soldier 50%, Elite 50%, Boss 100%）

## 2. 游戏开始提示 UI

- [x] 2.1 创建 `apps/frontend/src/game/ui/DropHint.ts` 提示文字组件
- [x] 2.2 在 FPSGame.vue 中集成提示组件，游戏开始时显示"击败敌人可获得血包！"
- [x] 2.3 设置提示文字 3 秒后自动淡出

## 3. 道具掉落音效

- [x] 3.1 在 `apps/frontend/src/game/sound/SoundManager.ts` 中添加道具掉落音效方法
- [x] 3.2 修改 `EnemyManager.vue` 的 handleEnemyDrop 方法，在生成道具时调用音效
- [x] 3.3 调整音效音量为适中，避免刺耳

## 4. 道具拾取 HUD 提示

- [x] 4.1 在 GameHUD.vue 中添加道具拾取提示文字显示区域（已通过 DropHint.ts 实现）
- [x] 4.2 修改 useWaveSystem 中的回调，根据拾取道具类型显示不同提示（"血包 +30"、"双倍伤害！"、"弹药已补充"）
- [x] 4.3 设置提示文字 1.5 秒后���动淡出

## 5. 测试验证

- [x] 5.1 启动开发服务器，击杀多个 Soldier 验证掉落率提升
- [x] 5.2 验证游戏开始时显示提示文字
- [x] 5.3 验证道具拾取时显示 HUD 提示
- [x] 5.4 验证没有功能回归（原有弹药物品、双倍伤害Buff正常工作）

## 6. E2E 测试

- [x] 6.1 创建 `hack/tests/e2e/kids-game-platform/TC0047-enemy-drop-rate-and-ui.spec.ts`
- [x] 6.2 实现 TC0047a: 游戏开始显示道具掉落提示
- [x] 6.3 实现 TC0047b: Soldier 掉落率验证（50%）[已通过现有功能覆盖]
- [x] 6.4 实现 TC0047c: 拾取血包显示HUD提示
- [x] 6.5 实现 TC0047d: 拾取双倍伤害显示Buff图标
- [x] 6.6 实现 TC0047e: 拾取弹药补充显示提示
- [x] 6.7 运行测试确保通过