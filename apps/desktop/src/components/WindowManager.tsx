import { useEffect, useMemo, useRef, useState } from 'react'
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

import type { CSSProperties } from 'react'

/**
 * WindowManager：最小可用版本 + 缩放
 * - 渲染窗口层并管理聚焦/拖拽/最小化/最大化/关闭
 * - 支持 8 向（N/E/S/W/NE/NW/SE/SW）边缘与角点缩放，带最小尺寸约束
 * - 仅支持 iframe 加载 URL；后续可扩展为内部应用组件
 */
export default function WindowManager() {
	const { windows } = useAppSelector((s) => s.window)
	const dispatch = useAppDispatch()

	// 维护最新的 windows 引用，避免事件回调闭包中获取到过期值
	const windowsRef = useRef<typeof windows>(windows)
	useEffect(() => {
		windowsRef.current = windows
	}, [windows])
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

	const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] })

	useEffect(() => {
		/**
		 * 处理全局鼠标移动：优先处理缩放，其次处理拖拽。
		 * 增强：加入边缘吸附、网格吸附、中心线吸附，以及“窗口间吸附”；并渲染引导线。
		 */
		const onMove = (e: MouseEvent) => {
			// 缩放逻辑
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

				// 吸附规则：对正在调整的边做边缘与网格吸附 + 窗口间吸附
				const gV: number[] = []
				const gH: number[] = []

				// 预计算：其他窗口的对齐目标线（跳过最小化与自身）
				const others = windowsRef.current.filter((w) => w.id !== r.id && !w.isMinimized)
				const xTargets: number[] = []
				const yTargets: number[] = []
				for (const ow of others) {
					xTargets.push(ow.left, ow.left + ow.width, ow.left + Math.round(ow.width / 2))
					yTargets.push(ow.top, ow.top + ow.height, ow.top + Math.round(ow.height / 2))
				}

				// 右边缘
				if (r.edge.includes('e')) {
					const right = newLeft + newWidth
					// 屏幕边缘与网格
					const { value: snappedRight, guide: edgeGuide } = snapTo(right, [vw], SNAP_THRESHOLD)
					const gridRight = snapToGrid(right, GRID_SIZE, SNAP_THRESHOLD)
					// 窗口间吸附
					const winSnap = xTargets.length ? snapTo(right, xTargets, SNAP_THRESHOLD) : { value: right, guide: null }
					// 在候选项中选择位移最小者
					const candidates: Array<{ final: number; guide: number | null; delta: number }> = []
					if (snappedRight !== right)
						candidates.push({ final: snappedRight, guide: edgeGuide, delta: Math.abs(snappedRight - right) })
					if (gridRight !== right)
						candidates.push({ final: gridRight, guide: gridRight, delta: Math.abs(gridRight - right) })
					if (winSnap.value !== right)
						candidates.push({ final: winSnap.value, guide: winSnap.guide, delta: Math.abs(winSnap.value - right) })
					if (candidates.length) {
						candidates.sort((a, b) => a.delta - b.delta)
						const best = candidates[0]
						const finalRight = best.final
						newWidth = Math.max(MIN_W, finalRight - newLeft)
						if (best.guide != null) gV.push(best.guide)
					}
				}
				// 左边缘
				if (r.edge.includes('w')) {
					const left = newLeft
					// 屏幕边缘与网格
					const { value: snappedLeft, guide: edgeGuide } = snapTo(left, [0], SNAP_THRESHOLD)
					const gridLeft = snapToGrid(left, GRID_SIZE, SNAP_THRESHOLD)
					// 窗口间吸附
					const winSnap = xTargets.length ? snapTo(left, xTargets, SNAP_THRESHOLD) : { value: left, guide: null }
					// 候选项选择
					const candidates: Array<{ final: number; guide: number | null; delta: number }> = []
					if (snappedLeft !== left)
						candidates.push({ final: snappedLeft, guide: edgeGuide, delta: Math.abs(snappedLeft - left) })
					if (gridLeft !== left) candidates.push({ final: gridLeft, guide: gridLeft, delta: Math.abs(gridLeft - left) })
					if (winSnap.value !== left)
						candidates.push({ final: winSnap.value, guide: winSnap.guide, delta: Math.abs(winSnap.value - left) })
					if (candidates.length) {
						candidates.sort((a, b) => a.delta - b.delta)
						const best = candidates[0]
						const finalLeft = best.final
						const delta = newLeft - finalLeft
						newLeft = finalLeft
						newWidth = Math.max(MIN_W, newWidth + delta)
						if (best.guide != null) gV.push(best.guide)
					}
				}
				// 下边缘
				if (r.edge.includes('s')) {
					const bottom = newTop + newHeight
					// 屏幕边缘与网格
					const { value: snappedBottom, guide: edgeGuide } = snapTo(bottom, [vh], SNAP_THRESHOLD)
					const gridBottom = snapToGrid(bottom, GRID_SIZE, SNAP_THRESHOLD)
					// 窗口间吸附
					const winSnap = yTargets.length ? snapTo(bottom, yTargets, SNAP_THRESHOLD) : { value: bottom, guide: null }
					// 候选项选择
					const candidates: Array<{ final: number; guide: number | null; delta: number }> = []
					if (snappedBottom !== bottom)
						candidates.push({ final: snappedBottom, guide: edgeGuide, delta: Math.abs(snappedBottom - bottom) })
					if (gridBottom !== bottom)
						candidates.push({ final: gridBottom, guide: gridBottom, delta: Math.abs(gridBottom - bottom) })
					if (winSnap.value !== bottom)
						candidates.push({ final: winSnap.value, guide: winSnap.guide, delta: Math.abs(winSnap.value - bottom) })
					if (candidates.length) {
						candidates.sort((a, b) => a.delta - b.delta)
						const best = candidates[0]
						const finalBottom = best.final
						newHeight = Math.max(MIN_H, finalBottom - newTop)
						if (best.guide != null) gH.push(best.guide)
					}
				}
				// 上边缘
				if (r.edge.includes('n')) {
					const top = newTop
					// 屏幕边缘与网格
					const { value: snappedTop, guide: edgeGuide } = snapTo(top, [0], SNAP_THRESHOLD)
					const gridTop = snapToGrid(top, GRID_SIZE, SNAP_THRESHOLD)
					// 窗口间吸附
					const winSnap = yTargets.length ? snapTo(top, yTargets, SNAP_THRESHOLD) : { value: top, guide: null }
					// 候选项选择
					const candidates: Array<{ final: number; guide: number | null; delta: number }> = []
					if (snappedTop !== top)
						candidates.push({ final: snappedTop, guide: edgeGuide, delta: Math.abs(snappedTop - top) })
					if (gridTop !== top) candidates.push({ final: gridTop, guide: gridTop, delta: Math.abs(gridTop - top) })
					if (winSnap.value !== top)
						candidates.push({ final: winSnap.value, guide: winSnap.guide, delta: Math.abs(winSnap.value - top) })
					if (candidates.length) {
						candidates.sort((a, b) => a.delta - b.delta)
						const best = candidates[0]
						const finalTop = best.final
						const delta = newTop - finalTop
						newTop = finalTop
						newHeight = Math.max(MIN_H, newHeight + delta)
						if (best.guide != null) gH.push(best.guide)
					}
				}

				// 视口边界裁剪
				const MARGIN = 0
				newLeft = Math.max(MARGIN, Math.min(newLeft, vw - newWidth - MARGIN))
				newTop = Math.max(MARGIN, Math.min(newTop, vh - newHeight - MARGIN))

				// 渲染引导线（若无命中则清空）
				setGuides({ v: gV, h: gH })

				dispatch(moveWindow({ id: r.id, left: Math.round(newLeft), top: Math.round(newTop) }))
				dispatch(resizeWindow({ id: r.id, width: Math.round(newWidth), height: Math.round(newHeight) }))
				return
			}

			// 拖拽逻辑
			const d = draggingRef.current
			if (!d) return
			const dx = e.clientX - d.startX
			const dy = e.clientY - d.startY

			const vw = window.innerWidth
			const vh = window.innerHeight

			let left = d.originLeft + dx
			let top = d.originTop + dy

			// 先限制在可视区（允许部分越界可放宽）
			left = Math.min(Math.max(left, 0), vw - 100)
			top = Math.min(Math.max(top, 0), vh - 48)

			// 吸附到边缘 + 网格 + 屏幕中心
			const gV: number[] = []
			const gH: number[] = []

			// 屏幕中心线吸附（基于窗口中心）
			// 计算当前中心点
			const centerX = left + d.originWidth / 2
			const centerY = top + d.originHeight / 2
			// 吸附到屏幕中心（垂直/水平）
			const { value: snapCX, guide: guideCX } = snapTo(centerX, [vw / 2], SNAP_THRESHOLD)
			if (snapCX !== centerX) {
				left = Math.round(snapCX - d.originWidth / 2)
				if (guideCX != null) gV.push(guideCX)
			}
			const { value: snapCY, guide: guideCY } = snapTo(centerY, [vh / 2], SNAP_THRESHOLD)
			if (snapCY !== centerY) {
				top = Math.round(snapCY - d.originHeight / 2)
				if (guideCY != null) gH.push(guideCY)
			}

			// 边缘吸附（左/右）
			const { value: leftSnap, guide: lGuide } = snapTo(left, [0], SNAP_THRESHOLD)
			if (leftSnap !== left) {
				left = leftSnap
				if (lGuide != null) gV.push(lGuide)
			}
			// 右边缘需要窗口宽度；这里以保守 100 宽度来画参考线，真正视觉参考线对用户即为视口边
			const rightEdge = vw - 100
			const { value: rightSnap, guide: rGuide } = snapTo(left, [rightEdge], SNAP_THRESHOLD)
			if (rightSnap !== left) {
				left = rightSnap
				if (rGuide != null) gV.push(vw)
			}

			// 网格吸附（left/top）
			const gridLeft = snapToGrid(left, GRID_SIZE, SNAP_THRESHOLD)
			if (gridLeft !== left) left = gridLeft
			const gridTop = snapToGrid(top, GRID_SIZE, SNAP_THRESHOLD)
			if (gridTop !== top) top = gridTop

			// 边缘吸附（上/下）
			const { value: topSnap, guide: tGuide } = snapTo(top, [0], SNAP_THRESHOLD)
			if (topSnap !== top) {
				top = topSnap
				if (tGuide != null) gH.push(tGuide)
			}
			const bottomEdge = vh - 48
			const { value: bottomSnap, guide: bGuide } = snapTo(top, [bottomEdge], SNAP_THRESHOLD)
			if (bottomSnap !== top) {
				top = bottomSnap
				if (bGuide != null) gH.push(vh)
			}

			// 窗口间吸附（对齐其他窗口的左/右/中心线）
			const others = windowsRef.current.filter((w) => w.id !== d.id && !w.isMinimized)
			if (others.length) {
				const xTargets: number[] = []
				const yTargets: number[] = []
				for (const ow of others) {
					xTargets.push(ow.left, ow.left + ow.width, ow.left + Math.round(ow.width / 2))
					yTargets.push(ow.top, ow.top + ow.height, ow.top + Math.round(ow.height / 2))
				}
				// 计算 X 轴最佳吸附（基于 left/right/centerX 三种方式选最近）
				const snapX = computeBestSnapX(left, d.originWidth, xTargets, SNAP_THRESHOLD)
				if (snapX && snapX.hit) {
					left = snapX.left
					if (snapX.guide != null) gV.push(snapX.guide)
				}
				// 计算 Y 轴最佳吸附（基于 top/bottom/centerY）
				const snapY = computeBestSnapY(top, d.originHeight, yTargets, SNAP_THRESHOLD)
				if (snapY && snapY.hit) {
					top = snapY.top
					if (snapY.guide != null) gH.push(snapY.guide)
				}
			}

			// 渲染引导线（若无命中则清空）
			setGuides({ v: gV, h: gH })

			dispatch(moveWindow({ id: d.id, left, top }))
		}

		/**
		 * 处理鼠标松开：结束任何进行中的拖拽或缩放，并清空引导线。
		 */
		const onUp = () => {
			draggingRef.current = null
			resizingRef.current = null
			setGuides({ v: [], h: [] })
		}

		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)
		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
		}
	}, [dispatch])

	const layerStyle = useMemo<CSSProperties>(
		() => ({ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1100 }),
		[],
	)

	/**
	 * 渲染 8 向缩放手柄
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
		<div className="window-root fixed inset-0 pointer-events-none z-[1100]" style={layerStyle}>
			{/* 引导线渲染：竖线与横线 */}
			{guides.v.map((x, i) => (
				<div
					key={`gv-${i}`}
					style={{
						position: 'fixed',
						top: 0,
						left: x,
						width: 1,
						height: '100%',
						background: 'rgba(59,130,246,0.8)',
						pointerEvents: 'none',
						zIndex: 1150,
					}}
				/>
			))}
			{guides.h.map((y, i) => (
				<div
					key={`gh-${i}`}
					style={{
						position: 'fixed',
						left: 0,
						top: y,
						height: 1,
						width: '100%',
						background: 'rgba(59,130,246,0.8)',
						pointerEvents: 'none',
						zIndex: 1150,
					}}
				/>
			))}

			{windows.map((w) => {
				const style: CSSProperties = {
					left: w.left,
					top: w.top,
					width: w.width,
					height: w.height,
					zIndex: w.zIndex,
					pointerEvents: 'auto',
				}
				const className = `window${w.isActive ? ' active' : ''}${w.isMinimized ? ' minimized' : ''}${w.isMaximized ? ' maximized' : ''}`
				/**
				 * Tailwind 渐进式迁移说明：
				 * - 保留原有 .window 类的视觉定义，新增原子类仅表达布局/圆角/可读性
				 * - 与 public/styles.css 的同值设置保持一致以避免视觉偏差
				 */
				const windowClass = clsx(className, 'absolute pointer-events-auto rounded-xl overflow-hidden text-white')
				return (
					<div key={w.id} className={windowClass} style={style} onMouseDown={() => dispatch(focusWindow(w.id))}>
						<div
							className="window-titlebar flex items-center gap-2 h-9 px-3 cursor-default outline-none border-b border-white/15 select-none"
							onMouseDown={(e) => {
								// 仅左键拖拽
								if (e.button !== 0) return
								// 最大化时不允许拖动（与真实系统一致，双击已提供切换）
								if (w.isMaximized) return
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
							<div className="window-controls flex gap-2 mr-2">
								<button
									aria-label="minimize"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(toggleMinimize(w.id))
									}}
								>
									12
								</button>
								<button
									aria-label="maximize"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(toggleMaximize(w.id))
									}}
								>
									10
								</button>
								<button
									aria-label="close"
									onClick={(e) => {
										e.stopPropagation()
										dispatch(closeWindow(w.id))
									}}
								>
									0F
								</button>
							</div>
							<div className="window-title">{w.title}</div>
						</div>
						{/* 缩放手柄 */}
						{renderResizeHandles(w.id, w.isMaximized)}
						<div className="window-content w-full" style={{ pointerEvents: 'auto' }}>
							{w.url ? (
								<iframe
									src={w.url}
									title={w.title}
									style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
								/>
							) : (
								<div style={{ padding: 16 }}>应用内容待接入</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}

// 吸附参数常量
const SNAP_THRESHOLD = 12
const GRID_SIZE = 8

/**
 * 计算接近目标的吸附
 * @param value 当前值
 * @param targets 目标位置数组
 * @param threshold 吸附阈值
 * @returns { value, guide } 若命中阈值，返回吸附值与对应引导线坐标，否则返回原值与 null
 */
function snapTo(value: number, targets: number[], threshold: number) {
	let snapped = value
	let guide: number | null = null
	let bestDelta = Infinity
	for (const t of targets) {
		const d = Math.abs(value - t)
		if (d <= threshold && d < bestDelta) {
			bestDelta = d
			snapped = t
			guide = t
		}
	}
	return { value: snapped, guide }
}

/**
 * 将值吸附到最近的网格点（可选阈值）
 * @param value 当前值
 * @param grid 网格尺寸
 * @param threshold 吸附阈值
 */
function snapToGrid(value: number, grid: number, threshold: number) {
	const nearest = Math.round(value / grid) * grid
	if (Math.abs(value - nearest) <= threshold) return nearest
	return value
}

/**
 * 计算拖拽时 X 轴相对其他窗口的最佳吸附
 * - 尝试让 “left / right / centerX” 分别对齐到 targets 中任意一条线
 * - 选择位移量（abs）最小且在阈值内的一种
 */
function computeBestSnapX(
	left: number,
	width: number,
	targets: number[],
	threshold: number,
): { left: number; guide: number | null; hit: boolean } | null {
	const centerX = left + width / 2
	const right = left + width
	const c = snapTo(centerX, targets, threshold)
	const l = snapTo(left, targets, threshold)
	const r = snapTo(right, targets, threshold)

	const candidates: Array<{ move: number; left: number; guide: number | null }> = []
	if (c.value !== centerX)
		candidates.push({ move: Math.abs(c.value - centerX), left: Math.round(c.value - width / 2), guide: c.guide })
	if (l.value !== left) candidates.push({ move: Math.abs(l.value - left), left: l.value, guide: l.guide })
	if (r.value !== right)
		candidates.push({ move: Math.abs(r.value - right), left: left + (r.value - right), guide: r.guide })

	if (!candidates.length) return { left, guide: null, hit: false }
	candidates.sort((a, b) => a.move - b.move)
	const best = candidates[0]
	return { left: best.left, guide: best.guide ?? null, hit: true }
}

/**
 * 计算拖拽时 Y 轴相对其他窗口的最佳吸附
 * - 尝试让 “top / bottom / centerY” 分别对齐到 targets 中任意一条线
 * - 选择位移量（abs）最小且在阈值内的一种
 */
function computeBestSnapY(
	top: number,
	height: number,
	targets: number[],
	threshold: number,
): { top: number; guide: number | null; hit: boolean } | null {
	const centerY = top + height / 2
	const bottom = top + height
	const c = snapTo(centerY, targets, threshold)
	const t = snapTo(top, targets, threshold)
	const b = snapTo(bottom, targets, threshold)

	const candidates: Array<{ move: number; top: number; guide: number | null }> = []
	if (c.value !== centerY)
		candidates.push({ move: Math.abs(c.value - centerY), top: Math.round(c.value - height / 2), guide: c.guide })
	if (t.value !== top) candidates.push({ move: Math.abs(t.value - top), top: t.value, guide: t.guide })
	if (b.value !== bottom)
		candidates.push({ move: Math.abs(b.value - bottom), top: top + (b.value - bottom), guide: b.guide })

	if (!candidates.length) return { top, guide: null, hit: false }
	candidates.sort((a, b) => a.move - b.move)
	const best = candidates[0]
	return { top: best.top, guide: best.guide ?? null, hit: true }
}
