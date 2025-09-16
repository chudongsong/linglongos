import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { AppDefinition, AppState } from '@/types'
import { useWindowStore } from './window'

export const useAppStore = defineStore('app', () => {
  // State
  const apps = ref<AppDefinition[]>([])
  const runningApps = ref<Map<string, string[]>>(new Map()) // appId -> windowIds
  const installedApps = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const systemApps = computed(() => 
    apps.value.filter(app => app.isSystem)
  )
  
  const userApps = computed(() => 
    apps.value.filter(app => !app.isSystem)
  )
  
  const appsByCategory = computed(() => {
    const categories: Record<string, AppDefinition[]> = {}
    apps.value.forEach(app => {
      if (!categories[app.category]) {
        categories[app.category] = []
      }
      categories[app.category].push(app)
    })
    return categories
  })
  
  const runningAppIds = computed(() => 
    Array.from(runningApps.value.keys())
  )

  // Actions
  function registerApp(app: AppDefinition): void {
    const existingIndex = apps.value.findIndex(a => a.id === app.id)
    if (existingIndex !== -1) {
      apps.value[existingIndex] = app
    } else {
      apps.value.push(app)
    }
    installedApps.value.add(app.id)
    saveAppRegistry()
  }

  function unregisterApp(appId: string): void {
    const index = apps.value.findIndex(app => app.id === appId)
    if (index !== -1) {
      apps.value.splice(index, 1)
      installedApps.value.delete(appId)
      
      // 关闭该应用的所有窗口
      const windowIds = runningApps.value.get(appId)
      if (windowIds) {
        const windowStore = useWindowStore()
        windowIds.forEach(windowId => {
          windowStore.closeWindow(windowId)
        })
        runningApps.value.delete(appId)
      }
      
      saveAppRegistry()
    }
  }

  function getApp(appId: string): AppDefinition | null {
    return apps.value.find(app => app.id === appId) || null
  }

  function isAppInstalled(appId: string): boolean {
    return installedApps.value.has(appId)
  }

  function isAppRunning(appId: string): boolean {
    return runningApps.value.has(appId) && (runningApps.value.get(appId)?.length || 0) > 0
  }

  function launchApp(appId: string, props?: Record<string, any>): string | null {
    const app = getApp(appId)
    if (!app) {
      setError(`应用 ${appId} 未找到`)
      return null
    }

    try {
      const windowStore = useWindowStore()
      
      // 检查是否为单实例应用
      if (app.isSingle && isAppRunning(appId)) {
        const windowIds = runningApps.value.get(appId)
        if (windowIds && windowIds.length > 0) {
          // 激活现有窗口
          windowStore.focusWindow(windowIds[0])
          return windowIds[0]
        }
      }

      // 创建新窗口
      const windowId = windowStore.createWindow({
        title: app.name,
        appId: app.id,
        icon: app.icon,
        component: resolveAppComponent(app.component),
        props: { ...app.config, ...props },
        center: true
      })

      // 记录运行状态
      const existingWindows = runningApps.value.get(appId) || []
      runningApps.value.set(appId, [...existingWindows, windowId])

      return windowId
    } catch (err) {
      setError(`启动应用失败: ${err instanceof Error ? err.message : '未知错误'}`)
      return null
    }
  }

  function closeApp(appId: string, windowId?: string): void {
    const windowIds = runningApps.value.get(appId)
    if (!windowIds) return

    const windowStore = useWindowStore()

    if (windowId) {
      // 关闭指定窗口
      const index = windowIds.indexOf(windowId)
      if (index !== -1) {
        windowIds.splice(index, 1)
        windowStore.closeWindow(windowId)
        
        // 如果没有窗口了，移除应用运行状态
        if (windowIds.length === 0) {
          runningApps.value.delete(appId)
        }
      }
    } else {
      // 关闭应用的所有窗口
      windowIds.forEach(id => {
        windowStore.closeWindow(id)
      })
      runningApps.value.delete(appId)
    }
  }

  function restartApp(appId: string): string | null {
    const app = getApp(appId)
    if (!app) return null

    // 关闭现有实例
    closeApp(appId)
    
    // 重新启动
    return launchApp(appId)
  }

  function getAppWindows(appId: string): string[] {
    return runningApps.value.get(appId) || []
  }

  function updateAppConfig(appId: string, config: Record<string, any>): void {
    const app = getApp(appId)
    if (app) {
      app.config = { ...app.config, ...config }
      saveAppRegistry()
    }
  }

  function searchApps(query: string): AppDefinition[] {
    const lowerQuery = query.toLowerCase()
    return apps.value.filter(app => 
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.category.toLowerCase().includes(lowerQuery)
    )
  }

  function getAppsByCategory(category: string): AppDefinition[] {
    return apps.value.filter(app => app.category === category)
  }

  function setError(errorMessage: string): void {
    error.value = errorMessage
  }

  function clearError(): void {
    error.value = null
  }

  function loadAppRegistry(): void {
    try {
      const saved = localStorage.getItem('app_registry')
      if (saved) {
        const registry = JSON.parse(saved)
        if (registry.apps) {
          apps.value = registry.apps
          installedApps.value = new Set(registry.installedApps || [])
        }
      }
      
      // 加载默认系统应用
      loadSystemApps()
    } catch (error) {
      console.error('Failed to load app registry:', error)
      loadSystemApps()
    }
  }

  function saveAppRegistry(): void {
    try {
      const registry = {
        apps: apps.value,
        installedApps: Array.from(installedApps.value)
      }
      localStorage.setItem('app_registry', JSON.stringify(registry))
    } catch (error) {
      console.error('Failed to save app registry:', error)
    }
  }

  function loadSystemApps(): void {
    const systemApps: AppDefinition[] = [
      {
        id: 'file-manager',
        name: '文件管理器',
        icon: 'folder',
        component: 'FileManager',
        category: '系统',
        description: '管理文件和文件夹',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: ['filesystem:read', 'filesystem:write'],
        isSystem: true,
        isSingle: false
      },
      {
        id: 'terminal',
        name: '终端',
        icon: 'terminal',
        component: 'Terminal',
        category: '系统',
        description: '命令行终端',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: ['system:execute'],
        isSystem: true,
        isSingle: false
      },
      {
        id: 'task-manager',
        name: '任务管理器',
        icon: 'activity',
        component: 'TaskManager',
        category: '系统',
        description: '监控系统进程和性能',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: ['system:monitor', 'process:manage'],
        isSystem: true,
        isSingle: true
      },
      {
        id: 'settings',
        name: '设置',
        icon: 'settings',
        component: 'Settings',
        category: '系统',
        description: '系统设置和配置',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: ['system:configure'],
        isSystem: true,
        isSingle: true
      },
      {
        id: 'calculator',
        name: '计算器',
        icon: 'calculator',
        component: 'Calculator',
        category: '工具',
        description: '简单计算器',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: [],
        isSystem: true,
        isSingle: true
      },
      {
        id: 'text-editor',
        name: '文本编辑器',
        icon: 'file-text',
        component: 'TextEditor',
        category: '工具',
        description: '文本编辑器',
        version: '1.0.0',
        author: '玲珑OS',
        permissions: ['filesystem:read', 'filesystem:write'],
        isSystem: true,
        isSingle: false
      }
    ]

    systemApps.forEach(app => {
      if (!apps.value.find(a => a.id === app.id)) {
        registerApp(app)
      }
    })
  }

  function resolveAppComponent(componentName: string): any {
    // 动态组件解析
    const componentMap: Record<string, any> = {
      'FileManager': () => import('@/components/apps/FileManager.vue'),
      'Terminal': () => import('@/components/apps/Terminal.vue'),
      'TaskManager': () => import('@/components/apps/TaskManager.vue'),
      'Settings': () => import('@/components/apps/Settings.vue'),
      'Calculator': () => import('@/components/apps/Calculator.vue'),
      'TextEditor': () => import('@/components/apps/TextEditor.vue')
    }
    
    return componentMap[componentName] || componentName
  }

  // 监听窗口关闭事件，更新运行状态
  function onWindowClosed(windowId: string): void {
    for (const [appId, windowIds] of runningApps.value.entries()) {
      const index = windowIds.indexOf(windowId)
      if (index !== -1) {
        windowIds.splice(index, 1)
        if (windowIds.length === 0) {
          runningApps.value.delete(appId)
        }
        break
      }
    }
  }

  // 初始化
  loadAppRegistry()

  return {
    // State
    apps: readonly(apps),
    runningApps: readonly(runningApps),
    installedApps: readonly(installedApps),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    systemApps,
    userApps,
    appsByCategory,
    runningAppIds,
    
    // Actions
    registerApp,
    unregisterApp,
    getApp,
    isAppInstalled,
    isAppRunning,
    launchApp,
    closeApp,
    restartApp,
    getAppWindows,
    updateAppConfig,
    searchApps,
    getAppsByCategory,
    setError,
    clearError,
    loadAppRegistry,
    saveAppRegistry,
    onWindowClosed
  }
})