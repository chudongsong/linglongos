/**
 * AppCenterOverlay 组件
 * 全屏半透明的应用中心覆盖层，支持搜索与分类筛选，网格展示应用，左右滑动或按钮切页。
 * 交互：
 * - 打开/关闭：由父级状态控制；组件内部提供淡入淡出动画（<=300ms）
 * - 点击背景关闭：点击内容区域外部（半透明背景）可关闭
 * - 拖拽：应用图标支持作为拖拽源，拖入 Dock 快捷栏以固定
 * - 搜索与分类联动：输入关键字或选择分类时，展示区域实时更新
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useDrag } from 'react-dnd'
import { DOCK_APP_TYPE } from '@/types/dnd'
import type { AppItem, CategoryMap, GridSize } from '@/types/config'
import type { LucideIcon } from 'lucide-react'
import {
	Search,
	X,
	ChevronLeft,
	ChevronRight,
	AppWindow,
	Cog,
	Globe,
	Image as ImageIcon,
	Music,
	FileText,
	Terminal,
} from 'lucide-react'

export interface AppCenterOverlayProps {
	open: boolean
	apps: AppItem[]
	categories: CategoryMap
	grid: GridSize
	onOpen: (id: string) => void
	onClose: () => void
	addPinnedAt: (id: string, index: number) => void
	/**
	 * 动画起点矩形（相对于视口），通常为 Dock 九宫格按钮的几何信息。
	 * 若未提供，则退化为轻微 scale 动画。
	 */
	anchorRect?: { x: number; y: number; width: number; height: number }
}

/**
 * AppCenterOverlay 主组件
 * 负责：布局与分页、搜索与分类筛选、打开/关闭动画、左右滑动切换。
 */
