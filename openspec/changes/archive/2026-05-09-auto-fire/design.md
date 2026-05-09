## Context

当前射击系统已实现完整的连发逻辑框架（`useShooting.ts` 中的 `updateAutoFire()` 方法），但鼠标输入层没有正确触发连发状态。`isFiring` ref 从未被设为 `true`，导致按住鼠标后无法进入自动连射模式。

- `useShooting.ts:47` - `fire()` 单次射击
- `useShooting.ts:292-305` - `updateAutoFire()` 已实现连发循环，但依赖 `isFiring` 标志
- `usePlayerInput.ts:189-207` - `handleMouseDown` 仅触发一次 `onShoot()`
- `usePlayerInput.ts:209-211` - `handleMouseUp` 为空操作
- `usePlayerInput.ts:60-78` - 虚拟按钮也只触发单次射击

## Goals / Non-Goals

**Goals:**
- 按住鼠标左键时，`isAuto: true` 的武器（冲锋枪、步枪）自动按 `fireRate` 间隔连射
- 松开鼠标左键时立即停止射击
- 触摸屏设备上的虚拟射击按钮同样支持按住连发
- 单发武器（手枪、狙击枪、霰弹枪、火箭筒）行为不变，仍然每次点击只发射一发
- `isAuto: false` 的武器按住时不连发

**Non-Goals:**
- 不改变 `fireRate` 参数或武器平衡性
- 不改变子弹伤害、弹道散布等射击机制
- 不改变射击音效和特效的播放逻辑elm

## Decisionsphe

1. **通过 `isFiring` 标志控制连发**：复用已有的 `updateAutoFire()` 方法，只需在输入层正确设置 `isFiring` 状态。这避免了重写射击循环，改动最小。
2. **新增 `startFiring()` / `stopFiring()` 接口**：在 `useShooting` 中暴露控制方法，在 `PlayerInputCallbacks` 中添加 `onShootStart` / `onShootStop` 回调，与现有 `onShoot` 分离，保持向后兼容。
3. **触摸屏适配**：在 `onVirtualButtonPress` 中触发开始射击，在 `onVirtualButtonRelease` 中触发停止射击。

## Risks / Trade-offs

- **事件丢失风险**：如果用户在游戏画布外释放鼠标，`mouseup` 事件可能丢失导致持续射击。缓解：在 `pointerlockchange` 事件中自动停止射击，并在 `handleMouseUp` 已注册到 `document` 级别（已在现有代码中实现）
- **性能影响**：连发在 `update()` 每帧调用，对性能影响可忽略（仅做时间戳比较）
