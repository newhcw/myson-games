import * as THREE from 'three'
import type { Enemy } from './types'
import { ENEMY_CONFIGS } from './types'
import { createEnemyMesh, playIdleAnimation, playWalkAnimation, playChaseAnimation, playHitAnimation, playDeathAnimation, updateEnemyPosition, updateBossEffects, updateExploderEffects, updateHealerEffects, createHealParticles } from './EnemyRenderer'
import { EnemyHealthBar } from './EnemyHealthBar'
import { enemyShooter } from './EnemyShooter'
import { ProjectileManager } from './ProjectileManager'
import { collisionDetector } from '@/game/utils/Collision'

export interface EnemyAIOptions {
  playerPosition: THREE.Vector3
  playerHealth: number
  onEnemyDead: (enemy: Enemy, killerId?: string) => void
  onPlayerHit: (damage: number) => void
}

export class EnemyAI {
  private enemies: Map<string, Enemy> = new Map()
  private scene: THREE.Group | null = null
  private lastPlayerPosition: THREE.Vector3 = new THREE.Vector3()
  private options: EnemyAIOptions | null = null
  private searchTimeout: Map<string, number> = new Map() // 敌人ID -> 开始搜索的时间
  private healthBar: EnemyHealthBar | null = null
  private _camera: THREE.Camera | null = null
  private projectileManager: ProjectileManager | null = null

  // 生成敌人
  spawnEnemy(type: keyof typeof ENEMY_CONFIGS, position: THREE.Vector3): Enemy {
    const config = ENEMY_CONFIGS[type]
    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      config,
      mesh: null,
      position: position.clone(),
      health: config.health,
      maxHealth: config.health,
      state: 'patrol',
      targetPosition: null,
      waypoints: this.generateWaypoints(position, config.patrolRadius),
      currentWaypointIndex: 0,
      waitTime: 0,
      lastAttackTime: 0,
      isDead: false,
      spawnTime: Date.now(),
      isCharging: false,
      chargeStartTime: 0,
      chargeLine: null,
      lastSpecialAttackTime: 0,
      warningRing: null,
      phase: 1,
      isExploding: false,
      explosionStartTime: 0,
      lastHealTime: 0,
    }

    // 创建3D模型
    if (this.scene) {
      // 创建Q版卡通模型
      const enemyMesh = createEnemyMesh(config)
      enemy.mesh = enemyMesh
      if (enemy.mesh) {
        enemy.mesh.position.copy(enemy.position)
        this.scene.add(enemy.mesh)
      }
    }

    this.enemies.set(enemy.id, enemy)

    // 立即初始化血条（避免懒加载导致的显示延迟）
    if (this.healthBar) {
      this.healthBar.update(enemy)
    }

