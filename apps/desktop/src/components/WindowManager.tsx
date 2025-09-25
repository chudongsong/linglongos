import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '@store/index'
import {
	closeWindow,
	focusWindow,
	moveWindow,
	toggleMaximize,
	toggleMinimize,
	resizeWindow,
} from '@store/slices/window.slice'
import { Settings } from '@features/settings'

import type { CSSProperties } from 'react'
// 已移除吸附与定位线相关工具导入
// import { SNAP_THRESHOLD, GRID_SIZE, snapTo, snapToGrid, computeBestSnapX, computeBestSnapY } from '@/utils/snap'

/**
 * WindowManager：最小可用版本 + 缩放
 * - 渲染窗口层并管理聚焦/拖拽/最小化/最大化/关闭
 * - 支持 8 向（N/E/S/W/NE/NW/SE/SW）边缘与角点缩放，带最小尺寸约束
 * - 仅支持 iframe 加载 URL；后续可扩展为内部应用组件
 */
/**
 * WindowManager - 桌面窗口管理控制器（Controller）
 *
 * 用途：
 * - 管理窗口的创建、聚焦、拖拽与缩放（8向）
 * - 移除坐标定位线与吸附逻辑，使用 requestAnimationFrame 优化拖拽性能
 * - 控制窗口标题栏与操作按钮的视觉与行为
 *
 * 返回值：React 组件的 JSX.Element
 */
