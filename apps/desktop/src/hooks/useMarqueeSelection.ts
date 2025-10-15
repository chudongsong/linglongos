/**
 * useMarqueeSelection
 * 框选行为与视觉选中集计算：
 * - 鼠标按下于空白处启动框选
 * - 鼠标移动更新矩形
 * - 鼠标释放更新选中集（支持追加选择 toggle）
 * - 实时计算视觉选中集（进行中时）
 */
import { useEffect, useMemo, useState } from 'react'
import type { FullConfig, AppItem } from '@/types/config'

export function useMarqueeSelection(params: {
	grid: { width: number; height: number }
	config?: FullConfig | null
	positions: Record<string, { row: number; col: number }>
	toPixels: (row: number, col: number) => { left: number; top: number }
	selected: Set<string>
	setSelected: (updater: (prev: Set<string>) => Set<string>) => void
	suppressNextClickClearRef: { current: boolean }
}) {
	const { grid, config, positions, toPixels, selected, setSelected, suppressNextClickClearRef } = params
	const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null)
	const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(
		null,
	)
	const [marqueeAdditive, setMarqueeAdditive] = useState<boolean>(false)

	/**
	 * 鼠标按下：启动框选
	 */
	function handleMouseDown(e: React.MouseEvent, containerEl: HTMLElement | null) {
		if (e.button !== 0) return
		const target = e.target as HTMLElement
		if (target.closest('.icon-item')) return
		const rect = containerEl?.getBoundingClientRect()
		if (!rect) return
		const startX = e.clientX - rect.left
		const startY = e.clientY - rect.top
		setMarqueeStart({ x: startX, y: startY })
		setMarqueeRect({ left: startX, top: startY, width: 0, height: 0 })
		setMarqueeAdditive(e.metaKey || e.ctrlKey)
		if (!(e.metaKey || e.ctrlKey)) {
			setSelected(() => new Set())
		}
	}

	/**
	 * 鼠标移动：更新框选矩形
	 */
	function handleMouseMove(e: React.MouseEvent, containerEl: HTMLElement | null) {
		if (!marqueeStart) return
		// 未按住左键则立即终止框选（防止离开页面再进入仍跟随）
		if ((e.buttons & 1) !== 1) {
			setMarqueeStart(null)
			setMarqueeRect(null)
			setMarqueeAdditive(false)
			return
		}
		const rect = containerEl?.getBoundingClientRect()
		if (!rect) return
		const currX = e.clientX - rect.left
		const currY = e.clientY - rect.top
		const left = Math.min(currX, marqueeStart.x)
		const top = Math.min(currY, marqueeStart.y)
		const width = Math.abs(currX - marqueeStart.x)
		const height = Math.abs(currY - marqueeStart.y)
		setMarqueeRect({ left, top, width, height })
	}

	/**
	 * 鼠标释放：更新选中集合
	 */
	function handleMouseUp() {
		if (!marqueeStart || !marqueeRect) return
		const apps: AppItem[] = config?.apps || []
		const hit = new Set<string>()
		for (const app of apps) {
			const pos = positions[app.id]
			if (!pos) continue
			const pixel = toPixels(pos.row, pos.col)
			const ax1 = pixel.left
			const ay1 = pixel.top
			const ax2 = ax1 + grid.width
			const ay2 = ay1 + grid.height
			const bx1 = marqueeRect.left
			const by1 = marqueeRect.top
			const bx2 = bx1 + marqueeRect.width
			const by2 = by1 + marqueeRect.height
			const overlap = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
			if (overlap) hit.add(app.id)
		}

		setSelected((prev) => {
			const next = new Set(prev)
			if (marqueeAdditive) {
				for (const id of hit) {
					if (next.has(id)) next.delete(id)
					else next.add(id)
				}
			} else {
				next.clear()
				for (const id of hit) next.add(id)
			}
			return next
		})

		setMarqueeStart(null)
		setMarqueeRect(null)
		setMarqueeAdditive(false)
		suppressNextClickClearRef.current = true
	}

	/**
	 * 全局监听：离开页面/窗口失焦 时终止框选（不提交选中集，不设置 suppressNextClickClearRef）
	 */
	useEffect(() => {
		const endMarquee = () => {
			setMarqueeStart(null)
			setMarqueeRect(null)
			setMarqueeAdditive(false)
		}
		const onLeaveDocument = () => endMarquee()
		const onWindowMouseOut = (ev: MouseEvent) => {
			const to = ev.relatedTarget as Node | null
			if (!to) endMarquee()
		}
		const onWindowBlur = () => endMarquee()
		document.addEventListener('mouseleave', onLeaveDocument)
		window.addEventListener('mouseout', onWindowMouseOut)
		window.addEventListener('blur', onWindowBlur)
		return () => {
			document.removeEventListener('mouseleave', onLeaveDocument)
			window.removeEventListener('mouseout', onWindowMouseOut)
			window.removeEventListener('blur', onWindowBlur)
		}
	}, [])

	/**
	 * 视觉选中集：实时计算（进行框选时）
	 */
	const visualSelected = useMemo<Set<string>>(() => {
		if (!marqueeRect) return selected
		const apps: AppItem[] = config?.apps || []
		const hit = new Set<string>()
		for (const app of apps) {
			const pos = positions[app.id]
			if (!pos) continue
			const pixel = toPixels(pos.row, pos.col)
			const ax1 = pixel.left
			const ay1 = pixel.top
			const ax2 = ax1 + grid.width
			const ay2 = ay1 + grid.height
			const bx1 = marqueeRect.left
			const by1 = marqueeRect.top
			const bx2 = bx1 + marqueeRect.width
			const by2 = by1 + marqueeRect.height
			const overlap = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
			if (overlap) hit.add(app.id)
		}
		if (!marqueeAdditive) {
			return hit
		}
		const next = new Set(selected)
		for (const id of hit) {
			if (next.has(id)) next.delete(id)
			else next.add(id)
		}
		return next
	}, [marqueeRect, marqueeAdditive, selected, config?.apps, positions, grid.width, grid.height, toPixels])

	return {
		marqueeRect,
		visualSelected,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	}
}
