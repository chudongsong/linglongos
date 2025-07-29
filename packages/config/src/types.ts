/**
 * 配置模块类型定义
 */

/**
 * 环境类型
 */
export type EnvType = 'development' | 'test' | 'production'

/**
 * 配置类型
 */
export interface Config {
  // 环境类型
  env: EnvType
  // 应用名称
  appName: string
  // 应用版本
  appVersion: string
  // 应用描述
  appDescription: string
  // API基础URL
  apiBaseUrl: string
  // 是否启用调试模式
  debug: boolean
  // 是否启用API请求日志
  apiLog: boolean
  // 是否启用性能监控
  performanceMonitor: boolean
  // 是否启用错误跟踪
  errorTracking: boolean
  // 是否启用用户行为分析
  userAnalytics: boolean
}

/**
 * 配置选项
 */
export interface ConfigOptions {
  // 环境类型
  env?: EnvType
  // 应用名称
  appName?: string
  // 应用版本
  appVersion?: string
  // 应用描述
  appDescription?: string
  // API基础URL
  apiBaseUrl?: string
  // 是否启用调试模式
  debug?: boolean
  // 是否启用API请求日志
  apiLog?: boolean
  // 是否启用性能监控
  performanceMonitor?: boolean
  // 是否启用错误跟踪
  errorTracking?: boolean
  // 是否启用用户行为分析
  userAnalytics?: boolean
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  // 获取配置
  getConfig(): Config
  // 获取配置项
  get<K extends keyof Config>(key: K): Config[K]
  // 设置配置项
  set<K extends keyof Config>(key: K, value: Config[K]): void
  // 合并配置
  merge(options: ConfigOptions): void
  // 重置配置
  reset(): void
}
