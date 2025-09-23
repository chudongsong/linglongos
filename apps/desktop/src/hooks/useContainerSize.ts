/**
 * useContainerSize
 * 监听并返回容器尺寸（宽高）。
 * - 提供 ref 绑定容器节点
 * - 自动监听 window resize 与容器初次挂载
 */
import { useEffect, useRef, useState } from 'react'

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
