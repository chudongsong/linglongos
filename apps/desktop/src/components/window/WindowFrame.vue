<template>
  <div 
    ref="windowRef"
    class="window-frame"
    :class="{ 
      active: window.isActive,
      maximized: window.isMaximized 
    }"
    :style="windowStyle"
    @mousedown="handleWindowMouseDown"
  >
    <!-- 窗口标题栏 -->
    <div 
      ref="titleBarRef"
      class="window-titlebar"
      @mousedown="handleTitleBarMouseDown"
      @dblclick="handleTitleBarDoubleClick"
    >
      <!-- 窗口图标和标题 -->
      <div class="window-title">
        <div v-if="window.icon" class="window-icon">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <!-- 这里可以根据window.icon渲染不同的图标 -->
            <path d="M9,12A3,3 0 0,0 12,9A3,3 0 0,0 9,6A3,3 0 0,0 6,9A3,3 0 0,0 9,12M9,20L12,14L15,20H9M20,4V16L18,14V7H4A2,2 0 0,1 2,5V4A2,2 0 0,1 4,2H18A2,2 0 0,1 20,4Z"/>
          </svg>
        </div>
        <span class="title-text">{{ window.title }}</span>
      </div>
      
      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button 
          class="control-button minimize-btn"
          @click="$emit('minimize', window)"
          :disabled="!window.minimizable"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20,14H4V10H20"/>
          </svg>
        </button>
        
        <button 
          class="control-button maximize-btn"
          @click="$emit('maximize', window)"
          :disabled="!window.resizable"
        >
          <svg v-if="window.isMaximized" class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4,8H8V4H20V16H16V20H4V8M16,8V14H18V6H10V8H16M6,12V18H14V12H6Z"/>
          </svg>
          <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4,4H20V20H4V4M6,8V18H18V8H6Z"/>
          </svg>
        </button>
        
        <button 
          class="control-button close-btn"
          @click="$emit('close', window)"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 窗口内容区域 -->
    <div class="window-content">
      <component 
        v-if="window.component && typeof window.component !== 'string'"
        :is="window.component"
        v-bind="window.props"
      />
      <Suspense v-else-if="window.component && typeof window.component === 'string'">
        <template #default>
          <component 
            :is="resolveComponent(window.component)"
            v-bind="window.props"
          />
        </template>
        <template #fallback>
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        </template>
      </Suspense>
      <div v-else class="placeholder-content">
        <h3>{{ window.title }}</h3>
        <p>应用内容加载中...</p>
      </div>
    </div>
    
    <!-- 调整大小手柄 -->
    <div 
      v-if="window.resizable && !window.isMaximized"
      class="resize-handles"
    >
      <div class="resize-handle resize-n" @mousedown="handleResizeMouseDown($event, 'n')"></div>
      <div class="resize-handle resize-e" @mousedown="handleResizeMouseDown($event, 'e')"></div>
      <div class="resize-handle resize-s" @mousedown="handleResizeMouseDown($event, 's')"></div>
      <div class="resize-handle resize-w" @mousedown="handleResizeMouseDown($event, 'w')"></div>
      <div class="resize-handle resize-ne" @mousedown="handleResizeMouseDown($event, 'ne')"></div>
      <div class="resize-handle resize-se" @mousedown="handleResizeMouseDown($event, 'se')"></div>
      <div class="resize-handle resize-sw" @mousedown="handleResizeMouseDown($event, 'sw')"></div>
      <div class="resize-handle resize-nw" @mousedown="handleResizeMouseDown($event, 'nw')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import type { WindowState, Position, Size } from '@/types'

interface Props {
  window: WindowState
}

