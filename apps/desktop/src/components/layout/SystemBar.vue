<template>
  <div class="system-bar">
    <!-- 系统时间 -->
    <div class="system-time">
      {{ currentTime }}
    </div>
    
    <!-- 系统状态 -->
    <div class="system-status">
      <!-- 网络状态 -->
      <div class="status-item" :class="{ connected: isOnline }">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2,17H22V16L19.5,14.5C19.2,14.2 18.8,14.2 18.5,14.5L16,16L13.5,14.5C13.2,14.2 12.8,14.2 12.5,14.5L10,16L7.5,14.5C7.2,14.2 6.8,14.2 6.5,14.5L4,16L2,17Z"/>
        </svg>
      </div>
      
      <!-- 通知按钮 -->
      <button class="status-item notification-btn" @click="toggleNotifications">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"/>
        </svg>
        <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const isOnline = ref(navigator.onLine)
const notificationCount = ref(0)

let timeInterval: number

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function toggleNotifications() {
  // TODO: 实现通知中心
  console.log('Toggle notifications')
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  // 监听网络状态
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.system-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: white;
  font-size: 12px;
  z-index: 1000;
}

.system-time {
  font-weight: 500;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;
}

.status-item.connected {
  color: #10b981;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.notification-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>