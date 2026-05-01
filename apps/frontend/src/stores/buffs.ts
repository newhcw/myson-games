/**
 * Buff 状态管理
 * 管理道具产生的 Buff 效果（双倍伤害等）的激活、计时、过期
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type BuffType = 'doubleDamage'

export interface BuffState {
  type: BuffType
  endTime: number       // Buff 过期时间戳（毫秒）
  active: boolean
}

export const useBuffsStore = defineStore('buffs', () => {
  // 当前激活的 Buff 列表
  const activeBuffs = ref<Map<BuffType, BuffState>>(new Map())

  // 更新定时器
  let updateTimer: number | null = null

  // Computed

  /** 检查指定 Buff 是否激活 */
  const hasBuff = (type: BuffType): boolean => {
    const buff = activeBuffs.value.get(type)
    return !!buff && buff.active && Date.now() < buff.endTime
  }

  /** 获取指定 Buff 剩余秒数（过期返回 0） */
  const getBuffRemaining = (type: BuffType): number => {
    const buff = activeBuffs.value.get(type)
    if (!buff || !buff.active) return 0
    const remaining = Math.ceil((buff.endTime - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  /** 获取所有激活的 Buff（供 HUD 渲染） */
  const getActiveBuffs = computed(() => {
    const result: BuffState[] = []
    activeBuffs.value.forEach((buff) => {
      if (buff.active && Date.now() < buff.endTime) {
        result.push({ ...buff })
      }
    })
    return result
  })

  // Actions

  /** 激活一个 Buff。同类 Buff 刷新时间，不叠加 */
  const addBuff = (type: BuffType, duration: number): void => {
    const endTime = Date.now() + duration * 1000
    activeBuffs.value.set(type, {
      type,
      endTime,
      active: true,
    })
    ensureUpdateTimer()
  }

  /** 手动移除 Buff（一般不需要，会自动过期） */
  const removeBuff = (type: BuffType): void => {
    activeBuffs.value.delete(type)
    if (activeBuffs.value.size === 0) {
      stopUpdateTimer()
    }
  }

  /** 清理所有 Buff */
  const clearAll = (): void => {
    activeBuffs.value.clear()
    stopUpdateTimer()
  }

  // 内部

  /** 启动定时清理 */
  function ensureUpdateTimer() {
    if (updateTimer !== null) return
    updateTimer = window.setInterval(() => {
      const now = Date.now()
      activeBuffs.value.forEach((buff, type: BuffType) => {
        if (now >= buff.endTime) {
          activeBuffs.value.delete(type)
        }
      })
      if (activeBuffs.value.size === 0) {
        stopUpdateTimer()
      }
    }, 500)
  }

  function stopUpdateTimer() {
    if (updateTimer !== null) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  return {
    activeBuffs,
    hasBuff,
    getBuffRemaining,
    getActiveBuffs,
    addBuff,
    removeBuff,
    clearAll,
  }
})
