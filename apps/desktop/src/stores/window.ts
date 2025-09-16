import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  WindowState, 
  WindowConfig, 
  Position, 
  Size, 
  WindowController 
} from '@/types'

export const useWindowStore = defineStore('window', () => {
  // State
  const windows = ref<Map<string, WindowState>>(new Map())
  const activeWindowId = ref<string | null>(null)
  const zIndexCounter = ref(1000)
  const minimizedWindows = ref<Set<string>>(new Set())
  const maximizedWindows = ref<Set<string>>(new Set())

  // Getters
  const allWindows = computed(() => Array.from(windows.value.values()))
  
  const visibleWindows = computed(() => 
    allWindows.value.filter(window => !window.isMinimized)
  )
  
  const activeWindow = computed(() => 
    activeWindowId.value ? windows.value.get(activeWindowId.value) : null
  )
  
  const windowCount = computed(() => windows.value.size)
  
  const taskbarWindows = computed(() => 
    allWindows.value.filter(window => !window.isMinimized || minimizedWindows.value.has(window.id))
  )

  // Actions
  function createWindow(config: WindowConfig): string {
    const windowId = generateWindowId()
    const defaultSize: Size = { width: 800, height: 600 }
    const defaultPosition: Position = calculateDefaultPosition()
    
    const windowState: WindowState = {
      id: windowId,
      title: config.title,
      appId: config.appId,
      position: config.position || (config.center ? calculateCenterPosition(config.size || defaultSize) : defaultPosition),
      size: config.size || defaultSize,
      isActive: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: ++zIndexCounter.value,
      resizable: config.resizable ?? true,
      draggable: config.draggable ?? true,
      icon: config.icon,
      component: config.component,
      props: config.props
    }

    windows.value.set(windowId, windowState)
    setActiveWindow(windowId)
    
    return windowId
  }

  function closeWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      windows.value.delete(windowId)
      minimizedWindows.value.delete(windowId)
      maximizedWindows.value.delete(windowId)
      
      // 如果关闭的是活动窗口，激活下一个窗口
      if (activeWindowId.value === windowId) {
        const remaining = visibleWindows.value
        if (remaining.length > 0) {
          const nextWindow = remaining.reduce((prev, current) => 
            prev.zIndex > current.zIndex ? prev : current
          )
          setActiveWindow(nextWindow.id)
        } else {
          activeWindowId.value = null
        }
      }
    }
  }

  function minimizeWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      window.isMinimized = true
      minimizedWindows.value.add(windowId)
      
      if (activeWindowId.value === windowId) {
        // 激活下一个可见窗口
        const visibleWins = visibleWindows.value
        if (visibleWins.length > 0) {
          const nextWindow = visibleWins.reduce((prev, current) => 
            prev.zIndex > current.zIndex ? prev : current
          )
          setActiveWindow(nextWindow.id)
        } else {
          activeWindowId.value = null
        }
      }
    }
  }

  function maximizeWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window && window.resizable) {
      if (window.isMaximized) {
        // 恢复窗口
        restoreWindow(windowId)
      } else {
        // 最大化窗口
        window.isMaximized = true
        maximizedWindows.value.add(windowId)
        
        // 保存原始尺寸和位置（如果还没有保存）
        if (!window.restorePosition) {
          window.restorePosition = { ...window.position }
          window.restoreSize = { ...window.size }
        }
        
        // 设置为全屏尺寸
        window.position = { x: 0, y: 0 }
        window.size = { 
          width: window.innerWidth || 1920, 
          height: (window.innerHeight || 1080) - 40 // 减去任务栏高度
        }
        
        setActiveWindow(windowId)
      }
    }
  }

  function restoreWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      if (window.isMinimized) {
        window.isMinimized = false
        minimizedWindows.value.delete(windowId)
      }
      
      if (window.isMaximized) {
        window.isMaximized = false
        maximizedWindows.value.delete(windowId)
        
        // 恢复原始尺寸和位置
        if (window.restorePosition && window.restoreSize) {
          window.position = { ...window.restorePosition }
          window.size = { ...window.restoreSize }
          delete window.restorePosition
          delete window.restoreSize
        }
      }
      
      setActiveWindow(windowId)
    }
  }

  function setActiveWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window && !window.isMinimized) {
      // 取消其他窗口的激活状态
      allWindows.value.forEach(w => w.isActive = false)
      
      // 激活目标窗口
      window.isActive = true
      window.zIndex = ++zIndexCounter.value
      activeWindowId.value = windowId
    }
  }

  function focusWindow(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      if (window.isMinimized) {
        restoreWindow(windowId)
      } else {
        setActiveWindow(windowId)
      }
    }
  }

  function moveWindow(windowId: string, position: Position): void {
    const window = windows.value.get(windowId)
    if (window && window.draggable && !window.isMaximized) {
      window.position = position
    }
  }

  function resizeWindow(windowId: string, size: Size): void {
    const window = windows.value.get(windowId)
    if (window && window.resizable && !window.isMaximized) {
      // 应用最小/最大尺寸限制
      const minSize = window.minSize || { width: 300, height: 200 }
      const maxSize = window.maxSize || { width: 2000, height: 1500 }
      
      window.size = {
        width: Math.max(minSize.width, Math.min(size.width, maxSize.width)),
        height: Math.max(minSize.height, Math.min(size.height, maxSize.height))
      }
    }
  }

  function updateWindow(windowId: string, updates: Partial<WindowState>): void {
    const window = windows.value.get(windowId)
    if (window) {
      Object.assign(window, updates)
    }
  }

  function setWindowTitle(windowId: string, title: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      window.title = title
    }
  }

  function getWindowById(windowId: string): WindowState | null {
    return windows.value.get(windowId) || null
  }

  function getWindowsByAppId(appId: string): WindowState[] {
    return allWindows.value.filter(window => window.appId === appId)
  }

  function bringToFront(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      window.zIndex = ++zIndexCounter.value
      setActiveWindow(windowId)
    }
  }

  function sendToBack(windowId: string): void {
    const window = windows.value.get(windowId)
    if (window) {
      window.zIndex = Math.min(...allWindows.value.map(w => w.zIndex)) - 1
    }
  }

  function cascadeWindows(): void {
    const visibleWins = visibleWindows.value.sort((a, b) => a.zIndex - b.zIndex)
    
    visibleWins.forEach((window, index) => {
      const offset = index * 30
      window.position = { x: 100 + offset, y: 100 + offset }
      window.zIndex = 1000 + index
    })
  }

  function tileWindows(): void {
    const visibleWins = visibleWindows.value
    if (visibleWins.length === 0) return

    const screenWidth = window.innerWidth || 1920
    const screenHeight = (window.innerHeight || 1080) - 40 // 减去任务栏高度
    
    const cols = Math.ceil(Math.sqrt(visibleWins.length))
    const rows = Math.ceil(visibleWins.length / cols)
    
    const windowWidth = screenWidth / cols
    const windowHeight = screenHeight / rows
    
    visibleWins.forEach((win, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      win.position = { x: col * windowWidth, y: row * windowHeight }
      win.size = { width: windowWidth, height: windowHeight }
      win.isMaximized = false
      maximizedWindows.value.delete(win.id)
    })
  }

  function minimizeAllWindows(): void {
    visibleWindows.value.forEach(window => {
      minimizeWindow(window.id)
    })
  }

  function closeAllWindows(): void {
    const windowIds = Array.from(windows.value.keys())
    windowIds.forEach(id => closeWindow(id))
  }

  function createWindowController(windowId: string): WindowController {
    return {
      minimize: () => minimizeWindow(windowId),
      maximize: () => maximizeWindow(windowId),
      restore: () => restoreWindow(windowId),
      close: () => closeWindow(windowId),
      focus: () => focusWindow(windowId),
      move: (position: Position) => moveWindow(windowId, position),
      resize: (size: Size) => resizeWindow(windowId, size)
    }
  }

  // Helper functions
  function generateWindowId(): string {
    return 'window_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  function calculateDefaultPosition(): Position {
    const existingWindows = visibleWindows.value
    const offset = existingWindows.length * 30
    return { x: 100 + offset, y: 100 + offset }
  }

  function calculateCenterPosition(size: Size): Position {
    const screenWidth = window.innerWidth || 1920
    const screenHeight = window.innerHeight || 1080
    
    return {
      x: (screenWidth - size.width) / 2,
      y: (screenHeight - size.height) / 2
    }
  }

  return {
    // State
    windows: readonly(windows),
    activeWindowId: readonly(activeWindowId),
    minimizedWindows: readonly(minimizedWindows),
    maximizedWindows: readonly(maximizedWindows),
    
    // Getters
    allWindows,
    visibleWindows,
    activeWindow,
    windowCount,
    taskbarWindows,
    
    // Actions
    createWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    setActiveWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    updateWindow,
    setWindowTitle,
    getWindowById,
    getWindowsByAppId,
    bringToFront,
    sendToBack,
    cascadeWindows,
    tileWindows,
    minimizeAllWindows,
    closeAllWindows,
    createWindowController
  }
})