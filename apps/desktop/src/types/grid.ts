/**
 * 网格系统类型定义
 * @description 定义桌面网格系统相关的所有类型接口
 */

/**
 * 网格尺寸类型
 */
export type GridSize = 'small' | 'medium' | 'large';

/**
 * 图标类型枚举
 */
export type IconType = 
  | 'file' 
  | 'folder' 
  | 'image' 
  | 'music' 
  | 'video' 
  | 'settings' 
  | 'calculator' 
  | 'browser' 
  | 'mail' 
  | 'calendar'
  | 'terminal'
  | 'editor'
  | 'game'
  | 'app';

/**
 * 位置坐标接口
 */
export interface IPosition {
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
}

/**
 * 网格位置接口
 */
export interface IGridPosition {
  /** 网格行索引 */
  row: number;
  /** 网格列索引 */
  col: number;
}

/**
 * 网格配置接口
 */
export interface IGridConfig {
  /** 网格尺寸 */
  size: GridSize;
  /** 每行图标数量 */
  columns: number;
  /** 每列图标数量 */
  rows: number;
  /** 图标间距 */
  gap: number;
  /** 图标大小 */
  iconSize: number;
  /** 网格内边距 */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * 桌面图标接口
 */
export interface IDesktopIcon {
  /** 唯一标识符 */
  readonly id: string;
  /** 图标名称 */
  name: string;
  /** 图标类型 */
  type: IconType;
  /** 自定义图标URL（可选） */
  customIcon?: string;
  /** 网格位置 */
  gridPosition: IGridPosition;
  /** 像素位置（用于自由模式） */
  pixelPosition?: IPosition;
  /** 是否激活状态 */
  isActive: boolean;
  /** 是否可拖拽 */
  isDraggable: boolean;
  /** 应用程序路径或URL */
  appPath?: string;
  /** 图标描述 */
  description?: string;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 桌面布局模式
 */
export type LayoutMode = 'grid' | 'free';

/**
 * 桌面配置接口
 */
export interface IDesktopConfig {
  /** 布局模式 */
  layoutMode: LayoutMode;
  /** 当前网格配置 */
  gridConfig: IGridConfig;
  /** 是否启用自动排列 */
  autoArrange: boolean;
  /** 是否启用网格对齐 */
  snapToGrid: boolean;
  /** 背景配置 */
  background: {
    /** 背景类型 */
    type: 'gradient' | 'image' | 'solid';
    /** 背景值 */
    value: string;
  };
  /** 主题配置 */
  theme: {
    /** 主色调 */
    primary: string;
    /** 辅助色 */
    secondary: string;
    /** 文字颜色 */
    textColor: string;
  };
}

/**
 * 应用程序信息接口
 */
export interface IApplication {
  /** 应用ID */
  readonly id: string;
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 应用图标 */
  icon: string;
  /** 应用描述 */
  description: string;
  /** 应用类型 */
  type: IconType;
  /** 应用路径 */
  path: string;
  /** 是否为系统应用 */
  isSystemApp: boolean;
  /** 安装时间 */
  readonly installedAt: Date;
}

/**
 * 桌面状态接口
 */
export interface IDesktopState {
  /** 桌面图标列表 */
  icons: IDesktopIcon[];
  /** 已安装应用列表 */
  applications: IApplication[];
  /** 当前选中的图标ID */
  selectedIconId: string | null;
  /** 桌面配置 */
  config: IDesktopConfig;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 拖拽状态 */
  dragState: {
    /** 是否正在拖拽 */
    isDragging: boolean;
    /** 拖拽的图标ID */
    draggedIconId: string | null;
    /** 拖拽起始位置 */
    startPosition: IPosition | null;
  };
}

/**
 * 网格预设配置
 * 优化后的配置确保图标和中文标签的精确对齐
 */
export const GRID_PRESETS: Record<GridSize, IGridConfig> = {
  small: {
    size: 'small',
    columns: 14,
    rows: 10,
    gap: 12,
    iconSize: 64,
    padding: { top: 24, right: 24, bottom: 24, left: 24 }
  },
  medium: {
    size: 'medium',
    columns: 10,
    rows: 7,
    gap: 20,
    iconSize: 88,
    padding: { top: 32, right: 32, bottom: 32, left: 32 }
  },
  large: {
    size: 'large',
    columns: 8,
    rows: 5,
    gap: 28,
    iconSize: 112,
    padding: { top: 40, right: 40, bottom: 40, left: 40 }
  }
};

/**
 * 默认桌面配置
 */
export const DEFAULT_DESKTOP_CONFIG: IDesktopConfig = {
  layoutMode: 'grid',
  gridConfig: GRID_PRESETS.medium,
  autoArrange: true,
  snapToGrid: true,
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  theme: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    textColor: '#1f2937'
  }
};