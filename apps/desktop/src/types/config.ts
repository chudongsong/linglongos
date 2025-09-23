/**
 * 应用动作参数
 */
export interface AppActionParams {
	url?: string
	path?: string
	panel?: string
	[key: string]: string | number | boolean | undefined
}

/**
 * 应用动作定义
 */
export interface AppAction {
	type: 'open' | string
	target: string
	params?: AppActionParams
}

/**
 * 应用配置项
 */
export interface AppItem {
	id: string
	name: string
	icon: string
	position?: { row?: number; col?: number }
	type: 'application' | 'system' | string
	category?: string
	action?: AppAction
	metadata?: Record<string, unknown>
}

/**
 * 分类定义
 */
export interface CategoryMap {
	[key: string]: { name: string; color?: string }
}

/**
 * 桌面网格尺寸定义
 */
export interface GridSize {
	width: number
	height: number
	gap: number
}

/**
 * 桌面设置
 */
export interface DesktopSettings {
	desktop: {
		gridSize: {
			small: GridSize
			medium: GridSize
			large: GridSize
		}
		padding: number
		iconSize: 'small' | 'medium' | 'large' | string
		background: {
			type: 'image' | 'gradient'
			value: string
			size?: string
			position?: string
			repeat?: string
		}
		theme: {
			iconTextColor: string
			iconTextShadow?: string
			selectionColor: string
			selectionBorder: string
		}
	}
	layout: {
		autoArrange: boolean
		snapToGrid: boolean
		allowOverlap: boolean
	}
	hotReload?: {
		enabled: boolean
		interval: number
	}
}

/**
 * 应用列表配置
 */
export interface AppsConfig {
	apps: AppItem[]
	categories: CategoryMap
	startup?: { autoStart?: string[]; delay?: number }
}

/**
 * 合并后的完整配置
 */
export interface FullConfig {
	desktop: DesktopSettings['desktop']
	layout: DesktopSettings['layout']
	hotReload?: DesktopSettings['hotReload']
	apps: AppItem[]
	categories: CategoryMap
	startup?: AppsConfig['startup']
}
