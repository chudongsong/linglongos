/**
 * 拖拽Hook
 * @description 提供拖拽相关的状态管理和操作
 */

import { useContext } from 'react';
import { DragContext, type DragContextValue } from '../contexts/DragContext';

export function useDrag(): DragContextValue {
  const context = useContext(DragContext);
  
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  
  return context;
}