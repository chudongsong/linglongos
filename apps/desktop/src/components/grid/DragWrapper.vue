<template>
  <div
    class="drag-wrapper"
    :class="wrapperClasses"
    :style="wrapperStyle"
    :draggable="enableDrag && !item.general.locked"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <slot />
    
    <!-- 拖拽句柄（可选） -->
    <div
      v-if="showDragHandle && enableDrag && !item.general.locked"
      class="drag-handle"
      @mousedown="handleDragHandleMouseDown"
    >
      <GripVerticalIcon class="w-4 h-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GripVerticalIcon } from 'lucide-vue-next'
import type { GridItem, GridConfig } from '@/types/grid'

/**
 * 拖拽包装器组件
 * @description 为网格项提供拖拽能力的包装器
 */

// Props
interface Props {
  /** 网格项数据 */
  item: GridItem
  /** 项目索引 */
  index: number
  /** 网格配置 */
  gridConfig: GridConfig
  /** 是否正在拖拽 */
  isDragging?: boolean
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 是否显示拖拽句柄 */
  showDragHandle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  enableDrag: true,
  showDragHandle: false
})

// Emits
interface Emits {
  (e: 'drag-start', event: DragEvent): void
  (e: 'drag-end', event: DragEvent): void
}

const emit = defineEmits<Emits>()

// 计算属性
/**
 * 包装器样式类
 */
const wrapperClasses = computed(() => ({
  'drag-wrapper--dragging': props.isDragging,
  'drag-wrapper--locked': props.item.general.locked,
  'drag-wrapper--draggable': props.enableDrag && !props.item.general.locked
}))

/**
 * 包装器样式
 */
const wrapperStyle = computed(() => {
  const { x, y } = props.item.position
  const { cellSize, gap } = props.gridConfig
  
  return {
    position: 'absolute',
    left: `${x * (cellSize + gap)}px`,
    top: `${y * (cellSize + gap)}px`,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    zIndex: props.isDragging ? 1000 : 1
  }
})

// 方法
/**
 * 处理拖拽开始
 */
const handleDragStart = (event: DragEvent): void => {
  if (!props.enableDrag || props.item.general.locked) {
    event.preventDefault()
    return
  }

  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      itemId: props.item.id,
      type: 'grid-item',
      originalPosition: props.item.position
    }))
  }

  emit('drag-start', event)
}

/**
 * 处理拖拽结束
 */
const handleDragEnd = (event: DragEvent): void => {
  emit('drag-end', event)
}

/**
 * 处理拖拽悬停
 */
const handleDragOver = (event: DragEvent): void => {
  if (props.enableDrag) {
    event.preventDefault()
  }
}

/**
 * 处理放置
 */
const handleDrop = (event: DragEvent): void => {
  event.preventDefault()
  // 处理放置逻辑由父组件管理
}

/**
 * 处理拖拽句柄鼠标按下
 */
const handleDragHandleMouseDown = (event: MouseEvent): void => {
  // 防止默认的选择行为
  event.preventDefault()
}
</script>

<style scoped>
.drag-wrapper {
  @apply relative;
  @apply transition-all duration-200;
}

.drag-wrapper--draggable {
  @apply cursor-grab;
}

.drag-wrapper--draggable:active {
  @apply cursor-grabbing;
}

.drag-wrapper--dragging {
  @apply cursor-grabbing;
  @apply z-50;
}

.drag-wrapper--locked {
  @apply cursor-not-allowed;
  @apply opacity-75;
}

/* 拖拽句柄 */
.drag-handle {
  @apply absolute top-1 right-1;
  @apply bg-gray-800/80 text-white;
  @apply rounded p-1;
  @apply opacity-0 transition-opacity;
  @apply cursor-grab;
  @apply z-10;
}

.drag-wrapper:hover .drag-handle {
  @apply opacity-100;
}

.drag-handle:active {
  @apply cursor-grabbing;
}

/* 拖拽状态动画 */
.drag-wrapper--dragging {
  animation: dragBounce 0.3s ease-out;
}

@keyframes dragBounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .drag-wrapper {
    @apply transition-none;
    animation: none !important;
  }
}
</style>