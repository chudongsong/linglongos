<template>
  <div 
    ref="iconRef"
    class="desktop-icon grid-item"
    :class="{ selected: isSelected, dragging: isDragging }"
    :style="iconStyle"
    @click="$emit('click', icon)"
    @dblclick="$emit('double-click', icon)"
    @contextmenu.prevent="$emit('context-menu', icon)"
    @mousedown="handleMouseDown"
  >
    <div class="icon-wrapper">
      <!-- 图标 -->
      <div class="icon-image">
        <svg v-if="icon.icon === 'folder'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        <svg v-else-if="icon.icon === 'terminal'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5A2,2 0 0,1 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z"/>
        </svg>
        <svg v-else-if="icon.icon === 'settings'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
        </svg>
        <svg v-else-if="icon.icon === 'activity'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.5,7L12,2L15.5,7H21V9H19V21H5V9H3V7H8.5M7,9V19H17V9H7Z"/>
        </svg>
        <svg v-else-if="icon.icon === 'calculator'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V12H9V10H7M11,10V12H13V10H11M15,10V12H17V10H15M7,14V16H9V14H7M11,14V16H13V14H11M15,14V16H17V14H15M7,18V20H9V18H7M11,18V20H13V18H11M15,18V20H17V18H15Z"/>
        </svg>
        <svg v-else-if="icon.icon === 'file-text'" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9,12A3,3 0 0,0 12,9A3,3 0 0,0 9,6A3,3 0 0,0 6,9A3,3 0 0,0 9,12M9,20L12,14L15,20H9M20,4V16L18,14V7H4A2,2 0 0,1 2,5V4A2,2 0 0,1 4,2H18A2,2 0 0,1 20,4Z"/>
        </svg>
      </div>
      
      <!-- 图标标签 -->
      <div class="icon-label">{{ icon.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { useDraggable } from '@/composables/useDrag'
import type { DesktopIcon } from '@/types'

interface Props {
  icon: DesktopIcon
}

interface Emits {
  (e: 'click', icon: DesktopIcon): void
  (e: 'double-click', icon: DesktopIcon): void
  (e: 'context-menu', icon: DesktopIcon): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const desktopStore = useDesktopStore()
const iconRef = ref<HTMLElement>()

const isSelected = computed(() => 
  desktopStore.selectedIconIds.has(props.icon.id)
)

const iconStyle = computed(() => {
  const { position } = props.icon
  const { cellWidth, cellHeight, gap } = desktopStore.gridConfig
  
  return {
    gridColumn: `${position.x + 1} / span ${position.width}`,
    gridRow: `${position.y + 1} / span ${position.height}`,
    width: `${cellWidth * position.width + gap * (position.width - 1)}px`,
    height: `${cellHeight * position.height + gap * (position.height - 1)}px`
  }
})

// 拖拽功能
const { isDragging, startDrag } = useDraggable(iconRef, {
  onDragStart: () => {
    console.log('Start dragging icon:', props.icon.name)
  },
  onDragEnd: () => {
    console.log('End dragging icon:', props.icon.name)
  },
  onDrop: (event) => {
    // 计算新位置
    const newPosition = desktopStore.findNearestPosition({
      x: event.clientX,
      y: event.clientY
    })
    
    // 更新图标位置
    desktopStore.moveIcon(props.icon.id, newPosition)
  },
  dragData: props.icon
})

function handleMouseDown(event: MouseEvent) {
  // 只有在左键且没有其他修饰键时才开始拖拽
  if (event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    startDrag(event)
  }
}
</script>

<style scoped>
.desktop-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease-in-out;
}

.desktop-icon:hover {
  transform: scale(1.05);
}

.desktop-icon.dragging {
  transform: rotate(5deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 9999;
}

.desktop-icon.selected .icon-wrapper {
  background-color: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
}

.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.icon-image {
  color: white;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.icon-label {
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