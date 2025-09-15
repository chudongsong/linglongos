<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent
    >
      <div class="context-menu-content">
        <template v-for="(item, index) in items" :key="index">
          <!-- 分割线 -->
          <div v-if="item.type === 'separator'" class="menu-separator" />
          
          <!-- 菜单项 -->
          <div
            v-else
            class="menu-item"
            :class="menuItemClasses(item)"
            @click="handleItemClick(item)"
            @mouseenter="handleItemHover(item)"
            @mouseleave="handleItemLeave(item)"
          >
            <!-- 图标 -->
            <div v-if="item.icon" class="menu-item-icon">
              <component :is="getIcon(item.icon)" class="w-4 h-4" />
            </div>
            
            <!-- 标签 -->
            <span class="menu-item-label">{{ item.label }}</span>
            
            <!-- 快捷键 -->
            <span v-if="item.shortcut" class="menu-item-shortcut">
              {{ item.shortcut }}
            </span>
            
            <!-- 子菜单箭头 -->
            <ChevronRightIcon v-if="item.children" class="menu-item-arrow w-4 h-4" />
          </div>
          
          <!-- 子菜单 -->
          <ContextMenu
            v-if="item.children && hoveredItem === item"
            :visible="true"
            :x="submenuX"
            :y="submenuY"
            :items="item.children"
            @select="handleSubmenuSelect"
            @close="handleSubmenuClose"
          />
        </template>
      </div>
    </div>
    
    <!-- 背景遮罩 -->
    <div
      v-if="visible"
      class="context-menu-backdrop"
      @click="handleBackdropClick"
      @contextmenu.prevent="handleBackdropClick"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  ChevronRightIcon,
  FolderIcon,
  FileIcon,
  TrashIcon,
  CopyIcon,
  ScissorsIcon,
  ClipboardIcon,
  SettingsIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  LockIcon,
  UnlockIcon,
  CheckSquareIcon,
  FolderPlusIcon,
  GridIcon
} from 'lucide-vue-next'

/**
 * 右键菜单组件
 * @description 提供上下文相关的操作菜单
 */

// 菜单项类型定义
interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  type?: 'item' | 'separator'
  children?: MenuItem[]
}

// Props
interface Props {
  /** 是否显示菜单 */
  visible: boolean
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 菜单项 */
  items: MenuItem[]
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度 */
  maxWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 200,
  maxWidth: 300
})

