// 用户相关类型
export interface User {
	id: string
	username: string
	email: string
	avatar?: string
	createdAt: Date
	lastLoginAt?: Date
	is2FAEnabled: boolean
}

// 面板实例类型
export interface PanelInstance {
	id: string
	name: string
	type: 'baota' | '1panel' | 'custom'
	host: string
	port: number
	apiKey: string
	isConnected: boolean
	lastConnectedAt?: Date
	version?: string
}

// 桌面配置类型
export interface DesktopConfig {
	version: number
	desktopItems: DesktopItem[]
	wallpaper?: string
	theme: 'light' | 'dark' | 'auto'
}

export interface DesktopItem {
	id: string
	type: 'app-icon' | 'widget' | 'folder'
	position: Position
	size?: Size
	appId?: string
	widgetId?: string
	folderId?: string
	customData?: Record<string, unknown>
}

export interface Position {
	x: number
	y: number
}

export interface Size {
	width: number
	height: number
}

// 窗口系统类型
export * from './window'

// 应用类型
export interface AppInfo {
	id: string
	name: string
	icon: string
	version: string
	description: string
	category: string
	author: string
	permissions: string[]
	isSystem: boolean
}

// 文件系统类型
export interface FileItem {
	name: string
	path: string
	type: 'file' | 'directory'
	size: number
	modifiedAt: Date
	permissions: string
	owner: string
	group: string
}

// API 响应类型
export interface ApiResponse<T = unknown> {
	success: boolean
	data?: T
	message?: string
	code?: number
}

// 事件系统类型
export interface SystemEvent {
	type: string
	payload: unknown
	timestamp: Date
	source: string
}

// 通知类型
export interface Notification {
	id: string
	type: 'info' | 'success' | 'warning' | 'error'
	title: string
	message: string
	duration?: number
	actions?: NotificationAction[]
}

export interface NotificationAction {
	label: string
	action: () => void
}

// 右键菜单类型
export interface ContextMenuItem {
	id: string
	label: string
	icon?: string
	shortcut?: string
	disabled?: boolean
	separator?: boolean
	children?: ContextMenuItem[]
	action?: () => void
}

// 进程类型
export interface ProcessInfo {
	pid: number
	name: string
	cpu: number
	memory: number
	status: 'running' | 'sleeping' | 'stopped'
	user: string
	command: string
}

// 服务类型
export interface ServiceInfo {
	name: string
	status: 'running' | 'stopped' | 'failed'
	enabled: boolean
	description: string
}

// 适配器接口
export interface PanelAdapter {
	connect(config: PanelInstance): Promise<boolean>
	disconnect(): Promise<void>
	getFiles(path: string): Promise<FileItem[]>
	createFile(path: string, content: string): Promise<boolean>
	deleteFile(path: string): Promise<boolean>
	getProcesses(): Promise<ProcessInfo[]>
	getServices(): Promise<ServiceInfo[]>
	restartService(serviceName: string): Promise<boolean>
}
