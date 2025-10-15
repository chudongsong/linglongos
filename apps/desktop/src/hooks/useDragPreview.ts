/**
 * useDragPreview
 * 封装 react-dnd 的自定义 DragLayer 数据，返回预览所需的 left/top 与 app 信息。
 */
import { useMemo } from 'react'
import { useDragLayer } from 'react-dnd'
import { ITEM_TYPE, type IconDragItem } from '@/types/dnd'
import type { FullConfig, AppItem } from '@/types/config'

/**
 * 拖拽预览 Hook。
 *
 * 封装自定义 DragLayer 数据，计算未吸附的实时预览 `left/top`，并返回对应应用信息。
 * 适用于仅展示拖拽过程中的影像，而不进行网格吸附。
 *
 * @param config 完整配置（可为空）
 * @returns `null` 或 `{ left, top, app }`
 */
export function useDragPreview(config?: FullConfig | null) {
	const dragLayer = useDragLayer((monitor) => ({
		isDragging: monitor.isDragging(),
		item: monitor.getItem(),
		clientOffset: monitor.getClientOffset(),
		initialClientOffset: monitor.getInitialClientOffset(),
		initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
	}))

	const dragPreviewData = useMemo(() => {
		const item = dragLayer.item as IconDragItem | null
		if (!dragLayer.isDragging || !item || item.type !== ITEM_TYPE) return null
		const client = dragLayer.clientOffset
		const initClient = dragLayer.initialClientOffset
		const initSource = dragLayer.initialSourceClientOffset
		if (!client || !initClient || !initSource) return null
		const left = initSource.x + (client.x - initClient.x)
		const top = initSource.y + (client.y - initClient.y)
		const app: AppItem | undefined = config?.apps.find((a) => a.id === item.id)
		return { left, top, app }
	}, [
		dragLayer.isDragging,
		dragLayer.item,
		dragLayer.clientOffset,
		dragLayer.initialClientOffset,
		dragLayer.initialSourceClientOffset,
		config,
	])

	return dragPreviewData
}