export default function AppCenterOverlay(props: AppCenterOverlayProps) {
	const { open, apps, categories, grid, onOpen, onClose, anchorRect } = props

	// 搜索与分类筛选状态
	const [query, setQuery] = useState('')
	const [categoryKey, setCategoryKey] = useState<string>('')
	const [page, setPage] = useState(0)

	// 视口尺寸：用于计算内容区域与网格容量
	const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: window.innerWidth, h: window.innerHeight })
	useEffect(() => {
		const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])

	// 过滤后的应用列表
	const filtered = useMemo(() => {
		let list = apps
		if (categoryKey) list = list.filter((a) => a.category === categoryKey)
		if (query.trim()) {
			const q = query.trim().toLowerCase()
			list = list.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
		}
		return list
	}, [apps, query, categoryKey])

	// 内容区域为视口的 70%，周边留白 30%
	const CONTENT_RATIO = 0.8
	const contentW = Math.max(700, Math.floor(viewport.w * (CONTENT_RATIO / 2)))
	const contentH = Math.floor(viewport.h * CONTENT_RATIO)
	const contentLeft = Math.floor((viewport.w - contentW) / 2)
	const contentTop = Math.floor((viewport.h - contentH) / 2)

	// 根据图标尺寸（使用网格尺寸）自动计算每页显示数量
	// 图标尺寸与桌面图标保持一致
	const unitW = grid.width // 使用桌面图标的原始宽度
	const unitH = grid.height // 使用桌面图标的原始高度
	const gap = Math.max(grid.gap * 1.5, 12) // 适当增加间距，最小12px
	const cols = Math.max(1, Math.floor((contentW - gap) / (unitW + gap))) // 计算每页列数，确保不小于 1
	const rows = Math.max(1, Math.floor((contentH - 120 - gap) / (unitH + gap))) // 额外预留顶部控件区域 120
	const capacity = Math.max(1, cols * rows)

	// 分页数据
	const pageCount = Math.max(1, Math.ceil(filtered.length / capacity))
	const clampedPage = Math.min(page, pageCount - 1)
	useEffect(() => {
		if (page !== clampedPage) setPage(clampedPage)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageCount])
	const pageItems = filtered.slice(clampedPage * capacity, clampedPage * capacity + capacity)

	// 打开/关闭过渡动画控制
	const [mounted, setMounted] = useState(open)
	const [animOpen, setAnimOpen] = useState(open)
	const closeFallbackTimerRef = useRef<number | null>(null)
	useEffect(() => {
		if (open) {
			if (closeFallbackTimerRef.current) {
				clearTimeout(closeFallbackTimerRef.current)
				closeFallbackTimerRef.current = null
			}
			setMounted(true)
			setAnimOpen(false)
			const id = requestAnimationFrame(() => setAnimOpen(true))
			return () => cancelAnimationFrame(id)
		} else {
			setAnimOpen(false)
			// 关闭时由 transitionend 决定卸载，增加兜底超时，避免极端情况下事件丢失
			if (closeFallbackTimerRef.current) clearTimeout(closeFallbackTimerRef.current)
			closeFallbackTimerRef.current = window.setTimeout(() => setMounted(false), 360)
			return () => {
				if (closeFallbackTimerRef.current) {
					clearTimeout(closeFallbackTimerRef.current)
					closeFallbackTimerRef.current = null
				}
			}
		}
	}, [open])

	// 计算关闭中状态（mounted 仍为 true 且 open 为 false）
	const isClosing = mounted && !open

	/**
	 * 计算从 anchorRect 缩放/平移到目标内容区域的变换值。
	 * 当 animOpen=false 时，返回起点变换；当 animOpen=true 时，返回单位变换。
	 * 末尾追加 translateZ(0) 以提升合成层稳定性。
	 */
	function getZoomTransform(): string {
		if (!anchorRect)
			return (animOpen ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,0,0) scale(0.96)') + ' translateZ(0)'
		const sx = anchorRect.width / contentW
		const sy = anchorRect.height / contentH
		const tx = anchorRect.x - contentLeft
		const ty = anchorRect.y - contentTop
		return (
			(animOpen ? 'translate3d(0,0,0) scale(1)' : `translate3d(${tx}px, ${ty}px, 0) scale(${sx}, ${sy})`) +
			' translateZ(0)'
		)
	}

	// 背景点击关闭（仅点击在覆盖层根节点上时触发）
	const onBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose()
	}

	// 触摸滑动切页
	const touchRef = useRef<{ x: number; y: number } | null>(null)
	const onTouchStart = (e: React.TouchEvent) => {
		const t = e.touches && e.touches.length > 0 ? e.touches[0] : undefined
		if (!t) return
		touchRef.current = { x: t.clientX, y: t.clientY }
	}
	const onTouchMove = (e: React.TouchEvent) => {
		// 阻止页面滚动，提升滑动体验
		e.preventDefault()
	}
	const onTouchEnd = (e: React.TouchEvent) => {
		const start = touchRef.current
		if (!start) return
		const t = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : undefined
		if (!t) return
		const dx = t.clientX - start.x
		const dy = t.clientY - start.y
		// 主要检测水平滑动，阈值 60 像素且水平位移显著大于垂直
		if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) setPage((p) => Math.min(p + 1, pageCount - 1))
			else setPage((p) => Math.max(p - 1, 0))
		}
		touchRef.current = null
	}

	// 修复 Hooks 调用顺序：将 useRef 放在任何条件 return 之前
	// 动画框引用：用于过渡动画和事件处理
	const frameRef = useRef<HTMLDivElement | null>(null)

	// 若未挂载则直接不渲染（注意：所有 Hooks 已在上方声明）
	if (!mounted) return null

	// 动态调整遮罩的滤镜强度以降低关闭时的 GPU 压力
	const overlayBlur = isClosing ? 4 : 8
	const overlaySat = isClosing ? 120 : 140

	// 根覆盖层样式与类（半透明背景 + 过渡动画）
	const overlayStyle: CSSProperties = {
		position: 'fixed',
		inset: 0,
		background: 'rgba(28,28,30,0.6)', // 60% 透明度
		backdropFilter: `saturate(${overlaySat}%) blur(${overlayBlur}px)`,
		WebkitBackdropFilter: `saturate(${overlaySat}%) blur(${overlayBlur}px)`,
		zIndex: 12000,
		willChange: 'opacity',
		pointerEvents: animOpen ? 'auto' : 'none', // 关闭过渡中禁用事件，减少主线程负担
	}
	const overlayClass = clsx(
		'app-center-overlay',
		'pointer-events-auto',
		'transition-opacity duration-200 ease-out',
		animOpen ? 'opacity-100' : 'opacity-0',
	)

	// 动画框：固定定位于最终位置尺寸，通过 transform 在开/关之间过渡
	const frameStyle: CSSProperties = {
		position: 'fixed',
		left: contentLeft,
		top: contentTop,
		width: contentW,
		height: contentH,
		transform: getZoomTransform(),
		transformOrigin: 'top left',
		transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)', // 近似 easeOutCubic，顺滑自然
		willChange: 'transform',
		contain: 'layout paint size', // 隔离布局/绘制，避免外部重排影响
		backfaceVisibility: 'hidden',
		transformStyle: 'preserve-3d',
	}

	// 内容容器（圆角扁平化风格）
	const contentClass = clsx('text-white', 'flex flex-col items-center justify-center')
	const contentInnerStyle: CSSProperties = { width: '100%', height: '100%', padding: 16 }

	const overlayNode = (
		<div
			className={overlayClass}
			style={overlayStyle}
			onMouseDown={onBackgroundClick}
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
		>
			{/* 固定在最终位置的动画框，使用 transform 从按钮缩放至全屏内容 */}
			<div
				ref={frameRef}
				style={frameStyle}
				onMouseDown={(e) => e.stopPropagation()}
				onTransitionEnd={(e) => {
					if (e.propertyName === 'transform' && !open) {
						setMounted(false)
					}
				}}
			>
				<div className={contentClass} style={contentInnerStyle}>
					{/* 顶部：搜索与操作 */}
					<div className="relative flex-1 group w-full mb-[1rem] ">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 transition-colors"
							aria-hidden="true"
						/>
						<input
							type="search"
							aria-label="搜索应用"
							enterKeyHint="search"
							value={query}
							onChange={(e) => {
								setQuery(e.target.value)
								setPage(0)
							}}
							placeholder="搜索应用..."
							className="flex-1 h-10 w-full pl-10 pr-10 rounded-2xl border-none bg-white/10 text-white outline-none transition-colors hover:bg-black/15"
						/>
						{query && (
							<button
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-transparent hover:bg-white/10 transition-colors"
								onClick={() => setQuery('')}
								aria-label="清除搜索"
							>
								<X className="w-4 h-4 text-white/70" />
							</button>
						)}
					</div>
					<div className="flex items-center justify-center w-full gap-6 mb-4 overflow-x-auto p-1">
						<Chip
							active={!categoryKey}
							color="#ffffff"
							icon={AppWindow}
							onClick={() => {
								// 点击“全部”始终回到未选择分类状态
								setCategoryKey('')
								setPage(0)
							}}
						>
							全部
						</Chip>
						{Object.entries(categories).map(([key, info]) => (
							<Chip
								key={key}
								active={categoryKey === key}
								color={info?.color}
								icon={getCategoryIcon(key)}
								onClick={() => {
									// 点击已选中的分类再次取消选中（toggle），否则选中该分类
									setCategoryKey(categoryKey === key ? '' : key)
									setPage(0)
								}}
							>
								{info?.name || key}
							</Chip>
						))}
					</div>

					{/* 应用网格展示区域 */}
					<div className="relative p-[2rem] bg-white/5 w-full rounded-2xl" style={{ height: contentH - 120 }}>
						<div
							className="grid"
							style={{
								gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
								gap,
							}}
						>
							{pageItems.map((app, _i) => (
								<AppTile
									key={app.id}
									app={app}
									unitW={unitW}
									unitH={unitH}
									onOpen={() => {
										onOpen(app.id)
										onClose()
									}}
								/>
							))}
						</div>

						{/* 分页与左右切换 */}
						{pageCount > 1 && (
							<>
								<button
									className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/15"
									onClick={() => setPage((p) => Math.max(p - 1, 0))}
									title="上一页"
								>
									<ChevronLeft className="w-5 h-5 text-white" />
								</button>
								<button
									className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/15"
									onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
									title="下一页"
								>
									<ChevronRight className="w-5 h-5 text-white" />
								</button>
								<div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1">
									{Array.from({ length: pageCount }).map((_, i) => (
										<button
											key={i}
											className={clsx(
												'w-2 h-2 rounded-full',
												i === clampedPage ? 'bg-white' : 'bg-white/40 hover:bg-white/60',
											)}
											onClick={() => setPage(i)}
											aria-label={`跳转到第 ${i + 1} 页`}
										/>
									))}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	)
	return createPortal(overlayNode, document.body)
}

/**
 * Chip 子组件：分类筛选项（带颜色强调 + SVG 图标）
 *
 * 变更：默认显示“图标（优先 SVG 图标，其次首字符徽标）”，在鼠标移入或键盘聚焦时平滑显示原始文字内容。
 * - 可访问性：通过 aria-label 与 title 暴露原始文本；focus-visible 时也显示文字；aria-selected 表示选中态
 * - 交互保持：点击行为与 active 态样式保持不变；支持点击已选中的分类再次取消选中
 */
/**
 * Chip 组件 - 分类筛选按钮
 * 优化选中效果，采用背景色高亮显示以增强视觉区分度
 */
function Chip(props: {
	active?: boolean
	color?: string | undefined
	icon?: LucideIcon
	onClick?: () => void
	children: React.ReactNode
}) {
	const { active, color, icon, onClick, children } = props
	// 提取文本用于生成首字符徽标与可访问性标签
	const labelText = typeof children === 'string' ? children : ''
	const mono = labelText ? labelText.trim().slice(0, 1) : ''
	const IconComp = icon

	// 优化选中状态的背景色配置
	const getActiveStyles = () => {
		if (!active) return {}

		// 如果有自定义颜色，使用该颜色作为背景
		if (color) {
			return {
				backgroundColor: `${color}33`, // 20% 透明度
			}
		}

		// 默认使用白色高亮
		return {
			backgroundColor: 'rgba(255, 255, 255, 0.25)',
		}
	}

	return (
		<button
			className={clsx(
				'app-chip',
				'px-3 h-6 rounded-sm text-sm border-none transition-all duration-200 inline-flex items-center gap-2',
				active
					? 'text-white font-medium'
					: 'bg-white/10 text-white/80 hover:bg-white/15 border-transparent hover:text-white/90',
			)}
			style={getActiveStyles()}
			onClick={onClick}
			aria-label={labelText || undefined}
			title={labelText || undefined}
			aria-selected={!!active}
		>
			<span
				className={clsx(
					'chip-icon',
					IconComp ? 'bg-transparent' : active ? 'bg-white/20' : 'bg-gradient-to-b from-white/90 to-white/70',
					'w-6 h-6 rounded-md grid place-items-center text-xs font-semibold shrink-0 transition-all duration-200',
					active ? 'text-white' : 'text-gray-800',
				)}
				aria-hidden="true"
			>
				{IconComp ? (
					<IconComp
						className="w-4 h-4 transition-colors duration-200"
						style={{ color: active ? '#ffffff' : color || '#ffffff' }}
					/>
				) : (
					mono || '•'
				)}
			</span>
			<span className="chip-label select-none transition-colors duration-200">{children}</span>
		</button>
	)
}

/**
 * AppTile 子组件：应用图标项（拖拽源 + 双击打开 + 选中高亮）
 */
function AppTile(props: { app: AppItem; unitW: number; unitH: number; onOpen: () => void }) {
	const { app, unitW, unitH, onOpen } = props
	const [{ isDragging }, dragRef] = useDrag(
		() => ({
			type: DOCK_APP_TYPE,
			item: { type: 'DOCK_APP', id: app.id, source: 'CENTER' },
			collect: (m) => ({ isDragging: m.isDragging() }),
		}),
		[app.id],
	)
	const setDragRef = (node: HTMLDivElement | null) => {
		if (node) dragRef(node)
	}

	/**
	 * 计算图标尺寸：与桌面图标保持一致的尺寸
	 * 根据桌面配置，small: 40px, medium: 64px, large: 80px
	 * 这里使用容器高度的合适比例来匹配桌面图标尺寸
	 */
	const iconSize = Math.min(Math.max(unitH * 0.53, 40), 80) // 调整比例以匹配桌面图标尺寸

	return (
		<div
			ref={setDragRef}
			className={clsx(
				'flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 hover:bg-white/5 hover:scale-105',
				'min-h-0 min-w-0', // 确保flex子项可以收缩
				isDragging && 'opacity-60 scale-95',
			)}
			onDoubleClick={onOpen}
			role="gridcell"
			title={app.name}
			style={{
				width: unitW,
				height: unitH,
				// 确保容器内容完美居中
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{/* 图标容器：使用flex确保图标完美居中 */}
			<div
				className="flex items-center justify-center flex-shrink-0"
				style={{
					width: iconSize,
					height: iconSize,
					minWidth: iconSize,
					minHeight: iconSize,
				}}
			>
				{app.icon ? (
					<img
						src={app.icon}
						alt={app.name}
						className="w-full h-full object-contain transition-transform duration-200"
						style={{ maxWidth: '100%', maxHeight: '100%' }}
					/>
				) : (
					<div
						className="w-full h-full rounded-xl bg-gradient-to-b from-white/90 to-white/70 text-gray-800 flex items-center justify-center font-semibold transition-transform duration-200"
						style={{ fontSize: `${iconSize * 0.3}px` }} // 字体大小为图标尺寸的30%
					>
						{app.name.slice(0, 1)}
					</div>
				)}
			</div>

			{/* 应用名称：自适应字体大小和容器宽度 */}
			<div
				className="text-white/80 text-center leading-tight flex-shrink-0 transition-all duration-200"
				style={{
					fontSize: `${Math.min(Math.max(unitW * 0.08, 10), 14)}px`, // 字体大小基于容器宽度自适应
					maxWidth: '100%',
					wordBreak: 'break-word',
					overflow: 'hidden',
					display: '-webkit-box',
					WebkitLineClamp: 2, // 最多显示2行
					WebkitBoxOrient: 'vertical',
					lineHeight: 1.2,
				}}
			>
				{app.name}
			</div>
		</div>
	)
}

/**
 * getCategoryIcon - 根据分类键返回 SVG 图标（lucide-react）
 *
 * @param key 分类键（string）
 * @returns LucideIcon 图标组件
 */
function getCategoryIcon(key: string): LucideIcon {
	const k = key.toLowerCase()
	if (k.includes('system') || k === 'system') return Cog
	if (k.includes('network') || k === 'network' || k.includes('web')) return Globe
	if (k.includes('image') || k.includes('photo') || k === 'image') return ImageIcon
	if (k.includes('music') || k.includes('audio') || k === 'media') return Music
	if (k.includes('doc') || k.includes('text') || k === 'document') return FileText
	if (k.includes('term') || k === 'terminal' || k === 'shell') return Terminal
	return AppWindow
}