interface Emits {
  (e: 'close', window: WindowState): void
  (e: 'minimize', window: WindowState): void
  (e: 'maximize', window: WindowState): void
  (e: 'focus', window: WindowState): void
  (e: 'move', window: WindowState, position: Position): void
  (e: 'resize', window: WindowState, size: Size): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const windowRef = ref<HTMLElement>()
const titleBarRef = ref<HTMLElement>()

// 动态组件解析
function resolveComponent(componentName: string) {
  const componentMap: Record<string, any> = {
    'FileManager': defineAsyncComponent(() => import('@/components/apps/FileManager.vue')),
    'Terminal': defineAsyncComponent(() => import('@/components/apps/Terminal.vue')),
    'TaskManager': defineAsyncComponent(() => import('@/components/apps/TaskManager.vue')),
    'Settings': defineAsyncComponent(() => import('@/components/apps/Settings.vue')),
    'Calculator': defineAsyncComponent(() => import('@/components/apps/Calculator.vue')),
    'TextEditor': defineAsyncComponent(() => import('@/components/apps/TextEditor.vue'))
  }
  
  return componentMap[componentName] || null
}

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const resizeDirection = ref('')
const initialMousePos = ref({ x: 0, y: 0 })
const initialWindowRect = ref({ x: 0, y: 0, width: 0, height: 0 })

// 计算窗口样式
const windowStyle = computed(() => {
  const { position, size, zIndex, isMaximized } = props.window
  
  if (isMaximized) {
    return {
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      zIndex: zIndex,
      pointerEvents: 'auto'
    }
  }
  
  return {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: zIndex,
    pointerEvents: 'auto'
  }
})

function handleWindowMouseDown() {
  emit('focus', props.window)
}

function handleTitleBarMouseDown(event: MouseEvent) {
  if (!props.window.draggable || props.window.isMaximized) return
  
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - props.window.position.x,
    y: event.clientY - props.window.position.y
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  event.preventDefault()
}

function handleTitleBarDoubleClick() {
  if (props.window.resizable) {
    emit('maximize', props.window)
  }
}

function handleResizeMouseDown(event: MouseEvent, direction: string) {
  if (!props.window.resizable) return
  
  isResizing.value = true
  resizeDirection.value = direction
  initialMousePos.value = { x: event.clientX, y: event.clientY }
  initialWindowRect.value = {
    x: props.window.position.x,
    y: props.window.position.y,
    width: props.window.size.width,
    height: props.window.size.height
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  event.preventDefault()
  event.stopPropagation()
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    const newPosition: Position = {
      x: event.clientX - dragOffset.value.x,
      y: event.clientY - dragOffset.value.y
    }
    
    // 边界检查
    newPosition.x = Math.max(0, Math.min(newPosition.x, window.innerWidth - props.window.size.width))
    newPosition.y = Math.max(0, Math.min(newPosition.y, window.innerHeight - props.window.size.height - 40)) // 减去任务栏高度
    
    emit('move', props.window, newPosition)
  } else if (isResizing.value) {
    const deltaX = event.clientX - initialMousePos.value.x
    const deltaY = event.clientY - initialMousePos.value.y
    
    let newRect = { ...initialWindowRect.value }
    
    // 根据调整方向计算新的尺寸和位置
    if (resizeDirection.value.includes('n')) {
      newRect.y += deltaY
      newRect.height -= deltaY
    }
    if (resizeDirection.value.includes('s')) {
      newRect.height += deltaY
    }
    if (resizeDirection.value.includes('w')) {
      newRect.x += deltaX
      newRect.width -= deltaX
    }
    if (resizeDirection.value.includes('e')) {
      newRect.width += deltaX
    }
    
    // 最小尺寸限制
    const minWidth = 300
    const minHeight = 200
    
    if (newRect.width < minWidth) {
      if (resizeDirection.value.includes('w')) {
        newRect.x = newRect.x + newRect.width - minWidth
      }
      newRect.width = minWidth
    }
    
    if (newRect.height < minHeight) {
      if (resizeDirection.value.includes('n')) {
        newRect.y = newRect.y + newRect.height - minHeight
      }
      newRect.height = minHeight
    }
    
    // 边界检查
    newRect.x = Math.max(0, newRect.x)
    newRect.y = Math.max(0, newRect.y)
    
    emit('move', props.window, { x: newRect.x, y: newRect.y })
    emit('resize', props.window, { width: newRect.width, height: newRect.height })
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  resizeDirection.value = ''
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

onMounted(() => {
  // 窗口创建时自动获得焦点
  emit('focus', props.window)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.window-frame {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s ease-in-out;
}

.window-frame.active {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.window-frame.maximized {
  border-radius: 0;
}

.window-titlebar {
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: move;
  user-select: none;
}

.window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.window-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-button {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn:hover {
  background: #ef4444;
}

.window-content {
  height: calc(100% - 32px);
  overflow: auto;
  background: white;
}

.placeholder-content {
  padding: 20px;
  text-align: center;
  color: #666;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
}

.resize-n, .resize-s {
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
}

.resize-n { top: -2px; }
.resize-s { bottom: -2px; }

.resize-e, .resize-w {
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
}

.resize-e { right: -2px; }
.resize-w { left: -2px; }

.resize-ne, .resize-nw, .resize-se, .resize-sw {
  width: 8px;
  height: 8px;
}

.resize-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.resize-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
</style>