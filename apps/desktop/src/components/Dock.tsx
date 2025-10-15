import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '@store/index'
import { focusWindow, openWindow, toggleMinimize } from '@store/slices/window.slice'

import AppCenterOverlay from '@components/AppCenterOverlay'

import { DOCK_APP_TYPE } from '@/types/dnd'

import type { DropTargetMonitor } from 'react-dnd'
import type { AppItem } from '@/types/config'
import type { DockAppDragItem } from '@/types/dnd'
// 新增：全屏应用中心覆盖层

/**
 * Dock 组件（Ubuntu 风格重设计）
 * 特性：
 * - 左侧：应用中心（App Center），以弹出面板展示全部可用应用，可拖拽到右侧快捷栏
 * - 右侧：快捷启动栏（Quick Launch），支持拖拽排序与从应用中心拖入
 * - 点击应用：若已运行则聚焦/还原，否则新开窗口
 * - 持久化：常用应用固定项存储于 localStorage（key: dock.pinned）
 */
export default function Dock() {
	const dispatch = useAppDispatch()
	const { windows } = useAppSelector((s) => s.window)
	const apps = useAppSelector((s) => s.desktop.config?.apps || [])
	// 新增：分类与网格尺寸（用于应用中心覆盖层）
	const categories = useAppSelector((s) => s.desktop.config?.categories || {})
	const grid = useAppSelector((s) => s.desktop.grid)

	// 整洁布局：Dock 快捷栏最大显示数量（超过部分通过“应用中心”访问）
	const MAX_QUICK_LAUNCH = 9

	// 快捷栏固定应用 id 列表
	const [pinned, setPinned] = useState<string[]>([])
	const [showCenter, setShowCenter] = useState(false)
	// 新增：记录“应用中心按钮”的位置用于放大动画起点
	const appCenterBtnRef = useRef<HTMLButtonElement | null>(null)
	const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

	// 初始化：从 localStorage 读取固定应用，若无则取前 6 个应用作为默认
	useEffect(() => {
		try {
			const raw = localStorage.getItem('dock.pinned')
			if (raw) {
				const parsed = JSON.parse(raw) as string[]
				const valid = parsed.filter((id) => apps.some((a) => a.id === id))
				setPinned(valid)
				return
			}
			setPinned(apps.slice(0, 6).map((a) => a.id))
		} catch {
			setPinned(apps.slice(0, 6).map((a) => a.id))
		}
		// 仅在 apps 初次可用时运行一次
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apps.length])

	// 持久化 pinned
	useEffect(() => {
		try {
			localStorage.setItem('dock.pinned', JSON.stringify(pinned))
		} catch {
			// 持久化过程中可能因隐私设置或存储空间导致失败，忽略即可
			void 0
		}
	}, [pinned])

	// 同步：当应用列表发生变化时，自动对齐 pinned（去除失效并补齐到最大显示数）
	useEffect(() => {
		const appIds = apps.map((a) => a.id)
		if (appIds.length === 0) return
		setPinned((prev) => {
			const filtered = prev.filter((id) => appIds.includes(id))
			const need = Math.max(0, Math.min(MAX_QUICK_LAUNCH, appIds.length) - filtered.length)
			const extras = need > 0 ? appIds.filter((id) => !filtered.includes(id)).slice(0, need) : []
			const next = extras.length > 0 || filtered.length !== prev.length ? [...filtered, ...extras] : prev
			const changed = next.length !== prev.length || next.some((id, i) => id !== prev[i])
			return changed ? next : prev
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apps])

	// 当前运行中的 appId 集合（用于显示指示点）
	const runningSet = useMemo(() => new Set(windows.map((w) => w.appId)), [windows])

	// 根据 id 获取 AppItem（使用 useCallback 稳定引用，避免影响下游依赖）
	const findApp = useCallback((id: string) => apps.find((a) => a.id === id), [apps])

	/**
	 * 打开或聚焦应用窗口
	 * - 若有该应用的窗口存在：优先选择 zIndex 最大者；若最小化则先还原，再聚焦
	 * - 否则：按应用配置创建新窗口
	 */
	const openOrFocusApp = useCallback(
		(appId: string) => {
			const app = findApp(appId)
			if (!app) return
			const owned = windows.filter((w) => w.appId === appId)
			if (owned.length > 0) {
				// 使用显式遍历，避免 reduce 在严格索引检查下的可能 undefined
				let topWin = owned[0]!
				for (let i = 1; i < owned.length; i++) {
					const cur = owned[i]!
					if (cur.zIndex > topWin.zIndex) topWin = cur
				}
				if (topWin.isMinimized) dispatch(toggleMinimize(topWin.id))
				dispatch(focusWindow(topWin.id))
				return
			}
			dispatch(openWindow({ app }))
		},
		[findApp, windows, dispatch],
	)

	/**
	 * 将应用添加到 pinned 指定位置（用于从应用中心拖入）
	 */
	const addPinnedAt = useCallback((appId: string, index: number) => {
		setPinned((list) => {
			if (list.includes(appId)) return list
			const next = list.slice()
			const clamped = Math.min(Math.max(index, 0), next.length)
			next.splice(clamped, 0, appId)
			return next
		})
	}, [])

	/**
	 * 交换 pinned 的两个索引位置
	 */
	const movePinned = useCallback((from: number, to: number) => {
		setPinned((list) => {
			const next = list.slice()
			// 边界检查，避免越界导致的 undefined
			if (from < 0 || from >= next.length) return list
			const removed = next.splice(from, 1)
			if (removed.length === 0) return list
			const item = removed[0]!
			const clampedTo = Math.min(Math.max(to, 0), next.length)
			next.splice(clampedTo, 0, item)
			return next
		})
	}, [])

	// Dock 外观（Ubuntu 风格：深色半透明、圆角、浮动阴影）
	const dockStyle: CSSProperties = {
		position: 'fixed',
		left: '50%',
		bottom: 16,
		transform: 'translateX(-50%)',
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		padding: '10px 14px',
		borderRadius: 16,
		background: 'rgba(28,28,30,0.6)',
		backdropFilter: 'saturate(140%) blur(14px)',
		WebkitBackdropFilter: 'saturate(140%) blur(14px)',
		boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
		zIndex: 1200,
	}

	// 新增：切换应用中心并捕获按钮位置
	const toggleAppCenter = useCallback(() => {
		// 打开时捕获按钮几何信息作为动画起点
		if (!showCenter) {
			const el = appCenterBtnRef.current
			if (el) {
				const r = el.getBoundingClientRect()
				setAnchorRect({ x: r.x, y: r.y, width: r.width, height: r.height })
			}
		}
		setShowCenter((v) => !v)
	}, [showCenter])

	/**
	 * 关闭应用中心（稳定回调，避免在 JSX 中创建内联函数）
	 */
	const handleCloseCenter = useCallback(() => {
		setShowCenter(false)
	}, [])

	return (
		<div aria-label="dock" style={dockStyle} className="pointer-events-auto select-none">
			{/* 左：应用中心按钮 */}
			<AppCenterButton active={showCenter} onClick={toggleAppCenter} buttonRef={appCenterBtnRef} />
			<Divider />

			{/* 右：快捷启动栏 */}
			<QuickLaunch
				apps={apps}
				pinnedIds={pinned.slice(0, MAX_QUICK_LAUNCH)}
				runningSet={runningSet}
				onOpen={openOrFocusApp}
				movePinned={movePinned}
				addPinnedAt={addPinnedAt}
			/>

			{/* 超出数量提示：保持 Dock 整洁，点击打开应用中心 */}
			{pinned.length > MAX_QUICK_LAUNCH && (
				<HiddenCountBadge count={pinned.length - MAX_QUICK_LAUNCH} onClick={toggleAppCenter} />
			)}

			{/* 新：全屏应用中心覆盖层（常驻渲染以支持入场/退场动画） */}
			{/** 仅在 anchorRect 存在时传递，避免传入 undefined 触发 exactOptionalPropertyTypes */}
			<AppCenterOverlay
				open={showCenter}
				apps={apps}
				categories={categories}
				grid={grid}
				onOpen={openOrFocusApp}
				onClose={handleCloseCenter}
				addPinnedAt={addPinnedAt}
				{...(anchorRect ? { anchorRect } : {})}
			/>
		</div>
	)
}

/**
 * AppCenterButton：九宫格按钮（Ubuntu 风格）
 */
function AppCenterButton(props: {
    active: boolean
    onClick: () => void
    buttonRef?: React.RefObject<HTMLButtonElement | null>
}) {
    const { active, onClick, buttonRef } = props
    return (
        <button
            ref={buttonRef}
            title="应用中心"
            onClick={onClick}
            aria-pressed={active}
            className={clsx(
                'grid place-items-center w-10 h-10 border-none cursor-pointer rounded-xl transition-colors',
                'bg-white/10',
                active && 'bg-white/20 ring-1 ring-white/30',
            )}
        >
            {/* 内联 3x3 圆点图标（SVG），无外部资源依赖 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/90">
                {[4, 12, 20].map((x) => [4, 12, 20].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />))}
            </svg>
        </button>
    )
}

/** 分隔线 */
function Divider() {
	return <div className="w-px h-8 bg-white/15 mx-1" />
}

/**
 * HiddenCountBadge：更多数量提示徽标
 * - 显示 "+N"，点击后打开应用中心以访问全部应用
 */
function HiddenCountBadge(props: { count: number; onClick: () => void }) {
  const { count, onClick } = props
  return (
    <button
      onClick={onClick}
      title={`还有 ${count} 个应用`}
      className={clsx(
        'px-2 h-6 rounded-full text-xs font-medium text-white/90 bg-white/10 hover:bg-white/15 border-none',
        'transition-colors',
      )}
      aria-label={`更多应用（${count}）`}
    >
      +{count}
    </button>
  )
}

/**
 * QuickLaunch：快捷启动栏
 * - 支持拖拽排序
 * - 支持从应用中心拖入固定
 */
function QuickLaunch(props: {
	apps: AppItem[]
	pinnedIds: string[]
	runningSet: Set<string>
	onOpen: (id: string) => void
	movePinned: (from: number, to: number) => void
	addPinnedAt: (id: string, index: number) => void
}) {
	const { apps, pinnedIds, runningSet, onOpen, movePinned, addPinnedAt } = props

	// 容器级别 drop：当从应用中心拖到空白处时，追加到末尾
	const [, drop] = useDrop(
		() => ({
			accept: DOCK_APP_TYPE,
			drop: (item: DockAppDragItem) => {
				if (item.source === 'CENTER') addPinnedAt(item.id, pinnedIds.length)
			},
		}),
		[pinnedIds.length, addPinnedAt],
	)
	// 使用回调 ref 包装 drop connector，避免类型不匹配
	const setContainerRef = (node: HTMLDivElement | null) => {
		if (node) drop(node)
	}

	return (
		<div ref={setContainerRef} className="flex items-center gap-2">
			{pinnedIds.map((id, index) => {
				const app = apps.find((a) => a.id === id)
				if (!app) return null
				return (
					<QuickLaunchItem
						key={id}
						app={app}
						index={index}
						running={runningSet.has(id)}
						onOpen={onOpen}
						movePinned={movePinned}
						addPinnedAt={addPinnedAt}
					/>
				)
			})}
		</div>
	)
}

/**
 * QuickLaunchItem：快捷栏单项（拖拽源 + 放置目标）
 */
function QuickLaunchItem(props: {
	app: AppItem
	index: number
	running: boolean
	onOpen: (id: string) => void
	movePinned: (from: number, to: number) => void
	addPinnedAt: (id: string, index: number) => void
}) {
	const { app, index, running, onOpen, movePinned, addPinnedAt } = props

	/**
	 * 处理图标双击打开（稳定回调，避免在 JSX 中创建内联函数）
	 */
	const handleOpen = useCallback(() => {
		onOpen(app.id)
	}, [onOpen, app.id])

	// 拖拽源：来自快捷栏
	const [{ isDragging }, drag] = useDrag(
		() => ({
			type: DOCK_APP_TYPE,
			item: { type: 'DOCK_APP', id: app.id, source: 'SHORTCUT', index },
			collect: (m) => ({ isDragging: m.isDragging() }),
		}),
		[app.id, index],
	)

	// 放置目标：
	const [, drop] = useDrop(
		() => ({
			accept: DOCK_APP_TYPE,
			hover: (item: DockAppDragItem, monitor: DropTargetMonitor<DockAppDragItem, unknown>) => {
				if (!monitor.isOver({ shallow: true })) return
				if (item.source === 'SHORTCUT' && typeof item.index === 'number' && item.index !== index) {
					movePinned(item.index, index)
					item.index = index
				}
			},
			drop: (item: DockAppDragItem) => {
				if (item.source === 'CENTER') addPinnedAt(item.id, index)
			},
		}),
		[index, movePinned, addPinnedAt],
	)

	// 同时绑定 drag 与 drop 能力
	const setRef = (node: HTMLDivElement | null) => {
		if (!node) return
		drag(drop(node))
	}

	return (
		<div
			ref={setRef}
			title={app.name}
			className={clsx(
				'group relative w-12 h-12 grid place-items-center rounded-xl text-white/90 hover:bg-white/10 transition-colors',
				isDragging && 'opacity-50',
			)}
			onDoubleClick={handleOpen}
		>
			{/* 图标 */}
			{app.icon ? (
				<img src={app.icon} alt={app.name} className="w-7 h-7 object-contain" />
			) : (
				<div className="w-7 h-7 rounded-xl bg-gradient-to-b from-white/90 to-white/70 text-gray-800 grid place-items-center text-sm font-semibold">
					{app.name.slice(0, 1)}
				</div>
			)}
			{/* 运行指示点 */}
			{running && (
				<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
			)}
		</div>
	)
}
