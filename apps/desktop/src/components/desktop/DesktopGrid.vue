<template>
  <div class="desktop-grid">
    <div class="grid-container" :style="gridStyle">
      <!-- 桌面图标 -->
      <DesktopIcon
        v-for="icon in desktopStore.icons"
        :key="icon.id"
        :icon="icon"
        @click="handleIconClick"
        @double-click="handleIconDoubleClick"
        @context-menu="handleIconContextMenu"
      />
      
      <!-- 文件夹 -->
      <DesktopFolder
        v-for="folder in desktopStore.folders"
        :key="folder.id"
        :folder="folder"
        @click="handleFolderClick"
        @double-click="handleFolderDoubleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { useAppStore } from '@/stores/app'
import DesktopIcon from './DesktopIcon.vue'
import DesktopFolder from './DesktopFolder.vue'
import type { DesktopIcon as DesktopIconType, Folder } from '@/types'

const desktopStore = useDesktopStore()
const appStore = useAppStore()

const gridStyle = computed(() => {
  const { columns, cellWidth, cellHeight, gap, padding } = desktopStore.gridConfig
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
    gridTemplateRows: `repeat(auto, ${cellHeight}px)`,
    gap: `${gap}px`,
    padding: `${padding}px`,
    width: '100%',
    height: '100%'
  }
})

function handleIconClick(icon: DesktopIconType) {
  desktopStore.selectIcon(icon.id)
}

function handleIconDoubleClick(icon: DesktopIconType) {
  if (icon.type === 'app' && icon.appId) {
    appStore.launchApp(icon.appId)
  }
}

function handleIconContextMenu(icon: DesktopIconType) {
  // TODO: 显示右键菜单
  console.log('Context menu for icon:', icon.name)
}

function handleFolderClick(folder: Folder) {
  desktopStore.selectIcon(folder.id)
}

function handleFolderDoubleClick(folder: Folder) {
  desktopStore.openFolder(folder.id)
}
</script>

<style scoped>
.desktop-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 40px); /* 减去任务栏高度 */
  overflow: hidden;
  z-index: 1;
}

.grid-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>