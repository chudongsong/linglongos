<template>
  <div class="window-manager">
    <!-- 渲染所有窗口 -->
    <WindowFrame
      v-for="window in windowStore.visibleWindows"
      :key="window.id"
      :window="window"
      @close="handleWindowClose"
      @minimize="handleWindowMinimize"
      @maximize="handleWindowMaximize"
      @focus="handleWindowFocus"
      @move="handleWindowMove"
      @resize="handleWindowResize"
    />
  </div>
</template>

<script setup lang="ts">
import { useWindowStore } from '@/stores/window'
import WindowFrame from './WindowFrame.vue'
import type { WindowState, Position, Size } from '@/types'

const windowStore = useWindowStore()

function handleWindowClose(window: WindowState) {
  windowStore.closeWindow(window.id)
}

function handleWindowMinimize(window: WindowState) {
  windowStore.minimizeWindow(window.id)
}

function handleWindowMaximize(window: WindowState) {
  windowStore.maximizeWindow(window.id)
}

function handleWindowFocus(window: WindowState) {
  windowStore.setActiveWindow(window.id)
}

function handleWindowMove(window: WindowState, position: Position) {
  windowStore.moveWindow(window.id, position)
}

function handleWindowResize(window: WindowState, size: Size) {
  windowStore.resizeWindow(window.id, size)
}
</script>

<style scoped>
.window-manager {
  position: fixed;
  top: 32px; /* SystemBar height */
  left: 0;
  right: 0;
  bottom: 40px; /* TaskBar height */
  pointer-events: none;
  z-index: 100;
}
</style>