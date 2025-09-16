<template>
  <div class="desktop-view">
    <!-- 桌面网格 -->
    <DesktopGrid />
    
    <!-- 系统栏 -->
    <SystemBar />
    
    <!-- 任务栏 -->
    <TaskBar />
    
    <!-- 窗口管理器 -->
    <WindowManager />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { useAppStore } from '@/stores/app'
import DesktopGrid from '@/components/desktop/DesktopGrid.vue'
import SystemBar from '@/components/layout/SystemBar.vue'
import TaskBar from '@/components/layout/TaskBar.vue'
import WindowManager from '@/components/window/WindowManager.vue'

const desktopStore = useDesktopStore()
const appStore = useAppStore()

onMounted(() => {
  // 初始化桌面
  initializeDesktop()
})

function initializeDesktop() {
  // 加载桌面配置
  desktopStore.loadDesktopConfig()
  
  // 加载应用注册表
  appStore.loadAppRegistry()
  
  // 创建一些默认桌面图标（如果没有的话）
  if (desktopStore.icons.length === 0) {
    createDefaultIcons()
  }
}

function createDefaultIcons() {
  const defaultIcons = [
    {
      type: 'app' as const,
      name: '文件管理器',
      icon: 'folder',
      appId: 'file-manager',
      position: { x: 0, y: 0, width: 1, height: 1 }
    },
    {
      type: 'app' as const,
      name: '终端',
      icon: 'terminal',
      appId: 'terminal',
      position: { x: 1, y: 0, width: 1, height: 1 }
    },
    {
      type: 'app' as const,
      name: '任务管理器',
      icon: 'activity',
      appId: 'task-manager',
      position: { x: 2, y: 0, width: 1, height: 1 }
    },
    {
      type: 'app' as const,
      name: '设置',
      icon: 'settings',
      appId: 'settings',
      position: { x: 0, y: 1, width: 1, height: 1 }
    },
    {
      type: 'app' as const,
      name: '计算器',
      icon: 'calculator',
      appId: 'calculator',
      position: { x: 1, y: 1, width: 1, height: 1 }
    },
    {
      type: 'app' as const,
      name: '文本编辑器',
      icon: 'file-text',
      appId: 'text-editor',
      position: { x: 2, y: 1, width: 1, height: 1 }
    }
  ]
  
  defaultIcons.forEach(icon => {
    desktopStore.addIcon(icon)
  })
}</script>

<style scoped>
.desktop-view {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: v-bind('desktopStore.wallpaper.value');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>