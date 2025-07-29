/**
 * 玲珑OS配置模块
 * 提供项目配置管理和环境变量处理
 */

// 导出环境配置
export * from './env'

// 导出环境变量加载工具
export * from './loadEnv'

// 导出路径工具
export * from './paths'

// 导出类型定义
export { Config, ConfigOptions, ConfigManager } from './types'
export { EnvType } from './env'

/**
 * 配置模块版本信息
 */
export const version = '0.1.0'

/**
 * 配置模块信息
 */
export const info = {
  name: '@linglongos/config',
  version,
  description: '玲珑OS配置模块 - 提供项目配置管理和环境变量处理',
  author: 'LingLong OS Team',
} as const
