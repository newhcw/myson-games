<template>
  <div ref="containerRef" class="enemy-manager">
    <!-- 敌人系统的 UI 容器 -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { enemyAI } from '@/game/enemies/EnemyAI'
import { ProjectileManager } from '@/game/enemies/ProjectileManager'
import type { PowerUpManager } from '@/game/powerups/PowerUpManager'
import { DROP_RATES, BOSS_DROP_COUNT } from '@/game/powerups/types'
import type { EnemyTypeKeyword } from '@/game/wave/types'

interface Props {
  scene: THREE.Scene
  camera: THREE.Camera
  playerPosition: THREE.Vector3
  playerHealth: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'player-hit', damage: number): void
  (e: 'enemy-killed', enemyId: string, score: number): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let enemies: string[] = []
let enemyTypes: Map<string, EnemyTypeKeyword> = new Map()
let animationTime = 0
let projectileManager: ProjectileManager | null = null
let powerUpManager: PowerUpManager | null = null
let onEnemyKilledCallback: ((enemyId: string) => void) | null = null

/**
 * 按波次配置生成敌人（Task 4.2）
 * @param configs 敌人配置数组 [{type, count}]
 * @param spawnPoints 刷新点数组
 */
const spawnEnemies = (
  configs: { type: EnemyTypeKeyword; count: number }[],
  spawnPoints: THREE.Vector3[]
): string[] => {
  const spawnedIds: string[] = []
  let pointIndex = 0

  configs.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      // 循环使用刷新点
      const point = spawnPoints[pointIndex % spawnPoints.length]
      pointIndex++

      const enemy = enemyAI.spawnEnemy(type, point.clone())
      enemies.push(enemy.id)
      enemyTypes.set(enemy.id, type)
      spawnedIds.push(enemy.id)
    }
  })

  return spawnedIds
}

/**
 * 敌人击杀时触发道具掉落判定（Task 4.3）
 */
const handleEnemyDrop = (enemyId: string): void => {
  if (!powerUpManager) return

  const enemyType = enemyTypes.get(enemyId)
  if (!enemyType) return

  const dropRate = DROP_RATES[enemyType] || 0
  const dropCount = enemyType === 'boss' ? BOSS_DROP_COUNT : 1

  // 获取敌人位置
  const enemy = enemyAI.getActiveEnemies().find((e: any) => e.id === enemyId)
  if (!enemy) return
  const pos = enemy.position.clone()

  for (let i = 0; i < dropCount; i++) {
    if (Math.random() < dropRate) {
      const randomType = PowerUpManager.randomType()
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        0,
        (Math.random() - 0.5) * 1.5
      )
      powerUpManager.spawn({ type: randomType, position: pos.clone().add(offset) })
    }
  }
}

// 更新循环
const update = (delta: number) => {
  animationTime += delta

  // 更新敌人 AI（子弹生成 + 蓄力 + 大招）
  enemyAI.update(delta, props.playerPosition, animationTime)

  // 更新子弹管理器（飞行运动 + 碰撞检测）
  if (projectileManager) {
    projectileManager.setPlayerPosition(props.playerPosition)
    projectileManager.update(delta)
  }

  // 更新道具管理器
  if (powerUpManager) {
    powerUpManager.setPlayerPosition(props.playerPosition)
    powerUpManager.update(delta, animationTime)
  }
}

// 处理敌人受伤
const onEnemyHit = (enemyId: string, damage: number): boolean => {
  const result = enemyAI.enemyHit(enemyId, damage)

  if (result.killed) {
    const score = enemyAI.getActiveEnemies().find((e: any) => e.id === enemyId)?.config?.scoreValue || 100
    emit('enemy-killed', enemyId, score)

    // 从追踪列表中移除
    const index = enemies.indexOf(enemyId)
    if (index > -1) {
      enemies.splice(index, 1)
    }

    // 道具掉落
    handleEnemyDrop(enemyId)

    // 通知波次管理器
    onEnemyKilledCallback?.(enemyId)

    // 清理 type 映射
    enemyTypes.delete(enemyId)
  }

  return result.killed
}

/** 设置击杀回调（由 WaveManager 注册） */
const setOnEnemyKilled = (cb: (enemyId: string) => void): void => {
  onEnemyKilledCallback = cb
}

// 获取敌人冷却进度（用于 UI 显示）
const getCooldownProgress = (enemy: any): { type: string; progress: number } | null => {
  if (!enemy) return null

  const now = Date.now()

  // 精英蓄力攻击
  if (enemy.config.type === 'elite' && enemy.isCharging) {
    const elapsed = now - enemy.chargeStartTime
    const progress = Math.min(elapsed / 1500, 1) // 1.5秒蓄力
    return { type: 'charge', progress }
  }

  // BOSS 大招冷却
  if (enemy.config.type === 'boss' && enemy.config.specialAttack) {
    const cooldown = enemy.phase === 2 
      ? enemy.config.specialAttack.cooldown * 0.5 
      : enemy.config.specialAttack.cooldown
    if (now - enemy.lastSpecialAttackTime < cooldown) {
      const progress = Math.min((now - enemy.lastSpecialAttackTime) / cooldown, 1)
      return { type: 'special', progress }
    }
  }

  return null
}

onMounted(() => {
  if (props.scene && props.camera) {
    const enemyGroup = new THREE.Group()
    enemyGroup.name = 'enemies'
    props.scene.add(enemyGroup)

    enemyAI.setScene(enemyGroup, props.camera)
    enemyAI.setOptions({
      playerPosition: props.playerPosition,
      playerHealth: props.playerHealth,
      onEnemyDead: (enemy) => {
        emit('enemy-killed', enemy.id, enemy.config.scoreValue)
      },
      onPlayerHit: (damage: number) => {
        emit('player-hit', damage)
      }
    })

    projectileManager = new ProjectileManager(100)
    projectileManager.setScene(enemyGroup)
    projectileManager.setOnPlayerHit((damage: number) => {
      emit('player-hit', damage)
    })
    enemyAI.setProjectileManager(projectileManager)

    // 不再在此处生成敌人，改为由 WaveManager 通过 spawnEnemies 调用
  }

  if (containerRef.value) {
    containerRef.value.id = 'game-ui'
  }
})

onUnmounted(() => {
  enemyAI.clear()
  projectileManager?.clear()
  powerUpManager?.dispose()
})

// 暴露方法给父组件
defineExpose({
  update,
  onEnemyHit,
  spawnEnemies,
  setOnEnemyKilled,
  setPowerUpManager: (mgr: PowerUpManager) => { powerUpManager = mgr },
  reset: () => {
    enemyAI.clear()
    projectileManager?.clear()
    powerUpManager?.dispose()
    enemies = []
    enemyTypes.clear()
    onEnemyKilledCallback = null
  },
  getActiveEnemies: () => enemyAI.getActiveEnemies(),
  getHealthBarCount: () => enemyAI.getHealthBarCount(),
  getProjectileManager: () => projectileManager,
  getActiveProjectileCount: () => projectileManager?.getActiveCount() || 0,
  getPowerUpManager: () => powerUpManager,
  spawnTestEnemy: (type: EnemyTypeKeyword, position: THREE.Vector3) => {
    const enemy = enemyAI.spawnEnemy(type, position)
    enemies.push(enemy.id)
    enemyTypes.set(enemy.id, type)
    return enemy
  },
})
</script>

<style scoped>
.enemy-manager {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>