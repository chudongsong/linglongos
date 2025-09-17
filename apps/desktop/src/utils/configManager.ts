/**
 * 配置管理工具类
 * @description 负责桌面配置的持久化存储和管理
 */

import { 
  type IDesktopConfig, 
  type IDesktopIcon, 
  type IApplication, 
  type GridSize,
  type LayoutMode,
  type IGridConfig,
  GRID_PRESETS,
  DEFAULT_DESKTOP_CONFIG 
} from '../types/grid';

/**
 * 本地存储键名常量
 */
const STORAGE_KEYS = {
  DESKTOP_CONFIG: 'linglong_desktop_config',
  DESKTOP_ICONS: 'linglong_desktop_icons',
  APPLICATIONS: 'linglong_applications',
  USER_PREFERENCES: 'linglong_user_preferences'
} as const;

/**
 * 配置管理器类
 */
export class ConfigManager {
  private static instance: ConfigManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.initializeDefaultConfig();
  }

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfig(): void {
    if (!this.hasStoredConfig()) {
      this.saveDesktopConfig(DEFAULT_DESKTOP_CONFIG);
      this.saveDesktopIcons(this.getDefaultIcons());
      this.saveApplications(this.getDefaultApplications());
    }
  }

  /**
   * 检查是否存在已保存的配置
   */
  private hasStoredConfig(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DESKTOP_CONFIG) !== null;
  }

  /**
   * 获取桌面配置
   */
  public getDesktopConfig(): IDesktopConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DESKTOP_CONFIG);
      if (stored) {
        const config = JSON.parse(stored) as IDesktopConfig;
        return this.validateDesktopConfig(config);
      }
    } catch (error) {
      console.error('Failed to load desktop config:', error);
    }
    return DEFAULT_DESKTOP_CONFIG;
  }

  /**
   * 保存桌面配置
   */
  public saveDesktopConfig(config: IDesktopConfig): void {
    try {
      const validatedConfig = this.validateDesktopConfig(config);
      localStorage.setItem(STORAGE_KEYS.DESKTOP_CONFIG, JSON.stringify(validatedConfig));
    } catch (error) {
      console.error('Failed to save desktop config:', error);
      throw new Error('保存桌面配置失败');
    }
  }

  /**
   * 获取桌面图标列表
   */
  public getDesktopIcons(): IDesktopIcon[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DESKTOP_ICONS);
      if (stored) {
        const icons = JSON.parse(stored) as IDesktopIcon[];
        return icons.map(icon => this.validateDesktopIcon(icon));
      }
    } catch (error) {
      console.error('Failed to load desktop icons:', error);
    }
    return this.getDefaultIcons();
  }

  /**
   * 保存桌面图标列表
   */
  public saveDesktopIcons(icons: IDesktopIcon[]): void {
    try {
      const validatedIcons = icons.map(icon => this.validateDesktopIcon(icon));
      localStorage.setItem(STORAGE_KEYS.DESKTOP_ICONS, JSON.stringify(validatedIcons));
    } catch (error) {
      console.error('Failed to save desktop icons:', error);
      throw new Error('保存桌面图标失败');
    }
  }

  /**
   * 获取应用程序列表
   */
  public getApplications(): IApplication[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (stored) {
        const apps = JSON.parse(stored) as IApplication[];
        return apps.map(app => this.validateApplication(app));
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
    return this.getDefaultApplications();
  }

  /**
   * 保存应用程序列表
   */
  public saveApplications(applications: IApplication[]): void {
    try {
      const validatedApps = applications.map(app => this.validateApplication(app));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(validatedApps));
    } catch (error) {
      console.error('Failed to save applications:', error);
      throw new Error('保存应用程序列表失败');
    }
  }

  /**
   * 更新网格配置
   */
  public updateGridConfig(size: GridSize): void {
    const currentConfig = this.getDesktopConfig();
    const newGridConfig = { ...GRID_PRESETS[size] };
    
    const updatedConfig: IDesktopConfig = {
      ...currentConfig,
      gridConfig: newGridConfig
    };
    
    this.saveDesktopConfig(updatedConfig);
  }

  /**
   * 添加新图标
   */
  public addIcon(icon: Omit<IDesktopIcon, 'id' | 'createdAt' | 'updatedAt'>): IDesktopIcon {
    const icons = this.getDesktopIcons();
    const newIcon: IDesktopIcon = {
      ...icon,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    icons.push(newIcon);
    this.saveDesktopIcons(icons);
    return newIcon;
  }

  /**
   * 更新图标
   */
  public updateIcon(iconId: string, updates: Partial<IDesktopIcon>): void {
    const icons = this.getDesktopIcons();
    const iconIndex = icons.findIndex(icon => icon.id === iconId);
    
    if (iconIndex === -1) {
      throw new Error(`图标 ${iconId} 不存在`);
    }
    
    icons[iconIndex] = {
      ...icons[iconIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveDesktopIcons(icons);
  }

  /**
   * 删除图标
   */
  public removeIcon(iconId: string): void {
    const icons = this.getDesktopIcons();
    const filteredIcons = icons.filter(icon => icon.id !== iconId);
    this.saveDesktopIcons(filteredIcons);
  }

  /**
   * 导出配置为JSON
   */
  public exportConfig(): string {
    const config = {
      desktopConfig: this.getDesktopConfig(),
      icons: this.getDesktopIcons(),
      applications: this.getApplications(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  public importConfig(jsonString: string): void {
    try {
      const config = JSON.parse(jsonString);
      
      if (config.desktopConfig) {
        this.saveDesktopConfig(config.desktopConfig);
      }
      
      if (config.icons) {
        this.saveDesktopIcons(config.icons);
      }
      
      if (config.applications) {
        this.saveApplications(config.applications);
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('导入配置失败：JSON格式无效');
    }
  }

  /**
   * 重置为默认配置
   */
  public resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.DESKTOP_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.DESKTOP_ICONS);
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    this.initializeDefaultConfig();
  }

  /**
   * 验证桌面配置
   */
  private validateDesktopConfig(config: unknown): IDesktopConfig {
    const configObj = config as Record<string, unknown>;
    const layoutMode = configObj.layoutMode as string;
    // 基本验证和默认值设置
    return {
      layoutMode: (layoutMode === 'grid' || layoutMode === 'free') ? layoutMode as LayoutMode : 'grid',
      gridConfig: (configObj.gridConfig as IGridConfig) || GRID_PRESETS.medium,
      autoArrange: configObj.autoArrange !== undefined ? Boolean(configObj.autoArrange) : true,
      snapToGrid: configObj.snapToGrid !== undefined ? Boolean(configObj.snapToGrid) : true,
      background: (configObj.background as IDesktopConfig['background']) || DEFAULT_DESKTOP_CONFIG.background,
      theme: (configObj.theme as IDesktopConfig['theme']) || DEFAULT_DESKTOP_CONFIG.theme
    };
  }

  /**
   * 验证桌面图标
   */
  private validateDesktopIcon(icon: unknown): IDesktopIcon {
    const iconObj = icon as Record<string, unknown>;
    return {
      id: (iconObj.id as string) || this.generateId(),
      name: (iconObj.name as string) || '未命名',
      type: (iconObj.type as IDesktopIcon['type']) || 'app',
      customIcon: iconObj.customIcon as string,
      gridPosition: (iconObj.gridPosition as IDesktopIcon['gridPosition']) || { row: 0, col: 0 },
      pixelPosition: iconObj.pixelPosition as IDesktopIcon['pixelPosition'],
      isActive: iconObj.isActive !== undefined ? Boolean(iconObj.isActive) : false,
      isDraggable: iconObj.isDraggable !== undefined ? Boolean(iconObj.isDraggable) : true,
      appPath: iconObj.appPath as string,
      description: iconObj.description as string,
      createdAt: iconObj.createdAt ? new Date(iconObj.createdAt as string) : new Date(),
      updatedAt: iconObj.updatedAt ? new Date(iconObj.updatedAt as string) : new Date()
    };
  }

  /**
   * 验证应用程序
   */
  private validateApplication(app: unknown): IApplication {
    const appObj = app as Record<string, unknown>;
    return {
      id: (appObj.id as string) || this.generateId(),
      name: (appObj.name as string) || '未知应用',
      version: (appObj.version as string) || '1.0.0',
      icon: (appObj.icon as string) || '',
      description: (appObj.description as string) || '',
      type: (appObj.type as IApplication['type']) || 'app',
      path: (appObj.path as string) || '',
      isSystemApp: appObj.isSystemApp !== undefined ? Boolean(appObj.isSystemApp) : false,
      installedAt: appObj.installedAt ? new Date(appObj.installedAt as string) : new Date()
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取默认图标列表
   */
  private getDefaultIcons(): IDesktopIcon[] {
    return [
      {
        id: 'icon-1',
        name: '文件管理器',
        type: 'folder',
        gridPosition: { row: 0, col: 0 },
        isActive: false,
        isDraggable: true,
        appPath: '/apps/file-manager',
        description: '管理文件和文件夹',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'icon-2',
        name: '终端',
        type: 'terminal',
        gridPosition: { row: 0, col: 1 },
        isActive: false,
        isDraggable: true,
        appPath: '/apps/terminal',
        description: '命令行终端',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'icon-3',
        name: '设置',
        type: 'settings',
        gridPosition: { row: 0, col: 2 },
        isActive: false,
        isDraggable: true,
        appPath: '/apps/settings',
        description: '系统设置',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'icon-4',
        name: '浏览器',
        type: 'browser',
        gridPosition: { row: 1, col: 0 },
        isActive: false,
        isDraggable: true,
        appPath: '/apps/browser',
        description: '网页浏览器',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'icon-5',
        name: '计算器',
        type: 'calculator',
        gridPosition: { row: 1, col: 1 },
        isActive: false,
        isDraggable: true,
        appPath: '/apps/calculator',
        description: '科学计算器',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 获取默认应用程序列表
   */
  private getDefaultApplications(): IApplication[] {
    return [
      {
        id: 'app-1',
        name: '文件管理器',
        version: '1.0.0',
        icon: 'folder',
        description: '管理文件和文件夹的系统应用',
        type: 'folder',
        path: '/apps/file-manager',
        isSystemApp: true,
        installedAt: new Date()
      },
      {
        id: 'app-2',
        name: '终端',
        version: '1.0.0',
        icon: 'terminal',
        description: '命令行终端应用',
        type: 'terminal',
        path: '/apps/terminal',
        isSystemApp: true,
        installedAt: new Date()
      },
      {
        id: 'app-3',
        name: '系统设置',
        version: '1.0.0',
        icon: 'settings',
        description: '系统配置和设置',
        type: 'settings',
        path: '/apps/settings',
        isSystemApp: true,
        installedAt: new Date()
      }
    ];
  }
}

/**
 * 导出配置管理器实例
 */
export const configManager = ConfigManager.getInstance();