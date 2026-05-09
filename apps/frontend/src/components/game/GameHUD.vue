<script setup lang="ts">
import { computed } from 'vue'
import { useWeaponStore } from '@/stores/weapon'
import { useBuffsStore } from '@/stores/buffs'
import { DEFAULT_WEAPONS } from '@/game/weapons/types'

const emit = defineEmits<{
  exit: []
}>()

const weaponStore = useWeaponStore()
const buffsStore = useBuffsStore()

const props = defineProps<{
  healthPercent: number
  score: number
  kills: number
  currentWave: number
  waveProgressText: string
  isBossWave: boolean
  waveState: 'spawning' | 'active' | 'intermission'
  intermissionCountdown: number
  activeBuffs: Array<{ type: string; duration: number }>
  currentWeaponIndex: number
  currentWeaponName: string
  ammoDisplay: string
  isReloading: boolean
  isHoldingBreath: boolean
  breathStamina: number
  maxBreathStamina: number
  isScopeActive: boolean
}>()

const currentScope = computed(() => weaponStore.currentScope)

const breathBarStyle = computed(() => ({
  width: props.breathStamina + '%',
}))
</script>

<template>
  <div class="hud">
    <div class="hud-top">
      <div class="health-bar">
        <div class="health-frame">
          <div class="health-icon" :class="{ 'danger-pulse': healthPercent <= 20 }">❤️</div>
          <div class="bar">
            <div class="bar-bg"></div>
            <div
              class="fill"
              :class="{
                warning: healthPercent <= 50 && healthPercent > 20,
                danger: healthPercent <= 20
              }"
              :style="{ width: healthPercent + '%' }"
            >
              <div class="fill-gloss"></div>
              <div class="fill-particles"></div>
            </div>
            <div class="bar-shimmer"></div>
            <div class="health-value" :class="{ 'danger-text': healthPercent <= 20 }">
              <span class="health-number">{{ Math.round(healthPercent) }}</span>
              <span class="health-unit">%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="score-panel score">
        <div class="score-item">
          <span class="score-icon">⭐</span>
          <span class="score-value">{{ score }}</span>
        </div>
        <div class="score-item kills-item kills">
          <span class="score-icon">⚔️</span>
          <span class="score-value">{{ kills }}</span>
        </div>
        <button class="exit-btn" @click.stop="emit('exit')">退出游戏</button>
      </div>
      <!-- 屏息体力条 -->
      <div v-if="breathStamina < maxBreathStamina" class="breath-bar">
        <div class="breath-fill" :style="breathBarStyle" :class="{ low: breathStamina < 20 }"></div>
        <span class="breath-label" v-if="isHoldingBreath">屏息中...</span>
      </div>
    </div>

    <!-- 波次显示 -->
    <div class="wave-display" :class="{ 'boss-wave': isBossWave }">
      <span class="wave-icon">{{ isBossWave ? '👑' : '⚔️' }}</span>
      <span class="wave-text">{{ waveProgressText }}</span>
    </div>

    <!-- Buff 状态图标 -->
    <div v-if="activeBuffs.length > 0" class="buff-bar">
      <div
        v-for="buff in activeBuffs"
        :key="buff.type"
        class="buff-icon"
        :data-buff-type="buff.type"
      >
        <span class="buff-emoji">{{ buff.type === 'doubleDamage' ? '⚡' : '✨' }}</span>
        <span class="buff-timer">{{ buffsStore.getBuffRemaining(buff.type) }}s</span>
      </div>
    </div>

    <!-- 波次间歇倒计时 -->
    <transition name="wave-countdown">
      <div v-if="waveState === 'intermission'" class="wave-intermission">
        <div class="intermission-content">
          <div class="intermission-label">第 {{ currentWave + 1 }} 波即将开始</div>
          <div class="intermission-countdown">{{ Math.ceil(intermissionCountdown) }}</div>
          <div class="intermission-hint">按 空格键 跳过</div>
        </div>
      </div>
    </transition>

    <!-- Crosshair -->
    <div class="crosshair" :class="{ 'scope-active': isScopeActive }">
      <span v-if="!isScopeActive" class="crosshair-clover"></span>
      <span v-if="isScopeActive" class="scope-cross">
        <span class="scope-line horizontal"></span>
        <span class="scope-line vertical"></span>
      </span>
    </div>

    <div class="hud-bottom">
      <!-- Weapon indicator -->
      <div class="weapon-indicator">
        <div
          v-for="(weapon, index) in DEFAULT_WEAPONS"
          :key="weapon.id"
          class="weapon-slot"
          :class="{ active: currentWeaponIndex === index }"
        >
          {{ index + 1 }}
        </div>
      </div>

      <div class="weapon-info">
        <span class="weapon-name">{{ currentWeaponName }}</span>
        <span class="ammo" :class="{ 'low-ammo': weaponStore.currentAmmo.current <= 5, 'reloading': isReloading }">
          <template v-if="isReloading">换弹中...</template>
          <template v-else>{{ ammoDisplay }}</template>
        </span>
      </div>
    </div>

    <div class="controls-hint">
      <p>WASD 移动 | 鼠标控制视角 | 1-6/Q 切换武器 | R 换弹 | 右键倍镜</p>
    </div>
  </div>
