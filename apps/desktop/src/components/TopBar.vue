<template>
  <div class="h-8 bg-black/20 backdrop-blur-md flex items-center justify-between px-4 text-white text-sm">
    <!-- 左侧Logo -->
    <div class="flex items-center space-x-2">
      <LIcon name="home" size="small" />
      <span class="font-medium">玲珑OS</span>
    </div>
    
    <!-- 中央时钟 -->
    <div class="flex items-center space-x-4">
      <span>{{ currentTime }}</span>
    </div>
    
    <!-- 右侧系统托盘 -->
    <div class="flex items-center space-x-2">
      <!-- 网络状态 -->
      <div class="tooltip" data-tooltip="网络连接正常">
        <LIcon name="wifi" size="small" class="text-green-400" />
      </div>
      
      <!-- 通知 -->
      <div class="tooltip" data-tooltip="通知" @click="toggleNotifications">
        <LIcon name="bell" size="small" class="cursor-pointer hover:text-blue-400" />
      </div>
      
      <!-- 用户菜单 -->
      <div class="relative">
        <div 
          class="flex items-center space-x-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded"
          @click="toggleUserMenu"
        >
          <img 
            :src="user?.avatar || '/default-avatar.png'" 
            :alt="user?.username"
            class="w-5 h-5 rounded-full"
          />
          <span>{{ user?.username }}</span>
          <LIcon name="chevron-down" size="small" />
        </div>
        
        <!-- 用户菜单下拉 -->
        <div 
          v-if="showUserMenu"
          class="absolute right-0 top-full mt-1 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 py-2 z-50"
        >
          <div class="px-4 py-2 border-b border-gray-200">
            <div class="font-medium text-gray-900">{{ user?.username }}</div>
            <div class="text-sm text-gray-500">{{ user?.email }}</div>
          </div>
          
          <button 
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            @click="openSettings"
          >
            <LIcon name="settings" size="small" />
            <span>设置</span>
          </button>
          
          <button 
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            @click="openAbout"
          >
            <LIcon name="info" size="small" />
            <span>关于</span>
          </button>
          
          <div class="border-t border-gray-200 mt-2 pt-2">
            <button 
              class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
              @click="handleLogout"
            >
              <LIcon name="logout" size="small" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LIcon } from '@linglongos/ui'
import { useAuthStore } from '../stores/auth'
import { useWindowStore } from '../stores/window'

const authStore = useAuthStore()
const windowStore = useWindowStore()

// 状态
const currentTime = ref('')
const showUserMenu = ref(false)
const showNotifications = ref(false)

// 计算属性
const user = computed(() => authStore.user)

// 定时器
let timeInterval: NodeJS.Timeout

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  // 点击外部关闭菜单
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  document.removeEventListener('click', handleClickOutside)
})

/**
 * 更新时间
 */
const updateTime = (): void => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 切换用户菜单
 */
const toggleUserMenu = (): void => {
  showUserMenu.value = !showUserMenu.value
  showNotifications.value = false
}

/**
 * 切换通知面板
 */
const toggleNotifications = (): void => {
  showNotifications.value = !showNotifications.value
  showUserMenu.value = false
}

/**
 * 处理外部点击
 */
const handleClickOutside = (event: Event): void => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserMenu.value = false
    showNotifications.value = false
  }
}

/**
 * 打开设置
 */
const openSettings = (): void => {
  windowStore.openApp('settings')
  showUserMenu.value = false
}

/**
 * 打开关于
 */
const openAbout = (): void => {
  // 这里可以打开关于对话框
  console.log('打开关于页面')
  showUserMenu.value = false
}

/**
 * 处理退出登录
 */
const handleLogout = (): void => {
  authStore.logout()
  showUserMenu.value = false
  // 刷新页面回到登录界面
  location.reload()
}
</script>