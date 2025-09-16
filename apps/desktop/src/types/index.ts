// 重新导出共享类型
export * from '@linglongos/shared-types'

// 桌面应用特有类型定义

/** 认证状态 */
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  permissions: Permission[]
  loading: boolean
  error: string | null
}

/** 权限接口 */
export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

/** 登录凭据 */
export interface LoginCredentials {
  username: string
  password: string
  remember?: boolean
}

/** 桌面图标 */
export interface DesktopIcon {
  id: string
  type: 'app' | 'file' | 'folder' | 'url'
  name: string
  icon: string
  position: GridPosition
  appId?: string
  filePath?: string
  url?: string
  children?: string[] // for folders
  metadata?: Record<string, any>
}

/** 网格位置 */
export interface GridPosition {
  x: number
  y: number
  width: number
  height: number
}

/** 网格配置 */
export interface GridConfig {
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  gap: number
  padding: number
}

/** 壁纸配置 */
export interface WallpaperConfig {
  type: 'color' | 'gradient' | 'image'
  value: string
  opacity?: number
  blur?: number
}

/** 主题配置 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  fontFamily: string
  fontSize: number
  borderRadius: number
  animations: boolean
}

/** 用户偏好设置 */
export interface UserPreferences {
  theme: ThemeConfig
  wallpaper: WallpaperConfig
  desktop: {
    grid: GridConfig
    showHiddenFiles: boolean
    autoArrange: boolean
  }
  system: {
    language: string
    timezone: string
    notifications: boolean
    sounds: boolean
  }
}

/** 应用定义 */
export interface AppDefinition {
  id: string
  name: string
  icon: string
  component: string
  category: string
  description: string
  version: string
  author: string
  permissions: string[]
  config?: Record<string, any>
  isSystem: boolean
  isSingle: boolean // 是否只能打开一个实例
}

/** 应用状态 */
export interface AppState {
  apps: AppDefinition[]
  runningApps: Map<string, string[]> // appId -> windowIds
  installedApps: Set<string>
  loading: boolean
  error: string | null
}

/** 拖拽配置 */
export interface DragConfig {
  type: 'icon' | 'window' | 'file'
  data: any
  preview?: HTMLElement
  effectAllowed: 'move' | 'copy' | 'link'
}

/** 放置配置 */
export interface DropConfig {
  accept: string[]
  effect: 'move' | 'copy' | 'link'
  onDrop: (data: any) => void
  onDragEnter?: () => void
  onDragLeave?: () => void
}

/** 系统状态 */
export interface SystemState {
  online: boolean
  performance: {
    cpu: number
    memory: number
    disk: number
  }
  notifications: Notification[]
  activeNotifications: Set<string>
}

/** 事件映射 */
export interface EventMap {
  'window:created': { windowId: string; config: WindowConfig }
  'window:closed': { windowId: string }
  'window:focused': { windowId: string }
  'window:minimized': { windowId: string }
  'window:maximized': { windowId: string }
  'icon:moved': { iconId: string; position: GridPosition }
  'icon:selected': { iconId: string }
  'app:launched': { appId: string; windowId: string }
  'app:closed': { appId: string; windowId: string }
  'notification:show': { notification: Notification }
  'notification:close': { notificationId: string }
  'theme:changed': { theme: ThemeConfig }
  'wallpaper:changed': { wallpaper: WallpaperConfig }
  'desktop:refresh': {}
  'system:performance': { performance: SystemState['performance'] }
}

/** 路由元信息 */
export interface RouteMeta {
  requiresAuth: boolean
  permissions?: string[]
  title?: string
  layout?: string
  keepAlive?: boolean
}

/** 组件属性基类 */
export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, any>
}

/** 窗口控制器 */
export interface WindowController {
  minimize(): void
  maximize(): void
  restore(): void
  close(): void
  focus(): void
  move(position: Position): void
  resize(size: Size): void
}

/** 文件夹 */
export interface Folder {
  id: string
  name: string
  icon: string
  children: string[] // icon ids
  position: GridPosition
  isOpen: boolean
}

/** 快捷方式 */
export interface Shortcut {
  id: string
  name: string
  key: string
  modifiers: string[]
  action: () => void
  global: boolean
  enabled: boolean
}

/** 右键菜单组 */
export interface ContextMenuGroup {
  id: string
  label?: string
  items: ContextMenuItem[]
  separator?: boolean
}

/** 动画配置 */
export interface AnimationConfig {
  enabled: boolean
  duration: number
  easing: string
  effects: {
    windowOpen: boolean
    windowClose: boolean
    iconMove: boolean
    backgroundChange: boolean
  }
}