</template>

<style scoped>
/* ===== HUD 主容器 ===== */
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 16px;
}

/* ===== 顶部 HUD ===== */
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

/* 血量条 - 木质框 + 液体 */
.health-bar {
  flex: 0 0 auto;
}

.health-frame {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(62, 39, 35, 0.85), rgba(93, 64, 55, 0.75));
  border: 2px solid rgba(139, 195, 74, 0.5);
  border-radius: 24px;
  padding: 6px 14px 6px 8px;
  backdrop-filter: blur(8px);
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.health-icon {
  font-size: 24px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
}

.health-icon.danger-pulse {
  animation: heart-pulse 0.6s ease-in-out infinite;
}

@keyframes heart-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.health-bar .bar {
  flex: 1;
  height: 24px;
  min-width: 120px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(139, 195, 74, 0.25);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}

.bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
}

.health-bar .fill {
  height: 100%;
  background: linear-gradient(180deg, #81C784 0%, #66BB6A 40%, #43A047 100%);
  border-radius: 12px;
  transition: width 0.25s ease-out, background 0.3s ease-out;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    0 0 8px rgba(102, 187, 106, 0.3);
}

.fill-gloss {
  position: absolute;
  top: 2px;
  left: 4px;
  right: 4px;
  height: 6px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 6px;
}

.fill-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 1px, transparent 1px),
                    radial-gradient(circle at 80% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
                    radial-gradient(circle at 50% 70%, rgba(255,255,255,0.12) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: particles-shimmer 2s linear infinite;
}

@keyframes particles-shimmer {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

/* 血量数值显示 */
.health-value {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  align-items: baseline;
  gap: 1px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.health-number {
  font-size: 13px;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #FFF;
}

.health-unit {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.health-value.danger-text .health-number {
  color: #FFEB3B;
  animation: danger-text-pulse 0.5s ease-in-out infinite;
}

@keyframes danger-text-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 血量变黄 */
.health-bar .fill.warning {
  background: linear-gradient(180deg, #FFD54F 0%, #FFB300 40%, #FF8F00 100%);
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.35),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    0 0 12px rgba(255, 179, 0, 0.5);
}

/* 血量变红 + 裂纹闪烁 */
.health-bar .fill.danger {
  background: linear-gradient(180deg, #EF5350 0%, #E53935 40%, #C62828 100%);
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    0 0 16px rgba(229, 57, 53, 0.6);
  animation: health-danger-glow 0.6s ease-in-out infinite;
}

@keyframes health-danger-glow {
  0%, 100% {
    filter: brightness(1);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2),
      0 0 16px rgba(229, 57, 53, 0.6);
  }
  50% {
    filter: brightness(1.2);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2),
      0 0 24px rgba(229, 57, 53, 0.8);
  }
}

/* 血量条光泽条纹 */
.bar-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 40%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.08) 60%,
    transparent 100%
  );
  z-index: 2;
  pointer-events: none;
}

/* 得分面板 */
.score-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(255, 179, 0, 0.35);
  border-radius: 14px;
  padding: 4px 14px;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.score-icon {
  font-size: 18px;
}