    return enemy
  }

  // 设置场景引用
  setScene(scene: THREE.Group, camera: THREE.Camera) {
    this.scene = scene
    this._camera = camera
    // 初始化血条系统
    if (!this.healthBar) {
      this.healthBar = new EnemyHealthBar(this._camera)
    }
    // 为已存在的敌人创建mesh
    this.enemies.forEach(enemy => {
      if (!enemy.mesh) {
        const enemyMesh = createEnemyMesh(enemy.config)
        enemy.mesh = enemyMesh
        if (enemy.mesh) {
          enemy.mesh.position.copy(enemy.position)
          this.scene!.add(enemy.mesh)
        }
      }
    })
  }

  // 设置选项
  setOptions(options: EnemyAIOptions) {
    this.options = options
  }

  // 设置子弹管理器
  setProjectileManager(manager: ProjectileManager) {
    this.projectileManager = manager
  }

  // 生成巡逻路径点
  private generateWaypoints(center: THREE.Vector3, radius: number): THREE.Vector3[] {
    const waypoints: THREE.Vector3[] = []
    const pointCount = 4

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2
      const x = center.x + Math.cos(angle) * radius
      const z = center.z + Math.sin(angle) * radius
      waypoints.push(new THREE.Vector3(x, 0, z))
    }

    return waypoints
  }

  // 检查玩家是否在敌人视野范围内
  private canSeePlayer(enemy: Enemy, playerPos: THREE.Vector3): boolean {
    const directionToPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position)
    const distance = directionToPlayer.length()

    // 距离检查
    if (distance > enemy.config.viewDistance) {
      return false
    }

    // 近距离感知：2.5单位内敌人能直接发现玩家（模拟听觉/直觉）
    if (distance < 2.5) {
      return true
    }

    // 角度检查
    directionToPlayer.normalize()
    const enemyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      enemy.mesh?.quaternion || new THREE.Quaternion()
    )

    // 如果没有mesh，使用默认朝向前方
    if (!enemy.mesh) {
      enemyForward.set(Math.sin(enemy.position.x * 0.1), 0, Math.cos(enemy.position.z * 0.1))
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, enemyForward.dot(directionToPlayer))))

    return angle < enemy.config.viewAngle / 2
  }

  // 更新所有敌人
  update(delta: number, playerPosition: THREE.Vector3, time: number) {
    if (!this.options) return

    const { onPlayerHit } = this.options
    this.lastPlayerPosition.copy(playerPosition)

    this.enemies.forEach(enemy => {
      if (enemy.isDead) return

      // BOSS 阶段转换检测：血量低于50%时进入狂暴阶段
      if (enemy.config.type === 'boss' && enemy.phase === 1 && enemy.health / enemy.maxHealth < 0.5) {
        enemy.phase = 2
        console.log(`BOSS ${enemy.id} 进入狂暴阶段！`)
      }

      // 状态机更新
      this.updateEnemyState(enemy, playerPosition, delta)

      // 行为更新
      this.updateEnemyBehavior(enemy, playerPosition, delta, time)

      // 处理蓄力攻击（精英）
      if (enemy.isCharging) {
        this.updateChargeAttack(enemy, playerPosition)
      }

      // BOSS 大招逻辑
      if (enemy.config.specialAttack) {
        this.updateBossSpecialAttack(enemy, playerPosition, time)
      }

      // 自爆兵逻辑
      if (enemy.config.type === 'exploder') {
        this.updateExploderBehavior(enemy, playerPosition, time)
      }

      // 治疗者逻辑
      if (enemy.config.type === 'healer') {
        this.updateHealerBehavior(enemy, time)
      }

      // 远程射击（追逐或攻击状态下，非蓄力中，非自爆兵非治疗者）
      if ((enemy.state === 'chase' || enemy.state === 'attack') && !enemy.isCharging
          && enemy.config.type !== 'exploder' && enemy.config.type !== 'healer') {
        this.tryShootPlayer(enemy, playerPosition, onPlayerHit)
      }

      // 更新模型位置
      if (enemy.mesh) {
        updateEnemyPosition(enemy)

        // 面向玩家（追逐状态）
        if (enemy.state === 'chase' || enemy.state === 'attack') {
          const lookTarget = new THREE.Vector3(playerPosition.x, enemy.position.y, playerPosition.z)
          enemy.mesh.lookAt(lookTarget)
        } else if (enemy.targetPosition) {
          // 面向移动方向
          const direction = new THREE.Vector3().subVectors(enemy.targetPosition, enemy.position).normalize()
          if (direction.length() > 0.01) {
            const angle = Math.atan2(direction.x, direction.z)
            enemy.mesh.rotation.y = angle
          }
        }
      }

      // 更新BOSS粒子特效
      updateBossEffects(enemy, time)

      // 更新自爆兵特效
      if (enemy.config.type === 'exploder' && !enemy.isExploding) {
        updateExploderEffects(enemy, time)
      }
    })

    // 批量更新所有敌人的血条（带重叠检测）
    if (this.healthBar) {
      const allEnemies: Enemy[] = []
      this.enemies.forEach(e => allEnemies.push(e))
      this.healthBar.updateAll(allEnemies)
    }
  }

  // 更新敌人状态
  private updateEnemyState(enemy: Enemy, playerPos: THREE.Vector3, delta: number) {
    const canSee = this.canSeePlayer(enemy, playerPos)

    switch (enemy.state) {
      case 'patrol':
        if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'wait':
        enemy.waitTime -= delta
        if (enemy.waitTime <= 0) {
          enemy.state = 'patrol'
        } else if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'chase':
        // 进入攻击距离后切换到攻击状态
        const distToPlayer = enemy.position.distanceTo(playerPos)
        const idealRange = enemy.config.type === 'boss' ? 10 : 5
        if (distToPlayer < idealRange) {
          enemy.state = 'attack'
        } else if (!canSee) {
          enemy.state = 'search'
          this.searchTimeout.set(enemy.id, Date.now())
        }
        break

      case 'search':
        // 5秒后恢复巡逻
        const searchStart = this.searchTimeout.get(enemy.id)
        if (searchStart && Date.now() - searchStart > 5000) {
          enemy.state = 'patrol'
          // 重新生成巡逻点
          enemy.waypoints = this.generateWaypoints(enemy.position, enemy.config.patrolRadius)
          enemy.currentWaypointIndex = 0
          this.searchTimeout.delete(enemy.id)
        } else if (canSee) {
          enemy.state = 'chase'
          this.searchTimeout.delete(enemy.id)
        }
        break

      case 'attack':
        // 玩家跑远了，重新追击
        const attackDist = enemy.position.distanceTo(playerPos)
        const chaseThreshold = enemy.config.type === 'boss' ? 15 : 8
        if (attackDist > chaseThreshold) {
          enemy.state = 'chase'
        } else if (!canSee) {
          enemy.state = 'search'
          this.searchTimeout.set(enemy.id, Date.now())
        }
        break
    }
  }

  // 更新敌人行为
  private updateEnemyBehavior(enemy: Enemy, playerPos: THREE.Vector3, delta: number, time: number) {
    const speed = enemy.config.moveSpeed

    switch (enemy.state) {
      case 'patrol':
        playWalkAnimation(enemy, time)
        if (enemy.waypoints.length > 0) {
          const target = enemy.waypoints[enemy.currentWaypointIndex]
          const distance = enemy.position.distanceTo(target)

          if (distance < 0.5) {
            // 到达路点，等待
            enemy.state = 'wait'
            enemy.waitTime = 1 + Math.random() * 2 // 1-3秒
            enemy.currentWaypointIndex = (enemy.currentWaypointIndex + 1) % enemy.waypoints.length
          } else {
            // 移动向下一个路点
            const direction = new THREE.Vector3().subVectors(target, enemy.position).normalize()
            enemy.position.add(direction.multiplyScalar(speed * delta))
          }
        }
        break

      case 'wait':
        playIdleAnimation(enemy, time)
        break

      case 'chase':
        playChaseAnimation(enemy, time)
        // 追逐玩家
        const chaseDirection = new THREE.Vector3().subVectors(playerPos, enemy.position)
        chaseDirection.y = 0 // 保持在地上
        chaseDirection.normalize()
        enemy.position.add(chaseDirection.multiplyScalar(speed * 1.5 * delta))
        break

      case 'search':
        playIdleAnimation(enemy, time)
        // 在当前位置等待或缓慢移动
        break

      case 'attack':
        playChaseAnimation(enemy, time)
        // 与玩家保持理想距离，围绕玩家侧移
        const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position)
        toPlayer.y = 0
        const attackDistance = toPlayer.length()
        const idealDistance = enemy.config.type === 'boss' ? 10 : 5
        if (attackDistance > idealDistance + 2) {
          // 太远，拉近
          toPlayer.normalize()
          enemy.position.add(toPlayer.multiplyScalar(speed * 0.8 * delta))
        } else if (attackDistance < idealDistance - 2) {
          // 太近，后退
          toPlayer.normalize()
          enemy.position.add(toPlayer.multiplyScalar(-speed * 0.6 * delta))
        } else {
          // 在理想距离，侧向移动躲避
          const strafeDir = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize()
          enemy.position.add(strafeDir.multiplyScalar(speed * 0.4 * Math.sin(time * 0.002) * delta))
        }
        break
    }
  }

  // ========== 自爆兵行为 ==========

  /** 更新自爆兵行为 */
  private updateExploderBehavior(enemy: Enemy, playerPosition: THREE.Vector3, time: number): void {
    if (enemy.isExploding) {
      // 预警阶段：更新特效，检测是否到达爆炸时间
      updateExploderEffects(enemy, time)
      const now = Date.now()
      if (now - enemy.explosionStartTime >= (enemy.config.explosionWarningDuration || 1000)) {
        this.triggerExplosion(enemy)
      }
      return
    }

    // 非预警状态：检测是否靠近玩家
    const distance = enemy.position.distanceTo(playerPosition)
    const triggerDistance = enemy.config.explosionTriggerDistance || 2

    if (distance <= triggerDistance && enemy.state === 'chase') {
      // 进入预警状态
      enemy.isExploding = true
      enemy.explosionStartTime = Date.now()
      enemy.state = 'attack'
    }
  }

  /** 触发自爆 */
  private triggerExplosion(enemy: Enemy): void {
    if (!this.options || enemy.isDead) return

    const { onPlayerHit } = this.options
    const distance = enemy.position.distanceTo(this.lastPlayerPosition)
    const explosionRadius = enemy.config.explosionRadius || 3

    // 对玩家造成伤害（距离衰减）
    if (distance <= explosionRadius) {
      const damageScale = 1 - (distance / explosionRadius) * 0.5 // 中心100%，边缘50%
      const damage = Math.round((enemy.config.damage || 40) * damageScale)
      onPlayerHit(damage)
    }

    // 自爆兵死亡
    enemy.health = 0
    enemy.isDead = true
    enemy.state = 'dead'

    // 播放死亡动画
    if (enemy.mesh) {
      playDeathAnimation(enemy, () => {
        if (this.scene && enemy.mesh) {
          this.scene.remove(enemy.mesh)
        }
      })
    }

    // 通知击杀
    if (this.options && this.options.onEnemyDead) {
      this.options.onEnemyDead(enemy)
    }
  }

  // ========== 治疗者行为 ==========

  /** 更新治疗者行为 */
  private updateHealerBehavior(enemy: Enemy, time: number): void {
    if (enemy.isDead) return

    // 更新治疗者特效
    updateHealerEffects(enemy, time)

    // 检查治疗冷却
    const healInterval = enemy.config.healInterval || 3000
    const now = Date.now()
    if (now - enemy.lastHealTime < healInterval) return

    // 检测周围友军
    const healRadius = enemy.config.healRadius || 8
    const healAmount = enemy.config.healAmount || 20

    this.enemies.forEach(other => {
      if (other.isDead || other.id === enemy.id) return
      if (other.config.type === 'healer') return // 治疗者不互相治疗

      const distance = other.position.distanceTo(enemy.position)
      if (distance <= healRadius && other.health < other.maxHealth) {
        // 恢复血量
        other.health = Math.min(other.maxHealth, other.health + healAmount)
        // 创建治疗粒子特效
        createHealParticles(enemy)
      }
    })

    enemy.lastHealTime = now
  }

  // 尝试远程射击玩家（弹道投射物模式）
  private tryShootPlayer(enemy: Enemy, playerPosition: THREE.Vector3, _onPlayerHit: (damage: number) => void) {
    const now = Date.now()
    const config = enemy.config

    // 冷却检查（使用敌人自身配置的 attackInterval）
    if (now - enemy.lastAttackTime < config.attackInterval) {
      return
    }

    // 检查是否可以射击（距离、角度）
    if (!enemyShooter.canShoot(enemy, playerPosition)) {
      return
    }

    // 精英：进入蓄力状态
    if (config.type === 'elite') {
      this.startChargeAttack(enemy, playerPosition)
      return
    }

    // 小兵 / BOSS：直接发射子弹
    this.fireProjectile(enemy, playerPosition)
    enemy.lastAttackTime = now
  }

  /** 发射一颗子弹 */
  private fireProjectile(enemy: Enemy, playerPosition: THREE.Vector3): void {
    if (!this.projectileManager) return

    const config = enemy.config
    const spawnPos = enemy.position.clone().add(new THREE.Vector3(0, 1, 0))
    const direction = new THREE.Vector3().subVectors(playerPosition, spawnPos).normalize()

    this.projectileManager.spawn({
      position: spawnPos,
      direction,
      speed: config.projectileSpeed,
      damage: config.damage,
      visual: config.projectileVisual,
      ownerId: enemy.id,
      spreadAngle: config.projectileSpread,
    })
  }

  // ========== 精英蓄力攻击 ==========

  /** 开始蓄力攻击 */
  private startChargeAttack(enemy: Enemy, playerPosition: THREE.Vector3): void {
    enemy.isCharging = true
    enemy.chargeStartTime = Date.now()

    // 创建蓄力瞄准线
    if (enemy.mesh && this.scene) {
      const startPos = enemy.position.clone().add(new THREE.Vector3(0, 1, 0))
      const dir = new THREE.Vector3().subVectors(playerPosition, enemy.position)
      const endPos = startPos.clone().add(dir.normalize().multiplyScalar(20))

      const points = [startPos, endPos]
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xFF3333,
        transparent: true,
        opacity: 0.6,
        linewidth: 1,
      })
      enemy.chargeLine = new THREE.Line(lineGeom, lineMat)
      this.scene.add(enemy.chargeLine)
    }
  }

  /** 更新蓄力攻击状态 */
  private updateChargeAttack(enemy: Enemy, playerPosition: THREE.Vector3): void {
    const now = Date.now()
    const chargeDuration = now - enemy.chargeStartTime

    // 更新瞄准线方向
    if (enemy.chargeLine) {
      const startPos = enemy.position.clone().add(new THREE.Vector3(0, 1, 0))
      const dir = new THREE.Vector3().subVectors(playerPosition, enemy.position)
      const endPos = startPos.clone().add(dir.normalize().multiplyScalar(20))
      const positions = (enemy.chargeLine.geometry as THREE.BufferGeometry).attributes.position
      positions.setXYZ(0, startPos.x, startPos.y, startPos.z)
      positions.setXYZ(1, endPos.x, endPos.y, endPos.z)
      positions.needsUpdate = true

      // 蓄力进度让瞄准线闪烁
      const progress = chargeDuration / 1500
      if (progress > 0.7) {
        (enemy.chargeLine.material as THREE.LineBasicMaterial).opacity = 0.4 + Math.sin(now * 0.02) * 0.3
      }
    }

    // 检查玩家是否逃出射程
    if (!enemyShooter.canShoot(enemy, playerPosition)) {
      this.cancelChargeAttack(enemy)
      return
    }

    // 蓄力完成（1500ms）
    if (chargeDuration >= 1500) {
      this.fireProjectile(enemy, playerPosition)
      enemy.lastAttackTime = now
      this.cancelChargeAttack(enemy)
    }
  }

  /** 取消蓄力攻击 */
  private cancelChargeAttack(enemy: Enemy): void {
    enemy.isCharging = false
    enemy.chargeStartTime = 0

    // 移除瞄准线
    if (enemy.chargeLine && this.scene) {
      this.scene.remove(enemy.chargeLine)
      enemy.chargeLine.geometry.dispose()
      ;(enemy.chargeLine.material as THREE.Material).dispose()
      enemy.chargeLine = null
    }
  }

  // ========== BOSS 大招 ==========

  /** 更新 BOSS 大招逻辑 */
  private updateBossSpecialAttack(enemy: Enemy, playerPosition: THREE.Vector3, _time: number): void {
    const special = enemy.config.specialAttack
    if (!special) return

    const now = Date.now()

    // 如果预警圆环存在，每帧更新扩散动画
    if (enemy.warningRing) {
      const elapsed = now - enemy.lastSpecialAttackTime
      const progress = Math.min(elapsed / special.warningDuration, 1)
      const currentRadius = 0.3 + progress * (1.5 - 0.3)
      enemy.warningRing.geometry.dispose()
      enemy.warningRing.geometry = new THREE.RingGeometry(0.3, currentRadius, 32)
      return
    }

    // 检查大招冷却
    if (now - enemy.lastSpecialAttackTime >= special.cooldown) {
      // 检查是否在射击范围内
      if (enemyShooter.canShoot(enemy, playerPosition)) {
        this.startBossSpecialAttack(enemy)
      }
    }
  }

  /** 开始 BOSS 大招（预警） */
  private startBossSpecialAttack(enemy: Enemy): void {
    const special = enemy.config.specialAttack!
    enemy.lastSpecialAttackTime = Date.now() // 进入冷却

    // 创建地面预警圆环
    if (this.scene) {
      const ringGeom = new THREE.RingGeometry(0.3, 0.5, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF3333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
      enemy.warningRing = new THREE.Mesh(ringGeom, ringMat)
      enemy.warningRing.rotation.x = -Math.PI / 2
      enemy.warningRing.position.copy(enemy.position)
      enemy.warningRing.position.y = 0.05
      this.scene.add(enemy.warningRing)
    }

    // 2 秒后发射弹幕
    setTimeout(() => {
      this.fireBossFanAttack(enemy)
    }, special.warningDuration)
  }

  /** BOSS 扇形弹幕发射 */
  private fireBossFanAttack(enemy: Enemy): void {
    if (enemy.isDead || !this.projectileManager) return

    // 清理预警圆环
    if (enemy.warningRing && this.scene) {
      this.scene.remove(enemy.warningRing)
      enemy.warningRing.geometry.dispose()
      ;(enemy.warningRing.material as THREE.Material).dispose()
      enemy.warningRing = null
    }

    // 如果玩家在预警期间逃远了，不发射
    const playerPos = this.lastPlayerPosition
    if (!enemyShooter.canShoot(enemy, playerPos)) return

    const spawnPos = enemy.position.clone().add(new THREE.Vector3(0, 1, 0))
    const direction = new THREE.Vector3().subVectors(playerPos, spawnPos).normalize()

    const special = enemy.config.specialAttack!
    const count = special.projectileCount
    const fanAngle = special.fanAngle

    for (let i = 0; i < count; i++) {
      // 在扇形范围内均匀分布
      const angleOffset = (i / (count - 1) - 0.5) * (fanAngle * Math.PI / 180)
      const dir = direction.clone()
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset)

      this.projectileManager!.spawn({
        position: spawnPos,
        direction: dir,
        speed: enemy.config.projectileSpeed,
        damage: enemy.config.damage,
        visual: enemy.config.projectileVisual,
        ownerId: enemy.id,
        spreadAngle: 0, // 弹幕不额外散布，角度已由扇形控制
      })
    }
  }

  // 敌人受伤
  enemyHit(enemyId: string, damage: number): { killed: boolean; damageDealt: number } {
    const enemy = this.enemies.get(enemyId)
    if (!enemy || enemy.isDead) {
      return { killed: false, damageDealt: 0 }
    }

    enemy.health -= damage

    // 播放被击中动画
    if (enemy.mesh) {
      playHitAnimation(enemy)
    }

    // 显示伤害数字
    if (this.healthBar) {
      const isCritical = damage >= enemy.config.damage * 2
      this.healthBar.showDamage(enemy, damage, isCritical)
    }

    let killed = false
    if (enemy.health <= 0) {
      enemy.health = 0
      enemy.isDead = true
      enemy.state = 'dead'
      killed = true

      // 播放死亡动画
      if (enemy.mesh) {
        playDeathAnimation(enemy, () => {
          // 动画完成后移除
          if (this.scene && enemy.mesh) {
            this.scene.remove(enemy.mesh)
          }
        })
      }

      // 通知击杀
      if (this.options && this.options.onEnemyDead) {
        this.options.onEnemyDead(enemy)
      }
    }

    return { killed, damageDealt: damage }
  }

  // 获取所有敌人
  getEnemies(): Enemy[] {
    return Array.from(this.enemies.values())
  }

  // 获取活着的敌人
  getActiveEnemies(): Enemy[] {
    return this.getEnemies().filter(e => !e.isDead)
  }

  // 获取血条数量
  getHealthBarCount(): number {
    return this.healthBar ? (this.healthBar as any).healthBars?.size || 0 : 0
  }

  // 清理
  clear() {
    this.enemies.forEach(enemy => {
      // 清理蓄力瞄准线
      if (enemy.chargeLine) {
        if (this.scene) this.scene.remove(enemy.chargeLine)
        enemy.chargeLine.geometry.dispose()
        ;(enemy.chargeLine.material as THREE.Material).dispose()
        enemy.chargeLine = null
      }
      // 清理 BOSS 预警圆环
      if (enemy.warningRing) {
        if (this.scene) this.scene.remove(enemy.warningRing)
        enemy.warningRing.geometry.dispose()
        ;(enemy.warningRing.material as THREE.Material).dispose()
        enemy.warningRing = null
      }
      if (enemy.mesh && this.scene) {
        this.scene.remove(enemy.mesh)
      }
    })
    this.enemies.clear()
    this.searchTimeout.clear()
    this.healthBar?.clear()
    this.projectileManager?.clear()
  }
}

export const enemyAI = new EnemyAI()