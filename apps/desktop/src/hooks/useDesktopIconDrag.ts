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

/**
 * 桌面图标拖拽源 Hook。
 *
 * 绑定图标为拖拽源，隐藏默认影像，使用自定义 DragLayer；当 `isDragging` 变为 `true` 时回调 `onDragStart`。
 *
 * @param id 图标（应用）唯一标识
 * @param onDragStart 拖拽开始回调（用于“拖拽开始即选中”）
 * @returns `{ isDragging, dragRef }`
 */
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

	// 当拖拽过程中鼠标离开网页/窗口失焦时，主动派发 mouseup 以结束 react-dnd 拖拽，避免重新进入时影像继续跟随
	useEffect(() => {
		if (!isDragging) return
		const endDrag = () => {
			if (typeof window !== 'undefined' && typeof document !== 'undefined') {
				const ev = new MouseEvent('mouseup', { bubbles: true, view: window })
				document.dispatchEvent(ev)
			}
		}
		const onLeaveDocument = () => endDrag()
		const onWindowMouseOut = (ev: MouseEvent) => {
			const to = ev.relatedTarget as Node | null
			if (!to) endDrag()
		}
		const onWindowBlur = () => endDrag()
		document.addEventListener('mouseleave', onLeaveDocument)
		window.addEventListener('mouseout', onWindowMouseOut)
		window.addEventListener('blur', onWindowBlur)
		return () => {
			document.removeEventListener('mouseleave', onLeaveDocument)
			window.removeEventListener('mouseout', onWindowMouseOut)
			window.removeEventListener('blur', onWindowBlur)
		}
	}, [isDragging])

	return { isDragging, dragRef }
}
