/**
 * useContainerSize
 * 监听并返回容器尺寸（宽高）。
 * - 提供 ref 绑定容器节点
 * - 自动监听 window resize 与容器初次挂载
 */
import { useEffect, useRef, useState } from 'react'

/**
 * 计算并维护容器尺寸的 Hook。
 *
 * 初始化时会返回一个用于绑定到容器节点的 `ref`，并在窗口尺寸变化或容器挂载时更新宽高。
 *
 * @param initialWidth 初始宽度（SSR 或无 `window` 环境下的回退值）
 * @param initialHeight 初始高度（SSR 或无 `window` 环境下的回退值）
 * @returns `{ containerRef, containerWidth, containerHeight }` 尺寸状态与容器 ref
 */
export function useContainerSize(initialWidth = 0, initialHeight = 0) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [containerWidth, setContainerWidth] = useState<number>(
		typeof window !== 'undefined' ? window.innerWidth : initialWidth,
	)
	const [containerHeight, setContainerHeight] = useState<number>(
		typeof window !== 'undefined' ? window.innerHeight : initialHeight,
	)

	useEffect(() => {
		const update = () => {
			const el = containerRef.current
			const w = el?.clientWidth ?? (typeof window !== 'undefined' ? window.innerWidth : initialWidth)
			const h = el?.clientHeight ?? (typeof window !== 'undefined' ? window.innerHeight : initialHeight)
			setContainerWidth(w)
			setContainerHeight(h)
		}
		update()
		window.addEventListener('resize', update)
		return () => window.removeEventListener('resize', update)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return { containerRef, containerWidth, containerHeight }
}
