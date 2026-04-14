import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DEFAULT_WEAPONS, type WeaponData, type AmmoData, type ScopeData, SCOPES } from '@/game/weapons/types'

export const useWeaponStore = defineStore('weapon', () => {
  // Weapon list
  const weapons = ref<WeaponData[]>([...DEFAULT_WEAPONS])

  // Current weapon index
  const currentWeaponIndex = ref(0)

  // Ammo state
  const ammo = ref<Map<string, AmmoData>>(new Map([
    ['pistol', { current: 12, reserve: 48, maxReserve: 120 }],
    ['smg', { current: 50, reserve: 150, maxReserve: 300 }],
    ['rifle', { current: 30, reserve: 90, maxReserve: 180 }],
    ['sniper', { current: 5, reserve: 15, maxReserve: 30 }],
    ['shotgun', { current: 6, reserve: 24, maxReserve: 48 }],
  ]))

  // Scope state
  const currentScope = ref<ScopeData>({
    isActive: false,
    magnification: 1,
    originalFov: 75,
  })

  // Reload state
  const isReloading = ref(false)

  // Computed properties
  const currentWeapon = computed(() => weapons.value[currentWeaponIndex.value])

  const currentAmmo = computed(() => {
    const weapon = currentWeapon.value
    return ammo.value.get(weapon.id) || { current: 0, reserve: 0, maxReserve: 0 }
  })

  // Actions
  const switchWeapon = (index: number) => {
    if (index >= 0 && index < weapons.value.length && !isReloading.value) {
      currentWeaponIndex.value = index
    }
  }

  const cycleWeapon = () => {
    if (isReloading.value) return
    currentWeaponIndex.value = (currentWeaponIndex.value + 1) % weapons.value.length
  }

  const fire = (): boolean => {
    const weapon = currentWeapon.value
    const weaponAmmo = currentAmmo.value

    if (isReloading.value || weaponAmmo.current <= 0) {
      return false
    }

    // Decrease ammo
    weaponAmmo.current--
    ammo.value.set(weapon.id, { ...weaponAmmo })

    return true
  }

  const reload = async () => {
    const weapon = currentWeapon.value
    const weaponAmmo = currentAmmo.value

    if (isReloading.value) return
    if (weaponAmmo.current === weapon.magazineSize) return
    if (weaponAmmo.reserve <= 0) return

    isReloading.value = true

    // Wait for reload time
    await new Promise((resolve) => setTimeout(resolve, weapon.reloadTime))

    // Calculate ammo needed
    const needed = weapon.magazineSize - weaponAmmo.current
    const available = Math.min(needed, weaponAmmo.reserve)

    weaponAmmo.current += available
    weaponAmmo.reserve -= available

    ammo.value.set(weapon.id, { ...weaponAmmo })
    isReloading.value = false
  }

  const toggleScope = () => {
    const weapon = currentWeapon.value

    if (!weapon.scope) return

    currentScope.value.isActive = !currentScope.value.isActive
    currentScope.value.magnification = currentScope.value.isActive
      ? weapon.scopeMultiplier
      : 1
  }

  const setScope = (scopeId: keyof typeof SCOPES) => {
    const scope = SCOPES[scopeId]
    currentScope.value.magnification = scope.magnification
  }

  return {
    weapons,
    currentWeaponIndex,
    currentWeapon,
    ammo,
    currentAmmo,
    currentScope,
    isReloading,
    switchWeapon,
    cycleWeapon,
    fire,
    reload,
    toggleScope,
    setScope,
  }
})