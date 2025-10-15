/**
 * Desktop 页面：
 * - 渲染桌面容器
 * - 根据配置计算网格尺寸变量，渲染图标位
 * - 实现图标选择、多选（框选）、拖拽并吸附网格
 */
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { fetchConfig } from '@store/slices/desktop.slice'
import { useContainerSize } from '@hooks/useContainerSize'
import { useBackgroundStyle } from '@hooks/useBackgroundStyle'
import { useStyleVars } from '@hooks/useStyleVars'
import { useGridSystem } from '@hooks/useGridSystem'
import { useSelection } from '@hooks/useSelection'
import { useMarqueeSelection } from '@hooks/useMarqueeSelection'
import { useContainerDrop } from '@hooks/useContainerDrop'
import { useSmartDragPreview } from '@hooks/useSmartDragPreview'
import { useAppLauncher } from '@hooks/useAppLauncher'
import { useDesktopIconDrag } from '@hooks/useDesktopIconDrag'
import { loadingManager } from '@services/loadingManager'

import type { CSSProperties } from 'react'
import type { AppItem } from '@/types/config'

export default function Desktop() {
	const dispatch = useAppDispatch()
	const { config, loading, error, grid, iconSize } = useAppSelector((s) => s.desktop)

	/** 初始化配置 */
	useEffect(() => {
		void dispatch(fetchConfig())
	}, [dispatch])

	/** 配置加载完成后：触发遮罩淡出与资源预加载 */
	useEffect(() => {
		if (!loading && config) {
			void loadingManager.finishWithConfig(config)
		}
	}, [loading, config])

	/** 配置加载失败时：也隐藏遮罩，避免界面被遮挡 */
	useEffect(() => {
		if (!loading && error) {
			void loadingManager.finishWithConfig(null)
		}
	}, [loading, error])

	/** 容器尺寸监听 */
	const { containerRef, containerWidth, containerHeight } = useContainerSize()

	/** 背景样式计算 */
	const backgroundStyle = useBackgroundStyle(config)

	/** 网格系统 */
	const gridSystem = useGridSystem({ config, grid, containerWidth, containerHeight })
	const { positions, setPositions, getMaxColsRows, toPixels, iconLayout, findNearestEmptySlot } = gridSystem

	/** 选择交互 */
	const selection = useSelection()
	const {
		selected,
		setSelected,
		suppressNextClickClearRef,
		handleIconClick,
		handleIconMouseDown,
		handleDragStartSelect,
	} = selection

	/** 框选与视觉选中 */
	const marqueeData = useMarqueeSelection({
		grid,
		config,
		positions,
		toPixels,
		selected,
		setSelected,
		suppressNextClickClearRef,
	})
	const { marqueeRect, visualSelected, handleMouseDown, handleMouseMove, handleMouseUp } = marqueeData

	/** 容器 drop 拖拽 */
	const dropRef = useContainerDrop({
		containerRef,
		containerWidth,
		containerHeight,
		grid,
		getMaxColsRows,
		toPixels,
		positions,
		setPositions,
		findNearestEmptySlot,
	})

	/** 智能拖拽预览（带实时吸附与对齐） */
	const smartPreview = useSmartDragPreview({
		config,
		containerRef,
		containerWidth,
		containerHeight,
		grid,
		getMaxColsRows,
		toPixels,
		positions,
		findNearestEmptySlot,
	})

	/** 应用启动器 */
	const { handleIconDoubleClick, handleIconKeyDown } = useAppLauncher(config)

	/** CSS 变量样式 */
	const styleVars = useStyleVars({ config, grid, backgroundStyle })

	if (loading) {
		return null
	}
	if (error) {
		return <div style={{ padding: 20 }}>配置错误：{error}</div>
	}

	return (
		<div
			ref={(node) => {
				containerRef.current = node
				dropRef(node)
			}}
			className={`desktop-container size-${iconSize}`}
			style={styleVars}
			onClick={() => {
				if (suppressNextClickClearRef.current) {
					suppressNextClickClearRef.current = false
					return
				}
				setSelected(new Set())
			}}
			onMouseDown={(e) => handleMouseDown(e, containerRef.current)}
			onMouseMove={(e) => handleMouseMove(e, containerRef.current)}
			onMouseUp={handleMouseUp}
		>
			<div className="desktop-grid">
				{iconLayout.map(({ app, style }: { app: AppItem; style: CSSProperties }) => (
					<div key={app.id} className="grid-item" style={style}>
						<DesktopIcon
							id={app.id}
							name={app.name}
							icon={app.icon}
							selected={visualSelected.has(app.id)}
							onClick={(e) => handleIconClick(e, app.id)}
							onDoubleClick={() => handleIconDoubleClick(app.id)}
							onKeyDown={(e) => handleIconKeyDown(e, app.id)}
							onMouseDown={(e) => handleIconMouseDown(e)}
							onDragStart={() => handleDragStartSelect(app.id)}
						/>
					</div>
				))}
			</div>

			{/* 框选矩形 */}
			{marqueeRect && (
				<div
					className="selection-rectangle"
					style={{
						position: 'absolute',
						left: marqueeRect.left,
						top: marqueeRect.top,
						width: marqueeRect.width,
						height: marqueeRect.height,
						pointerEvents: 'none',
					}}
				/>
			)}

			{/* 新：智能拖拽预览层（自由跟随 + 容器绝对定位），指针事件穿透 */}
			{smartPreview && (
				<div
					className="drag-preview"
					style={{
						position: 'absolute',
						pointerEvents: 'none',
						left: smartPreview.freeLeft,
						top: smartPreview.freeTop,
						zIndex: 9999,
					}}
				>
					<div className="icon-item selected dragging">
						<img src={smartPreview.app?.icon ?? ''} alt={smartPreview.app?.name ?? ''} />
						<span>{smartPreview.app?.name ?? ''}</span>
					</div>
				</div>
			)}
		</div>
	)
}

/**
 * DesktopIcon 子组件
 * - 封装每个桌面图标的拖拽源（useDrag）
 * - 保持点击、双击与键盘可达性
 */
function DesktopIcon(props: {
	id: string
	name: string
	icon: string
	selected: boolean
	onClick: (e: React.MouseEvent) => void
	onDoubleClick: () => void
	onKeyDown: (e: React.KeyboardEvent) => void
	onMouseDown: (e: React.MouseEvent) => void
	onDragStart: () => void
}) {
	const { id, name, icon, selected, onClick, onDoubleClick, onKeyDown, onMouseDown, onDragStart } = props
	const { isDragging, dragRef } = useDesktopIconDrag(id, onDragStart)
	const setDragRef = (node: HTMLDivElement | null) => {
		// 将 react-dnd 的 dragRef 连接到 DOM 节点
		if (node) dragRef(node)
	}

	return (
		<div
			ref={setDragRef}
			className={`icon-item${selected ? ' selected' : ''}${isDragging ? ' dragging' : ''}`}
			role="button"
			tabIndex={0}
			data-id={id}
			onDoubleClick={onDoubleClick}
			onClick={onClick}
			onKeyDown={onKeyDown}
			onMouseDown={onMouseDown}
		>
			<img src={icon} alt={name} />
			<span>{name}</span>
		</div>
	)
}
