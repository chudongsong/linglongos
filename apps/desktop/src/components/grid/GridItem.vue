<template>
  <div
    ref="itemRef"
    class="grid-item"
    :class="itemClasses"
    :draggable="isDraggable"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 选中状态指示器 -->
    <div v-if="isSelected" class="selection-indicator" />
    
    <!-- 锁定状态指示器 -->
    <div v-if="item.general.locked" class="lock-indicator">
      <LockIcon class="w-3 h-3" />
    </div>

    <!-- 应用图标 -->
    <div class="item-icon" :class="iconClasses">
      <!-- 自定义图标 -->
      <img
        v-if="appInfo?.icon && !iconError"
        :src="appInfo.icon"
        :alt="displayName"
        class="icon-image"
        @error="handleIconError"
      />
      
      <!-- 默认图标 -->
      <component
        v-else
        :is="defaultIcon"
        class="default-icon"
        :class="defaultIconClasses"
      />
      
      <!-- 文件类型标识 -->
      <div v-if="item.type === 'files' && item.metadata.ext_name" class="file-extension">
        {{ item.metadata.ext_name.toUpperCase() }}
      </div>
    </div>

    <!-- 项目标题 -->
    <div class="item-title" :class="titleClasses">
      <span class="title-text">{{ displayName }}</span>
    </div>

    <!-- 拖拽预览叠加层 -->
    <div v-if="isDragging" class="drag-overlay" />

    <!-- 悬停工具提示 -->
    <div v-if="showTooltip && isHovered" class="tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="tooltip-title">{{ displayName }}</div>
        <div v-if="appInfo?.description" class="tooltip-description">
          {{ appInfo.description }}
        </div>
        <div v-if="item.type === 'files'" class="tooltip-meta">
          <div>类型: {{ getFileTypeDescription() }}</div>
          <div v-if="item.data.size">大小: {{ formatFileSize(item.data.size) }}</div>
        </div>
        <div class="tooltip-position">
          位置: ({{ item.position.x }}, {{ item.position.y }})
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  FolderIcon, 
  FileIcon, 
  ImageIcon, 
  FileTextIcon,
  TerminalIcon,
  SettingsIcon,
  CalculatorIcon,
  BrowserIcon,
  LockIcon
} from 'lucide-vue-next'
import type { GridItem, GridConfig, DesktopApp } from '@/types/grid'

/**
 * 网格项组件
 * @description 单个网格项的渲染和交互
 */

// Props
interface Props {
  /** 网格项数据 */
  item: GridItem
  /** 网格配置 */
  gridConfig: GridConfig
  /** 是否选中 */
  isSelected?: boolean
  /** 是否正在拖拽 */
  isDragging?: boolean
  /** 关联的应用信息 */
  appInfo?: DesktopApp
  /** 是否显示工具提示 */
  showTooltip?: boolean
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 图标大小 */
  iconSize?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isDragging: false,
  showTooltip: true,
  enableDrag: true,
  iconSize: 'medium'
})

// Emits
interface Emits {
  (e: 'click', event: MouseEvent): void
  (e: 'double-click', event: MouseEvent): void
  (e: 'context-menu', event: MouseEvent): void
  (e: 'drag-start', event: DragEvent): void
  (e: 'drag-end', event: DragEvent): void
  (e: 'hover', isHovered: boolean): void
}

const emit = defineEmits<Emits>()

// Refs
const itemRef = ref<HTMLElement>()

// Reactive data
const isHovered = ref(false)
const iconError = ref(false)
const isLoading = ref(false)

// 计算属性
/**
 * 显示名称
 */
const displayName = computed(() => {
  return props.item.data.title || props.appInfo?.name || '未知项目'
})

/**
 * 是否可拖拽
 */
const isDraggable = computed(() => {
  return props.enableDrag && !props.item.general.locked
})

/**
 * 项目样式类
 */
const itemClasses = computed(() => ({
  'grid-item--selected': props.isSelected,
  'grid-item--dragging': props.isDragging,
  'grid-item--locked': props.item.general.locked,
  'grid-item--hovered': isHovered.value,
  'grid-item--file': props.item.type === 'files',
  'grid-item--app': props.item.type === 'apps',
  [`grid-item--${props.iconSize}`]: true
}))

/**
 * 图标样式类
 */
const iconClasses = computed(() => ({
  'icon--loading': isLoading.value,
  'icon--error': iconError.value
}))

/**
 * 标题样式类
 */
