/**
 * 响应式网格Hook
 * @description 实现网格布局的自适应调整功能
 */

import { useState, useEffect, useCallback } from 'react';
import { type GridSize, type IGridConfig, GRID_PRESETS } from '../types/grid';

interface UseResponsiveGridOptions {
  /** 初始网格配置 */
  initialConfig: IGridConfig;
  /** 断点配置 */
  breakpoints?: {
    small: number;
    medium: number;
    large: number;
  };
  /** 是否启用自动调整 */
  autoResize?: boolean;
  /** 调整延迟（毫秒） */
  resizeDelay?: number;
}

interface UseResponsiveGridReturn {
  /** 当前网格配置 */
  gridConfig: IGridConfig;
  /** 当前屏幕尺寸类型 */
  screenSize: GridSize;
  /** 容器尺寸 */
  containerSize: { width: number; height: number };
  /** 是否正在调整尺寸 */
  isResizing: boolean;
  /** 手动设置网格尺寸 */
  setGridSize: (size: GridSize) => void;
  /** 刷新容器尺寸 */
  refreshSize: () => void;
}

const DEFAULT_BREAKPOINTS = {
  small: 768,   // 小屏幕：< 768px
  medium: 1200, // 中等屏幕：768px - 1200px
  large: 1920   // 大屏幕：> 1200px
};

export function useResponsiveGrid(options: UseResponsiveGridOptions): UseResponsiveGridReturn {
  const {
    initialConfig,
    breakpoints = DEFAULT_BREAKPOINTS,
    autoResize = true,
    resizeDelay = 300
  } = options;

  // 状态管理
  const [gridConfig, setGridConfig] = useState<IGridConfig>(initialConfig);
  const [screenSize, setScreenSize] = useState<GridSize>('medium');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);

  // 获取当前屏幕尺寸类型
  const getScreenSizeType = useCallback((width: number): GridSize => {
    if (width < breakpoints.small) {
      return 'small';
    } else if (width < breakpoints.medium) {
      return 'medium';
    } else {
      return 'large';
    }
  }, [breakpoints]);

  // 更新容器尺寸
  const updateContainerSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setContainerSize({ width, height });
    
    if (autoResize) {
      const newScreenSize = getScreenSizeType(width);
      
      if (newScreenSize !== screenSize) {
        setScreenSize(newScreenSize);
        
        // 根据屏幕尺寸自动调整网格配置
        const newGridConfig = { ...GRID_PRESETS[newScreenSize] };
        
        // 根据实际容器尺寸微调网格配置
        const adjustedConfig = adjustGridConfigForContainer(newGridConfig, width, height);
        setGridConfig(adjustedConfig);
      }
    }
  }, [autoResize, getScreenSizeType, screenSize]);

  // 根据容器尺寸调整网格配置
  const adjustGridConfigForContainer = useCallback((
    config: IGridConfig, 
    containerWidth: number, 
    containerHeight: number
  ): IGridConfig => {
    const { iconSize, gap, padding } = config;
    
    // 计算可用空间
    const availableWidth = containerWidth - padding.left - padding.right;
    const availableHeight = containerHeight - padding.top - padding.bottom;
    
    // 计算最大可容纳的列数和行数
    const maxColumns = Math.floor((availableWidth + gap) / (iconSize + gap));
    const maxRows = Math.floor((availableHeight + gap) / (iconSize + gap));
    
    // 确保至少有最小的网格尺寸
    const minColumns = 4;
    const minRows = 3;
    
    return {
      ...config,
      columns: Math.max(minColumns, Math.min(config.columns, maxColumns)),
      rows: Math.max(minRows, Math.min(config.rows, maxRows))
    };
  }, []);

  // 手动设置网格尺寸
  const setGridSize = useCallback((size: GridSize) => {
    setScreenSize(size);
    const newGridConfig = { ...GRID_PRESETS[size] };
    
    // 根据当前容器尺寸调整配置
    const adjustedConfig = adjustGridConfigForContainer(
      newGridConfig, 
      containerSize.width, 
      containerSize.height
    );
    
    setGridConfig(adjustedConfig);
  }, [containerSize, adjustGridConfigForContainer]);

  // 刷新容器尺寸
  const refreshSize = useCallback(() => {
    updateContainerSize();
  }, [updateContainerSize]);

  // 防抖处理的resize事件
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      setIsResizing(true);
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateContainerSize();
        setIsResizing(false);
      }, resizeDelay);
    };

    // 初始化尺寸
    updateContainerSize();

    // 监听窗口尺寸变化
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateContainerSize, resizeDelay]);

  // 监听设备方向变化（移动设备）
  useEffect(() => {
    const handleOrientationChange = () => {
      // 延迟更新，等待设备完成方向切换
      setTimeout(() => {
        updateContainerSize();
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateContainerSize]);

  return {
    gridConfig,
    screenSize,
    containerSize,
    isResizing,
    setGridSize,
    refreshSize
  };
}

/**
 * 获取推荐的网格配置
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @returns 推荐的网格配置
 */
export function getRecommendedGridConfig(
  containerWidth: number, 
  containerHeight: number
): IGridConfig {
  // 根据容器尺寸推荐合适的网格配置
  const aspectRatio = containerWidth / containerHeight;
  
  if (containerWidth < 768) {
    return GRID_PRESETS.small;
  } else if (containerWidth < 1200) {
    // 根据宽高比调整中等尺寸配置
    const config = { ...GRID_PRESETS.medium };
    if (aspectRatio > 1.5) {
      // 宽屏，增加列数
      config.columns = Math.min(config.columns + 2, 12);
    }
    return config;
  } else {
    // 根据宽高比调整大尺寸配置
    const config = { ...GRID_PRESETS.large };
    if (aspectRatio > 1.8) {
      // 超宽屏，增加列数
      config.columns = Math.min(config.columns + 3, 16);
    }
    return config;
  }
}

/**
 * 计算网格的最佳尺寸
 * @param iconCount 图标数量
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @returns 最佳的网格配置
 */
export function calculateOptimalGridSize(
  iconCount: number,
  containerWidth: number,
  containerHeight: number
): IGridConfig {
  const baseConfig = getRecommendedGridConfig(containerWidth, containerHeight);
  
  // 根据图标数量调整网格尺寸
  const idealColumns = Math.ceil(Math.sqrt(iconCount * (containerWidth / containerHeight)));
  const idealRows = Math.ceil(iconCount / idealColumns);
  
  // 确保不超过容器限制
  const maxColumns = Math.floor((containerWidth - baseConfig.padding.left - baseConfig.padding.right + baseConfig.gap) / (baseConfig.iconSize + baseConfig.gap));
  const maxRows = Math.floor((containerHeight - baseConfig.padding.top - baseConfig.padding.bottom + baseConfig.gap) / (baseConfig.iconSize + baseConfig.gap));
  
  return {
    ...baseConfig,
    columns: Math.min(idealColumns, maxColumns),
    rows: Math.min(idealRows, maxRows)
  };
}