// Emits
interface Emits {
  (e: 'select', itemId: string): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// Refs
const menuRef = ref<HTMLElement>()

// Reactive data
const hoveredItem = ref<MenuItem | null>(null)
const submenuX = ref(0)
const submenuY = ref(0)

// 计算属性
/**
 * 菜单样式
 */
const menuStyle = computed(() => {
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${props.x}px`,
    top: `${props.y}px`,
    minWidth: `${props.minWidth}px`,
    maxWidth: `${props.maxWidth}px`,
    zIndex: '9999'
  }

  return style
})

// 方法
/**
 * 获取图标组件
 */
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'folder': FolderIcon,
    'file': FileIcon,
    'trash-2': TrashIcon,
    'copy': CopyIcon,
    'scissors': ScissorsIcon,
    'clipboard': ClipboardIcon,
    'settings': SettingsIcon,
    'refresh-cw': RefreshCwIcon,
    'external-link': ExternalLinkIcon,
    'lock': LockIcon,
    'unlock': UnlockIcon,
    'check-square': CheckSquareIcon,
    'folder-plus': FolderPlusIcon,
    'grid': GridIcon
  }
  
  return iconMap[iconName] || FileIcon
}

/**
 * 获取菜单项样式类
 */
const menuItemClasses = (item: MenuItem) => ({
  'menu-item--disabled': item.disabled,
  'menu-item--danger': item.danger,
  'menu-item--hovered': hoveredItem.value === item
})

/**
 * 处理菜单项点击
 */
const handleItemClick = (item: MenuItem): void => {
  if (item.disabled) return
  
  emit('select', item.id)
  emit('close')
}

/**
 * 处理菜单项悬停
 */
const handleItemHover = (item: MenuItem): void => {
  if (item.children) {
    hoveredItem.value = item
    
    // 计算子菜单位置
    nextTick(() => {
      if (menuRef.value) {
        const rect = menuRef.value.getBoundingClientRect()
        submenuX.value = rect.right
        submenuY.value = rect.top
      }
    })
  } else {
    hoveredItem.value = null
  }
}

/**
 * 处理菜单项离开
 */
const handleItemLeave = (item: MenuItem): void => {
  // 延迟清除悬停状态，给用户时间移动到子菜单
  setTimeout(() => {
    if (hoveredItem.value === item) {
      hoveredItem.value = null
    }
  }, 100)
}

/**
 * 处理子菜单选择
 */
const handleSubmenuSelect = (itemId: string): void => {
  emit('select', itemId)
  emit('close')
}

/**
 * 处理子菜单关闭
 */
const handleSubmenuClose = (): void => {
  hoveredItem.value = null
}

/**
 * 处理背景点击
 */
const handleBackdropClick = (): void => {
  emit('close')
}

/**
 * 调整菜单位置以确保在视口内
 */
const adjustPosition = (): void => {
  if (!menuRef.value) return

  const menu = menuRef.value
  const rect = menu.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let { x, y } = props

  // 水平位置调整
  if (rect.right > viewport.width) {
    x = viewport.width - rect.width - 10
  }
  if (x < 10) {
    x = 10
  }

  // 垂直位置调整
  if (rect.bottom > viewport.height) {
    y = viewport.height - rect.height - 10
  }
  if (y < 10) {
    y = 10
  }

  menu.style.left = `${x}px`
  menu.style.top = `${y}px`
}

/**
 * 处理键盘事件
 */
const handleKeydown = (event: KeyboardEvent): void => {
  if (!props.visible) return

  switch (event.key) {
    case 'Escape':
      emit('close')
      event.preventDefault()
      break
    case 'ArrowUp':
    case 'ArrowDown':
      // TODO: 实现键盘导航
      event.preventDefault()
      break
    case 'Enter':
      // TODO: 选择当前聚焦项
      event.preventDefault()
      break
  }
}

// 监听器
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      adjustPosition()
    })
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.context-menu {
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg;
  @apply py-1;
  @apply backdrop-blur-sm;
  animation: menuFadeIn 0.15s ease-out;
}

.context-menu-content {
  @apply min-w-full;
}

.menu-item {
  @apply flex items-center px-3 py-2;
  @apply text-gray-700 dark:text-gray-300;
  @apply text-sm cursor-pointer;
  @apply transition-colors duration-150;
  @apply relative;
}

.menu-item:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

.menu-item--disabled {
  @apply text-gray-400 dark:text-gray-500;
  @apply cursor-not-allowed;
}

.menu-item--disabled:hover {
  @apply bg-transparent;
}

.menu-item--danger {
  @apply text-red-600 dark:text-red-400;
}

.menu-item--danger:hover {
  @apply bg-red-50 dark:bg-red-900/20;
}

.menu-item--hovered {
  @apply bg-blue-50 dark:bg-blue-900/20;
  @apply text-blue-700 dark:text-blue-300;
}

.menu-item-icon {
  @apply flex-shrink-0 mr-3;
  @apply text-gray-500 dark:text-gray-400;
}

.menu-item--danger .menu-item-icon {
  @apply text-red-500 dark:text-red-400;
}

.menu-item-label {
  @apply flex-1 truncate;
}

.menu-item-shortcut {
  @apply ml-auto pl-4;
  @apply text-xs text-gray-400 dark:text-gray-500;
  @apply font-mono;
}

.menu-item-arrow {
  @apply ml-2 text-gray-400 dark:text-gray-500;
}

.menu-separator {
  @apply h-px bg-gray-200 dark:bg-gray-700;
  @apply my-1 mx-0;
}

.context-menu-backdrop {
  @apply fixed inset-0 z-[9998];
  @apply bg-transparent;
}

/* 动画 */
@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .context-menu {
    @apply border-2 border-black dark:border-white;
  }
  
  .menu-separator {
    @apply bg-black dark:bg-white;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .context-menu {
    animation: none;
  }
}

/* 确保菜单在移动设备上可见 */
@media (max-width: 640px) {
  .context-menu {
    @apply min-w-[160px] max-w-[250px];
  }
  
  .menu-item {
    @apply py-3;
  }
}
</style>