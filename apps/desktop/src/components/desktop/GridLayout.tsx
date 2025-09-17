/**
 * 网格布局组件
 * @description 提供灵活的网格系统，支持大、中、小三种预设布局
 */

import React, { useMemo, useCallback, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { cn } from '../../utils/cn';
import { 
  type IDesktopIcon, 
  type IGridConfig, 
  type GridSize, 
  type IGridPosition
} from '../../types/grid';
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
  const [activeIcon, setActiveIcon] = useState<IDesktopIcon | null>(null);

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
    const { cellWidth, cellHeight } = gridDimensions;
    const { padding, columns, rows } = gridConfig;
    
    const adjustedX = x - padding.left;
    const adjustedY = y - padding.top;
    
    const col = Math.max(0, Math.min(columns - 1, Math.round(adjustedX / cellWidth)));
    const row = Math.max(0, Math.min(rows - 1, Math.round(adjustedY / cellHeight)));
    
    return { row, col };
  }, [gridDimensions, gridConfig]);

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
    
    // 螺旋搜索最近的空闲位置
    for (let radius = 1; radius < Math.max(columns, rows); radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const newPosition = {
            row: Math.max(0, Math.min(rows - 1, targetPosition.row + dy)),
            col: Math.max(0, Math.min(columns - 1, targetPosition.col + dx))
          };
          
          if (!isPositionOccupied(newPosition, excludeIconId)) {
            return newPosition;
          }
        }
      }
    }
    
    // 如果没有找到空闲位置，返回原位置
    return targetPosition;
  }, [gridConfig, isPositionOccupied]);

  // 处理拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const icon = icons.find(icon => icon.id === active.id);
    if (icon) {
      setActiveIcon(icon);
    }
  }, [icons]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (delta.x !== 0 || delta.y !== 0) {
      const icon = icons.find(icon => icon.id === active.id);
      if (icon && onIconMove) {
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
        
        onIconMove(icon.id, newGridPosition);
      }
    }
    
    setActiveIcon(null);
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

      {/* 网格线（开发模式） */}
      {renderGridLines()}

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