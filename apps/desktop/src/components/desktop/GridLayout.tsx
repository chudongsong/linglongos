/**
 * 网格布局组件
 * @description 提供灵活的网格系统，支持大、中、小三种预设布局
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { cn } from '../../utils/cn';
import { 
  type IDesktopIcon, 
  type IGridConfig, 
  type GridSize, 
  type IGridPosition
} from '../../types/grid';
import { GridPositionValidator } from '../../utils/gridPositionValidator';
import GridIcon from './GridIcon';

interface GridLayoutProps {
  /** 图标列表 */
  icons: IDesktopIcon[];
  /** 网格配置 */
  gridConfig: IGridConfig;
  /** 选中的图标ID */
  selectedIconId?: string | null;
  /** 是否启用拖拽 */
  enableDrag?: boolean;
  /** 是否启用网格对齐 */
  snapToGrid?: boolean;
  /** 图标点击事件 */
  onIconClick?: (iconId: string) => void;
  /** 图标双击事件 */
  onIconDoubleClick?: (iconId: string) => void;
  /** 图标拖拽结束事件 */
  onIconMove?: (iconId: string, newPosition: IGridPosition) => void;
  /** 网格尺寸变化事件 */
  onGridSizeChange?: (size: GridSize) => void;
  /** 桌面点击事件 */
  onDesktopClick?: () => void;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  icons,
  gridConfig,
  selectedIconId,
  enableDrag = true,
  snapToGrid = true,
  onIconClick,
  onIconDoubleClick,
  onIconMove,
  onGridSizeChange,
  onDesktopClick
}) => {
  // 位置验证状态
  const [positionValidation, setPositionValidation] = useState<{
    isValid: boolean;
    conflicts: any[];
    outOfBounds: any[];
  }>({ isValid: true, conflicts: [], outOfBounds: [] });

  // 验证图标位置配置
  useEffect(() => {
    const validationResult = GridPositionValidator.validatePositions(
      icons,
      gridConfig.columns,
      gridConfig.rows
    );
    
    setPositionValidation(validationResult);
    
    // 在开发环境下输出验证结果
    if (process.env.NODE_ENV === 'development' && !validationResult.isValid) {
      console.warn('🚨 图标位置验证失败:', validationResult);
      const report = GridPositionValidator.generateReport(validationResult);
      console.warn(report);
    }
  }, [icons, gridConfig.columns, gridConfig.rows]);
  const [activeIcon, setActiveIcon] = useState<IDesktopIcon | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<IGridPosition | null>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 计算网格尺寸
  const gridDimensions = useMemo(() => {
    const { columns, rows, gap, iconSize, padding } = gridConfig;
    const totalWidth = columns * iconSize + (columns - 1) * gap + padding.left + padding.right;
    const totalHeight = rows * iconSize + (rows - 1) * gap + padding.top + padding.bottom;
    
    return {
      totalWidth,
      totalHeight,
      cellWidth: iconSize + gap,
      cellHeight: iconSize + gap
    };
  }, [gridConfig]);

  // 计算图标在网格中的像素位置
  const getIconPixelPosition = useCallback((gridPosition: IGridPosition) => {
    const { cellWidth, cellHeight } = gridDimensions;
    const { padding } = gridConfig;
    
    return {
      x: gridPosition.col * cellWidth + padding.left,
      y: gridPosition.row * cellHeight + padding.top
    };
  }, [gridDimensions, gridConfig]);

  // 计算像素位置对应的网格位置
  const getGridPositionFromPixel = useCallback((x: number, y: number) => {
    const { padding, columns, rows, iconSize, gap } = gridConfig;
    
    const adjustedX = x - padding.left;
    const adjustedY = y - padding.top;
    
    // 使用更精确的网格计算，考虑图标中心点
    const centerOffsetX = iconSize / 2;
    const centerOffsetY = iconSize / 2;
    
    const col = Math.max(0, Math.min(columns - 1, 
      Math.round((adjustedX + centerOffsetX) / (iconSize + gap))
    ));
    const row = Math.max(0, Math.min(rows - 1, 
      Math.round((adjustedY + centerOffsetY) / (iconSize + gap))
    ));
    
    return { row, col };
  }, [gridConfig]);

  // 检查网格位置是否被占用
  const isPositionOccupied = useCallback((position: IGridPosition, excludeIconId?: string) => {
    return icons.some(icon => 
      icon.id !== excludeIconId &&
      icon.gridPosition.row === position.row &&
      icon.gridPosition.col === position.col
    );
  }, [icons]);

  // 查找最近的空闲位置
  const findNearestFreePosition = useCallback((targetPosition: IGridPosition, excludeIconId?: string): IGridPosition => {
    const { columns, rows } = gridConfig;
    
    // 如果目标位置空闲，直接返回
    if (!isPositionOccupied(targetPosition, excludeIconId)) {
      return targetPosition;
    }
    
    // 使用曼哈顿距离优先的搜索策略
    const candidates: Array<{ position: IGridPosition; distance: number }> = [];
    
    // 生成所有可能的位置并计算距离
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const position = { row, col };
        if (!isPositionOccupied(position, excludeIconId)) {
          const distance = Math.abs(row - targetPosition.row) + Math.abs(col - targetPosition.col);
          candidates.push({ position, distance });
        }
      }
    }
    
    // 如果没有空闲位置，返回目标位置
    if (candidates.length === 0) {
      return targetPosition;
    }
    
    // 按距离排序，返回最近的位置
    candidates.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // 距离相同时，优先选择行号较小的位置（从上到下排列）
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      // 行号相同时，优先选择列号较小的位置（从左到右排列）
      return a.position.col - b.position.col;
    });
    
    return candidates[0].position;
  }, [gridConfig, isPositionOccupied]);

  // 处理拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const icon = icons.find(icon => icon.id === active.id);
    if (icon) {
      setActiveIcon(icon);
      setDragPreviewPosition(icon.gridPosition);
    }
  }, [icons]);

  // 处理拖拽移动
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    
    if (!activeIcon || !snapToGrid) return;
    
    const currentPixelPos = getIconPixelPosition(activeIcon.gridPosition);
    const newPixelPos = {
      x: currentPixelPos.x + delta.x,
      y: currentPixelPos.y + delta.y
    };
    
    const newGridPosition = getGridPositionFromPixel(newPixelPos.x, newPixelPos.y);
    const previewPosition = findNearestFreePosition(newGridPosition, activeIcon.id);
    
    setDragPreviewPosition(previewPosition);
  }, [activeIcon, snapToGrid, getIconPixelPosition, getGridPositionFromPixel, findNearestFreePosition]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    
    const icon = icons.find(icon => icon.id === active.id);
    if (!icon) {
      setActiveIcon(null);
      return;
    }
    
    // 只有当拖拽距离超过阈值时才进行移动
    const dragThreshold = 5; // 像素
    const dragDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    
    if (dragDistance > dragThreshold && onIconMove) {
      const currentPixelPos = getIconPixelPosition(icon.gridPosition);
      const newPixelPos = {
        x: currentPixelPos.x + delta.x,
        y: currentPixelPos.y + delta.y
      };
      
      let newGridPosition = getGridPositionFromPixel(newPixelPos.x, newPixelPos.y);
      
      // 如果启用网格对齐，查找最近的空闲位置
      if (snapToGrid) {
        newGridPosition = findNearestFreePosition(newGridPosition, icon.id);
      }
      
      // 只有当位置真正改变时才触发移动事件
      if (newGridPosition.row !== icon.gridPosition.row || 
          newGridPosition.col !== icon.gridPosition.col) {
        onIconMove(icon.id, newGridPosition);
      }
    }
    
    setActiveIcon(null);
    setDragPreviewPosition(null);
  }, [icons, onIconMove, getIconPixelPosition, getGridPositionFromPixel, snapToGrid, findNearestFreePosition]);

  // 处理桌面点击
  const handleDesktopClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDesktopClick?.();
    }
  }, [onDesktopClick]);



  // 渲染网格线（调试用）
  const renderGridLines = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    const { columns, rows, gap, iconSize, padding } = gridConfig;
    const lines = [];
    
    // 垂直线
    for (let col = 0; col <= columns; col++) {
      const x = padding.left + col * (iconSize + gap) - gap / 2;
      lines.push(
        <div
          key={`v-${col}`}
          className="absolute bg-blue-200/30 pointer-events-none"
          style={{
            left: x,
            top: padding.top,
            width: 1,
            height: rows * iconSize + (rows - 1) * gap
          }}
        />
      );
    }
    
    // 水平线
    for (let row = 0; row <= rows; row++) {
      const y = padding.top + row * (iconSize + gap) - gap / 2;
      lines.push(
        <div
          key={`h-${row}`}
          className="absolute bg-blue-200/30 pointer-events-none"
          style={{
            left: padding.left,
            top: y,
            width: columns * iconSize + (columns - 1) * gap,
            height: 1
          }}
        />
      );
    }
    
    return lines;
  };

  // 渲染位置冲突提示
  const renderPositionConflicts = () => {
    if (process.env.NODE_ENV !== 'development' || positionValidation.isValid) return null;
    
    const conflictIndicators: React.ReactElement[] = [];
    
    // 渲染位置冲突
    positionValidation.conflicts.forEach((conflict, index) => {
      const pixelPosition = getIconPixelPosition(conflict.position);
      conflictIndicators.push(
        <div
          key={`conflict-${index}`}
          className="absolute pointer-events-none z-40"
          style={{
            left: pixelPosition.x,
            top: pixelPosition.y,
            width: gridConfig.iconSize,
            height: gridConfig.iconSize,
          }}
        >
          {/* 冲突警告背景 */}
          <div className="absolute inset-0 bg-red-500/30 rounded-lg border-2 border-red-500 border-dashed animate-pulse" />
          
          {/* 冲突图标数量 */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {conflict.conflictingIcons.length}
          </div>
          
          {/* 警告图标 */}
          <div className="absolute top-1 left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            ⚠
          </div>
        </div>
      );
    });
    
    // 渲染超出范围的图标
    positionValidation.outOfBounds.forEach((icon, index) => {
      const pixelPosition = getIconPixelPosition(icon.gridPosition);
      conflictIndicators.push(
        <div
          key={`outofbounds-${index}`}
          className="absolute pointer-events-none z-40"
          style={{
            left: pixelPosition.x,
            top: pixelPosition.y,
            width: gridConfig.iconSize,
            height: gridConfig.iconSize,
          }}
        >
          {/* 超出范围警告背景 */}
          <div className="absolute inset-0 bg-orange-500/30 rounded-lg border-2 border-orange-500 border-dashed animate-pulse" />
          
          {/* 超出范围图标 */}
          <div className="absolute top-1 left-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
            📍
          </div>
        </div>
      );
    });
    
    return conflictIndicators;
  };

  // 渲染拖拽预览位置
  const renderDragPreview = () => {
    if (!dragPreviewPosition || !activeIcon) return null;
    
    const previewPixelPos = getIconPixelPosition(dragPreviewPosition);
    
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: previewPixelPos.x,
          top: previewPixelPos.y,
          width: gridConfig.iconSize,
          height: gridConfig.iconSize,
        }}
      >
        {/* 预览背景 */}
        <div className="absolute inset-0 bg-blue-200/40 rounded-lg border-2 border-blue-400 border-dashed animate-pulse" />
        
        {/* 预览图标轮廓 */}
        <div 
          className="absolute bg-blue-100/60 rounded-lg border border-blue-300"
          style={{
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            width: Math.floor(gridConfig.iconSize * 0.7),
            height: Math.floor(gridConfig.iconSize * 0.7),
          }}
        />
        
        {/* 位置指示器 */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        'relative w-full h-full min-h-screen overflow-hidden',
        'bg-gradient-to-br from-blue-50 to-indigo-100'
      )}
      onClick={handleDesktopClick}
      style={{
        minWidth: gridDimensions.totalWidth,
        minHeight: gridDimensions.totalHeight
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
      </div>

      {/* 网格线（调试用） */}
      {renderGridLines()}

      {/* 拖拽预览位置 */}
      {renderDragPreview()}

      {/* 位置冲突提示 */}
      {renderPositionConflicts()}

      {/* 网格尺寸控制器 */}
      <div className="absolute top-4 right-4 flex space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        {(['small', 'medium', 'large'] as GridSize[]).map((size) => (
          <button
            key={size}
            onClick={() => onGridSizeChange?.(size)}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              gridConfig.size === size
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
          </button>
        ))}
      </div>

      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* 桌面图标 */}
        <div className="relative z-10">
          {icons.map((icon) => {
            const pixelPosition = getIconPixelPosition(icon.gridPosition);
            return (
              <GridIcon
                key={icon.id}
                icon={icon}
                position={pixelPosition}
                size={gridConfig.iconSize}
                isSelected={selectedIconId === icon.id}
                isDraggable={enableDrag && icon.isDraggable}
                onClick={() => onIconClick?.(icon.id)}
                onDoubleClick={() => onIconDoubleClick?.(icon.id)}
              />
            );
          })}
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeIcon ? (
            <div 
              className="flex flex-col items-center justify-center p-2 rounded-lg opacity-80"
              style={{ width: gridConfig.iconSize, height: gridConfig.iconSize }}
            >
              <div className="w-full h-full flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="w-8 h-8 bg-gray-400 rounded" />
              </div>
              <div className="mt-1 text-xs text-center max-w-full truncate px-1 py-0.5 rounded bg-white/80 backdrop-blur-sm text-gray-900">
                {activeIcon.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 网格信息显示 */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
        <div>网格: {gridConfig.columns}×{gridConfig.rows}</div>
        <div>图标数量: {icons.length}</div>
        <div>尺寸: {gridConfig.size}</div>
        {selectedIconId && (
          <div>已选择: {icons.find(icon => icon.id === selectedIconId)?.name}</div>
        )}
      </div>
    </div>
  );
};

export default GridLayout;