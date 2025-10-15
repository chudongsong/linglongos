/**
 * useSmartDragPreview
 * 提供桌面图标拖拽过程中的实时预览，包含：
 * - 平滑的实时位置计算（基于 react-dnd DragLayer）
 * - 容器边界约束与网格行列计算
 * - 智能吸附：预测最近可用网格位并返回吸附后的像素坐标
 * - 兼容现有网格系统（toPixels/getMaxColsRows/findNearestEmptySlot/positions）
 */
import { useMemo } from 'react'
import { useDragLayer } from 'react-dnd'
import type { XYCoord } from 'react-dnd'
import { ITEM_TYPE, type IconDragItem } from '@/types/dnd'
import type { FullConfig, AppItem } from '@/types/config'

export interface SmartPreviewParams {
  config?: FullConfig | null
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  containerWidth: number
  containerHeight: number
  grid: { width: number; height: number; gap: number }
  getMaxColsRows: () => { maxCols: number; maxRows: number; padding: number }
  toPixels: (row: number, col: number) => { left: number; top: number }
  positions: Record<string, { row: number; col: number }>
  findNearestEmptySlot: (targetRow: number, targetCol: number, excludeId: string) => { row: number; col: number }
}

/**
 * 智能拖拽预览 Hook。
 *
 * 在拖拽过程中实时计算图标预览位置，约束在容器边界，吸附至网格行列，并给出最终吸附后的像素坐标与应用信息。
 * 兼容现有网格系统（`toPixels`/`getMaxColsRows`/`findNearestEmptySlot`/`positions`）。
 *
 * @param params 预览计算所需的上下文参数（容器、网格、配置、位置映射等）
 * @returns `null` 或 `{ left, top, app }`：吸附后的像素位置及对应应用
 */
export function useSmartDragPreview(params: SmartPreviewParams) {
  const { config, containerRef, containerWidth, containerHeight, grid, getMaxColsRows, toPixels, positions, findNearestEmptySlot } = params

  const dragLayer = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    clientOffset: monitor.getClientOffset(),
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
  }))

  const data = useMemo(() => {
    const item = dragLayer.item as IconDragItem | null
    if (!dragLayer.isDragging || !item || item.type !== ITEM_TYPE) return null

    const client = dragLayer.clientOffset as XYCoord | null
    const initClient = dragLayer.initialClientOffset as XYCoord | null
    const initSource = dragLayer.initialSourceClientOffset as XYCoord | null
    const container = containerRef.current
    if (!client || !initClient || !initSource || !container) return null

    // 原始位移（未吸附）
    const dx = client.x - initClient.x
    const dy = client.y - initClient.y

    const originRC = positions[item.id]
    const originPx = originRC ? toPixels(originRC.row, originRC.col) : { left: 0, top: 0 }
    let left = originPx.left + dx
    let top = originPx.top + dy

    // 容器边界与网格参数
    const { padding, maxCols, maxRows } = getMaxColsRows()
    const minLeft = padding
    const minTop = padding
    const maxLeft = Math.max(minLeft, containerWidth - padding - grid.width)
    const maxTop = Math.max(minTop, containerHeight - padding - grid.height)
    left = Math.min(Math.max(left, minLeft), maxLeft)
    top = Math.min(Math.max(top, minTop), maxTop)

    // 计算行列（四舍五入吸附），并查找最近空位
    const cellW = grid.width + grid.gap
    const cellH = grid.height + grid.gap
    let col = Math.round((left - padding) / cellW)
    let row = Math.round((top - padding) / cellH)
    col = Math.min(Math.max(col, 0), maxCols - 1)
    row = Math.min(Math.max(row, 0), maxRows - 1)

    const { row: finalRow, col: finalCol } = findNearestEmptySlot(row, col, item.id)
    const snapped = toPixels(finalRow, finalCol)

    const app: AppItem | undefined = config?.apps.find((a) => a.id === item.id)
    return {
      id: item.id,
      app,
      // 未吸附位置（用于需要自由跟随的效果）
      freeLeft: left,
      freeTop: top,
      // 吸附到最近可用网格后的像素坐标（实时对齐显示）
      snappedLeft: snapped.left,
      snappedTop: snapped.top,
      // 预测的行列
      row: finalRow,
      col: finalCol,
    }
  }, [
    dragLayer.isDragging,
    dragLayer.item,
    dragLayer.clientOffset,
    dragLayer.initialClientOffset,
    dragLayer.initialSourceClientOffset,
    config,
    containerRef,
    containerWidth,
    containerHeight,
    grid.width,
    grid.height,
    grid.gap,
    getMaxColsRows,
    toPixels,
    positions,
    findNearestEmptySlot,
  ])

  return data
}
