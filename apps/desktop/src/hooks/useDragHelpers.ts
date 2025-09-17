/**
 * 拖拽辅助函数
 * @description 提供拖拽相关的工具函数
 */

import { type IDesktopIcon, type IGridPosition } from '../types/grid';

/**
 * 计算网格位置
 * @param mouseX 鼠标X坐标
 * @param mouseY 鼠标Y坐标
 * @param gridConfig 网格配置
 * @returns 网格位置
 */
export function calculateGridPosition(
  mouseX: number,
  mouseY: number,
  gridConfig: { iconSize: number; gap: number; padding: { left: number; top: number } }
): IGridPosition {
  const { iconSize, gap, padding } = gridConfig;
  
  const col = Math.floor((mouseX - padding.left + gap / 2) / (iconSize + gap));
  const row = Math.floor((mouseY - padding.top + gap / 2) / (iconSize + gap));
  
  return {
    row: Math.max(0, row),
    col: Math.max(0, col)
  };
}

/**
 * 检查位置是否有效
 * @param position 网格位置
 * @param gridConfig 网格配置
 * @returns 是否有效
 */
export function isValidGridPosition(
  position: IGridPosition,
  gridConfig: { columns: number; rows: number }
): boolean {
  return (
    position.row >= 0 &&
    position.row < gridConfig.rows &&
    position.col >= 0 &&
    position.col < gridConfig.columns
  );
}

/**
 * 检查位置是否被占用
 * @param position 网格位置
 * @param icons 图标列表
 * @param excludeIconId 排除的图标ID
 * @returns 是否被占用
 */
export function isPositionOccupied(
  position: IGridPosition,
  icons: IDesktopIcon[],
  excludeIconId?: string
): boolean {
  return icons.some(icon => 
    icon.id !== excludeIconId &&
    icon.gridPosition.row === position.row &&
    icon.gridPosition.col === position.col
  );
}

/**
 * 查找最近的空闲位置
 * @param targetPosition 目标位置
 * @param icons 图标列表
 * @param gridConfig 网格配置
 * @param excludeIconId 排除的图标ID
 * @returns 最近的空闲位置
 */
export function findNearestFreePosition(
  targetPosition: IGridPosition,
  icons: IDesktopIcon[],
  gridConfig: { columns: number; rows: number },
  excludeIconId?: string
): IGridPosition | null {
  const { columns, rows } = gridConfig;
  
  // 如果目标位置本身就是空闲的，直接返回
  if (
    isValidGridPosition(targetPosition, gridConfig) &&
    !isPositionOccupied(targetPosition, icons, excludeIconId)
  ) {
    return targetPosition;
  }
  
  // 使用广度优先搜索查找最近的空闲位置
  const visited = new Set<string>();
  const queue: IGridPosition[] = [targetPosition];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.row}-${current.col}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (
      isValidGridPosition(current, gridConfig) &&
      !isPositionOccupied(current, icons, excludeIconId)
    ) {
      return current;
    }
    
    // 添加相邻位置到队列
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
      { row: current.row - 1, col: current.col - 1 },
      { row: current.row - 1, col: current.col + 1 },
      { row: current.row + 1, col: current.col - 1 },
      { row: current.row + 1, col: current.col + 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (
        neighbor.row >= 0 && neighbor.row < rows &&
        neighbor.col >= 0 && neighbor.col < columns
      ) {
        queue.push(neighbor);
      }
    }
  }
  
  return null;
}

/**
 * 自动排列图标
 * @param icons 图标列表
 * @param gridConfig 网格配置
 * @returns 排列后的图标列表
 */
export function autoArrangeIcons(
  icons: IDesktopIcon[],
  gridConfig: { columns: number; rows: number }
): IDesktopIcon[] {
  const { columns } = gridConfig;
  
  return icons.map((icon, index) => ({
    ...icon,
    gridPosition: {
      row: Math.floor(index / columns),
      col: index % columns
    }
  }));
}

/**
 * 计算拖拽距离
 * @param start 起始位置
 * @param end 结束位置
 * @returns 距离
 */
export function calculateDragDistance(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 检查是否为有效拖拽
 * @param distance 拖拽距离
 * @param threshold 阈值
 * @returns 是否为有效拖拽
 */
export function isValidDrag(distance: number, threshold: number = 5): boolean {
  return distance > threshold;
}