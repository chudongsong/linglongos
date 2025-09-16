<template>
  <div 
    class="desktop-folder grid-item"
    :class="{ selected: isSelected }"
    :style="folderStyle"
    @click="$emit('click', folder)"
    @dblclick="$emit('double-click', folder)"
  >
    <div class="folder-wrapper">
      <!-- 文件夹图标 -->
      <div class="folder-icon">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        <!-- 文件夹内容数量指示器 -->
        <div v-if="folder.children.length > 0" class="folder-badge">
          {{ folder.children.length }}
        </div>
      </div>
      
      <!-- 文件夹标签 -->
      <div class="folder-label">{{ folder.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import type { Folder } from '@/types'

interface Props {
  folder: Folder
}

interface Emits {
  (e: 'click', folder: Folder): void
  (e: 'double-click', folder: Folder): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const desktopStore = useDesktopStore()

const isSelected = computed(() => 
  desktopStore.selectedIconIds.has(props.folder.id)
)

const folderStyle = computed(() => {
  const { position } = props.folder
  const { cellWidth, cellHeight, gap } = desktopStore.gridConfig
  
  return {
    gridColumn: `${position.x + 1} / span ${position.width}`,
    gridRow: `${position.y + 1} / span ${position.height}`,
    width: `${cellWidth * position.width + gap * (position.width - 1)}px`,
    height: `${cellHeight * position.height + gap * (position.height - 1)}px`
  }
})
</script>

<style scoped>
.desktop-folder {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease-in-out;
}

.desktop-folder:hover {
  transform: scale(1.05);
}

.desktop-folder.selected .folder-wrapper {
  background-color: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
}

.folder-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  position: relative;
}

.folder-icon {
  color: #fbbf24;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  position: relative;
}

.folder-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-label {
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>