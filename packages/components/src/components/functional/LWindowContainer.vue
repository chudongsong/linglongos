<template>
  <div class="window-container fixed inset-0 pointer-events-none">
    <!-- 窗口列表 -->
    <LWindow
      v-for="window in visibleWindows"
      :key="window.id"
      :window="window"
      :modal="isModalWindow(window)"
      class="pointer-events-auto"
      @activate="handleActivate"
      @close="handleClose"
      @minimize="handleMinimize"
      @maximize="handleMaximize"
      @move="handleMove"
      @resize="handleResize"
      @state-change="handleStateChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LWindow from './LWindow.vue'
import { useWindowManager } from '../../composables/useWindowManager'
import type { WindowState } from '../../types'

interface Props {
  /** 模态窗口ID列表 */
  modalWindows?: string[]
}

interface Emits {
  windowActivate: [windowId: string]
  windowClose: [windowId: string]
  windowMinimize: [windowId: string]
  windowMaximize: [windowId: string]
  windowMove: [windowId: string, position: { x: number; y: number }]
  windowResize: [windowId: string, size: { width: number; height: number }]
  windowStateChange: [windowId: string, state: Partial<WindowState>]
}

const props = withDefaults(defineProps<Props>(), {
  modalWindows: () => []
})

const emit = defineEmits<Emits>()

const windowManager = useWindowManager()

// 计算属性
const visibleWindows = computed(() => windowManager.visibleWindows.value)

/**
 * 检查是否为模态窗口
 */
const isModalWindow = (window: WindowState): boolean => {
  return props.modalWindows.includes(window.id)
}

/**
 * 处理窗口激活
 */
const handleActivate = (windowId: string): void => {
  windowManager.activateWindow(windowId)
  emit('windowActivate', windowId)
}

/**
 * 处理窗口关闭
 */
const handleClose = (windowId: string): void => {
  windowManager.closeWindow(windowId)
  emit('windowClose', windowId)
}

/**
 * 处理窗口最小化
 */
const handleMinimize = (windowId: string): void => {
  windowManager.minimizeWindow(windowId)
  emit('windowMinimize', windowId)
}

/**
 * 处理窗口最大化
 */
const handleMaximize = (windowId: string): void => {
  windowManager.maximizeWindow(windowId)
  emit('windowMaximize', windowId)
}

/**
 * 处理窗口移动
 */
const handleMove = (windowId: string, position: { x: number; y: number }): void => {
  windowManager.moveWindow(windowId, position)
  emit('windowMove', windowId, position)
}

/**
 * 处理窗口调整大小
 */
const handleResize = (windowId: string, size: { width: number; height: number }): void => {
  windowManager.resizeWindow(windowId, size)
  emit('windowResize', windowId, size)
}

/**
 * 处理窗口状态改变
 */
const handleStateChange = (windowId: string, state: Partial<WindowState>): void => {
  emit('windowStateChange', windowId, state)
}

// 暴露窗口管理器方法
defineExpose({
  windowManager
})
</script>

<style scoped>
.window-container {
  z-index: 100;
}
</style>