const titleClasses = computed(() => ({
  'title--selected': props.isSelected,
  'title--truncated': displayName.value.length > 12
}))

/**
 * 默认图标
 */
const defaultIcon = computed(() => {
  if (props.item.type === 'files') {
    const ext = props.item.metadata.ext_name?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return ImageIcon
    }
    if (['txt', 'md', 'doc', 'docx'].includes(ext || '')) {
      return FileTextIcon
    }
    return FileIcon
  }

  // 应用图标
  switch (props.item.appId) {
    case 'app-file-manager':
      return FolderIcon
    case 'app-terminal':
      return TerminalIcon
    case 'app-settings':
      return SettingsIcon
    case 'app-calculator':
      return CalculatorIcon
    case 'app-browser':
      return BrowserIcon
    default:
      return FileIcon
  }
})

/**
 * 默认图标样式类
 */
const defaultIconClasses = computed(() => {
  const size = props.iconSize
  return {
    'w-8 h-8': size === 'small',
    'w-12 h-12': size === 'medium',
    'w-16 h-16': size === 'large'
  }
})

/**
 * 工具提示样式
 */
const tooltipStyle = computed(() => ({
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: '8px',
  zIndex: 1000
}))

// 方法
/**
 * 处理点击事件
 */
const handleClick = (event: MouseEvent): void => {
  event.stopPropagation()
  emit('click', event)
}

/**
 * 处理双击事件
 */
const handleDoubleClick = (event: MouseEvent): void => {
  event.stopPropagation()
  emit('double-click', event)
}

/**
 * 处理右键菜单
 */
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  event.stopPropagation()
  emit('context-menu', event)
}

/**
 * 处理拖拽开始
 */
const handleDragStart = (event: DragEvent): void => {
  if (!isDraggable.value) {
    event.preventDefault()
    return
  }

  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({
      itemId: props.item.id,
      type: 'grid-item'
    }))

    // 创建拖拽预览
    const dragImage = createDragPreview()
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, 32, 32)
    }
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
 * 处理鼠标进入
 */
const handleMouseEnter = (): void => {
  isHovered.value = true
  emit('hover', true)
}

/**
 * 处理鼠标离开
 */
const handleMouseLeave = (): void => {
  isHovered.value = false
  emit('hover', false)
}

/**
 * 处理图标加载错误
 */
const handleIconError = (): void => {
  iconError.value = true
}

/**
 * 创建拖拽预览
 */
const createDragPreview = (): HTMLElement | null => {
  if (!itemRef.value) return null

  const preview = itemRef.value.cloneNode(true) as HTMLElement
  preview.style.transform = 'rotate(5deg)'
  preview.style.opacity = '0.8'
  preview.style.pointerEvents = 'none'
  
  // 临时添加到body以生成预览
  document.body.appendChild(preview)
  setTimeout(() => {
    document.body.removeChild(preview)
  }, 0)
  
  return preview
}

/**
 * 获取文件类型描述
 */
const getFileTypeDescription = (): string => {
  const ext = props.item.metadata.ext_name?.toLowerCase()
  
  const typeMap: Record<string, string> = {
    'txt': '文本文件',
    'md': 'Markdown文档',
    'jpg': 'JPEG图片',
    'jpeg': 'JPEG图片',
    'png': 'PNG图片',
    'gif': 'GIF图片',
    'svg': 'SVG矢量图',
    'pdf': 'PDF文档',
    'doc': 'Word文档',
    'docx': 'Word文档',
    'xls': 'Excel表格',
    'xlsx': 'Excel表格',
    'zip': '压缩文件',
    'rar': '压缩文件'
  }
  
  return typeMap[ext || ''] || '文件'
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 模拟加载状态
 */
const simulateLoading = async (): Promise<void> => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  isLoading.value = false
}

// 生命周期
onMounted(() => {
  // 如果有远程图标，预加载
  if (props.appInfo?.icon) {
    const img = new Image()
    img.onload = () => {
      iconError.value = false
    }
    img.onerror = () => {
      iconError.value = true
    }
    img.src = props.appInfo.icon
  }
})

// 暴露给父组件的方法
defineExpose({
  element: itemRef,
  simulateLoading
})
</script>

<style scoped>
.grid-item {
  @apply relative flex flex-col items-center justify-center;
  @apply bg-transparent hover:bg-black/5 dark:hover:bg-white/5;
  @apply rounded-lg transition-all duration-200 ease-in-out;
  @apply cursor-pointer select-none;
  @apply border-2 border-transparent;
  user-select: none;
  -webkit-user-select: none;
}

