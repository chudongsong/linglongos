<template>
  <div class="h-12 bg-black/30 backdrop-blur-md flex items-center justify-center px-4">
    <div class="flex items-center space-x-2">
      <!-- 开始按钮 -->
      <button
        class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        @click="toggleStartMenu"
      >
        <LIcon name="home" size="small" />
        <span class="text-sm">开始</span>
      </button>
      
      <!-- 应用图标 -->
      <div class="flex items-center space-x-1">
        <button
          v-for="window in visibleWindows"
          :key="window.id"
          :class="[
            'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white text-sm',
            window.isActive 
              ? 'bg-blue-500/50 border border-blue-400/50' 
              : 'bg-white/10 hover:bg-white/20'
          ]"
          @click="handleWindowClick(window)"
        >
          <LIcon :name="getAppIcon(window.appId)" size="small" />
          <span class="max-w-32 truncate">{{ window.title }}</span>
        </button>
      </div>
    </div>
    
    <!-- 开始菜单 -->
    <div
      v-if="showStartMenu"
      class="fixed bottom-12 left-4 w-80 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 p-4 z-50"
    >
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 mb-2">应用程序</h3>
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="app in availableApps"
            :key="app.id"
            class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
            @click="openApp(app.id)"
          >
            <LIcon :name="app.icon" size="large" class="mb-1" />
            <span class="text-xs text-gray-700 text-center">{{ app.name }}</span>
          </button>
        </div>
      </div>
      
      <div class="border-t border-gray-200 pt-4">
        <button
          class="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          @click="openSettings"
        >
          <LIcon name="settings" size="small" />
          <span>设置</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LIcon } from '@linglongos/ui'
import { useWindowStore } from '../stores/window'
import type { AppInfo } from '@linglongos/shared-types'

const windowStore = useWindowStore()

// 状态
const showStartMenu = ref(false)

// 计算属性
const visibleWindows = computed(() => windowStore.visibleWindows)

// 可用应用列表
const availableApps: AppInfo[] = [
  {
    id: 'file-manager',
    name: '文件管理器',
    icon: 'folder',
    version: '1.0.0',
    description: '管理远程服务器文件',
    category: '系统工具',
    author: '玲珑OS团队',
    permissions: ['file:read', 'file:write'],
    isSystem: true,
  },
  {
    id: 'terminal',
    name: '终端',
    icon: 'terminal',
    version: '1.0.0',
    description: '远程终端连接',
    category: '系统工具',
    author: '玲珑OS团队',
    permissions: ['terminal:access'],
    isSystem: true,
  },
  {
    id: 'settings',
    name: '设置',
    icon: 'settings',
    version: '1.0.0',
    description: '系统设置和配置',
    category: '系统工具',
    author: '玲珑OS团队',
    permissions: ['system:config'],
    isSystem: true,
  },
  {
    id: 'task-manager',
    name: '任务管理器',
    icon: 'monitor',
    version: '1.0.0',
    description: '查看和管理系统进程',
    category: '系统工具',
    author: '玲珑OS团队',
    permissions: ['process:read', 'process:kill'],
    isSystem: true,
  },
]

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

/**
 * 切换开始菜单
 */
const toggleStartMenu = (): void => {
  showStartMenu.value = !showStartMenu.value
}

/**
 * 处理窗口点击
 */
const handleWindowClick = (window: any): void => {
  if (window.isMinimized) {
    windowStore.restoreWindow(window.id)
  } else if (window.isActive) {
    windowStore.minimizeWindow(window.id)
  } else {
    windowStore.activateWindow(window.id)
  }
}

/**
 * 打开应用
 */
const openApp = (appId: string): void => {
  windowStore.openApp(appId)
  showStartMenu.value = false
}

/**
 * 打开设置
 */
const openSettings = (): void => {
  windowStore.openApp('settings')
  showStartMenu.value = false
}

/**
 * 获取应用图标
 */
const getAppIcon = (appId: string): string => {
  const app = availableApps.find(a => a.id === appId)
  return app?.icon || 'app'
}

/**
 * 处理外部点击
 */
const handleClickOutside = (event: Event): void => {
  const target = event.target as HTMLElement
  if (!target.closest('.fixed')) {
    showStartMenu.value = false
  }
}
</script>