<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden">
    <!-- 顶部信息栏 -->
    <TopBar />
    
    <!-- 主桌面区域 -->
    <div class="flex-1 relative desktop-grid" @contextmenu.prevent="handleDesktopRightClick">
      <!-- 桌面图标和小组件 -->
      <div
        v-for="item in desktopItems"
        :key="item.id"
        :style="getItemStyle(item)"
        class="absolute cursor-pointer"
        @click="handleItemClick(item)"
        @dblclick="handleItemDoubleClick(item)"
        @contextmenu.prevent="handleItemRightClick(item, $event)"
      >
        <!-- 应用图标 -->
        <DesktopIcon
          v-if="item.type === 'app-icon'"
          :app-id="item.appId!"
          :selected="selectedItems.includes(item.id)"
        />
        
        <!-- 小组件 -->
        <DesktopWidget
          v-else-if="item.type === 'widget'"
          :widget-id="item.widgetId!"
          :size="item.size"
        />
        
        <!-- 文件夹 -->
        <DesktopFolder
          v-else-if="item.type === 'folder'"
          :folder-id="item.folderId!"
          :selected="selectedItems.includes(item.id)"
        />
      </div>
      
      <!-- 选择框 -->
      <SelectionBox
        v-if="isSelecting"
        :start="selectionStart"
        :end="selectionEnd"
      />
    </div>
    
    <!-- 底部任务栏 -->
    <TaskBar />
    
    <!-- 窗口容器 -->
    <WindowContainer />
    
    <!-- 右键菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @close="closeContextMenu"
      @select="handleContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DesktopItem, Position } from '@linglongos/shared-types'
import { useDesktopStore } from '../stores/desktop'
import { useWindowStore } from '../stores/window'
import TopBar from '../components/TopBar.vue'
import TaskBar from '../components/TaskBar.vue'
import DesktopIcon from '../components/DesktopIcon.vue'
import DesktopWidget from '../components/DesktopWidget.vue'
import DesktopFolder from '../components/DesktopFolder.vue'
import SelectionBox from '../components/SelectionBox.vue'
import WindowContainer from '../components/WindowContainer.vue'
import ContextMenu from '../components/ContextMenu.vue'

const desktopStore = useDesktopStore()
const windowStore = useWindowStore()

// 桌面项目
const desktopItems = computed(() => desktopStore.desktopItems)

// 选中的项目
const selectedItems = ref<string[]>([])

// 选择框相关
const isSelecting = ref(false)
const selectionStart = ref<Position>({ x: 0, y: 0 })
const selectionEnd = ref<Position>({ x: 0, y: 0 })

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as Array<{ id: string; label: string; icon?: string; action: () => void }>,
})

onMounted(() => {
  // 加载桌面配置
  desktopStore.loadDesktopConfig()
  
  // 添加全局事件监听
  document.addEventListener('mousedown', handleGlobalMouseDown)
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  // 移除全局事件监听
  document.removeEventListener('mousedown', handleGlobalMouseDown)
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  document.removeEventListener('keydown', handleGlobalKeyDown)
})

/**
 * 获取桌面项目的样式
 */
const getItemStyle = (item: DesktopItem) => {
  const gridSize = 80 // 网格大小
  return {
    left: `${item.position.x * gridSize}px`,
    top: `${item.position.y * gridSize}px`,
    width: item.size ? `${item.size.width * gridSize}px` : 'auto',
    height: item.size ? `${item.size.height * gridSize}px` : 'auto',
  }
}

/**
 * 处理项目点击
 */
const handleItemClick = (item: DesktopItem): void => {
  // 清除之前的选择
  selectedItems.value = [item.id]
}

/**
 * 处理项目双击
 */
const handleItemDoubleClick = (item: DesktopItem): void => {
  if (item.type === 'app-icon' && item.appId) {
    // 打开应用
    windowStore.openApp(item.appId)
  } else if (item.type === 'folder' && item.folderId) {
    // 打开文件夹
    console.log('打开文件夹:', item.folderId)
  }
}

/**
 * 处理项目右键点击
 */
const handleItemRightClick = (item: DesktopItem, event: MouseEvent): void => {
  selectedItems.value = [item.id]
  
  const menuItems = [
    { id: 'open', label: '打开', icon: 'open', action: () => handleItemDoubleClick(item) },
    { id: 'rename', label: '重命名', icon: 'edit', action: () => console.log('重命名') },
    { id: 'delete', label: '删除', icon: 'delete', action: () => console.log('删除') },
  ]
  
  showContextMenu(event.clientX, event.clientY, menuItems)
}

/**
 * 处理桌面右键点击
 */
const handleDesktopRightClick = (event: MouseEvent): void => {
  selectedItems.value = []
  
  const menuItems = [
    { id: 'refresh', label: '刷新', icon: 'refresh', action: () => location.reload() },
    { id: 'new-folder', label: '新建文件夹', icon: 'folder', action: () => console.log('新建文件夹') },
    { id: 'paste', label: '粘贴', icon: 'paste', action: () => console.log('粘贴') },
    { id: 'settings', label: '个性化', icon: 'settings', action: () => console.log('个性化') },
  ]
  
  showContextMenu(event.clientX, event.clientY, menuItems)
}

/**
 * 显示右键菜单
 */
const showContextMenu = (x: number, y: number, items: typeof contextMenu.value.items): void => {
  contextMenu.value = {
    visible: true,
    x,
    y,
    items,
  }
}

/**
 * 关闭右键菜单
 */
const closeContextMenu = (): void => {
  contextMenu.value.visible = false
}

/**
 * 处理右键菜单选择
 */
const handleContextMenuSelect = (itemId: string): void => {
  const menuItem = contextMenu.value.items.find(item => item.id === itemId)
  if (menuItem) {
    menuItem.action()
  }
  closeContextMenu()
}

/**
 * 全局鼠标按下事件
 */
const handleGlobalMouseDown = (event: MouseEvent): void => {
  // 如果点击的是桌面空白区域，开始选择
  if (event.target === event.currentTarget) {
    isSelecting.value = true
    selectionStart.value = { x: event.clientX, y: event.clientY }
    selectionEnd.value = { x: event.clientX, y: event.clientY }
    selectedItems.value = []
  }
  
  // 关闭右键菜单
  if (contextMenu.value.visible) {
    closeContextMenu()
  }
}

/**
 * 全局鼠标移动事件
 */
const handleGlobalMouseMove = (event: MouseEvent): void => {
  if (isSelecting.value) {
    selectionEnd.value = { x: event.clientX, y: event.clientY }
  }
}

/**
 * 全局鼠标释放事件
 */
const handleGlobalMouseUp = (): void => {
  if (isSelecting.value) {
    isSelecting.value = false
    // 这里可以添加选择框内项目的选择逻辑
  }
}

/**
 * 全局键盘事件
 */
const handleGlobalKeyDown = (event: KeyboardEvent): void => {
  // ESC键关闭右键菜单
  if (event.key === 'Escape' && contextMenu.value.visible) {
    closeContextMenu()
  }
  
  // Delete键删除选中项目
  if (event.key === 'Delete' && selectedItems.value.length > 0) {
    console.log('删除选中项目:', selectedItems.value)
  }
  
  // Ctrl+A全选
  if (event.ctrlKey && event.key === 'a') {
    event.preventDefault()
    selectedItems.value = desktopItems.value.map(item => item.id)
  }
}
</script>

<style scoped>
.desktop-grid {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 80px 80px;
}
</style>