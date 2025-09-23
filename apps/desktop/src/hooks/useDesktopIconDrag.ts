/**
 * useDesktopIconDrag
 * 将图标作为拖拽源：
 * - 提供 dragRef 绑定图标节点
 * - 隐藏默认拖拽影像，使用自定义 DragLayer
 * - isDragging 变更为 true 时，回调 onDragStart 以完成“拖拽开始即选中”
 */
import { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { ITEM_TYPE } from '@/types/dnd'

export function useDesktopIconDrag(id: string, onDragStart: () => void) {
	const [{ isDragging }, dragRef, dragPreview] = useDrag(
		() => ({
			type: ITEM_TYPE,
			item: { type: ITEM_TYPE, id } as { type: 'ICON'; id: string },
			collect: (monitor) => ({ isDragging: monitor.isDragging() }),
		}),
		[id],
	)

	useEffect(() => {
		dragPreview(getEmptyImage(), { captureDraggingState: true })
	}, [dragPreview])

	useEffect(() => {
		if (isDragging) onDragStart()
	}, [isDragging, onDragStart])

	return { isDragging, dragRef }
}
