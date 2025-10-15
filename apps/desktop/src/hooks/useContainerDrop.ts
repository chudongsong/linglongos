/**
 * useContainerDrop
 * 容器作为拖拽接收区：
 * - 计算落点并约束在容器范围
 * - 将像素坐标吸附到网格
 * - 若目标网格已占用，查找最近可用网格位
 */
import { useDrop } from 'react-dnd'
import type { XYCoord } from 'react-dnd'
import { ITEM_TYPE, type IconDragItem } from '@/types/dnd'

/**
 * 容器作为拖拽接收区的 Hook。
 *
 * 用于在图标拖拽释放时：
 * - 将释放点限制在容器边界内；
 * - 将像素坐标吸附到网格行/列；
 * - 若目标网格已被占用，查找最近可用网格位并更新位置。
 *
 * @param params 参数对象
 * @param params.containerRef 容器 `div` 的 ref，用于获取边界与坐标系
 * @param params.containerWidth 容器宽度（像素）
 * @param params.containerHeight 容器高度（像素）
 * @param params.grid 网格规格：图标占位宽高与网格间距
 * @param params.getMaxColsRows 计算最大列/行与 padding 的函数
 * @param params.toPixels 将网格行/列转换为像素 `left/top` 的函数
 * @param params.positions 当前所有图标的网格行/列映射
 * @param params.setPositions 位置更新函数（函数式 setState）
 * @param params.findNearestEmptySlot 查找最近可用网格位的函数
 * @returns 用于绑定到容器节点的 dropRef（作为拖拽接收区）
 */
export function useContainerDrop(params: {
    containerRef: React.MutableRefObject<HTMLDivElement | null>
    containerWidth: number
    containerHeight: number
    grid: { width: number; height: number; gap: number }
	getMaxColsRows: () => { maxCols: number; maxRows: number; padding: number }
	toPixels: (row: number, col: number) => { left: number; top: number }
	positions: Record<string, { row: number; col: number }>
	setPositions: (
		updater: (prev: Record<string, { row: number; col: number }>) => Record<string, { row: number; col: number }>,
	) => void
	findNearestEmptySlot: (targetRow: number, targetCol: number, excludeId: string) => { row: number; col: number }
}) {
	const {
		containerRef,
		containerWidth,
		containerHeight,
		grid,
		getMaxColsRows,
		toPixels,
		positions,
		setPositions,
		findNearestEmptySlot,
	} = params

	const [, dropRef] = useDrop(
		() => ({
			accept: ITEM_TYPE,
			drop: (item: IconDragItem, monitor) => {
				const clientOffset = monitor.getClientOffset() as XYCoord | null
				const initialClient = monitor.getInitialClientOffset() as XYCoord | null
				const initialSource = monitor.getInitialSourceClientOffset() as XYCoord | null
				const container = containerRef.current
				if (!clientOffset || !initialClient || !initialSource || !container) return

				const dx = clientOffset.x - initialClient.x
				const dy = clientOffset.y - initialClient.y

				const originRC = positions[item.id]
				const originPx = originRC ? toPixels(originRC.row, originRC.col) : { left: 0, top: 0 }

				let left = originPx.left + dx
				let top = originPx.top + dy

				const { padding, maxCols, maxRows } = getMaxColsRows()

				const minLeft = padding
				const minTop = padding
				const maxLeft = Math.max(minLeft, containerWidth - padding - grid.width)
				const maxTop = Math.max(minTop, containerHeight - padding - grid.height)
				left = Math.min(Math.max(left, minLeft), maxLeft)
				top = Math.min(Math.max(top, minTop), maxTop)

				const cellW = grid.width + grid.gap
				const cellH = grid.height + grid.gap

				let col = Math.round((left - padding) / cellW)
				let row = Math.round((top - padding) / cellH)
				col = Math.min(Math.max(col, 0), maxCols - 1)
				row = Math.min(Math.max(row, 0), maxRows - 1)

				const { row: finalRow, col: finalCol } = findNearestEmptySlot(row, col, item.id)
				setPositions((prev) => ({ ...prev, [item.id]: { row: finalRow, col: finalCol } }))
			},
		}),
		[containerWidth, containerHeight, grid.width, grid.height, grid.gap, positions],
	)

	return dropRef
}
