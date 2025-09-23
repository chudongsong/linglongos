import { useMemo } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '@store/index'
import { focusWindow, toggleMinimize } from '@store/slices/window.slice'

import type { CSSProperties } from 'react'

/**
 * Dock 组件（初版）
 * - 展示当前运行中的窗口（含最小化的）
 * - 点击逻辑：
 *   - 若为最小化窗口：还原并聚焦
 *   - 若为非激活窗口：直接聚焦
 *   - 若为当前激活窗口：切换最小化
 */
export default function Dock() {
	const { windows } = useAppSelector((s) => s.window)
	const dispatch = useAppDispatch()

	/**
	 * 计算需要显示在 Dock 的窗口列表
	 * - 按创建顺序（id 生成时刻近似）或 zIndex 排序均可，选择 zIndex 升序，视觉更符合“最近置顶在右侧”预期
	 */
	const items = useMemo(() => {
		return [...windows].sort((a, b) => a.zIndex - b.zIndex)
	}, [windows])

	/**
	 * 处理 Dock 项点击
	 * @param id 窗口 id
	 * @param isActive 是否为当前激活
	 * @param isMinimized 是否为最小化
	 */
	function handleClick(id: string, isActive: boolean, isMinimized: boolean) {
		if (isMinimized) {
			// 还原并聚焦
			dispatch(toggleMinimize(id))
			dispatch(focusWindow(id))
			return
		}
		if (!isActive) {
			// 直接聚焦
			dispatch(focusWindow(id))
			return
		}
		// 若已激活，则切换为最小化
		dispatch(toggleMinimize(id))
	}

	// Dock 样式：固定底部居中，毛玻璃+圆角
	const dockStyle: CSSProperties = {
		position: 'fixed',
		left: '50%',
		bottom: 16,
		transform: 'translateX(-50%)',
		display: 'flex',
		gap: 12,
		padding: '8px 12px',
		borderRadius: 12,
		background: 'rgba(255,255,255,0.6)',
		backdropFilter: 'saturate(180%) blur(12px)',
		WebkitBackdropFilter: 'saturate(180%) blur(12px)',
		boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
		zIndex: 1200,
		pointerEvents: 'auto',
	}

	const itemStyleBase: CSSProperties = {
		width: 40,
		height: 40,
		borderRadius: 8,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		userSelect: 'none',
		cursor: 'pointer',
		fontSize: 14,
		fontWeight: 700,
		color: '#1f2937',
		background: 'linear-gradient(180deg,#ffffff,#f3f4f6)',
		boxShadow: '0 4px 12px rgba(31,41,55,0.15) inset, 0 6px 12px rgba(0,0,0,0.06)',
	}

	const badgeStyle: CSSProperties = {
		position: 'absolute',
		right: -2,
		bottom: -2,
		width: 10,
		height: 10,
		borderRadius: 999,
		background: '#10b981',
		border: '2px solid rgba(255,255,255,0.9)',
	}

	return (
		<div
			aria-label="dock"
			className="fixed left-1/2 bottom-4 -translate-x-1/2 flex gap-3 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-md backdrop-saturate-150 shadow-lg z-[1200] pointer-events-auto"
			style={dockStyle}
		>
			{items.map((w) => {
				const label = (w.title || 'App').slice(0, 2)
				const style: CSSProperties = {
					...itemStyleBase,
					opacity: w.isMinimized ? 0.6 : 1,
					position: 'relative',
					outline: w.isActive ? '2px solid #3b82f6' : 'none',
				}
				const itemClass = clsx(
					'relative w-10 h-10 rounded-lg flex items-center justify-center select-none cursor-pointer text-sm font-bold text-gray-800',
					{
						'opacity-60': w.isMinimized,
						'ring-2 ring-blue-500': w.isActive,
					},
				)
				return (
					<div
						key={w.id}
						className={itemClass}
						style={style}
						title={w.title}
						onClick={() => handleClick(w.id, w.isActive, w.isMinimized)}
					>
						{label}
						{/* 运行中小圆点 */}
						<span style={badgeStyle} />
					</div>
				)
			})}
		</div>
	)
}
