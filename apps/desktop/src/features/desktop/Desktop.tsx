import React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, Dispatch } from '../../store';
import DesktopIcon from './DesktopIcon';
import { cn } from '../../utils/cn';

interface DesktopIconType {
  id: string;
  name: string;
  icon: string;
  position: { x: number; y: number };
  isActive: boolean;
}

const Desktop: React.FC = () => {
  const dispatch = useDispatch<Dispatch>();
  const { icons, selectedIcon } = useSelector((state: RootState) => state.desktop);
  const [activeIcon, setActiveIcon] = React.useState<DesktopIconType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const icon = icons.find(icon => icon.id === active.id);
    if (icon) {
      setActiveIcon(icon);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (delta.x !== 0 || delta.y !== 0) {
      const icon = icons.find(icon => icon.id === active.id);
      if (icon) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - 80, icon.position.x + delta.x)),
          y: Math.max(0, Math.min(window.innerHeight - 160, icon.position.y + delta.y))
        };
        
        dispatch.desktop.moveIcon({
          id: icon.id,
          position: newPosition
        });
      }
    }
    
    setActiveIcon(null);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    // 点击桌面空白区域时清除选择
    if (e.target === e.currentTarget) {
      dispatch.desktop.selectIcon('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 这里可以添加右键菜单功能
    console.log('右键菜单');
  };

  return (
    <div 
      className={cn(
        'relative w-full h-full min-h-screen overflow-hidden',
        'bg-gradient-to-br from-blue-50 to-indigo-100'
      )}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {/* 桌面背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
      </div>

      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 桌面图标 */}
        <div className="relative z-10">
          {icons.map((icon) => (
            <DesktopIcon key={icon.id} icon={icon} />
          ))}
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeIcon ? (
            <div className="flex flex-col items-center justify-center w-20 h-20 p-2 rounded-lg opacity-80">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm shadow-lg">
                {/* 这里可以根据图标类型显示对应的图标 */}
                <div className="w-8 h-8 bg-gray-400 rounded" />
              </div>
              <div className="mt-1 text-xs text-center max-w-full truncate px-1 py-0.5 rounded bg-white/80 backdrop-blur-sm text-gray-900">
                {activeIcon.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 桌面信息显示（可选） */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
        <div>图标数量: {icons.length}</div>
        {selectedIcon && (
          <div>已选择: {icons.find(icon => icon.id === selectedIcon)?.name}</div>
        )}
      </div>
    </div>
  );
};

export default Desktop;