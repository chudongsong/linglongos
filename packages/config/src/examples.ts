/**
 * 配置包使用示例
 */

import { paths } from './paths'
import { appConfig, getEnvironment, isDev, isProd, isTest, getApiBaseUrl } from './env'

/**
 * 示例：如何使用路径别名导入组件
 */
export const importExample = `
// 导入组件
import { LButton, LCard, LInput } from '${paths.components}'

// 导入工具函数
import { formatDate, parseDate } from '${paths.utils}'

// 导入类型
import type { User, Product } from '${paths.types}'

// 导入配置
import { appConfig, isDev } from '${paths.config}'
`

/**
 * 示例：如何使用环境配置
 */
export const envExample = `
// 获取当前环境
const env = ${getEnvironment.toString()}

// 环境判断
if (${isDev.toString()}) {
  console.log('当前是开发环境')
} else if (${isProd.toString()}) {
  console.log('当前是生产环境')
} else if (${isTest.toString()}) {
  console.log('当前是测试环境')
}

// 获取API基础URL
const apiUrl = ${getApiBaseUrl.toString()}

// 使用应用配置
const appName = ${JSON.stringify(appConfig.appName)}
const primaryColor = ${JSON.stringify(appConfig.theme.primaryColor)}
const isDarkModeEnabled = ${JSON.stringify(appConfig.features.darkMode)}
`
