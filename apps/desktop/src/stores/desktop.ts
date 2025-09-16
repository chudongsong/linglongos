import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  DesktopIcon, 
  GridConfig, 
  GridPosition, 
  WallpaperConfig, 
  ThemeConfig, 
  Folder 
} from '@/types'

export const useDesktopStore = defineStore('desktop', () => {
  // State
  const icons = ref<DesktopIcon[]>([])
  const folders = ref<Folder[]>([])
  const selectedIconIds = ref<Set<string>>(new Set())
  const gridConfig = ref<GridConfig>({
    columns: 20,
    rows: 12,
    cellWidth: 80,
    cellHeight: 80,
    gap: 10,
    padding: 20
  })
  const wallpaper = ref<WallpaperConfig>({
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 1
  })
  const theme = ref<ThemeConfig>({
    mode: 'light',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    fontFamily: 'Inter',
    fontSize: 14,
    borderRadius: 8,
    animations: true
  })

  // Getters
  const gridItems = computed(() => {
    const items: (DesktopIcon | Folder)[] = [...icons.value, ...folders.value]
    return items.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
  })

  const selectedIcons = computed(() => 
    icons.value.filter(icon => selectedIconIds.value.has(icon.id))
  )

  const availablePositions = computed(() => {
    const occupied = new Set<string>()
    gridItems.value.forEach(item => {
      for (let x = item.position.x; x < item.position.x + item.position.width; x++) {
        for (let y = item.position.y; y < item.position.y + item.position.height; y++) {
          occupied.add(`${x},${y}`)
        }
      }
    })

    const available: GridPosition[] = []
    for (let y = 0; y < gridConfig.value.rows; y++) {
      for (let x = 0; x < gridConfig.value.columns; x++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y, width: 1, height: 1 })
        }
      }
    }
    return available
  })

  // Actions
  function addIcon(icon: Omit<DesktopIcon, 'id'>): string {
    const id = generateId()
    const newIcon: DesktopIcon = {
      ...icon,
      id,
      position: icon.position || findAvailablePosition()
    }
    icons.value.push(newIcon)
    saveDesktopConfig()
    return id
  }

  function removeIcon(iconId: string): void {
    const index = icons.value.findIndex(icon => icon.id === iconId)
    if (index !== -1) {
      icons.value.splice(index, 1)
      selectedIconIds.value.delete(iconId)
      saveDesktopConfig()
    }
  }

  function updateIcon(iconId: string, updates: Partial<DesktopIcon>): void {
    const icon = icons.value.find(icon => icon.id === iconId)
    if (icon) {
      Object.assign(icon, updates)
      saveDesktopConfig()
    }
  }

  function moveIcon(iconId: string, position: GridPosition): void {
    const icon = icons.value.find(icon => icon.id === iconId)
    if (icon && isPositionAvailable(position, iconId)) {
      icon.position = position
      saveDesktopConfig()
    }
  }

  function selectIcon(iconId: string, multi = false): void {
    if (!multi) {
      selectedIconIds.value.clear()
    }
    selectedIconIds.value.add(iconId)
  }

  function unselectIcon(iconId: string): void {
    selectedIconIds.value.delete(iconId)
  }

  function clearSelection(): void {
    selectedIconIds.value.clear()
  }

  function createFolder(iconIds: string[], name: string): string {
    if (iconIds.length < 2) return ''

    const folderId = generateId()
    const firstIcon = icons.value.find(icon => iconIds.includes(icon.id))
    if (!firstIcon) return ''

    const folder: Folder = {
      id: folderId,
      name,
      icon: 'folder',
      children: iconIds,
      position: firstIcon.position,
      isOpen: false
    }

    folders.value.push(folder)
    
    // 移除被加入文件夹的图标
    icons.value = icons.value.filter(icon => !iconIds.includes(icon.id))
    clearSelection()
    saveDesktopConfig()
    
    return folderId
  }

  function openFolder(folderId: string): void {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.isOpen = true
      // 这里可以触发文件夹打开窗口的逻辑
    }
  }

  function closeFolder(folderId: string): void {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.isOpen = false
    }
  }

  function addToFolder(folderId: string, iconId: string): void {
    const folder = folders.value.find(f => f.id === folderId)
    const icon = icons.value.find(i => i.id === iconId)
    
    if (folder && icon && !folder.children.includes(iconId)) {
      folder.children.push(iconId)
      removeIcon(iconId)
      saveDesktopConfig()
    }
  }

  function removeFromFolder(folderId: string, iconId: string): void {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      const index = folder.children.indexOf(iconId)
      if (index !== -1) {
        folder.children.splice(index, 1)
        
        // 如果文件夹为空，删除文件夹
        if (folder.children.length === 0) {
          const folderIndex = folders.value.findIndex(f => f.id === folderId)
          if (folderIndex !== -1) {
            folders.value.splice(folderIndex, 1)
          }
        }
        saveDesktopConfig()
      }
    }
  }

  function setWallpaper(wallpaperConfig: WallpaperConfig): void {
    wallpaper.value = wallpaperConfig
    saveDesktopConfig()
  }

  function setTheme(themeConfig: ThemeConfig): void {
    theme.value = themeConfig
    applyTheme(themeConfig)
    saveDesktopConfig()
  }

  function updateGridConfig(config: Partial<GridConfig>): void {
    gridConfig.value = { ...gridConfig.value, ...config }
    saveDesktopConfig()
  }

  function autoArrange(): void {
    let x = 0
    let y = 0
    const { columns } = gridConfig.value

    gridItems.value.forEach(item => {
      item.position = { x, y, width: 1, height: 1 }
      x++
      if (x >= columns) {
        x = 0
        y++
      }
    })
    
    saveDesktopConfig()
  }

  function resetLayout(): void {
    icons.value = []
    folders.value = []
    selectedIconIds.value.clear()
    saveDesktopConfig()
  }

  function findAvailablePosition(): GridPosition {
    const available = availablePositions.value
    return available.length > 0 ? available[0] : { x: 0, y: 0, width: 1, height: 1 }
  }

  function isPositionAvailable(position: GridPosition, excludeId?: string): boolean {
    return !gridItems.value.some(item => {
      if (excludeId && item.id === excludeId) return false
      
      return (
        position.x < item.position.x + item.position.width &&
        position.x + position.width > item.position.x &&
        position.y < item.position.y + item.position.height &&
        position.y + position.height > item.position.y
      )
    })
  }

  function findNearestPosition(mousePos: { x: number; y: number }): GridPosition {
    const { cellWidth, cellHeight, gap, padding } = gridConfig.value
    
    const gridX = Math.floor((mousePos.x - padding) / (cellWidth + gap))
    const gridY = Math.floor((mousePos.y - padding) / (cellHeight + gap))
    
    return {
      x: Math.max(0, Math.min(gridX, gridConfig.value.columns - 1)),
      y: Math.max(0, Math.min(gridY, gridConfig.value.rows - 1)),
      width: 1,
      height: 1
    }
  }

  function loadDesktopConfig(): void {
    try {
      const saved = localStorage.getItem('desktop_config')
      if (saved) {
        const config = JSON.parse(saved)
        if (config.icons) icons.value = config.icons
        if (config.folders) folders.value = config.folders
        if (config.gridConfig) gridConfig.value = config.gridConfig
        if (config.wallpaper) wallpaper.value = config.wallpaper
        if (config.theme) {
          theme.value = config.theme
          applyTheme(config.theme)
        }
      }
    } catch (error) {
      console.error('Failed to load desktop config:', error)
    }
  }

  function saveDesktopConfig(): void {
    try {
      const config = {
        icons: icons.value,
        folders: folders.value,
        gridConfig: gridConfig.value,
        wallpaper: wallpaper.value,
        theme: theme.value
      }
      localStorage.setItem('desktop_config', JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save desktop config:', error)
    }
  }

  function applyTheme(themeConfig: ThemeConfig): void {
    const root = document.documentElement
    
    // 应用主题模式
    if (themeConfig.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // 应用CSS变量
    root.style.setProperty('--primary-color', themeConfig.primaryColor)
    root.style.setProperty('--accent-color', themeConfig.accentColor)
    root.style.setProperty('--font-family', themeConfig.fontFamily)
    root.style.setProperty('--font-size', `${themeConfig.fontSize}px`)
    root.style.setProperty('--border-radius', `${themeConfig.borderRadius}px`)
  }

  function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // 初始化
  loadDesktopConfig()

  return {
    // State
    icons: readonly(icons),
    folders: readonly(folders),
    selectedIconIds: readonly(selectedIconIds),
    gridConfig: readonly(gridConfig),
    wallpaper: readonly(wallpaper),
    theme: readonly(theme),
    
    // Getters
    gridItems,
    selectedIcons,
    availablePositions,
    
    // Actions
    addIcon,
    removeIcon,
    updateIcon,
    moveIcon,
    selectIcon,
    unselectIcon,
    clearSelection,
    createFolder,
    openFolder,
    closeFolder,
    addToFolder,
    removeFromFolder,
    setWallpaper,
    setTheme,
    updateGridConfig,
    autoArrange,
    resetLayout,
    findAvailablePosition,
    isPositionAvailable,
    findNearestPosition,
    loadDesktopConfig,
    saveDesktopConfig
  }
})