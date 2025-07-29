<template>
  <div
    v-if="!window.isMinimized"
    :class="[
      'absolute rounded-lg shadow-2xl overflow-hidden transition-all duration-200 bg-white dark:bg-gray-800',
      window.isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300 dark:ring-gray-600',
      window.isMaximized ? 'inset-0 rounded-none' : '',
      modal ? 'z-50' : ''
    ]"
    :style="windowStyle"
    @mousedown="handleActivate"
  >
    <!-- 标题栏 -->
    <div
      :class="[
        'h-8 flex items-center justify-between px-3 select-none',
        window.isActive 
          ? 'bg-blue-600 dark:bg-blue-700' 
          : 'bg-gray-500 dark:bg-gray-600',
        window.draggable ? 'cursor-move' : ''
      ]"
      @mousedown="handleTitleBarMouseDown"
      @dblclick="handleTitleBarDoubleClick"
    >
      <!-- 左侧：图标和标题 -->
      <div class="flex items-center space-x-2 text-white">
        <div v-if="window.icon" class="w-4 h-4 flex-shrink-0">
          <img :src="window.icon" :alt="window.title" class="w-full h-full object-contain" />
        </div>
        <span class="text-sm font-medium truncate">{{ window.title }}</span>
      </div>
      
      <!-- 右侧：控制按钮 -->
      <div class="flex items-center space-x-1">
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
          @click.stop="handleMinimize"
          title="最小化"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="5" width="8" height="2" />
          </svg>
        </button>
        <button
          v-if="window.resizable"
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
          @click.stop="handleMaximize"
          :title="window.isMaximized ? '还原' : '最大化'"
        >
          <svg v-if="window.isMaximized" class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="3" width="7" height="7" stroke="currentColor" stroke-width="1" fill="none" />
            <rect x="3" y="2" width="7" height="7" stroke="currentColor" stroke-width="1" fill="none" />
          </svg>
          <svg v-else class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1" fill="none" />
          </svg>
        </button>
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500 text-white transition-colors"
          @click.stop="handleClose"
          title="关闭"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 窗口内容 -->
    <div class="flex-1 overflow-hidden">
      <component
        v-if="window.component"
        :is="window.component"
        v-bind="window.props"
        @close="handleClose"
      />
      <slot v-else />
    </div>
    
    <!-- 调整大小手柄 -->
    <template v-if="window.resizable && !window.isMaximized">
      <!-- 边缘调整手柄 -->
      <div class="absolute top-0 left-0 w-full h-1 cursor-n-resize" @mousedown="handleResizeMouseDown('n', $event)" />
      <div class="absolute top-0 right-0 w-1 h-full cursor-e-resize" @mousedown="handleResizeMouseDown('e', $event)" />
      <div class="absolute bottom-0 left-0 w-full h-1 cursor-s-resize" @mousedown="handleResizeMouseDown('s', $event)" />
      <div class="absolute top-0 left-0 w-1 h-full cursor-w-resize" @mousedown="handleResizeMouseDown('w', $event)" />
      
      <!-- 角落调整手柄 -->
      <div class="absolute top-0 left-0 w-2 h-2 cursor-nw-resize" @mousedown="handleResizeMouseDown('nw', $event)" />
      <div class="absolute top-0 right-0 w-2 h-2 cursor-ne-resize" @mousedown="handleResizeMouseDown('ne', $event)" />
      <div class="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" @mousedown="handleResizeMouseDown('sw', $event)" />
      <div class="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" @mousedown="handleResizeMouseDown('se', $event)" />
    </template>
  </div>
  
  <!-- 模态遮罩 -->
  <div
    v-if="modal && !window.isMinimized"
    class="fixed inset-0 bg-black/50 z-40"
    @click="handleModalBackdropClick"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { WindowState } from '../../types'

interface Props {
  window: WindowState
  modal?: boolean
}

interface Emits {
  close: [windowId: string]
  minimize: [windowId: string]
  maximize: [windowId: string]
  activate: [windowId: string]
  move: [windowId: string, position: { x: number; y: number }]
  resize: [windowId: string, size: { width: number; height: number }]
  stateChange: [windowId: string, state: Partial<WindowState>]
}

const props = withDefaults(defineProps<Props>(), {
  modal: false
})

