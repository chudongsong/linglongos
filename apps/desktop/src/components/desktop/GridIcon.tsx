/**
 * 网格图标组件
 * @description 在网格系统中显示的可拖拽图标
 */

import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../utils/cn';
import type { IDesktopIcon } from '../../types/grid';

interface GridIconProps {
  /** 图标数据 */
  icon: IDesktopIcon;
  /** 像素位置 */
  position: { x: number; y: number };
  /** 图标尺寸 */
  size: number;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否可拖拽 */
  isDraggable?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 双击事件 */
  onDoubleClick?: () => void;
}

const GridIcon: React.FC<GridIconProps> = memo(({
  icon,
  position,
  size,
  isSelected = false,
  isDraggable = true,
  onClick,
  onDoubleClick
}) => {
  // 拖拽钩子
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: icon.id,
    disabled: !isDraggable,
  });

  // 拖拽样式
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  // 处理双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.();
  };

  // 计算精确的布局尺寸，确保均匀间距
  const iconContainerSize = Math.floor(size * 0.7); // 图标容器占总尺寸的70%
  const labelHeight = Math.max(16, Math.floor(size * 0.15)); // 响应式标签高度
  const totalContentHeight = iconContainerSize + labelHeight + 4; // 总内容高度（包含4px间距）
  const iconTopMargin = Math.floor((size - totalContentHeight) / 2); // 垂直居中
  const labelTopMargin = 4; // 标签与图标的固定间距

  // 渲染图标内容
  const renderIconContent = () => {
    // 如果有自定义图标，使用自定义图标
    if (icon.customIcon) {
      return (
        <img
          src={icon.customIcon}
          alt={icon.name}
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
      );
    }

    // 根据图标类型渲染不同的图标
    const getIconByType = () => {
      switch (icon.type) {
        case 'file':
          return '📄';
        case 'folder':
          return '📁';
        case 'image':
          return '🖼️';
        case 'music':
          return '🎵';
        case 'video':
          return '🎬';
        case 'settings':
          return '⚙️';
        case 'calculator':
          return '🧮';
        case 'browser':
          return '🌐';
        case 'mail':
          return '📧';
        case 'calendar':
          return '📅';
        case 'terminal':
          return '💻';
        case 'editor':
          return '📝';
        case 'game':
          return '🎮';
        case 'app':
        default:
          return '📱';
      }
    };

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
        <div 
          className="flex items-center justify-center"
          style={{ fontSize: Math.floor(iconContainerSize * 0.4) }}
        >
          {getIconByType()}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 10,
      }}
      className={cn(
        'flex flex-col items-center cursor-pointer transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isDragging && 'opacity-50',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white/50'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...attributes}
      {...listeners}
    >
      {/* 图标容器 - 精确定位和尺寸 */}
      <div 
        className={cn(
          'relative rounded-lg overflow-hidden',
          'shadow-lg hover:shadow-xl transition-shadow duration-200',
          isSelected && 'ring-2 ring-blue-400'
        )}
        style={{
          width: iconContainerSize,
          height: iconContainerSize,
          marginTop: iconTopMargin,
        }}
      >
        {renderIconContent()}
        
        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* 图标标签 - 精确定位和尺寸 */}
      <div 
        className={cn(
          'text-center truncate rounded flex items-center justify-center',
          'bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm',
          'border border-white/20 transition-all duration-200',
          isSelected && 'bg-blue-100 text-blue-900 border-blue-200',
          'hover:bg-white hover:shadow-md'
        )}
        style={{
          width: Math.min(size - 4, iconContainerSize + 8), // 标签宽度不超过图标容器
          height: labelHeight,
          marginTop: labelTopMargin,
          fontSize: Math.max(9, Math.min(12, Math.floor(size * 0.11))), // 更合理的字体大小范围
          padding: '2px 6px', // 固定内边距
        }}
        title={icon.name} // 悬停显示完整名称
      >
        <span className="truncate">{icon.name}</span>
      </div>

      {/* 拖拽指示器 */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50" />
      )}
    </div>
  );
});

GridIcon.displayName = 'GridIcon';

export default GridIcon;