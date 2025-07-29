/**
 * 应用集成
 *
 * 这个文件负责集成所有应用，并提供给窗口管理器使用
 */

import appRegistry from '../config/app-registry'
import type { AppDefinition } from '../config/app-registry'
import type { Component } from 'vue'
import type { AppInfo } from '@linglongos/shared-types'

/**
 * 将窗口应用定义转换为应用信息
 */
export function convertToAppInfo(app: AppDefinition): AppInfo {
  return {
    id: app.id,
    name: app.name,
    icon: app.icon,
    version: '1.0.0',
    description: '',
    category: app.category || '其他',
    author: '玲珑OS团队',
    permissions: [],
    isSystem: app.category === 'system',
  }
}

/**
 * 获取所有应用信息
 */
export function getAllAppInfo(): Record<string, AppInfo> {
  const appInfoMap: Record<string, AppInfo> = {}

  Object.values(appRegistry).forEach(app => {
    appInfoMap[app.id] = convertToAppInfo(app)
  })

  return appInfoMap
}

/**
 * 获取应用组件
 */
export function getAppComponent(appId: string): Component | undefined {
  const app = appRegistry[appId]
  return app ? app.component : undefined
}

/**
 * 获取应用默认配置
 */
export function getAppDefaultConfig(appId: string): {
  size?: { width: number; height: number }
  position?: { x: number; y: number }
  singleton?: boolean
} {
  const app = appRegistry[appId]
  if (!app) return {}

  return {
    size: app.defaultSize,
    position: app.defaultPosition,
    singleton: app.singleton,
  }
}

export default appRegistry
