/**
 * 网格桌面组件
 * @description 基于网格系统的桌面界面，支持灵活的图标排列和拖拽
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import GridLayout from './GridLayout';
import { ConfigManager } from '../../utils/configManager';
import { useResponsiveGrid } from '../../hooks/useResponsiveGrid';
import { useContainerSize } from '../../hooks/useContainerSize';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { DragProvider } from '../../contexts/DragContext';
import { DragPreview } from '../drag/DragPreview';
import { 
  type IDesktopIcon, 
  type IGridConfig, 
  type GridSize, 
  type IGridPosition,
  GRID_PRESETS 
} from '../../types/grid';

const GridDesktop: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedIcon } = useSelector((state: RootState) => state.desktop);
  
  // 本地状态
  const [icons, setIcons] = useState<IDesktopIcon[]>([]);
  const [gridConfig, setGridConfig] = useState<IGridConfig>(GRID_PRESETS.medium);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 性能监控
  const { startInteractionTiming, endInteractionTiming } = usePerformanceMonitor({
    componentName: 'GridDesktop',
    enabled: process.env.NODE_ENV === 'development'
  });

  // 配置管理器实例
  const configManager = ConfigManager.getInstance();

  // 容器尺寸监听
  const { size: containerSize, ref: containerRef } = useContainerSize({
    debounceDelay: 200,
    enabled: true
  });

  // 响应式网格Hook
  const { 
    gridConfig: responsiveGridConfig, 
    screenSize
  } = useResponsiveGrid({ 
    initialConfig: gridConfig,
    autoResize: true 
  });

  // 初始化数据
  useEffect(() => {
    const initializeDesktop = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 首先尝试从JSON文件加载配置
        const jsonLoadSuccess = await configManager.loadFromJsonFile();
        
        if (jsonLoadSuccess) {
          console.log('成功从JSON配置文件加载桌面设置');
        } else {
          console.log('使用本地存储或默认配置');
        }

        // 加载桌面配置
        const desktopConfig = configManager.getDesktopConfig();
        setGridConfig(desktopConfig.gridConfig);

        // 加载桌面图标
        const desktopIcons = configManager.getDesktopIcons();
        setIcons(desktopIcons);

        console.log('桌面初始化完成:', {
          gridConfig: desktopConfig.gridConfig,
          iconCount: desktopIcons.length
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载桌面数据失败';
        setError(errorMessage);
        console.error('Failed to initialize desktop:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDesktop();
  }, [configManager]);



  // 处理图标点击
  const handleIconClick = useCallback((iconId: string) => {
    startInteractionTiming();
    dispatch.desktop.selectIcon(iconId);
    endInteractionTiming();
  }, [dispatch, startInteractionTiming, endInteractionTiming]);

  // 处理图标双击
  const handleIconDoubleClick = useCallback((iconId: string) => {
    startInteractionTiming();
    const icon = icons.find(icon => icon.id === iconId);
    if (icon) {
      // 打开应用
      dispatch.desktop.openApplication(iconId);
      console.log('Opening application:', icon.name, icon.appPath);
    }
    endInteractionTiming();
  }, [icons, dispatch, startInteractionTiming, endInteractionTiming]);

  // 处理图标移动
  const handleIconMove = useCallback((iconId: string, newPosition: IGridPosition) => {
    try {
      // 更新本地状态
      setIcons(prevIcons => 
        prevIcons.map(icon => 
          icon.id === iconId 
            ? { ...icon, gridPosition: newPosition, updatedAt: new Date() }
            : icon
        )
      );

      // 更新持久化存储
      configManager.updateIcon(iconId, { 
        gridPosition: newPosition,
        updatedAt: new Date()
      });

      // 更新Redux状态（如果需要）
      dispatch.desktop.moveIcon({
        id: iconId,
        position: { x: newPosition.col * 100, y: newPosition.row * 100 } // 临时转换
      });

    } catch (err) {
      console.error('Failed to move icon:', err);
      setError('移动图标失败');
    }
  }, [configManager, dispatch]);

  // 处理网格尺寸变化
  const handleGridSizeChange = useCallback((size: GridSize) => {
    try {
      const newGridConfig = { ...GRID_PRESETS[size] };
      setGridConfig(newGridConfig);

      // 更新配置管理器
      configManager.updateGridConfig(size);

      // 重新排列图标以适应新的网格尺寸
      const updatedIcons = icons.map(icon => {
        const { row, col } = icon.gridPosition;
        const newRow = Math.min(row, newGridConfig.rows - 1);
        const newCol = Math.min(col, newGridConfig.columns - 1);
        
        return {
          ...icon,
          gridPosition: { row: newRow, col: newCol },
          updatedAt: new Date()
        };
      });

      setIcons(updatedIcons);
      configManager.saveDesktopIcons(updatedIcons);

    } catch (err) {
      console.error('Failed to change grid size:', err);
      setError('更改网格尺寸失败');
    }
  }, [icons, configManager]);

  // 处理桌面点击
  const handleDesktopClick = useCallback(() => {
    dispatch.desktop.selectIcon('');
  }, [dispatch]);

  // 添加新图标
  const addNewIcon = useCallback((iconData: Omit<IDesktopIcon, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newIcon = configManager.addIcon(iconData);
      setIcons(prevIcons => [...prevIcons, newIcon]);
      return newIcon;
    } catch (err) {
      console.error('Failed to add icon:', err);
      setError('添加图标失败');
      return null;
    }
  }, [configManager]);

  // 删除图标
  const removeIcon = useCallback((iconId: string) => {
    try {
      configManager.removeIcon(iconId);
      setIcons(prevIcons => prevIcons.filter(icon => icon.id !== iconId));
      
      // 如果删除的是选中的图标，清除选择
      if (selectedIcon === iconId) {
        dispatch.desktop.selectIcon('');
      }
    } catch (err) {
      console.error('Failed to remove icon:', err);
      setError('删除图标失败');
    }
  }, [configManager, selectedIcon, dispatch]);

  // 自动排列图标
  const autoArrangeIcons = useCallback(() => {
    try {
      const arrangedIcons = icons.map((icon, index) => {
        const row = Math.floor(index / gridConfig.columns);
        const col = index % gridConfig.columns;
        
        return {
          ...icon,
          gridPosition: { row, col },
          updatedAt: new Date()
        };
      });

      setIcons(arrangedIcons);
      configManager.saveDesktopIcons(arrangedIcons);
    } catch (err) {
      console.error('Failed to auto arrange icons:', err);
      setError('自动排列失败');
    }
  }, [icons, gridConfig, configManager]);

  // 错误处理
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">桌面加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载桌面...</p>
        </div>
      </div>
    );
  }

  return (
    <DragProvider>
      <div ref={containerRef} className="relative w-full h-full">
        {/* 网格布局组件 */}
        <GridLayout
          icons={icons}
          gridConfig={responsiveGridConfig}
          selectedIconId={selectedIcon}
          enableDrag={true}
          snapToGrid={true}
          onIconClick={handleIconClick}
          onIconDoubleClick={handleIconDoubleClick}
          onIconMove={handleIconMove}
          onGridSizeChange={handleGridSizeChange}
          onDesktopClick={handleDesktopClick}
        />

        {/* 拖拽预览组件 */}
        <DragPreview />

      {/* 桌面工具栏 */}
      <div className="absolute top-4 left-4 flex space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <button
          onClick={autoArrangeIcons}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="自动排列图标"
        >
          自动排列
        </button>
        <button
          onClick={() => configManager.resetToDefault()}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          title="重置为默认配置"
        >
          重置
        </button>
      </div>

        {/* 调试信息（开发模式） */}
         {process.env.NODE_ENV === 'development' && (
           <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 max-w-xs">
             <div>网格: {responsiveGridConfig.columns}×{responsiveGridConfig.rows}</div>
             <div>图标尺寸: {responsiveGridConfig.iconSize}px</div>
             <div>间距: {responsiveGridConfig.gap}px</div>
             <div>图标数量: {icons.length}</div>
             <div>容器: {containerSize.width}×{containerSize.height}</div>
             <div>屏幕: {screenSize}</div>
             {selectedIcon && (
               <div>选中: {icons.find(icon => icon.id === selectedIcon)?.name}</div>
             )}
           </div>
         )}
      </div>
    </DragProvider>
  );
};

export default GridDesktop;