<template>
  <div id="app" class="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
    <!-- 登录页面 -->
    <LoginView v-if="!isAuthenticated" @login="handleLogin" />
    
    <!-- 主桌面 -->
    <DesktopView v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginView from './views/LoginView.vue'
import DesktopView from './views/DesktopView.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const isAuthenticated = ref(false)

onMounted(() => {
  // 检查是否已登录
  isAuthenticated.value = authStore.checkAuth()
})

const handleLogin = (): void => {
  isAuthenticated.value = true
}
</script>

<style scoped>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>