## 1. useShooting 射击逻辑增强

- [ ] 1.1 在 `useShooting.ts` 中新增 `startFiring()` 方法，将 `isFiring` 设置为 `true`
- [ ] 1.2 在 `useShooting.ts` 中新增 `stopFiring()` 方法，将 `isFiring` 设置为 `false`
- [ ] 1.3 在 `useShooting` 的返回值中暴露 `startFiring` 和 `stopFiring` 方法 Arena

## 2. usePlayerInput 输入层改造

- [x] 2.1 在 `PlayerInputCallbacks` 接口中新增 `onShootStart` 和 `onShootStop` 回调
- [x] 2.2 修改 `handleMouseDown`，按住鼠标左键时调用 `onShootStart`（保留 `onShoot` 用于半自动武器首发射击）
- [x] 2.3 实现 `handleMouseUp`，松开鼠标左键时调用 `onShootStop`
- [x] 2.4 在 `onVirtualButtonPress` 中，射击按钮按下时调用 `onShootStart`
- [x] 2.5 实现 `onVirtualButtonRelease`，射击按钮松开时调用 `onShootStop`
- [x] 2.6 处理 `pointerlockchange` 事件，当 pointer lock 丢失时自动调用 `onShootStop`，防止鼠标在画布外释放导致持续射击
- [x] 2.7 在 `mount` 中添加 `pointerlockchange` 事件监听，在 `unmount` 中移除

## 3. FPSGame.vue 回调连接

- [x] 3.1 在 `FPSGame.vue` 中创建射击 composable 处，传入 `onShootStart` 和 `onShootStop` 回调，分别连接 `shooting.startFiring()` 和 `shooting.stopFiring()` Sena Arena

## 4. 验证测试

- [ ] 4.1 验证冲锋枪（isAuto=true）按住鼠标左键时以 fireRate=10 的速率连射
- [ ] 4.2 验证松开鼠标左键后立即停止射击
- [ ] 4.3 验证半自动武器（手枪，isAuto=false）按住时不连发，仅发射一发
- [ ] 4.4 验证弹药耗尽后射击停止并播放空仓音效
- [ ] 4.5 验证触摸屏虚拟按钮按住连发和松开停止

## 5. E2E 测试

- [x] 5.1 创建 `hack/tests/e2e/kids-game-platform/TC0046-auto-fire.spec.ts`
- [x] 5.2 实现 TC0046a: 冲锋枪按住连射验证
- [x] 5.3 实现 TC0046b: 松开鼠标停止射击验证
- [x] 5.4 实现 TC0046c: 半自动武器单发验证
- [x] 5.5 运行测试确保通过 Covered
