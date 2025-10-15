/**
 * window.slice
 *
 * 负责桌面窗口的生命周期与交互：创建/关闭/聚焦/移动/缩放/最小化/最大化以及 zIndex 管理。
 * 提供最小可用实现，后续可扩展：吸附、对齐、窗口间布局、持久化等能力。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppItem } from '@/types/config'

/** 生成短 ID（避免引入额外依赖） */
function genId(prefix = 'win'): string {
	const rand = Math.random().toString(36).slice(2, 8)
	const ts = Date.now().toString(36).slice(-4)
	return `${prefix}-${ts}-${rand}`
}

/** 窗口记录类型 */
export interface WindowRecord {
	id: string
	title: string
	appId: string
	icon?: string
	url?: string
	left: number
	top: number
	width: number
	height: number
	zIndex: number
	isActive: boolean
	isMinimized: boolean
	isMaximized: boolean
	// 还原尺寸与位置（用于最大化→还原）
	restoreLeft?: number
	restoreTop?: number
	restoreWidth?: number
	restoreHeight?: number
}

/** 窗口切片状态 */
export interface WindowState {
	windows: WindowRecord[]
	topZ: number
	openCount: number
}

const initialState: WindowState = {
	windows: [],
	topZ: 1100,
	openCount: 0,
}

/** 根据打开次数生成层叠起始位置（用于新窗口默认位置） */
function getCascadePosition(count: number) {
	const baseLeft = 96
	const baseTop = 96
	const step = 28
	return { left: baseLeft + count * step, top: baseTop + count * step }
}

/** 创建窗口的有效载荷 */
export interface OpenWindowPayload {
  app: AppItem
}

/** 移动窗口的有效载荷 */
export interface MoveWindowPayload {
  id: string
  left: number
  top: number
}

/** 调整窗口尺寸的有效载荷 */
export interface ResizeWindowPayload {
  id: string
  width: number
  height: number
}

const windowSlice = createSlice({
	name: 'window',
	initialState,
	reducers: {
		/** 创建并激活一个新窗口（同一 appId 可存在多个实例） */
		openWindow(state, action: PayloadAction<OpenWindowPayload>) {
			const { app } = action.payload
			const id = genId(app.id || 'win')
			// 简单判断 URL：以 http(s) 或 / 开头
			const target = app.action?.target
			const isUrl = typeof target === 'string' && /^(https?:\/\/|\/)/.test(target)

			// 取消当前激活态
			state.windows.forEach((w) => (w.isActive = false))

			const { left, top } = getCascadePosition(state.openCount)
			const rec: WindowRecord = {
				id,
				title: app.name || app.id,
				appId: app.id,
				icon: app.icon,
				left,
				top,
				width: 860,
				height: 560,
				zIndex: ++state.topZ,
				isActive: true,
				isMinimized: false,
				isMaximized: false,
			}
			// 仅在存在有效 URL 时赋值，避免将 undefined 写入（exactOptionalPropertyTypes）
			if (isUrl) {
				(rec as WindowRecord & { url: string }).url = target as string
			}
			state.windows.push(rec)
			state.openCount += 1
		},

		/** 关闭窗口 */
		closeWindow(state, action: PayloadAction<string>) {
			const id = action.payload
			state.windows = state.windows.filter((w) => w.id !== id)
		},

		/** 聚焦窗口并置顶 */
		focusWindow(state, action: PayloadAction<string>) {
			const id = action.payload
			state.windows.forEach((w) => (w.isActive = w.id === id))
			const win = state.windows.find((w) => w.id === id)
			if (win) {
				win.zIndex = ++state.topZ
			}
		},

		/** 移动窗口到指定位置 */
		moveWindow(state, action: PayloadAction<MoveWindowPayload>) {
			const { id, left, top } = action.payload
			const win = state.windows.find((w) => w.id === id)
			if (win) {
				win.left = Math.round(left)
				win.top = Math.round(top)
			}
		},

		/** 调整窗口尺寸（带最小尺寸约束） */
		resizeWindow(state, action: PayloadAction<ResizeWindowPayload>) {
			const { id, width, height } = action.payload
			const win = state.windows.find((w) => w.id === id)
			if (win) {
				win.width = Math.max(320, Math.round(width))
				win.height = Math.max(240, Math.round(height))
			}
		},

		/** 切换最小化状态 */
		toggleMinimize(state, action: PayloadAction<string>) {
			const win = state.windows.find((w) => w.id === action.payload)
			if (!win) return
			win.isMinimized = !win.isMinimized
			if (!win.isMinimized) {
				// 还原后聚焦置顶
				state.windows.forEach((w) => (w.isActive = w.id === win.id))
				win.zIndex = ++state.topZ
			} else {
				win.isActive = false
			}
		},

		/** 切换最大化，并记录/还原先前位置与尺寸 */
		toggleMaximize(state, action: PayloadAction<string>) {
			const win = state.windows.find((w) => w.id === action.payload)
			if (!win) return
			if (!win.isMaximized) {
				win.restoreLeft = win.left
				win.restoreTop = win.top
				win.restoreWidth = win.width
				win.restoreHeight = win.height
				win.isMaximized = true
			} else {
				// 还原
				if (typeof win.restoreLeft === 'number') win.left = win.restoreLeft
				if (typeof win.restoreTop === 'number') win.top = win.restoreTop
				if (typeof win.restoreWidth === 'number') win.width = win.restoreWidth
				if (typeof win.restoreHeight === 'number') win.height = win.restoreHeight
				win.isMaximized = false
			}
			// 聚焦置顶
			state.windows.forEach((w) => (w.isActive = w.id === win.id))
			win.zIndex = ++state.topZ
		},
	},
})

export const { openWindow, closeWindow, focusWindow, moveWindow, resizeWindow, toggleMinimize, toggleMaximize } =
	windowSlice.actions

export default windowSlice.reducer
