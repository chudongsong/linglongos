<template>
  <div id="app" class="min-h-screen bg-background text-foreground">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * 应用根组件
 * @description 应用的主入口组件，包含路由视图
 */
</script>

<style scoped>
/* 应用根样式 */
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>