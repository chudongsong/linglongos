/**
 * 拖拽上下文提供器
 * @description 管理全局拖拽状态和交互逻辑
 */

import React, { createContext, useState, useCallback, useRef } from 'react';
import { type IDesktopIcon, type IGridPosition } from '../types/grid';

interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 被拖拽的图标 */
  draggedIcon: IDesktopIcon | null;
  /** 拖拽起始位置 */
  startPosition: IGridPosition | null;
  /** 当前拖拽位置 */
  currentPosition: IGridPosition | null;
  /** 拖拽偏移量 */
  offset: { x: number; y: number };
  /** 是否显示拖拽预览 */
  showPreview: boolean;
}

interface DragActions {
  /** 开始拖拽 */
  startDrag: (icon: IDesktopIcon, startPos: IGridPosition, offset: { x: number; y: number }) => void;
  /** 更新拖拽位置 */
  updateDragPosition: (position: IGridPosition) => void;
  /** 结束拖拽 */
  endDrag: () => void;
  /** 取消拖拽 */
  cancelDrag: () => void;
  /** 设置拖拽预览显示状态 */
  setShowPreview: (show: boolean) => void;
}

export interface DragContextValue extends DragState, DragActions {}

export const DragContext = createContext<DragContextValue | null>(null);

interface DragProviderProps {
  children: React.ReactNode;
  /** 拖拽开始回调 */
  onDragStart?: (icon: IDesktopIcon, startPos: IGridPosition) => void;
  /** 拖拽中回调 */
  onDragMove?: (icon: IDesktopIcon, currentPos: IGridPosition, startPos: IGridPosition) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (icon: IDesktopIcon, endPos: IGridPosition, startPos: IGridPosition) => void;
  /** 拖拽取消回调 */
  onDragCancel?: (icon: IDesktopIcon, startPos: IGridPosition) => void;
}

export function DragProvider({ 
  children, 
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel
}: DragProviderProps) {
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIcon: null,
    startPosition: null,
    currentPosition: null,
    offset: { x: 0, y: 0 },
    showPreview: true
  });

  // 拖拽计时器引用
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 开始拖拽
  const startDrag = useCallback((
    icon: IDesktopIcon, 
    startPos: IGridPosition, 
    offset: { x: number; y: number }
  ) => {
    setDragState({
      isDragging: true,
      draggedIcon: icon,
      startPosition: startPos,
      currentPosition: startPos,
      offset,
      showPreview: true
    });

    // 触发拖拽开始回调
    onDragStart?.(icon, startPos);

    // 设置拖拽延迟，避免误触
    dragTimerRef.current = setTimeout(() => {
      setDragState(prev => ({ ...prev, showPreview: true }));
    }, 100);
  }, [onDragStart]);

  // 更新拖拽位置
  const updateDragPosition = useCallback((position: IGridPosition) => {
    setDragState(prev => {
      if (!prev.isDragging || !prev.draggedIcon || !prev.startPosition) {
        return prev;
      }

      const newState = {
        ...prev,
        currentPosition: position
      };

      // 触发拖拽移动回调
      onDragMove?.(prev.draggedIcon, position, prev.startPosition);

      return newState;
    });
  }, [onDragMove]);

  // 结束拖拽
  const endDrag = useCallback(() => {
    const { draggedIcon, startPosition, currentPosition } = dragState;

    if (draggedIcon && startPosition && currentPosition) {
      // 触发拖拽结束回调
      onDragEnd?.(draggedIcon, currentPosition, startPosition);
    }

    // 清理状态
    setDragState({
      isDragging: false,
      draggedIcon: null,
      startPosition: null,
      currentPosition: null,
      offset: { x: 0, y: 0 },
      showPreview: true
    });

    // 清理计时器
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  }, [dragState, onDragEnd]);

  // 取消拖拽
  const cancelDrag = useCallback(() => {
    const { draggedIcon, startPosition } = dragState;

    if (draggedIcon && startPosition) {
      // 触发拖拽取消回调
      onDragCancel?.(draggedIcon, startPosition);
    }

    // 清理状态
    setDragState({
      isDragging: false,
      draggedIcon: null,
      startPosition: null,
      currentPosition: null,
      offset: { x: 0, y: 0 },
      showPreview: true
    });

    // 清理计时器
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  }, [dragState, onDragCancel]);

  // 设置拖拽预览显示状态
  const setShowPreview = useCallback((show: boolean) => {
    setDragState(prev => ({ ...prev, showPreview: show }));
  }, []);

  const contextValue: DragContextValue = {
    ...dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    setShowPreview
  };

  return (
    <DragContext.Provider value={contextValue}>
      {children}
    </DragContext.Provider>
  );
}