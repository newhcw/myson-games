## Context

玩家死亡界面（DeathScreen）当前渲染正常，但存在三个 UX 问题：

1. **指针锁定**：死亡时 `document.pointerLockElement` 仍指向游戏容器，鼠标被隐藏且无法点击死亡界面的按钮
2. **光标隐藏**：`.game-room` CSS 设置了 `cursor: none`，即使解锁指针后鼠标仍不可见
3. **输入未拦截**：`handleKeyDown`、`handleMouseDown` 等事件处理函数在死亡后仍在工作，导致键盘操作和射击仍可触发

## Goals / Non-Goals

**Goals:**
- 死亡时自动解锁指针，释放鼠标
- 死亡时让鼠标光标可见（小手形状）
- 死亡时阻止所有键盘和鼠标游戏输入
- 死亡时点击游戏区域不会重新锁定指针
- 复活后恢复正常游戏输入和光标行为

**Non-Goals:**
- 不修改死亡界面的视觉样式和动画
- 不修改其他游戏状态（暂停、胜利）的指针行为
- 不修改底层输入系统架构

## Decisions

1. **指针解锁时机**：在 `watch(gameStore.isDead)` 中处理，与现有倍镜关闭逻辑放在一起，确保死亡一瞬间同步释放指针。
   - 替代方案：在 `onPlayerHit` 中检测血量归零时解锁 → 但不如 watch 统一可靠

2. **光标控制方式**：使用 inline style 直接覆盖 `.game-room` 的 `cursor: none`，而非修改 CSS/添加 class。
   - 原因：scoped CSS 无法被外部 class 覆盖，inline style 优先级最高且可直接在 watch 中操作 DOM

3. **输入拦截策略**：在输入事件处理函数入口处增加 `gameStore.isDead` 检查，早于其他逻辑返回。
   - `handleKeyDown`：顶部 return，覆盖所有按键包括 Escape
   - `handleMouseDown`：在 pointer lock 检查之后立即 return，覆盖射击和右键倍镜
   - `handleClick`：增加 `&& !gameStore.isDead` 条件，防止点击重新锁定

4. **自动射击拦截**：`gameLoop` 中 `if (!gameStore.isDead && !gameStore.isPaused)` 已阻止 `updateAutoFire` 调用，无需额外修改

## Risks / Trade-offs

- **风险**：复活(`onRestart`)时需清除 inline style → 已在 watch 中添加 `else` 分支重置 cursor
- **低风险**：`handleKeyDown` 完全跳过后，死亡时按 Escape 也不会触发暂停 → 死亡界面已有按钮，不需要键盘操作