/* 尺寸变体 */
.grid-item--small {
  @apply text-xs;
}

.grid-item--medium {
  @apply text-sm;
}

.grid-item--large {
  @apply text-base;
}

/* 状态样式 */
.grid-item--selected {
  @apply bg-blue-100 dark:bg-blue-900/30;
  @apply border-blue-500;
}

.grid-item--hovered {
  @apply bg-gray-100 dark:bg-gray-800/50;
}

.grid-item--dragging {
  @apply opacity-50 scale-95;
  @apply shadow-lg;
}

.grid-item--locked {
  @apply opacity-75;
}

.grid-item--locked:hover {
  @apply cursor-not-allowed;
}

/* 选中指示器 */
.selection-indicator {
  @apply absolute inset-0 rounded-lg;
  @apply bg-blue-500/20 border-2 border-blue-500;
  @apply pointer-events-none;
}

/* 锁定指示器 */
.lock-indicator {
  @apply absolute top-1 right-1;
  @apply bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800;
  @apply rounded-full p-1;
  @apply z-10;
}

/* 图标容器 */
.item-icon {
  @apply relative flex items-center justify-center;
  @apply w-12 h-12 mb-2;
  @apply rounded-lg;
}

.icon-image {
  @apply w-full h-full object-contain;
  @apply rounded-lg;
}

.default-icon {
  @apply text-gray-600 dark:text-gray-300;
}

.icon--loading .default-icon {
  @apply animate-pulse;
}

.icon--error .default-icon {
  @apply text-red-500;
}

/* 文件扩展名标识 */
.file-extension {
  @apply absolute -bottom-1 -right-1;
  @apply bg-blue-500 text-white text-xs;
  @apply px-1 py-0.5 rounded;
  @apply font-bold;
  @apply min-w-[20px] text-center;
}

/* 项目标题 */
.item-title {
  @apply text-center text-gray-700 dark:text-gray-300;
  @apply font-medium leading-tight;
  @apply w-full px-1;
}

.title-text {
  @apply block;
  @apply overflow-hidden text-ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.title--selected {
  @apply text-blue-700 dark:text-blue-300;
  @apply font-semibold;
}

.title--truncated .title-text {
  -webkit-line-clamp: 1;
}

/* 拖拽叠加层 */
.drag-overlay {
  @apply absolute inset-0 rounded-lg;
  @apply bg-blue-500/30 border-2 border-blue-500 border-dashed;
  @apply pointer-events-none;
}

/* 工具提示 */
.tooltip {
  @apply pointer-events-none;
  animation: fadeIn 0.2s ease-out;
}

.tooltip-content {
  @apply bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900;
  @apply px-3 py-2 rounded-lg shadow-lg;
  @apply text-sm whitespace-nowrap;
  @apply border border-gray-700 dark:border-gray-300;
}

.tooltip-title {
  @apply font-semibold mb-1;
}

.tooltip-description {
  @apply text-gray-300 dark:text-gray-600 mb-1;
}

.tooltip-meta {
  @apply text-gray-400 dark:text-gray-500 text-xs;
  @apply border-t border-gray-700 dark:border-gray-300 pt-1 mt-1;
}

.tooltip-position {
  @apply text-gray-500 dark:text-gray-400 text-xs;
  @apply mt-1;
}

/* 加载状态 */
.loading-overlay {
  @apply absolute inset-0 rounded-lg;
  @apply bg-white/80 dark:bg-gray-900/80;
  @apply flex items-center justify-center;
  @apply pointer-events-none;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-blue-500 border-t-transparent;
  @apply rounded-full animate-spin;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 类型特定样式 */
.grid-item--file .item-icon {
  @apply bg-gray-100 dark:bg-gray-800;
}

.grid-item--app .item-icon {
  @apply bg-gradient-to-br from-blue-50 to-blue-100;
  @apply dark:from-blue-900/20 dark:to-blue-800/20;
}

/* 悬停效果增强 */
.grid-item:hover .item-icon {
  @apply scale-105;
}

.grid-item:hover .item-title {
  @apply text-gray-900 dark:text-gray-100;
}

/* 焦点样式（键盘导航） */
.grid-item:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
  @apply ring-offset-transparent;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .grid-item {
    @apply border border-gray-400;
  }
  
  .grid-item--selected {
    @apply border-blue-600 border-2;
  }
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .grid-item,
  .item-icon,
  .loading-spinner {
    @apply transition-none;
    animation: none !important;
  }
}
</style>