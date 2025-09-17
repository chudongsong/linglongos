/**
 * 拖拽占位符组件
 * @description 显示拖拽目标位置的占位符
 */

import React from 'react';
import { type IGridPosition, type IGridConfig } from '../../types/grid';

interface DragPlaceholderProps {
  /** 占位符位置 */
  position: IGridPosition;
  /** 网格配置 */
  gridConfig: IGridConfig;
  /** 是否显示 */
  visible: boolean;
  /** 自定义样式类名 */
  className?: string;
}

export function DragPlaceholder({ 
  position, 
  gridConfig, 
  visible, 
  className = '' 
}: DragPlaceholderProps) {
  if (!visible) {
    return null;
  }

  const style = {
    left: position.col * (gridConfig.iconSize + gridConfig.gap) + gridConfig.padding.left,
    top: position.row * (gridConfig.iconSize + gridConfig.gap) + gridConfig.padding.top,
    width: gridConfig.iconSize,
    height: gridConfig.iconSize
  };

  return (
    <div
      className={`absolute border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-lg transition-all duration-200 ${className}`}
      style={style}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      </div>
    </div>
  );
}