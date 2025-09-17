import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { cn } from '../../utils/cn';
import { 
  FileText, 
  Folder, 
  Image, 
  Music, 
  Video, 
  Settings, 
  Calculator,
  Globe,
  Mail,
  Calendar
} from 'lucide-react';

interface IconType {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'image' | 'music' | 'video' | 'settings' | 'calculator' | 'browser' | 'mail' | 'calendar';
  position: { x: number; y: number };
  isActive: boolean;
}

interface DesktopIconProps {
  icon: IconType;
}

const iconComponents = {
  file: FileText,
  folder: Folder,
  image: Image,
  music: Music,
  video: Video,
  settings: Settings,
  calculator: Calculator,
  browser: Globe,
  mail: Mail,
  calendar: Calendar,
};

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon }) => {
  const dispatch = useDispatch();
  const { selectedIcon } = useSelector((state: RootState) => state.desktop);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: icon.id,
    data: {
      type: 'icon',
      icon,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const IconComponent = iconComponents[icon.type] || FileText;
  const isSelected = selectedIcon === icon.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch.desktop.selectIcon(icon.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch.desktop.openApplication(icon.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: icon.position.x,
        top: icon.position.y,
        zIndex: isDragging ? 1000 : 1,
      }}
      {...listeners}
      {...attributes}
      className={cn(
        'flex flex-col items-center justify-center w-20 h-20 p-2 rounded-lg cursor-pointer transition-all duration-200 select-none',
        'hover:bg-white/20 hover:backdrop-blur-sm',
        isSelected && 'bg-blue-500/30 backdrop-blur-sm border border-blue-400',
        isDragging && 'opacity-50 scale-110'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* 图标 */}
      <div className={cn(
        'w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200',
        'bg-white/80 backdrop-blur-sm shadow-sm',
        isSelected && 'bg-white/90',
        isDragging && 'shadow-lg'
      )}>
        <IconComponent 
          className={cn(
            'w-8 h-8 transition-colors duration-200',
            icon.type === 'folder' && 'text-yellow-600',
            icon.type === 'file' && 'text-blue-600',
            icon.type === 'image' && 'text-green-600',
            icon.type === 'music' && 'text-purple-600',
            icon.type === 'video' && 'text-red-600',
            icon.type === 'settings' && 'text-gray-600',
            icon.type === 'calculator' && 'text-orange-600',
            icon.type === 'browser' && 'text-blue-500',
            icon.type === 'mail' && 'text-red-500',
            icon.type === 'calendar' && 'text-green-500'
          )}
        />
      </div>
      
      {/* 标签 */}
      <div className={cn(
        'mt-1 text-xs text-center max-w-full truncate px-1 py-0.5 rounded transition-all duration-200',
        'text-gray-800 bg-white/60 backdrop-blur-sm',
        isSelected && 'bg-white/80 text-gray-900 font-medium'
      )}>
        {icon.name}
      </div>
    </div>
  );
};

export default DesktopIcon;