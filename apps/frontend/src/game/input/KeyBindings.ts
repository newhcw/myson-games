/**
 * 按键映射配置
 * 定义默认按键映射和相关类型
 */

/** 按键映射配置 */
export interface KeyBindingConfig {
  [action: string]: string // action name -> key
}

/** 动作标签映射（用于 UI 显示） */
export const ACTION_LABELS: Record<string, string> = {
  move_forward: '向前移动',
  move_back: '向后移动',
  move_left: '向左移动',
  move_right: '向右移动',
  jump: '跳跃',
  crouch: '下蹲',
  run: '跑动',
  shoot: '射击',
  reload: '换弹',
  switch_weapon_1: '切换武器 1',
  switch_weapon_2: '切换武器 2',
  switch_weapon_3: '切换武器 3',
  switch_weapon_4: '切换武器 4',
  switch_weapon_5: '切换武器 5',
  switch_weapon_6: '切换武器 6',
  cycle_weapon: '循环切换武器',
  scope: '瞄准镜',
  hold_breath: '屏息稳定',
}

/** 按键显示名称（用于 UI 显示） */
export const KEY_LABELS: Record<string, string> = {
  ' ': '空格',
  'control': 'Ctrl',
  'shift': 'Shift',
  'mouseleft': '鼠标左键',
  'mouseright': '鼠标右键',
  'w': 'W',
  'a': 'A',
  's': 'S',
  'd': 'D',
  'q': 'Q',
  'r': 'R',
  'b': 'B',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
}

/** 默认按键映射 */
export const DEFAULT_KEY_BINDINGS: KeyBindingConfig = {
  move_forward: 'w',
  move_back: 's',
  move_left: 'a',
  move_right: 'd',
  jump: ' ',
  crouch: 'control',
  run: 'shift',
  shoot: 'mouseleft',
  reload: 'r',
  switch_weapon_1: '1',
  switch_weapon_2: '2',
  switch_weapon_3: '3',
  switch_weapon_4: '4',
  switch_weapon_5: '5',
  switch_weapon_6: '6',
  cycle_weapon: 'q',
  scope: 'mouseright',
  hold_breath: 'b',
}

/** 获取按键显示名称 */
export const getKeyLabel = (key: string): string => {
  return KEY_LABELS[key] || key.toUpperCase()
}

/** 获取动作显示名称 */
export const getActionLabel = (action: string): string => {
  return ACTION_LABELS[action] || action
}
