/**
 * 玲珑OS工具库
 * 提供常用的工具方法，包括数据处理、文件操作、URL处理、正则验证、格式化等
 */

// 数据处理工具
export * from './data'

// 字符串工具
export * from './string'

// 数字工具
export * from './number'

// 日期工具
export * from './date'

// 文件处理工具
export * from './file'

// URL处理工具
export * from './url'

// 正则验证工具
export * from './validator'

// 格式化工具
export * from './format'

/**
 * 工具库版本信息
 */
export const version = '1.0.0'

/**
 * 工具库信息
 */
export const info = {
	name: '@linglongos/utils',
	version,
	description: '玲珑OS工具库 - 提供常用的工具方法',
	author: 'LingLong OS Team',
} as const
