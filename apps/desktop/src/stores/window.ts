import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WindowState, AppInfo } from '@linglongos/shared-types'
import { getAllAppInfo, getAppComponent, getAppDefaultConfig } from '../utils/windowApps'

export const useWindowStore = defineStore('window', () => {
  // 状态
  const windows = ref<WindowState[]>([])
  const activeWindowId = ref<string | null>(null)
  const nextZIndex = ref(1000)

  // 计算属性
  const activeWindow = computed(() => {
    return windows.value.find(w => w.id === activeWindowId.value) || null
  })

  const visibleWindows = computed(() => {
    return windows.value.filter(w => !w.isMinimized)
  })

  /**
   * 打开应用
   */
  const openApp = (appId: string): void => {
    // 获取应用配置
    const appConfig = getAppDefaultConfig(appId)

    // 检查是否是单例应用
    if (appConfig.singleton) {
      const existingWindow = windows.value.find(w => w.appId === appId)
      if (existingWindow) {
        // 如果已经打开，则激活该窗口
        activateWindow(existingWindow.id)
        if (existingWindow.isMinimized) {
          restoreWindow(existingWindow.id)
        }
        return
      }
    }

    // 创建新窗口
    const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const appInfo = getAppInfo(appId)
    const appComponent = getAppComponent(appId)

    // 计算窗口位置（级联显示）
    const position = appConfig.position || {
      x: 100 + (windows.value.length % 10) * 30,
      y: 100 + (windows.value.length % 10) * 30,
    }

    // 使用应用默认大小或默认值
    const size = appConfig.size || { width: 800, height: 600 }

    const newWindow: WindowState = {
      id: windowId,
      appId,
      title: appInfo.name,
      position,
      size,
      isMaximized: false,
      isMinimized: false,
      isActive: true,
      zIndex: nextZIndex.value++,
      icon: appInfo.icon,
      component: appComponent,
      resizable: true,
      draggable: true,
    }

    windows.value.push(newWindow)
    activateWindow(windowId)
  }

  /**
   * 关闭窗口
   */
  const closeWindow = (windowId: string): void => {
    const index = windows.value.findIndex(w => w.id === windowId)
    if (index !== -1) {
      windows.value.splice(index, 1)

      // 如果关闭的是活动窗口，激活下一个窗口
      if (activeWindowId.value === windowId) {
        const nextWindow = windows.value[windows.value.length - 1]
        activeWindowId.value = nextWindow ? nextWindow.id : null
      }
    }
  }

  /**
   * 激活窗口
   */
  const activateWindow = (windowId: string): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      // 取消所有窗口的激活状态
      windows.value.forEach(w => {
        w.isActive = false
      })

      // 激活指定窗口
      window.isActive = true
      window.zIndex = nextZIndex.value++
      activeWindowId.value = windowId
    }
  }

  /**
   * 最小化窗口
   */
  const minimizeWindow = (windowId: string): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.isMinimized = true

      // 如果最小化的是活动窗口，激活下一个窗口
      if (activeWindowId.value === windowId) {
        const nextWindow = visibleWindows.value.find(w => w.id !== windowId)
        activeWindowId.value = nextWindow ? nextWindow.id : null
      }
    }
  }

  /**
   * 还原窗口
   */
  const restoreWindow = (windowId: string): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.isMinimized = false
      window.isMaximized = false
      activateWindow(windowId)
    }
  }

  /**
   * 最大化窗口
   */
  const maximizeWindow = (windowId: string): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.isMaximized = !window.isMaximized
      activateWindow(windowId)
    }
  }

  /**
   * 移动窗口
   */
  const moveWindow = (windowId: string, position: { x: number; y: number }): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.position = position
    }
  }

  /**
   * 调整窗口大小
   */
  const resizeWindow = (windowId: string, size: { width: number; height: number }): void => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.size = size
    }
  }

  /**
   * 获取应用信息
   */
  const getAppInfo = (appId: string): AppInfo => {
    // 从应用注册表中获取应用信息
    const appInfoMap = getAllAppInfo()

    return (
      appInfoMap[appId] || {
        id: appId,
        name: '未知应用',
        icon: 'app',
        version: '1.0.0',
        description: '',
        category: '其他',
        author: '',
        permissions: [],
        isSystem: false,
      }
    )
  }

  /**
   * 关闭所有窗口
   */
  const closeAllWindows = (): void => {
    windows.value = []
    activeWindowId.value = null
  }

  return {
    // 状态
    windows,
    activeWindowId,

    // 计算属性
    activeWindow,
    visibleWindows,

    // 方法
    openApp,
    closeWindow,
    activateWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
    getAppInfo,
    closeAllWindows,
  }
})
