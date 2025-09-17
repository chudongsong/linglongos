/**
 * 拖拽预览组件
 * @description 显示拖拽时的预览效果
 */

import React from 'react';
import { useDrag } from '../../hooks/useDrag';

interface DragPreviewProps {
  /** 自定义样式类名 */
  className?: string;
}

export function DragPreview({ className = '' }: DragPreviewProps) {
  const { isDragging, draggedIcon, showPreview, offset } = useDrag();

  if (!isDragging || !draggedIcon || !showPreview) {
    return null;
  }

  return (
    <div
      className={`fixed pointer-events-none z-50 transition-opacity duration-200 ${className}`}
      style={{
        left: offset.x,
        top: offset.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          {draggedIcon.customIcon ? (
            <img 
              src={draggedIcon.customIcon} 
              alt={draggedIcon.name}
              className="w-8 h-8 rounded"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-medium">
              {draggedIcon.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 truncate max-w-24">
            {draggedIcon.name}
          </span>
        </div>
      </div>
    </div>
  );
}