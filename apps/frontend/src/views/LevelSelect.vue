<template>
  <div class="game-container">
    <LevelSelect />
  </div>
</template>

<script setup>
import LevelSelect from '../components/LevelSelect.vue'
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>