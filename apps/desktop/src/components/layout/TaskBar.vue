<template>
  <div class="taskbar">
    <!-- 开始按钮 -->
    <button 
      class="start-button"
      :class="{ active: showStartMenu }"
      @click="toggleStartMenu"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4,2A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2H4M4,4H11V11H4V4M13,4H20V11H13V4M4,13H11V20H4V13M13,13H20V20H13V13Z"/>
      </svg>
    </button>
    
    <!-- 任务栏应用 -->
    <div class="taskbar-apps">
      <TaskbarItem
        v-for="window in windowStore.taskbarWindows"
        :key="window.id"
        :window="window"
        @click="handleWindowClick"
      />
    </div>
    
    <!-- 系统托盘 -->
    <div class="system-tray">
      <!-- 用户菜单 -->
      <button class="tray-button user-menu" @click="toggleUserMenu">
        <div class="user-avatar">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWindowStore } from '@/stores/window'
import { useAuthStore } from '@/stores/auth'
import TaskbarItem from './TaskbarItem.vue'
import type { WindowState } from '@/types'

const windowStore = useWindowStore()
const authStore = useAuthStore()

const showStartMenu = ref(false)
const showUserMenu = ref(false)

function toggleStartMenu() {
  showStartMenu.value = !showStartMenu.value
  showUserMenu.value = false
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
  showStartMenu.value = false
}

function handleWindowClick(window: WindowState) {
  windowStore.focusWindow(window.id)
}
</script>

<style scoped>
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 999;
}

.start-button {
  width: 40px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  transition: all 0.2s;
}

.start-button:hover,
.start-button.active {
  background: rgba(255, 255, 255, 0.2);
}

.taskbar-apps {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.system-tray {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.tray-button {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tray-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>