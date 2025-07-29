/**
 * 玲珑OS API模块
 * 提供统一的API请求封装和服务
 */

// 导出核心请求模块
export * from './core/request'

// 导出API服务
export * from './services/fileApi'

// 导出类型定义
export * from './types'

/**
 * API模块版本信息
 */
export const version = '0.1.0'

/**
 * API模块信息
 */
export const info = {
  name: '@linglongos/api',
  version,
  description: '玲珑OS API请求封装模块',
  author: 'LingLong OS Team',
} as const
