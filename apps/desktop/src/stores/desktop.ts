import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DesktopConfig, DesktopItem } from '@linglongos/shared-types'

export const useDesktopStore = defineStore('desktop', () => {
  // 状态
  const desktopConfig = ref<DesktopConfig>({
    version: 1,
    desktopItems: [],
    theme: 'auto',
  })

  const desktopItems = ref<DesktopItem[]>([])
  const wallpaper = ref<string>('')
  const theme = ref<'light' | 'dark' | 'auto'>('auto')

  /**
   * 加载桌面配置
   */
  const loadDesktopConfig = async (): Promise<void> => {
    try {
      // 从localStorage加载配置
      const savedConfig = localStorage.getItem('linglongos_desktop_config')
      if (savedConfig) {
        const config: DesktopConfig = JSON.parse(savedConfig)
        desktopConfig.value = config
        desktopItems.value = config.desktopItems
        wallpaper.value = config.wallpaper || ''
        theme.value = config.theme
      } else {
        // 使用默认配置
        await loadDefaultConfig()
      }
    } catch (error) {
      console.error('加载桌面配置失败:', error)
      await loadDefaultConfig()
    }
  }

  /**
   * 加载默认配置
   */
  const loadDefaultConfig = async (): Promise<void> => {
    const defaultItems: DesktopItem[] = [
      {
        id: 'file-manager',
        type: 'app-icon',
        position: { x: 0, y: 0 },
        appId: 'file-manager',
      },
      {
        id: 'terminal',
        type: 'app-icon',
        position: { x: 1, y: 0 },
        appId: 'terminal',
      },
      {
        id: 'settings',
        type: 'app-icon',
        position: { x: 2, y: 0 },
        appId: 'settings',
      },
      {
        id: 'task-manager',
        type: 'app-icon',
        position: { x: 3, y: 0 },
        appId: 'task-manager',
      },
      {
        id: 'performance-widget',
        type: 'widget',
        position: { x: 0, y: 2 },
        size: { width: 3, height: 2 },
        widgetId: 'performance-monitor',
      },
    ]

    desktopItems.value = defaultItems
    desktopConfig.value = {
      version: 1,
      desktopItems: defaultItems,
      theme: 'auto',
    }

    await saveDesktopConfig()
  }

  /**
   * 保存桌面配置
   */
  const saveDesktopConfig = async (): Promise<void> => {
    try {
      const config: DesktopConfig = {
        version: desktopConfig.value.version,
        desktopItems: desktopItems.value,
        wallpaper: wallpaper.value,
        theme: theme.value,
      }

      localStorage.setItem('linglongos_desktop_config', JSON.stringify(config))
      desktopConfig.value = config
    } catch (error) {
      console.error('保存桌面配置失败:', error)
      throw error
    }
  }

  /**
   * 添加桌面项目
   */
  const addDesktopItem = async (item: Omit<DesktopItem, 'id'>): Promise<void> => {
    const newItem: DesktopItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    desktopItems.value.push(newItem)
    await saveDesktopConfig()
  }

  /**
   * 移除桌面项目
   */
  const removeDesktopItem = async (itemId: string): Promise<void> => {
    const index = desktopItems.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      desktopItems.value.splice(index, 1)
      await saveDesktopConfig()
    }
  }

  /**
   * 更新桌面项目
   */
  const updateDesktopItem = async (
    itemId: string,
    updates: Partial<DesktopItem>
  ): Promise<void> => {
    const index = desktopItems.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      desktopItems.value[index] = { ...desktopItems.value[index], ...updates }
      await saveDesktopConfig()
    }
  }

  /**
   * 移动桌面项目
   */
  const moveDesktopItem = async (
    itemId: string,
    newPosition: { x: number; y: number }
  ): Promise<void> => {
    await updateDesktopItem(itemId, { position: newPosition })
  }

  /**
   * 设置壁纸
   */
  const setWallpaper = async (wallpaperUrl: string): Promise<void> => {
    wallpaper.value = wallpaperUrl
    await saveDesktopConfig()
  }

  /**
   * 设置主题
   */
  const setTheme = async (newTheme: 'light' | 'dark' | 'auto'): Promise<void> => {
    theme.value = newTheme
    await saveDesktopConfig()
  }

  /**
   * 重置桌面配置
   */
  const resetDesktopConfig = async (): Promise<void> => {
    localStorage.removeItem('linglongos_desktop_config')
    await loadDefaultConfig()
  }

  /**
   * 获取指定位置的桌面项目
   */
  const getItemAtPosition = (x: number, y: number): DesktopItem | null => {
    return desktopItems.value.find(item => item.position.x === x && item.position.y === y) || null
  }

  /**
   * 检查位置是否被占用
   */
  const isPositionOccupied = (x: number, y: number, excludeId?: string): boolean => {
    return desktopItems.value.some(
      item => item.id !== excludeId && item.position.x === x && item.position.y === y
    )
  }

  /**
   * 查找空闲位置
   */
  const findFreePosition = (): { x: number; y: number } => {
    const maxX = 20 // 最大列数
    const maxY = 15 // 最大行数

    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < maxX; x++) {
        if (!isPositionOccupied(x, y)) {
          return { x, y }
        }
      }
    }

    // 如果没有找到空闲位置，返回一个默认位置
    return { x: 0, y: 0 }
  }

  return {
    // 状态
    desktopConfig,
    desktopItems,
    wallpaper,
    theme,

    // 方法
    loadDesktopConfig,
    loadDefaultConfig,
    saveDesktopConfig,
    addDesktopItem,
    removeDesktopItem,
    updateDesktopItem,
    moveDesktopItem,
    setWallpaper,
    setTheme,
    resetDesktopConfig,
    getItemAtPosition,
    isPositionOccupied,
    findFreePosition,
  }
})
