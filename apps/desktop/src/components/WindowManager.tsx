import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '@store/index'
import {
    focusWindow,
    moveWindow,
    toggleMaximize,
    resizeWindow,
} from '@store/slices/window.slice'
import { Settings } from '@features/settings'
import WindowControls from './WindowControls'

import type { CSSProperties } from 'react'

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

// 拖拽引用（窗口标题栏拖拽：拖拽过程中实时移动窗口）
const draggingRef = useRef<{
  id: string
  startX: number
  startY: number
  originLeft: number
  originTop: number
  width: number
  height: number
} | null>(null)

// rAF 调度，避免高频 setState
const frameIdRef = useRef<number | null>(null)
// rAF 待提交位置（取最新一次鼠标移动计算结果）
const pendingPosRef = useRef<{ id: string; left: number; top: number } | null>(null)

	useEffect(() => {
		/**
		 * 结束当前交互（拖拽/缩放）并清理临时状态
		 */
		const endInteraction = () => {
			// 结束缩放
			resizingRef.current = null
			// 结束拖拽
			if (draggingRef.current) {
				draggingRef.current = null
				pendingPosRef.current = null
			}
		}

		/**
		 * 处理全局鼠标移动：优先处理缩放，其次处理拖拽预览。
		 * 拖拽期间不更新窗口位置，仅更新预览层；松开后一次性提交。
		 */
		const onMove = (e: MouseEvent) => {
			e.preventDefault()

			// 若未按住左键，则立即结束交互（防止离开页面后返回仍跟随）
			// 鼠标左键对应 bit 位 1；当 e.buttons === 0 或未包含左键位时，认为未按住
			if ((e.buttons & 1) !== 1) {
				endInteraction()
				return
			}

			// 若鼠标坐标越界到页面外（安全边界判断），立即结束交互
			const vw = window.innerWidth
			const vh = window.innerHeight
			if (e.clientX < 0 || e.clientY < 0 || e.clientX > vw || e.clientY > vh) {
				endInteraction()
				return
			}

			// 1) 处理缩放逻辑
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

      // 2) 处理拖拽（标题栏，实时移动窗口，移除吸附/对齐）
      if (draggingRef.current) {
        const d = draggingRef.current
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY

                // 自由位置（不吸附、不对齐）并进行视口边界裁剪
                const vw = window.innerWidth
                const vh = window.innerHeight
                const freeLeft = Math.max(0, Math.min(d.originLeft + dx, vw - d.width))
                const freeTop = Math.max(0, Math.min(d.originTop + dy, vh - d.height))
        // rAF 批量更新窗口位置，避免高频 dispatch
        pendingPosRef.current = { id: d.id, left: Math.round(freeLeft), top: Math.round(freeTop) }
        if (frameIdRef.current == null) {
          frameIdRef.current = requestAnimationFrame(() => {
            frameIdRef.current = null
            const p = pendingPosRef.current
            if (p) {
              dispatch(moveWindow({ id: p.id, left: p.left, top: p.top }))
            }
          })
        }

        return
      }
    }

		/**
		 * 处理鼠标松开：结束任何进行中的拖拽或缩放。
		 */
		const onUp = () => {
			endInteraction()
		}

		// 鼠标离开整个页面（窗口）时，立即终止交互
		const onLeaveDocument = () => {
			endInteraction()
		}

		// 当触发 "mouseout" 且目标为 null（离开浏览器窗口）时，终止交互
		const onWindowMouseOut = (ev: MouseEvent) => {
			// relatedTarget 为 null 表示指针移出至浏览器之外
			const to = ev.relatedTarget as Node | null
			if (!to) {
				endInteraction()
			}
		}

		// 浏览器窗口失焦（例如切到其他应用）也应结束交互
		const onWindowBlur = () => {
			endInteraction()
		}

		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)
		document.addEventListener('mouseleave', onLeaveDocument)
		window.addEventListener('mouseout', onWindowMouseOut)
		window.addEventListener('blur', onWindowBlur)
		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
			document.removeEventListener('mouseleave', onLeaveDocument)
			window.removeEventListener('mouseout', onWindowMouseOut)
			window.removeEventListener('blur', onWindowBlur)
			if (frameIdRef.current != null) {
				cancelAnimationFrame(frameIdRef.current)
				frameIdRef.current = null
			}
		}
		}, [dispatch, windows])

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
				const windowClass = clsx(
					className,
					// 拖拽中禁用过渡以消除跟随延迟
					draggingRef.current?.id === w.id && 'dragging',
					// 缩放中禁用过渡，保证尺寸变化即时生效
					resizingRef.current?.id === w.id && 'resizing',
					'absolute pointer-events-auto rounded-xl overflow-hidden text-white',
				)
				return (
					<div key={w.id} className={windowClass} style={style} onMouseDown={() => dispatch(focusWindow(w.id))}>
						{/* Ubuntu风格扁平化标题栏 */}
            <div
            className="window-titlebar flex items-center bg-gray-800/95 border-b border-gray-700/30 select-none"
            style={{ height: '52px', paddingInline: '6px' }}
            // 标题栏拖拽：开始实时拖拽（左键且未最大化）
            onMouseDown={(e) => {
              if (e.button !== 0) return
              if (w.isMaximized) return
              // 读取当前窗口位置与尺寸
              const el = (e.currentTarget.parentElement as HTMLElement)
              const rect = el.getBoundingClientRect()
              draggingRef.current = {
                id: w.id,
                startX: e.clientX,
                startY: e.clientY,
                originLeft: rect.left,
                originTop: rect.top,
                width: rect.width,
                height: rect.height,
              }
            }}
            onDoubleClick={() => dispatch(toggleMaximize(w.id))}
            tabIndex={0}
          >
							{/* 左侧：应用图标和名称 */}
              <div className="flex items-center gap-2 px-2 min-w-0">
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

              {/* 右侧：现代化窗口控制按钮 */}
              <WindowControls id={w.id} isMaximized={w.isMaximized} />
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