.score-value {
  color: #FFD54F;
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.kills-item .score-value {
  color: #EF5350;
}

.exit-btn {
  padding: 6px 16px;
  background: rgba(229, 57, 53, 0.85);
  color: #FFF8E1;
  border-radius: 14px;
  font-weight: 700;
  font-size: 14px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid rgba(255, 205, 210, 0.3);
  align-self: flex-end;
}

.exit-btn:hover {
  background: #E53935;
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(229, 57, 53, 0.4);
}

/* 屏息体力条 */
.breath-bar {
  position: relative;
  width: 140px;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
  border: 1px solid rgba(129, 212, 250, 0.3);
}

.breath-fill {
  height: 100%;
  background: linear-gradient(90deg, #29B6F6, #4FC3F7);
  border-radius: 4px;
  transition: width 0.1s ease-out;
}

.breath-fill.low {
  background: linear-gradient(90deg, #E53935, #FF9800);
}

.breath-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  color: #4FC3F7;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* ===== 准星 - 四叶草风格 ===== */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-clover {
  display: block;
  width: 20px;
  height: 20px;
  position: relative;
}

.crosshair-clover::before,
.crosshair-clover::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-clover::before {
  width: 18px;
  height: 1.5px;
}

.crosshair-clover::after {
  width: 1.5px;
  height: 18px;
}

/* 准星中心点 */
.crosshair-dot {
  display: block;
  width: 5px;
  height: 5px;
  background: rgba(76, 175, 80, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.crosshair.scope-active .scope-cross {
  position: relative;
  display: block;
  width: 60px;
  height: 60px;
}

.scope-line {
  position: absolute;
  background: rgba(200, 230, 201, 0.95);
}

.scope-line.horizontal {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.scope-line.vertical {
  width: 1px;
  height: 100%;
  left: 50%;
  top: 0;
}

/* ===== 底部 HUD ===== */
.hud-bottom {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.weapon-indicator {
  display: flex;
  gap: 6px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 12px;
  padding: 6px 10px;
  backdrop-filter: blur(6px);
}

.weapon-slot {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-mono);
  transition: all 0.2s;
}

.weapon-slot.active {
  background: linear-gradient(135deg, rgba(255, 179, 0, 0.8), rgba(255, 143, 0, 0.8));
  border-color: #FFD54F;
  color: #3E2723;
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(255, 179, 0, 0.5);
}

.weapon-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  background: rgba(62, 39, 35, 0.7);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 12px;
  padding: 4px 14px;
  backdrop-filter: blur(6px);
}

.weapon-name {
  color: #C8E6C9;
  font-size: 15px;
  font-weight: 600;
}

.ammo {
  color: #FFF8E1;
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ammo.low-ammo {
  color: #FF5252;
  animation: low-ammo-pulse 0.4s ease-in-out infinite;
}

@keyframes low-ammo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.ammo.reloading {
  color: #FFB300;
  animation: reload-spin 1s linear infinite;
}

@keyframes reload-spin {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(200, 230, 201, 0.45);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ===== 波次 ===== */
.wave-display {
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(62, 39, 35, 0.75);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(139, 195, 74, 0.35);
  border-radius: 24px;
  padding: 6px 20px;
  pointer-events: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.wave-display.boss-wave {
  border-color: rgba(255, 179, 0, 0.7);
  box-shadow: 0 0 18px rgba(255, 179, 0, 0.35);
}

.wave-icon {
  font-size: 22px;
}

.wave-text {
  color: #FFF8E1;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ===== Buff 状态栏 ===== */
.buff-bar {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  pointer-events: none;
}

.buff-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(62, 39, 35, 0.7);
  backdrop-filter: blur(6px);
  border-radius: 12px;
  padding: 5px 12px;
  border: 2px solid rgba(255, 179, 0, 0.5);
  min-width: 50px;
  box-shadow: 0 0 10px rgba(255, 179, 0, 0.2);
}

.buff-icon[data-buff-type="doubleDamage"] {
  border-color: rgba(255, 152, 0, 0.7);
  box-shadow: 0 0 14px rgba(255, 152, 0, 0.3);
}

.buff-emoji {
  font-size: 22px;
  line-height: 1.1;
}

.buff-timer {
  color: #FFD54F;
  font-size: 11px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* ===== 波次间歇 ===== */
.wave-intermission {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.intermission-content {
  background: rgba(46, 125, 50, 0.8);
  backdrop-filter: blur(14px);
  border: 2px solid rgba(139, 195, 74, 0.4);
  border-radius: 24px;
  padding: 36px 56px;
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.intermission-label {
  color: #C8E6C9;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.intermission-countdown {
  font-size: 80px;
  font-weight: 800;
  font-family: var(--font-display);
  color: #FFD54F;
  text-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(255, 215, 0, 0.4);
  line-height: 1;
  margin-bottom: 8px;
  animation: glow-pulse 1s infinite;
}

.intermission-hint {
  color: rgba(200, 230, 201, 0.6);
  font-size: 14px;
}

.wave-countdown-enter-active,
.wave-countdown-leave-active {
  transition: opacity 0.3s ease;
}

.wave-countdown-enter-from,
.wave-countdown-leave-to {
  opacity: 0;
}
</style>
