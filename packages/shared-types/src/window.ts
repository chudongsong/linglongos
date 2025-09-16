import type { Component } from 'vue'

/**
 * 位置接口
 */
export interface Position {
	x: number
	y: number
}

/**
 * 大小接口
 */
export interface Size {
	width: number
	height: number
}

/**
 * 窗口状态接口
 */
export interface WindowState {
	/** 窗口ID */
	id: string
	/** 窗口标题 */
	title: string
	/** 应用ID */
	appId: string
	/** 窗口位置 */
	position: Position
	/** 窗口大小 */
	size: Size
	/** 是否激活 */
	isActive: boolean
	/** 是否最小化 */
	isMinimized: boolean
	/** 是否最大化 */
	isMaximized: boolean
	/** 层级 */
	zIndex: number
	/** 是否可调整大小 */
	resizable?: boolean
	/** 是否可拖拽 */
	draggable?: boolean
	/** 窗口图标 */
	icon?: string
	/** 窗口内容组件 */
	component?: Component
	/** 传递给组件的属性 */
	props?: Record<string, any>
}

/**
 * 窗口配置接口
 */
export interface WindowConfig {
	/** 窗口标题 */
	title: string
	/** 应用ID */
	appId: string
	/** 初始位置 */
	position?: Position
	/** 初始大小 */
	size?: Size
	/** 最小大小 */
	minSize?: Size
	/** 最大大小 */
	maxSize?: Size
	/** 是否可调整大小 */
	resizable?: boolean
	/** 是否可拖拽 */
	draggable?: boolean
	/** 窗口图标 */
	icon?: string
	/** 窗口内容组件 */
	component?: Component
	/** 传递给组件的属性 */
	props?: Record<string, any>
	/** 是否居中显示 */
	center?: boolean
	/** 是否模态窗口 */
	modal?: boolean
}
