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
let animationTime = 0
let projectileManager: ProjectileManager | null = null

// 生成初始敌人
const spawnInitialEnemies = () => {
  // 生成5个敌人
  const spawnPositions = [
    new THREE.Vector3(10, 0, 10),
    new THREE.Vector3(-10, 0, 10),
    new THREE.Vector3(10, 0, -10),
    new THREE.Vector3(-10, 0, -10),
    new THREE.Vector3(0, 0, 15)
  ]

  spawnPositions.forEach((pos, index) => {
    const enemyType = index < 3 ? 'soldier' : index < 4 ? 'elite' : 'boss'
    const enemy = enemyAI.spawnEnemy(enemyType, pos)
    enemies.push(enemy.id)
    // 保存生成数据
    enemySpawnData.set(enemy.id, { type: enemyType, position: pos })
  })
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
}

// 存储敌人的初始位置和类型
const enemySpawnData: Map<string, { type: string; position: THREE.Vector3 }> = new Map()

// 处理敌人受伤
const onEnemyHit = (enemyId: string, damage: number): boolean => {
  const result = enemyAI.enemyHit(enemyId, damage)

  if (result.killed) {
    emit('enemy-killed', enemyId, 100) // 击杀分数
    const index = enemies.indexOf(enemyId)
    if (index > -1) {
      enemies.splice(index, 1)
    }

    // 获取敌人的初始生成数据
    const spawnData = enemySpawnData.get(enemyId)

    // 30秒后原位置重生
    setTimeout(() => {
      if (spawnData) {
        const enemy = enemyAI.spawnEnemy(spawnData.type, spawnData.position)
        enemies.push(enemy.id)
        // 更新新的敌人ID对应的生成数据
        enemySpawnData.set(enemy.id, spawnData)
      }
    }, 30000) // 30秒重生（30000毫秒）
  }

  return result.killed
}

onMounted(() => {
  // 设置 EnemyAI
  if (props.scene && props.camera) {
    // 创建一个 group 来存放所有敌人
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

    // 初始化子弹管理器
    projectileManager = new ProjectileManager(100)
    projectileManager.setScene(enemyGroup)
    projectileManager.setOnPlayerHit((damage: number) => {
      emit('player-hit', damage)
    })
    enemyAI.setProjectileManager(projectileManager)

    // 生成初始敌人
    spawnInitialEnemies()
  }

  // 将容器设置为游戏 UI 容器
  if (containerRef.value) {
    containerRef.value.id = 'game-ui'
  }
})

onUnmounted(() => {
  enemyAI.clear()
  projectileManager?.clear()
})

// 暴露方法给父组件
defineExpose({
  update,
  onEnemyHit,
  getActiveEnemies: () => enemyAI.getActiveEnemies(),
  getHealthBarCount: () => enemyAI.getHealthBarCount(),
  getProjectileManager: () => projectileManager,
  getActiveProjectileCount: () => projectileManager?.getActiveCount() || 0
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