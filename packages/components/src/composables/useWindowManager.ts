import { ref, computed } from 'vue'
import type { WindowState, WindowOptions, WindowManager } from '../types'

/**
 * 窗口管理器
 */
export function useWindowManager(): WindowManager {
  // 窗口列表
  const windows = ref<WindowState[]>([])

  // 可见窗口（未最小化）
  const visibleWindows = computed(() => {
    return windows.value.filter(window => !window.isMinimized).sort((a, b) => a.zIndex - b.zIndex)
  })

  // 当前激活窗口
  const activeWindow = computed(() => {
    return windows.value.find(window => window.isActive)
  })

  /**
   * 创建窗口
   */
  const createWindow = (options: WindowOptions): WindowState => {
    // 生成唯一ID
    const id = options.id || `window-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 计算默认位置
    const defaultPosition = {
      x: Math.max(0, Math.floor((window.innerWidth - 800) / 2)),
      y: Math.max(0, Math.floor((window.innerHeight - 600) / 2)),
    }

    // 计算最高层级
    const maxZIndex = windows.value.length > 0 ? Math.max(...windows.value.map(w => w.zIndex)) : 100

    // 创建窗口状态
    const windowState: WindowState = {
      id,
      title: options.title,
      icon: options.icon,
      component: options.component,
      props: options.props || {},
      position: options.position || {
        x: defaultPosition.x + windows.value.length * 20,
        y: defaultPosition.y + windows.value.length * 20,
      },
      size: options.size || { width: 800, height: 600 },
      minSize: options.minSize,
      maxSize: options.maxSize,
      zIndex: options.zIndex !== undefined ? options.zIndex : maxZIndex + 1,
      isActive: options.isActive !== undefined ? options.isActive : true,
      isMinimized: options.isMinimized || false,
      isMaximized: options.isMaximized || false,
      resizable: options.resizable !== undefined ? options.resizable : true,
      draggable: options.draggable !== undefined ? options.draggable : true,
      closable: options.closable !== undefined ? options.closable : true,
      minimizable: options.minimizable !== undefined ? options.minimizable : true,
      maximizable: options.maximizable !== undefined ? options.maximizable : true,
    }

    // 如果新窗口是激活状态，取消其他窗口的激活状态
    if (windowState.isActive) {
      windows.value.forEach(window => {
        window.isActive = false
      })
    }

    // 添加到窗口列表
    windows.value.push(windowState)

    return windowState
  }

  /**
   * 获取窗口
   */
  const getWindow = (id: string): WindowState | undefined => {
    return windows.value.find(window => window.id === id)
  }

  /**
   * 激活窗口
   */
  const activateWindow = (id: string): void => {
    const window = getWindow(id)
    if (!window) return

    // 取消其他窗口的激活状态
    windows.value.forEach(w => {
      w.isActive = false
    })

    // 激活当前窗口
    window.isActive = true

    // 将窗口移到最上层
    const maxZIndex = Math.max(...windows.value.map(w => w.zIndex))
    if (window.zIndex < maxZIndex) {
      window.zIndex = maxZIndex + 1
    }
  }

  /**
   * 关闭窗口
   */
  const closeWindow = (id: string): void => {
    const index = windows.value.findIndex(window => window.id === id)
    if (index === -1) return

    // 移除窗口
    windows.value.splice(index, 1)

    // 如果还有其他窗口，激活最上层的窗口
    if (windows.value.length > 0) {
      const topWindow = windows.value.reduce((prev, current) =>
        current.zIndex > prev.zIndex ? current : prev
      )
      activateWindow(topWindow.id)
    }
  }

  /**
   * 最小化窗口
   */
  const minimizeWindow = (id: string): void => {
    const window = getWindow(id)
    if (!window) return

    window.isMinimized = true

    // 如果是当前激活窗口，激活其他窗口
    if (window.isActive && windows.value.length > 1) {
      const nextWindow = windows.value.find(w => w.id !== id && !w.isMinimized)
      if (nextWindow) {
        activateWindow(nextWindow.id)
      }
    }
  }

  /**
   * 最大化窗口
   */
  const maximizeWindow = (id: string): void => {
    const window = getWindow(id)
    if (!window || !window.resizable) return

    window.isMaximized = !window.isMaximized

    // 激活窗口
    if (!window.isActive) {
      activateWindow(id)
    }
  }

  /**
   * 移动窗口
   */
  const moveWindow = (id: string, position: { x: number; y: number }): void => {
    const window = getWindow(id)
    if (!window || window.isMaximized) return

    window.position = { ...position }
  }

  /**
   * 调整窗口大小
   */
  const resizeWindow = (id: string, size: { width: number; height: number }): void => {
    const window = getWindow(id)
    if (!window || !window.resizable || window.isMaximized) return

    // 应用最小尺寸限制
    if (window.minSize) {
      size.width = Math.max(size.width, window.minSize.width)
      size.height = Math.max(size.height, window.minSize.height)
    }

    // 应用最大尺寸限制
    if (window.maxSize) {
      size.width = Math.min(size.width, window.maxSize.width)
      size.height = Math.min(size.height, window.maxSize.height)
    }

    window.size = { ...size }
  }

  /**
   * 更新窗口
   */
  const updateWindow = (id: string, options: Partial<WindowOptions>): void => {
    const window = getWindow(id)
    if (!window) return

    // 更新属性
    if (options.title !== undefined) window.title = options.title
    if (options.icon !== undefined) window.icon = options.icon
    if (options.component !== undefined) window.component = options.component
    if (options.props !== undefined) window.props = { ...options.props }
    if (options.position !== undefined) window.position = { ...options.position }
    if (options.size !== undefined) window.size = { ...options.size }
    if (options.minSize !== undefined) window.minSize = { ...options.minSize }
    if (options.maxSize !== undefined) window.maxSize = { ...options.maxSize }
    if (options.zIndex !== undefined) window.zIndex = options.zIndex
    if (options.isActive !== undefined && options.isActive !== window.isActive) {
      if (options.isActive) {
        activateWindow(id)
      } else {
        window.isActive = false
      }
    }
    if (options.isMinimized !== undefined) window.isMinimized = options.isMinimized
    if (options.isMaximized !== undefined) window.isMaximized = options.isMaximized
    if (options.resizable !== undefined) window.resizable = options.resizable
    if (options.draggable !== undefined) window.draggable = options.draggable
    if (options.closable !== undefined) window.closable = options.closable
    if (options.minimizable !== undefined) window.minimizable = options.minimizable
    if (options.maximizable !== undefined) window.maximizable = options.maximizable
  }

  return {
    windows,
    visibleWindows,
    activeWindow,
    createWindow,
    getWindow,
    activateWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
    updateWindow,
  }
}