export default function WindowManager() {
	const { windows } = useAppSelector((s) => s.window)
	const dispatch = useAppDispatch()

	// 维护最新的 windows 引用，避免事件回调闭包中获取到过期值
	// 已移除吸附与定位线相关工具导入
	// 已移除：保留 windows 直接使用，避免未使用引用与闭包混淆
	// const windowsRef = useRef<typeof windows>(windows)
	// useEffect(() => {
	// 	windowsRef.current = windows
	// }, [windows])
	
	// 标题栏拖拽引用
	const draggingRef = useRef<{
		id: string
		startX: number
		startY: number
		originLeft: number
		originTop: number
		originWidth: number
		originHeight: number
	} | null>(null)
	
	// 缩放引用
	const resizingRef = useRef<{
		id: string
		edge: 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
		startX: number
		startY: number
		originLeft: number
		originTop: number
		originWidth: number
		originHeight: number
	} | null>(null)

	// rAF 合帧调度引用，提升拖拽流畅度
	const frameIdRef = useRef<number | null>(null)
	const pendingPositionRef = useRef<{ id: string; left: number; top: number } | null>(null)

	useEffect(() => {
		/**
		 * 处理全局鼠标移动：优先处理缩放，其次处理拖拽。
		 * 重构：移除吸附/引导线逻辑，使用 requestAnimationFrame 合帧调度位置更新，提升拖拽流畅度与实时性。
		 */
		const onMove = (e: MouseEvent) => {
			e.preventDefault()

			// 缩放逻辑（保持原有实现，去除引导线相关调用）
			if (resizingRef.current) {
				const r = resizingRef.current
				const dx = e.clientX - r.startX
				const dy = e.clientY - r.startY

				const MIN_W = 320
				const MIN_H = 240

				let newLeft = r.originLeft
				let newTop = r.originTop
				let newWidth = r.originWidth
				let newHeight = r.originHeight

				if (r.edge.includes('e')) {
					newWidth = Math.max(MIN_W, r.originWidth + dx)
				}
				if (r.edge.includes('s')) {
					newHeight = Math.max(MIN_H, r.originHeight + dy)
				}
				if (r.edge.includes('w')) {
					newWidth = Math.max(MIN_W, r.originWidth - dx)
					newLeft = r.originLeft + (r.originWidth - newWidth)
				}
				if (r.edge.includes('n')) {
					newHeight = Math.max(MIN_H, r.originHeight - dy)
					newTop = r.originTop + (r.originHeight - newHeight)
				}

				const vw = window.innerWidth
				const vh = window.innerHeight

				// 视口边界裁剪
				const MARGIN = 0
				newLeft = Math.max(MARGIN, Math.min(newLeft, vw - newWidth - MARGIN))
				newTop = Math.max(MARGIN, Math.min(newTop, vh - newHeight - MARGIN))

				dispatch(moveWindow({ id: r.id, left: Math.round(newLeft), top: Math.round(newTop) }))
				dispatch(resizeWindow({ id: r.id, width: Math.round(newWidth), height: Math.round(newHeight) }))
				return
			}

			// 拖拽逻辑（高性能：使用 rAF 合帧更新位置）
			const d = draggingRef.current
			if (!d) return

			const dx = e.clientX - d.startX
			const dy = e.clientY - d.startY

			const vw = window.innerWidth
			const vh = window.innerHeight

			let left = d.originLeft + dx
			let top = d.originTop + dy

			// 拖拽垂直边界：修正为根据窗口高度限制，保证不越界
			left = Math.min(Math.max(left, 0), vw - d.originWidth)
			top = Math.min(Math.max(top, 0), vh - d.originHeight)

			// 使用 requestAnimationFrame 合帧调度，减少多次 dispatch 造成的抖动
			pendingPositionRef.current = { id: d.id, left, top }
			if (frameIdRef.current == null) {
				frameIdRef.current = requestAnimationFrame(() => {
					const p = pendingPositionRef.current
					if (p) {
						dispatch(moveWindow({ id: p.id, left: p.left, top: p.top }))
						pendingPositionRef.current = null
					}
					frameIdRef.current = null
				})
			}
		}

		/**
		 * 处理鼠标松开：结束任何进行中的拖拽或缩放。
		 */
		const onUp = () => {
			draggingRef.current = null
			resizingRef.current = null
		}

		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)
		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
			// 释放可能残留的 rAF 与位置引用，避免内存泄漏
			if (frameIdRef.current != null) {
				cancelAnimationFrame(frameIdRef.current)
				frameIdRef.current = null
			}
			pendingPositionRef.current = null
		}
	}, [dispatch])

	const layerStyle = useMemo<CSSProperties>(
		() => ({ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1100 }),
		[],
	)

	/**
	 * 渲染窗口内容（View）
	 *
	 * @param w 当前窗口对象（包含 appId、url、title 等关键信息）
	 * @returns JSX.Element - 根据 URL（iframe）或 appId（React 组件）进行内容渲染
	 */
	function renderWindowContent(w: typeof windows[0]) {
		if (w.url) {
			return (
				<iframe
					src={w.url}
					title={w.title}
					style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
				/>
			)
		}

		// 根据appId渲染对应的React组件
		switch (w.appId) {
			case 'settings':
				return (
					<div style={{ width: '100%', height: '100%', background: 'white', overflow: 'auto' }}>
						<Settings />
					</div>
				)
			default:
				return (
					<div style={{ padding: 16, background: 'white' }}>
						应用内容待接入：{w.appId}
					</div>
				)
		}
	}

	/**
	 * 渲染 8 向缩放手柄
	 *
	 * @param winId 窗口唯一 ID
	 * @param isMaximized 当前窗口是否最大化（最大化时不显示缩放手柄）
	 * @returns 缩放手柄的 JSX.Element 列表或 null
	 */
	function renderResizeHandles(winId: string, isMaximized: boolean) {
		if (isMaximized) return null
		const base: CSSProperties = { position: 'absolute', pointerEvents: 'auto', zIndex: 2 }
		const size = 10
		const half = Math.floor(size / 2)

		const handles: Array<{
			edge: 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
			style: CSSProperties
			cursor: CSSProperties['cursor']
		}> = [
			{
				edge: 'n',
				style: { ...base, top: -half, left: '50%', transform: 'translateX(-50%)', width: 40, height: size },
				cursor: 'ns-resize',
			},
			{
				edge: 's',
				style: { ...base, bottom: -half, left: '50%', transform: 'translateX(-50%)', width: 40, height: size },
				cursor: 'ns-resize',
			},
			{
				edge: 'e',
				style: { ...base, right: -half, top: '50%', transform: 'translateY(-50%)', width: size, height: 40 },
				cursor: 'ew-resize',
			},
			{
				edge: 'w',
				style: { ...base, left: -half, top: '50%', transform: 'translateY(-50%)', width: size, height: 40 },
				cursor: 'ew-resize',
			},
			{ edge: 'ne', style: { ...base, right: -half, top: -half, width: size, height: size }, cursor: 'nesw-resize' },
			{ edge: 'nw', style: { ...base, left: -half, top: -half, width: size, height: size }, cursor: 'nwse-resize' },
			{ edge: 'se', style: { ...base, right: -half, bottom: -half, width: size, height: size }, cursor: 'nwse-resize' },
			{ edge: 'sw', style: { ...base, left: -half, bottom: -half, width: size, height: size }, cursor: 'nesw-resize' },
		]

		return handles.map((h) => (
			<div
				key={h.edge}
				style={{ ...h.style, cursor: h.cursor }}
				onMouseDown={(e) => {
					e.preventDefault()
					e.stopPropagation()
					const el = e.currentTarget.parentElement as HTMLElement
					// 从当前窗口元素读取位置与尺寸
					const rect = el.getBoundingClientRect()
					resizingRef.current = {
						id: winId,
						edge: h.edge,
						startX: e.clientX,
						startY: e.clientY,
						originLeft: rect.left,
						originTop: rect.top,
						originWidth: rect.width,
						originHeight: rect.height,
					}
				}}
			/>
		))
	}

	return (
		<div style={layerStyle}>
			{/* 坐标定位线功能已移除 */}

			{/* 窗口层 */}
			{windows.map((w) => {
				if (w.isMinimized) return null

				const style: CSSProperties = {
					left: w.left,
					top: w.top,
					width: w.width,
					height: w.height,
					zIndex: w.zIndex,
				}

				if (w.isMaximized) {
					style.left = 0
					style.top = 0
					style.width = '100vw'
					style.height = '100vh'
				}

				const className = w.isActive ? 'window window-focused' : 'window'
				/**
				 * 窗口样式说明：
				 * - 保留原有 .window 类的视觉定义，新增原子类仅表达布局/圆角/可读性
				 * - 与 public/styles.css 的同值设置保持一致以避免视觉偏差
				 */
				const windowClass = clsx(className, 'absolute pointer-events-auto rounded-xl overflow-hidden text-white')
				return (
					<div key={w.id} className={windowClass} style={style} onMouseDown={() => dispatch(focusWindow(w.id))}>
						{/* Ubuntu风格扁平化标题栏 */}
						<div
							className="window-titlebar flex items-center bg-gray-800 border-b border-gray-600/30 select-none"
							style={{ height: '60px' }}
							onMouseDown={(e) => {
								// 仅左键拖拽
								if (e.button !== 0) return
								// 最大化时不允许拖动（与真实系统一致，双击已提供切换）
								if (w.isMaximized) return
								e.preventDefault()
								draggingRef.current = {
									id: w.id,
									startX: e.clientX,
									startY: e.clientY,
									originLeft: w.left,
									originTop: w.top,
									originWidth: w.width,
									originHeight: w.height,
								}
							}}
							onDoubleClick={() => dispatch(toggleMaximize(w.id))}
							tabIndex={0}
						>
							{/* 左侧：应用图标和名称 */}
							<div className="flex items-center gap-2 px-3 min-w-0">
								{w.icon && (
									<img 
										src={w.icon} 
										alt="" 
										className="w-4 h-4 flex-shrink-0" 
									/>
								)}
								<span className="text-sm font-medium text-gray-200 truncate">
									{w.title}
								</span>
							</div>

							{/* 中间：自定义内容区域（预留给应用内容，如搜索、排序等） */}
							<div className="flex-1 flex items-center justify-center px-2">
								{/* 这里可以由应用自定义内容，如搜索框、排序按钮等 */}
								<div className="text-xs text-gray-400 opacity-50">
									{/* 应用可在此区域添加自定义控件 */}
								</div>
							</div>

							{/* 右侧：窗口控制按钮（设计更新：按钮背景白色10%，图标黑色，尺寸200%） */}
							<div className="flex items-center gap-1 px-2">
								{/* 最小化 */}
								<button
									className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(toggleMinimize(w.id))
									}}
									title="最小化"
								>
									<svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
									</svg>
								</button>
								{/* 最大化/还原 */}
								<button
									className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(toggleMaximize(w.id))
									}}
									title={w.isMaximized ? '还原' : '最大化'}
								>
									{w.isMaximized ? (
										<svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
										</svg>
									) : (
										<svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
										</svg>
									)}
								</button>
								{/* 关闭 */}
								<button
									className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(closeWindow(w.id))
									}}
									title="关闭"
								>
									<svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						{/* 缩放手柄 */}
						{renderResizeHandles(w.id, w.isMaximized)}
						<div className="window-content w-full" style={{ pointerEvents: 'auto' }}>
							{renderWindowContent(w)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
