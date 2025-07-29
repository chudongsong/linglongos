// 导出 context-menu 类型
export interface MenuItem {
  id?: string
  label: string
  icon?: string | object
  type?: 'normal' | 'checkbox' | 'radio' | 'separator'
  checked?: boolean
  radioGroup?: string
  accelerator?: string
  disabled?: boolean
  visible?: boolean
  submenu?: MenuItem[]
  click?: (item: MenuItem, event: MouseEvent) => void
}

export interface MenuPosition {
  x: number
  y: number
}

export interface ContextMenuConfig {
  items: MenuItem[]
  theme?: 'light' | 'dark' | 'auto'
  showIcons?: boolean
  showAccelerators?: boolean
  minWidth?: number
  maxWidth?: number
  maxHeight?: number
  zIndex?: number
}

export interface ContextMenuState {
  visible: boolean
  position: MenuPosition
  activeItem?: MenuItem
  openSubmenuPath: MenuItem[]
}

export interface ContextMenuManager {
  show: (position: MenuPosition, config: ContextMenuConfig) => Promise<void>
  hide: () => void
  update: (config: Partial<ContextMenuConfig>) => void
  getState: () => ContextMenuState
  destroy: () => void
}

// 导出 iframe 类型
export interface IframeAppConfig {
  url: string
  allowScripts?: boolean
  allowForms?: boolean
  allowPopups?: boolean
  allowDownloads?: boolean
  allowFullscreen?: boolean
  sandbox?: string[]
  communication?: {
    targetOrigin?: string
    allowedOrigins?: string[]
  }
}

export interface IframeState {
  loaded: boolean
  loading: boolean
  error: boolean
  errorMessage?: string
  currentUrl?: string
  canGoBack: boolean
  canGoForward: boolean
}

export interface IframeMessage {
  type: string
  data: any
  source: {
    url?: string
    origin?: string
  }
}

export interface IframeEvents {
  load: []
  error: [error: Error]
  loadStart: []
  urlChange: [url: string]
  message: [message: IframeMessage]
  fullscreenChange: [isFullscreen: boolean]
}

export interface IframeAPI {
  postMessage: (type: string, data: any) => void
  onMessage: (type: string, callback: (data: any, message: IframeMessage) => void) => () => void
  navigate: (url: string) => void
  goBack: () => void
  goForward: () => void
  reload: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void
  getState: () => IframeState
}

// 导出 window 类型
export interface WindowState {
  id: string
  title: string
  icon?: string
  component?: any
  props?: Record<string, any>
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  minSize?: {
    width: number
    height: number
  }
  maxSize?: {
    width: number
    height: number
  }
  zIndex: number
  isActive: boolean
  isMinimized: boolean
  isMaximized: boolean
  resizable: boolean
  draggable: boolean
  closable: boolean
  minimizable: boolean
  maximizable: boolean
}

export interface WindowOptions {
  id?: string
  title: string
  icon?: string
  component?: any
  props?: Record<string, any>
  position?: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  minSize?: {
    width: number
    height: number
  }
  maxSize?: {
    width: number
    height: number
  }
  zIndex?: number
  isActive?: boolean
  isMinimized?: boolean
  isMaximized?: boolean
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
}

export interface WindowManager {
  windows: Ref<WindowState[]>
  visibleWindows: ComputedRef<WindowState[]>
  activeWindow: ComputedRef<WindowState | undefined>
  createWindow: (options: WindowOptions) => WindowState
  getWindow: (id: string) => WindowState | undefined
  activateWindow: (id: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  moveWindow: (id: string, position: { x: number; y: number }) => void
  resizeWindow: (id: string, size: { width: number; height: number }) => void
  updateWindow: (id: string, options: Partial<WindowOptions>) => void
}

// 导入 Vue 类型
import type { Ref, ComputedRef } from 'vue'
