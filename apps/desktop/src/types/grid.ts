/**
 * 网格系统类型定义
 * @description 桌面网格系统的所有TypeScript类型定义
 */

// 网格尺寸预设类型
export type GridSize = 'small' | 'medium' | 'large'

// 网格位置类型
export interface GridPosition {
	x: number // 网格列索引
	y: number // 网格行索引
}

// 边距配置
export interface Padding {
	top: number
	right: number
	bottom: number
	left: number
}

// 网格配置类型
export interface GridConfig {
	id: string
	name: string
	gridSize: GridSize
	cellSize: number // 单元格尺寸（像素）
	gap: number // 网格间距（像素）
	columns: number // 列数
	rows: number // 行数
	padding: Padding // 容器内边距
}

// 网格项目通用配置
export interface GridItemGeneral {
	locked: boolean // 是否锁定位置
	visible: boolean // 是否可见
}

// 网格项目元数据
export interface GridItemMetadata {
	create_time: string // 创建时间戳
	ext_name?: string // 扩展名（文件类型时使用）
	open_mode: string // 打开方式标识
}

// 网格项目类型
export interface GridItem {
	id: string
	appId: string
	type: 'apps' | 'files' // apps 应用、files 文件
	position: GridPosition
	general: GridItemGeneral
	data: Record<string, any> // 桌面应用的补充参数
	metadata: GridItemMetadata
}

// 桌面应用信息
export interface DesktopApp {
	id: string
	name: string
	icon: string
	description?: string
	category?: string
	executable?: string
}

// 主题配置
export interface ThemeConfig {
	mode: 'light' | 'dark'
	accentColor: string
	wallpaper?: string
}

// 配置元数据
export interface ConfigMetadata {
	name: string
	description: string
	author: string
	createdAt: string
	lastModified: string
}

// 桌面配置
export interface DesktopConfiguration {
	version: number
	metadata?: ConfigMetadata
	gridConfig: GridConfig
	apps: DesktopApp[]
	items: GridItem[]
	theme: ThemeConfig
	lastModified: number
}

// 拖拽状态
export interface DragState {
	isDragging: boolean
	dragItem: GridItem | null
	dragStartPosition: GridPosition | null
	dropTarget: GridPosition | null
	dragPreview?: HTMLElement
}

// 网格预设配置
export interface GridPreset {
	size: GridSize
	cellSize: number
	gap: number
	columns: number
	rows: number
	name: string
	description: string
}

// 位置验证结果
export interface PositionValidation {
	isValid: boolean
	reason?: string
	suggestedPosition?: GridPosition
}

// 网格计算辅助类型
export interface GridDimensions {
	width: number
	height: number
	totalWidth: number
	totalHeight: number
}

// 坐标转换类型
export interface Point {
	x: number
	y: number
}

// 网格事件类型
export interface GridEvent {
	type: 'item-moved' | 'item-added' | 'item-removed' | 'config-changed'
	payload: any
	timestamp: number
}

// 网格操作选项
export interface GridOperationOptions {
	animate?: boolean
	duration?: number
	autoSave?: boolean
	validatePosition?: boolean
}

// 导出导入选项
export interface ExportOptions {
	includeMetadata?: boolean
	includeTheme?: boolean
	format?: 'json' | 'compressed'
}

export interface ImportOptions {
	mergeMode?: 'replace' | 'merge' | 'append'
	validateSchema?: boolean
	autoMigrate?: boolean
}
