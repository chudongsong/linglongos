/**
 * DnD 共享类型与常量
 * - 用于桌面图标的拖拽标识
 */
export interface IconDragItem {
  type: 'ICON'
  id: string
}

/**
 * 拖拽的 Item 类型常量
 */
export const ITEM_TYPE = 'ICON' as const