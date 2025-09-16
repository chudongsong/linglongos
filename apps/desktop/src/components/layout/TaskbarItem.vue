<template>
  <button 
    class="taskbar-item"
    :class="{ 
      active: window.isActive, 
      minimized: window.isMinimized 
    }"
    @click="$emit('click', window)"
    :title="window.title"
  >
    <!-- 应用图标 -->
    <div class="app-icon">
      <svg v-if="window.icon === 'folder'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
      </svg>
      <svg v-else-if="window.icon === 'terminal'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5A2,2 0 0,1 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z"/>
      </svg>
      <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9,12A3,3 0 0,0 12,9A3,3 0 0,0 9,6A3,3 0 0,0 6,9A3,3 0 0,0 9,12M9,20L12,14L15,20H9M20,4V16L18,14V7H4A2,2 0 0,1 2,5V4A2,2 0 0,1 4,2H18A2,2 0 0,1 20,4Z"/>
      </svg>
    </div>
    
    <!-- 应用标题 -->
    <span class="app-title">{{ window.title }}</span>
    
    <!-- 运行指示器 -->
    <div v-if="!window.isMinimized" class="running-indicator"></div>
  </button>
</template>

<script setup lang="ts">
import type { WindowState } from '@/types'

interface Props {
  window: WindowState
}

interface Emits {
  (e: 'click', window: WindowState): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.taskbar-item {
  position: relative;
  height: 32px;
  min-width: 48px;
  max-width: 200px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  transition: all 0.2s;
  overflow: hidden;
}

.taskbar-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.taskbar-item.active {
  background: rgba(59, 130, 246, 0.6);
}

.taskbar-item.minimized {
  opacity: 0.6;
}

.app-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  flex: 1;
  font-size: 12px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1;
}

.running-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 2px;
  background: #10b981;
  border-radius: 1px;
}
</style>