const emit = defineEmits<Emits>()

// 状态
const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const resizeData = ref({
  direction: '',
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  startLeft: 0,
  startTop: 0
})

// 计算属性
const windowStyle = computed(() => {
  if (props.window.isMaximized) {
    return {
      zIndex: props.window.zIndex,
    }
  }
  
  return {
    left: `${props.window.position.x}px`,
    top: `${props.window.position.y}px`,
    width: `${props.window.size.width}px`,
    height: `${props.window.size.height}px`,
    zIndex: props.window.zIndex,
  }
})

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

/**
 * 处理激活
 */
const handleActivate = (): void => {
  emit('activate', props.window.id)
}

/**
 * 处理关闭
 */
const handleClose = (): void => {
  emit('close', props.window.id)
}

/**
 * 处理最小化
 */
const handleMinimize = (): void => {
  emit('minimize', props.window.id)
}

/**
 * 处理最大化
 */
const handleMaximize = (): void => {
  emit('maximize', props.window.id)
}

/**
 * 处理标题栏鼠标按下
 */
const handleTitleBarMouseDown = (event: MouseEvent): void => {
  if (!props.window.draggable || props.window.isMaximized) return
  
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - props.window.position.x,
    y: event.clientY - props.window.position.y,
  }
  
  event.preventDefault()
}

/**
 * 处理标题栏双击
 */
const handleTitleBarDoubleClick = (): void => {
  if (props.window.resizable) {
    handleMaximize()
  }
}

/**
 * 处理调整大小鼠标按下
 */
const handleResizeMouseDown = (direction: string, event: MouseEvent): void => {
  if (!props.window.resizable) return
  
  isResizing.value = true
  resizeData.value = {
    direction,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: props.window.size.width,
    startHeight: props.window.size.height,
    startLeft: props.window.position.x,
    startTop: props.window.position.y
  }
  
  event.preventDefault()
  event.stopPropagation()
}

/**
 * 处理鼠标移动
 */
const handleMouseMove = (event: MouseEvent): void => {
  if (isDragging.value) {
    const newPosition = {
      x: Math.max(0, Math.min(event.clientX - dragOffset.value.x, window.innerWidth - 200)),
      y: Math.max(0, Math.min(event.clientY - dragOffset.value.y, window.innerHeight - 100)),
    }
    
    emit('move', props.window.id, newPosition)
  } else if (isResizing.value) {
    handleResize(event)
  }
}

/**
 * 处理调整大小
 */
const handleResize = (event: MouseEvent): void => {
  const { direction, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeData.value
  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  
  let newWidth = startWidth
  let newHeight = startHeight
  let newLeft = startLeft
  let newTop = startTop
  
  // 根据方向调整大小
  if (direction.includes('e')) {
    newWidth = Math.max(200, startWidth + deltaX)
  }
  if (direction.includes('w')) {
    newWidth = Math.max(200, startWidth - deltaX)
    newLeft = startLeft + (startWidth - newWidth)
  }
  if (direction.includes('s')) {
    newHeight = Math.max(150, startHeight + deltaY)
  }
  if (direction.includes('n')) {
    newHeight = Math.max(150, startHeight - deltaY)
    newTop = startTop + (startHeight - newHeight)
  }
  
  // 限制窗口不能超出屏幕
  if (newLeft < 0) {
    newWidth += newLeft
    newLeft = 0
  }
  if (newTop < 0) {
    newHeight += newTop
    newTop = 0
  }
  if (newLeft + newWidth > window.innerWidth) {
    newWidth = window.innerWidth - newLeft
  }
  if (newTop + newHeight > window.innerHeight) {
    newHeight = window.innerHeight - newTop
  }
  
  emit('resize', props.window.id, { width: newWidth, height: newHeight })
  if (newLeft !== props.window.position.x || newTop !== props.window.position.y) {
    emit('move', props.window.id, { x: newLeft, y: newTop })
  }
}

/**
 * 处理鼠标释放
 */
const handleMouseUp = (): void => {
  isDragging.value = false
  isResizing.value = false
}

/**
 * 处理模态遮罩点击
 */
const handleModalBackdropClick = (): void => {
  // 模态窗口点击遮罩不关闭，只激活窗口
  handleActivate()
}
</script>