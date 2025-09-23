/**
 * useSelection
 * 管理图标选中状态与交互：
 * - 支持单选/多选（cmd/ctrl 切换）
 * - 记录拖拽开始时是否按住追加选择键
 * - 提供点击、按下事件处理器
 */
import { useRef, useState } from 'react'

/**
 * 选择管理 Hook
 * 提供选中集合、控制清空的 ref，以及点击/按下/拖拽开始时的处理函数。
 */
export function useSelection() {
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const suppressNextClickClearRef = useRef<boolean>(false)
	const dragMultiKeyRef = useRef<boolean>(false)

	/**
	 * 图标点击：支持 cmd/ctrl 追加或切换选择
	 */
	function handleIconClick(e: React.MouseEvent, id: string) {
		e.stopPropagation()
		const additive = e.metaKey || e.ctrlKey
		setSelected((prev) => {
			const next = new Set(prev)
			if (additive) {
				if (next.has(id)) next.delete(id)
				else next.add(id)
			} else {
				next.clear()
				next.add(id)
			}
			return next
		})
	}

	/**
	 * 记录图标按下时是否按住多选相关修饰键（用于拖拽开始判定）
	 */
	function handleIconMouseDown(e: React.MouseEvent) {
		dragMultiKeyRef.current = !!(e.metaKey || e.ctrlKey || e.shiftKey)
	}

	/**
	 * 拖拽开始：如未选中则选中，被记录为多选则仅追加
	 */
	function handleDragStartSelect(id: string) {
		setSelected((prev) => {
			if (prev.has(id)) return prev
			const next = new Set(prev)
			if (dragMultiKeyRef.current) {
				next.add(id)
			} else {
				next.clear()
				next.add(id)
			}
			return next
		})
	}

	return {
		selected,
		setSelected,
		suppressNextClickClearRef,
		dragMultiKeyRef,
		handleIconClick,
		handleIconMouseDown,
		handleDragStartSelect,
	}
}
