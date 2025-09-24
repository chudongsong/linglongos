/**
 * DnD 共享类型与常量
 * - 用于桌面图标与 Dock 的拖拽标识
 */
export interface IconDragItem {
	/** 拖拽类型：桌面图标 */
	type: 'ICON'
	/** 图标对应的应用/实体 id */
	id: string
}

/**
 * Dock 应用拖拽项
 * - 用于“应用中心”与“快捷启动栏”之间的拖拽
 */
export interface DockAppDragItem {
	/** 拖拽类型：Dock 应用 */
	type: 'DOCK_APP'
	/** 应用 id */
	id: string
	/** 拖拽来源：CENTER=应用中心, SHORTCUT=快捷栏 */
	source: 'CENTER' | 'SHORTCUT'
	/** 若来源为快捷栏，记录其当前索引，便于排序 */
	index?: number
}

/**
 * 拖拽的 Item 类型常量
 */
export const ITEM_TYPE = 'ICON' as const
/** Dock 拖拽类型常量 */
export const DOCK_APP_TYPE = 'DOCK_APP' as const
