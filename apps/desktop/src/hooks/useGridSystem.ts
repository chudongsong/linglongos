/**
 * useGridSystem
 * 管理桌面网格与图标位置：
 * - 计算容器最大列/行数
 * - 支持根据应用配置初始化网格位置
 * - 提供 row/col 与像素互转、图标布局与最近可用网格查询
 */
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { FullConfig, AppItem } from '@/types/config'

/**
 * 网格系统 Hook
 * @param params 参数：配置、网格规格、容器宽高
 */
export function useGridSystem(params: {
	config?: FullConfig | null
	grid: { width: number; height: number; gap: number }
	containerWidth: number
	containerHeight: number
}) {
	const { config, grid, containerWidth, containerHeight } = params
	const [positions, setPositions] = useState<Record<string, { row: number; col: number }>>({})

	/** 计算最大列/行数 */
	function getMaxColsRows() {
		const padding = config?.desktop?.padding ?? 10
		const availableW = Math.max(0, containerWidth - padding * 2)
		const availableH = Math.max(0, containerHeight - padding * 2)
		const maxCols = Math.max(1, Math.floor((availableW + grid.gap) / (grid.width + grid.gap)))
		const maxRows = Math.max(1, Math.floor((availableH + grid.gap) / (grid.height + grid.gap)))
		return { maxCols, maxRows, padding }
	}

	/** 根据配置初始化/同步图标位置 */
	useEffect(() => {
		const apps: AppItem[] = config?.apps || []
		if (apps.length === 0) return

		const { maxCols } = getMaxColsRows()

		const ids = new Set(apps.map((a) => a.id))
		const knownIds = new Set(Object.keys(positions))
		const needReinit = positions && (ids.size !== knownIds.size || apps.some((a) => !knownIds.has(a.id)))

		if (!needReinit && Object.keys(positions).length > 0) return

		let autoIndex = 0
		const next: Record<string, { row: number; col: number }> = {}

		for (const app of apps) {
			const hasPos = typeof app.position?.row === 'number' && typeof app.position?.col === 'number'
			const col = hasPos ? (app.position!.col as number) : autoIndex % maxCols
			const row = hasPos ? (app.position!.row as number) : Math.floor(autoIndex / maxCols)
			if (!hasPos) autoIndex += 1
			next[app.id] = { row, col }
		}
		setPositions(next)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config?.apps])

	/** 将 row/col 转为像素 */
	const toPixels = useCallback(
		(row: number, col: number) => {
			const padding = config?.desktop?.padding ?? 10
			const cellW = grid.width + grid.gap
			const cellH = grid.height + grid.gap
			return {
				left: padding + col * cellW,
				top: padding + row * cellH,
			}
		},
		[grid.width, grid.height, grid.gap, config?.desktop?.padding],
	)

	/** 计算每个图标的布局定位（left/top） */
	const iconLayout = useMemo(() => {
		const apps: AppItem[] = config?.apps || []
		return apps.map((app) => {
			const pos = positions[app.id]
			const { left, top } = pos ? toPixels(pos.row, pos.col) : { left: 0, top: 0 }
			return {
				app,
				style: { left: `${left}px`, top: `${top}px` } as CSSProperties,
			}
		})
	}, [config?.apps, positions, toPixels])

	/** 查找最近可用网格位 */
	function findNearestEmptySlot(targetRow: number, targetCol: number, excludeId: string) {
		const { maxCols, maxRows } = getMaxColsRows()

		const occupied = new Set<string>()
		for (const [id, rc] of Object.entries(positions)) {
			if (id === excludeId) continue
			occupied.add(`${rc.row},${rc.col}`)
		}

		let row = Math.min(Math.max(targetRow, 0), maxRows - 1)
		let col = Math.min(Math.max(targetCol, 0), maxCols - 1)

		const total = maxCols * maxRows
		for (let i = 0; i < total; i++) {
			const key = `${row},${col}`
			if (!occupied.has(key)) return { row, col }
			col += 1
			if (col >= maxCols) {
				col = 0
				row += 1
				if (row >= maxRows) row = 0
			}
		}
		return { row: targetRow, col: targetCol }
	}

	return {
		positions,
		setPositions,
		getMaxColsRows,
		toPixels,
		iconLayout,
		findNearestEmptySlot,
	}
}
