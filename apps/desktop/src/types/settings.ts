/**
 * 设置应用相关的类型定义
 */

/**
 * 背景配置类型
 */
export interface BackgroundConfig {
  type: 'image' | 'gradient' | 'color'
  value: string
  size?: 'cover' | 'contain' | 'auto'
  position?: string
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  opacity?: number
}

/**
 * 主题配置类型
 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  shadowColor: string
}

/**
 * 版本信息类型
 */
export interface VersionInfo {
  version: string
  buildDate: string
  gitCommit?: string
  updateAvailable: boolean
  updateStatus: 'checking' | 'latest' | 'available' | 'error'
  latestVersion?: string
  releaseNotes?: string
  buildNumber: string
  releaseDate: string
  changelog?: Array<{
    version: string
    date: string
    changes: string[]
  }>
}

/**
 * Google Authenticator 配置类型
 */
export interface GoogleAuthConfig {
  enabled: boolean
  verified: boolean
  secret?: string
  qrCode?: string
  backupCodes: string[]
  lastVerified?: string
}

/**
 * 宝塔云端账号配置类型
 */
export interface BaotaAccountConfig {
  connected: boolean
  username?: string
  email?: string
  serverId?: string
  lastSync?: string
  syncEnabled: boolean
}

/**
 * 管理面板API配置类型
 */
export interface AdminApiConfig {
  enabled: boolean
  port: number
  ssl: boolean
  allowedIps: string[]
  apiKey?: string
  rateLimit: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
}

/**
 * 设置应用的完整状态类型
 */
export interface SettingsState {
  // 加载状态
  loading: {
    settings: boolean
    version: boolean
    googleAuth: boolean
    baotaAccount: boolean
  }
  error: string | null
  
  // 当前活动的设置页面
  activeSection: string
  
  // 各功能模块的配置
  background: BackgroundConfig
  theme: ThemeConfig
  version: VersionInfo | null
  googleAuth: GoogleAuthConfig
  baotaAccount: BaotaAccountConfig
  adminApi: AdminApiConfig
  
  // 预览状态
  previewMode: boolean
  previewBackground?: BackgroundConfig
  previewTheme?: ThemeConfig
}

/**
 * 设置项类型
 */
export interface SettingItem {
  id: string
  title: string
  description?: string
  icon: string
  category: string
  component: string
}

/**
 * 设置分类类型
 */
export interface SettingCategory {
  id: string
  title: string
  icon: string
  items: SettingItem[]
}

/**
 * 壁纸项类型
 */
export interface WallpaperItem {
  id: string
  name: string
  thumbnail: string
  fullImage: string
  category: 'default' | 'nature' | 'abstract' | 'custom'
}

/**
 * 颜色预设类型
 */
export interface ColorPreset {
  id: string
  name: string
  colors: ThemeConfig
  preview: string
}