<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      ref="menuRef"
      :class="[
        'fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50',
        `theme-${config.theme || 'auto'}`
      ]"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <template v-for="(item, index) in visibleItems" :key="item.id || index">
        <!-- 分隔符 -->
        <div
          v-if="item.type === 'separator'"
          class="h-px bg-gray-200 dark:bg-gray-600 mx-2 my-1"
        />
        
        <!-- 普通菜单项 -->
        <div
          v-else
          :class="[
            'relative flex items-center px-3 py-2 text-sm cursor-pointer select-none',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            item.disabled ? 'opacity-50 cursor-not-allowed' : '',
            state.activeItem?.id === item.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
          ]"
          @click="handleItemClick(item, $event)"
          @mouseenter="handleItemHover(item)"
          @mouseleave="handleItemLeave(item)"
        >
          <!-- 图标 -->
          <div
            v-if="config.showIcons !== false"
            class="w-4 h-4 mr-3 flex-shrink-0 flex items-center justify-center"
          >
            <component
              v-if="item.icon && typeof item.icon === 'object'"
              :is="item.icon"
              class="w-4 h-4"
            />
            <img
              v-else-if="item.icon && typeof item.icon === 'string'"
              :src="item.icon"
              :alt="item.label"
              class="w-4 h-4 object-contain"
            />
            <!-- 复选框 -->
            <div
              v-else-if="item.type === 'checkbox'"
              class="w-3 h-3 border border-gray-400 rounded-sm flex items-center justify-center"
              :class="item.checked ? 'bg-blue-500 border-blue-500' : ''"
            >
              <svg
                v-if="item.checked"
                class="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <!-- 单选框 -->
            <div
              v-else-if="item.type === 'radio'"
              class="w-3 h-3 border border-gray-400 rounded-full flex items-center justify-center"
              :class="item.checked ? 'border-blue-500' : ''"
            >
              <div
                v-if="item.checked"
                class="w-1.5 h-1.5 bg-blue-500 rounded-full"
              />
            </div>
          </div>
          
          <!-- 标签 -->
          <span class="flex-1 truncate">{{ item.label }}</span>
          
          <!-- 快捷键 -->
          <span
            v-if="config.showAccelerators !== false && item.accelerator"
            class="ml-4 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ item.accelerator }}
          </span>
          
          <!-- 子菜单箭头 -->
          <svg
            v-if="item.submenu && item.submenu.length > 0"
            class="w-3 h-3 ml-2 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </template>
    </div>
    
    <!-- 子菜单 -->
    <LContextMenu
      v-if="activeSubmenu"
      :config="submenuConfig"
      :state="submenuState"
      @itemClick="handleSubmenuItemClick"
      @hide="handleSubmenuHide"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type {
  MenuItem,
  ContextMenuConfig,
  ContextMenuState,
  MenuPosition
} from '../types'

interface Props {
  config: ContextMenuConfig
  state: ContextMenuState
}

const props = defineProps<Props>()
const emit = defineEmits([
  'show',
  'hide',
  'itemClick',
  'itemHover',
  'submenuShow',
  'submenuHide'
])

// 引用
const menuRef = ref<HTMLElement>()

// 子菜单状态
const activeSubmenu = ref<MenuItem | null>(null)
const submenuConfig = ref<ContextMenuConfig>({
  items: [],
  theme: 'auto',
  showIcons: true,
  showAccelerators: true,
  zIndex: 1000
})
const submenuState = reactive<ContextMenuState>({
  visible: false,
  position: { x: 0, y: 0 },
  openSubmenuPath: []
})

// 计算属性
const visibleItems = computed(() => {
  return props.config.items.filter(item => item.visible !== false)
})

const menuStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.state.position.x}px`,
    top: `${props.state.position.y}px`,
    zIndex: String(props.config.zIndex || 1000)
  }
  
  if (props.config.minWidth) {
    style.minWidth = `${props.config.minWidth}px`
  }
  if (props.config.maxWidth) {
    style.maxWidth = `${props.config.maxWidth}px`
  }
  if (props.config.maxHeight) {
    style.maxHeight = `${props.config.maxHeight}px`
    style.overflowY = 'auto'
  }
  
  return style
})

// 监听菜单显示状态
watch(() => props.state.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      adjustMenuPosition()
    })
  } else {
    hideSubmenu()
  }
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('contextmenu', handleDocumentContextMenu)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('contextmenu', handleDocumentContextMenu)
  document.removeEventListener('keydown', handleKeyDown)
})

/**
 * 调整菜单位置，确保不超出屏幕
 */
const adjustMenuPosition = (): void => {
  if (!menuRef.value) return
  
  const rect = menuRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let { x, y } = props.state.position
  
  // 水平方向调整
  if (x + rect.width > viewportWidth) {
    x = viewportWidth - rect.width - 10
  }
  if (x < 10) {
    x = 10
  }
  
  // 垂直方向调整
  if (y + rect.height > viewportHeight) {
    y = viewportHeight - rect.height - 10
  }
  if (y < 10) {
    y = 10
  }
  
  // 更新位置
  if (x !== props.state.position.x || y !== props.state.position.y) {
    props.state.position.x = x
    props.state.position.y = y
  }
}

/**
 * 处理菜单项点击
 */
const handleItemClick = (item: MenuItem, event: MouseEvent): void => {
  if (item.disabled) return
  
  // 处理复选框
  if (item.type === 'checkbox') {
    item.checked = !item.checked
  }
  
  // 处理单选框
  if (item.type === 'radio' && item.radioGroup) {
    // 取消同组其他项的选中状态
    props.config.items.forEach(menuItem => {
      if (menuItem.type === 'radio' && menuItem.radioGroup === item.radioGroup) {
        menuItem.checked = false
      }
    })
    item.checked = true
  }
  
  // 如果有子菜单，显示子菜单
  if (item.submenu && item.submenu.length > 0) {
    showSubmenu(item, event)
    return
  }
  
  // 执行点击处理函数
  if (item.click) {
    item.click(item, event)
  }
  
  emit('itemClick', item, event)
  
  // 隐藏菜单
  emit('hide')
}

/**
 * 处理菜单项悬停
 */
const handleItemHover = (item: MenuItem): void => {
  props.state.activeItem = item
  emit('itemHover', item)
  
  // 如果有子菜单，延迟显示
  if (item.submenu && item.submenu.length > 0) {
    setTimeout(() => {
      if (props.state.activeItem === item) {
        showSubmenu(item)
      }
    }, 300)
  } else {
    hideSubmenu()
  }
}

/**
 * 处理菜单项离开
 */
const handleItemLeave = (item: MenuItem): void => {
  // 延迟清除激活状态，给子菜单显示留时间
  setTimeout(() => {
    if (props.state.activeItem === item && !activeSubmenu.value) {
      props.state.activeItem = undefined
    }
  }, 100)
}

/**
 * 显示子菜单
 */
const showSubmenu = (item: MenuItem, event?: MouseEvent): void => {
  if (!item.submenu || item.submenu.length === 0) return
  
  const menuRect = menuRef.value?.getBoundingClientRect()
  if (!menuRect) return
  
  activeSubmenu.value = item
  submenuConfig.value = {
    ...props.config,
    items: item.submenu
  }
  
  submenuState.visible = true
  submenuState.position = {
    x: menuRect.right,
    y: menuRect.top
  }
  
  emit('submenuShow', item)
}

/**
 * 隐藏子菜单
 */
const hideSubmenu = (): void => {
  if (activeSubmenu.value) {
    emit('submenuHide', activeSubmenu.value)
  }
  
  activeSubmenu.value = null
  submenuState.visible = false
}

/**
 * 处理子菜单项点击
 */
const handleSubmenuItemClick = (item: MenuItem, event: MouseEvent): void => {
  // 将子菜单项点击事件转发到父级
  emit('itemClick', item, event)
  // 隐藏整个菜单
  emit('hide')
}

/**
 * 处理子菜单隐藏
 */
const handleSubmenuHide = (): void => {
  hideSubmenu()
}

/**
 * 处理文档点击
 */
const handleDocumentClick = (event: MouseEvent): void => {
  if (!menuRef.value?.contains(event.target as Node)) {
    emit('hide')
  }
}

/**
 * 处理文档右键
 */
const handleDocumentContextMenu = (event: MouseEvent): void => {
  if (!menuRef.value?.contains(event.target as Node)) {
    emit('hide')
  }
}

/**
 * 处理键盘事件
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  if (!props.state.visible) return
  
  switch (event.key) {
    case 'Escape':
      emit('hide')
      break
    case 'ArrowUp':
      navigateMenu(-1)
      event.preventDefault()
      break
    case 'ArrowDown':
      navigateMenu(1)
      event.preventDefault()
      break
    case 'Enter':
      if (props.state.activeItem) {
        handleItemClick(props.state.activeItem, event as any)
      }
      event.preventDefault()
      break
  }
}

/**
 * 键盘导航菜单
 */
const navigateMenu = (direction: number): void => {
  const items = visibleItems.value.filter(item => 
    item.type !== 'separator' && !item.disabled
  )
  
  if (items.length === 0) return
  
  const currentIndex = props.state.activeItem 
    ? items.findIndex(item => item.id === props.state.activeItem?.id)
    : -1
  
  let nextIndex = currentIndex + direction
  
  if (nextIndex < 0) {
    nextIndex = items.length - 1
  } else if (nextIndex >= items.length) {
    nextIndex = 0
  }
  
  props.state.activeItem = items[nextIndex]
}
</script>

<style scoped>
.theme-dark {
  @apply bg-gray-800 border-gray-700;
}

.theme-light {
  @apply bg-white border-gray-200;
}

.theme-auto {
  @apply bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700;
}
</style>