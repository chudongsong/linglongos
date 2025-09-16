<template>
	<GridContainer
		ref="containerRef"
		:show-grid-lines="showGridLines"
		:show-debug-info="showDebugInfo"
		:responsive="responsive"
		@resize="handleContainerResize"
		@contextmenu="handleContextMenu"
	>
		<template #default="{ gridConfig, containerDimensions }">
			<!-- 网格项目渲染 -->
			<GridItem
				v-for="item in visibleGridItems"
				:key="item.id"
				:item="item"
				:grid-config="gridConfig"
				:is-selected="selectedItems.has(item.id)"
				:is-dragging="dragState.isDragging && dragState.dragItem?.id === item.id"
				:style="getItemStyle(item, gridConfig)"
				@click="handleItemClick(item, $event)"
				@double-click="handleItemDoubleClick(item, $event)"
				@context-menu="handleItemContextMenu(item, $event)"
				@drag-start="handleDragStart(item, $event)"
				@drag-end="handleDragEnd(item, $event)"
			/>

			<!-- 拖拽预览位置指示器 -->
			<div
				v-if="dragState.isDragging && dragState.dropTarget"
				class="drop-target-indicator"
				:style="getDropTargetStyle(dragState.dropTarget, gridConfig)"
			/>

			<!-- 空位置指示器（在显示网格线时） -->
			<div
				v-if="showGridLines"
				v-for="position in availablePositions.slice(0, 20)"
				:key="`empty-${position.x}-${position.y}`"
				class="empty-position-indicator"
				:style="getEmptyPositionStyle(position, gridConfig)"
			/>
		</template>
	</GridContainer>

	<!-- 右键菜单 -->
	<ContextMenu
		v-if="contextMenu.visible"
		:x="contextMenu.x"
		:y="contextMenu.y"
		:items="contextMenuItems"
		@select="handleContextMenuSelect"
		@close="closeContextMenu"
	/>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
	import { useGridStore } from '@/stores/grid'
	import { configManager } from '@/utils/config-manager'
	import GridContainer from './GridContainer.vue'
	import GridItem from './GridItem.vue'
	import ContextMenu from './ContextMenu.vue'
	import type { GridItem as GridItemType, GridConfig, GridPosition, DesktopApp } from '@/types/grid'

	/**
	 * 网格系统核心组件
	 * @description 网格逻辑的核心实现，负责网格计算和状态管理
	 */

	// Props
	interface Props {
		/** 是否显示网格线 */
		showGridLines?: boolean
		/** 是否显示调试信息 */
		showDebugInfo?: boolean
		/** 是否启用响应式调整 */
		responsive?: boolean
		/** 是否启用多选 */
		enableMultiSelect?: boolean
		/** 是否启用拖拽 */
		enableDrag?: boolean
		/** 自动保存间隔（毫秒） */
		autoSaveInterval?: number
	}

	const props = withDefaults(defineProps<Props>(), {
		showGridLines: false,
		showDebugInfo: false,
		responsive: true,
		enableMultiSelect: true,
		enableDrag: true,
		autoSaveInterval: 5000,
	})

	// Emits
	interface Emits {
		(e: 'item-click', item: GridItemType, event: MouseEvent): void
		(e: 'item-double-click', item: GridItemType, event: MouseEvent): void
		(e: 'item-moved', item: GridItemType, oldPosition: GridPosition, newPosition: GridPosition): void
		(e: 'selection-changed', selectedItems: Set<string>): void
		(e: 'grid-context-menu', position: GridPosition, event: MouseEvent): void
	}

	const emit = defineEmits<Emits>()

	// Store
	const gridStore = useGridStore()

	// Refs
	const containerRef = ref<InstanceType<typeof GridContainer>>()

	// Reactive data
	const contextMenu = ref({
		visible: false,
		x: 0,
		y: 0,
		targetItem: null as GridItemType | null,
		targetPosition: null as GridPosition | null,
	})

	const mousePosition = ref({ x: 0, y: 0 })

	// 计算属性
	const visibleGridItems = computed(() => gridStore.visibleGridItems)
	const selectedItems = computed(() => gridStore.selectedItems)
	const dragState = computed(() => gridStore.dragState)
	const availablePositions = computed(() => gridStore.availablePositions)

	/**
	 * 右键菜单项
	 */
	const contextMenuItems = computed(() => {
		const items = []

		if (contextMenu.value.targetItem) {
			// 项目右键菜单
			items.push(
				{ id: 'open', label: '打开', icon: 'external-link' },
				{ type: 'separator' },
				{ id: 'cut', label: '剪切', icon: 'scissors' },
				{ id: 'copy', label: '复制', icon: 'copy' },
				{ type: 'separator' },
			)

			if (!contextMenu.value.targetItem.general.locked) {
				items.push({ id: 'lock', label: '锁定位置', icon: 'lock' })
			} else {
				items.push({ id: 'unlock', label: '解锁位置', icon: 'unlock' })
			}

			items.push(
				{ type: 'separator' },
				{ id: 'properties', label: '属性', icon: 'settings' },
				{ id: 'delete', label: '删除', icon: 'trash-2', danger: true },
			)
		} else {
			// 空白区域右键菜单
			items.push(
				{ id: 'paste', label: '粘贴', icon: 'clipboard', disabled: !hasClipboardContent() },
				{ type: 'separator' },
				{ id: 'new-folder', label: '新建文件夹', icon: 'folder-plus' },
				{ type: 'separator' },
				{ id: 'refresh', label: '刷新', icon: 'refresh-cw' },
				{ id: 'grid-settings', label: '网格设置', icon: 'grid' },
				{ type: 'separator' },
				{ id: 'select-all', label: '全选', icon: 'check-square' },
			)
		}

		return items
	})

	// 方法
	/**
	 * 获取项目样式
	 */
	const getItemStyle = (item: GridItemType, gridConfig: GridConfig) => {
		const { x, y } = item.position
		const { cellSize, gap } = gridConfig

		return {
			position: 'absolute',
			left: `${x * (cellSize + gap)}px`,
			top: `${y * (cellSize + gap)}px`,
			width: `${cellSize}px`,
			height: `${cellSize}px`,
			zIndex: dragState.value.isDragging && dragState.value.dragItem?.id === item.id ? 1000 : 1,
		}
	}

	/**
	 * 获取拖拽目标位置样式
	 */
	const getDropTargetStyle = (position: GridPosition, gridConfig: GridConfig) => {
		const { x, y } = position
		const { cellSize, gap } = gridConfig

		return {
			position: 'absolute',
			left: `${x * (cellSize + gap)}px`,
			top: `${y * (cellSize + gap)}px`,
			width: `${cellSize}px`,
			height: `${cellSize}px`,
			backgroundColor: 'rgba(59, 130, 246, 0.3)',
			border: '2px dashed #3b82f6',
			borderRadius: '8px',
			pointerEvents: 'none',
			zIndex: 999,
		}
	}

	/**
	 * 获取空位置指示器样式
	 */
	const getEmptyPositionStyle = (position: GridPosition, gridConfig: GridConfig) => {
		const { x, y } = position
		const { cellSize, gap } = gridConfig

		return {
			position: 'absolute',
			left: `${x * (cellSize + gap)}px`,
			top: `${y * (cellSize + gap)}px`,
			width: `${cellSize}px`,
			height: `${cellSize}px`,
			border: '1px dashed rgba(0, 0, 0, 0.2)',
			borderRadius: '4px',
			pointerEvents: 'none',
			zIndex: 0,
		}
	}

	/**
	 * 坐标转换：鼠标位置到网格位置
	 */
	const mouseToGridPosition = (mouseX: number, mouseY: number): GridPosition | null => {
		if (!containerRef.value?.containerElement) return null

		const containerEl = containerRef.value.containerElement
		const rect = containerEl.getBoundingClientRect()
		const gridConfig = gridStore.currentConfig

		// 计算相对于容器的坐标
		const relativeX = mouseX - rect.left - gridConfig.padding.left
		const relativeY = mouseY - rect.top - gridConfig.padding.top

		// 转换为网格坐标
		const cellSizeWithGap = gridConfig.cellSize + gridConfig.gap
		const gridX = Math.floor(relativeX / cellSizeWithGap)
		const gridY = Math.floor(relativeY / cellSizeWithGap)

		// 边界检查
		if (gridX < 0 || gridX >= gridConfig.columns || gridY < 0 || gridY >= gridConfig.rows) {
			return null
		}

		return { x: gridX, y: gridY }
	}

	/**
	 * 处理项目点击
	 */
	const handleItemClick = (item: GridItemType, event: MouseEvent): void => {
		event.stopPropagation()

		if (props.enableMultiSelect && (event.ctrlKey || event.metaKey)) {
			// 多选模式
			gridStore.toggleItemSelection(item.id)
		} else if (props.enableMultiSelect && event.shiftKey && gridStore.hasSelectedItems) {
			// 范围选择（TODO: 实现范围选择逻辑）
			console.log('范围选择模式')
		} else {
			// 单选模式
			gridStore.clearSelection()
			gridStore.selectItem(item.id)
		}

		emit('item-click', item, event)
		emit('selection-changed', gridStore.selectedItems)
	}

	/**
	 * 处理项目双击
	 */
	const handleItemDoubleClick = (item: GridItemType, event: MouseEvent): void => {
		event.stopPropagation()

		// 打开应用
		openItem(item)

		emit('item-double-click', item, event)
	}

	/**
	 * 处理项目右键菜单
	 */
	const handleItemContextMenu = (item: GridItemType, event: MouseEvent): void => {
		event.preventDefault()
		event.stopPropagation()

		// 如果项目未选中，先选中它
		if (!gridStore.selectedItems.has(item.id)) {
			gridStore.clearSelection()
			gridStore.selectItem(item.id)
		}

		showContextMenu(event.clientX, event.clientY, item)
	}

	/**
	 * 处理容器右键菜单
	 */
	const handleContextMenu = (event: MouseEvent): void => {
		const gridPosition = mouseToGridPosition(event.clientX, event.clientY)
		if (gridPosition) {
			emit('grid-context-menu', gridPosition, event)
		}

		showContextMenu(event.clientX, event.clientY, null, gridPosition)
	}

	/**
	 * 显示右键菜单
	 */
	const showContextMenu = (
		x: number,
		y: number,
		item: GridItemType | null,
		position: GridPosition | null = null,
	): void => {
		contextMenu.value = {
			visible: true,
			x,
			y,
			targetItem: item,
			targetPosition: position,
		}
	}

	/**
	 * 关闭右键菜单
	 */
	const closeContextMenu = (): void => {
		contextMenu.value.visible = false
		contextMenu.value.targetItem = null
		contextMenu.value.targetPosition = null
	}

	/**
	 * 处理右键菜单选择
	 */
	const handleContextMenuSelect = (itemId: string): void => {
		const targetItem = contextMenu.value.targetItem
		const targetPosition = contextMenu.value.targetPosition

		switch (itemId) {
			case 'open':
				if (targetItem) openItem(targetItem)
				break
			case 'delete':
				if (targetItem) deleteItems([targetItem.id])
				break
			case 'lock':
				if (targetItem) toggleItemLock(targetItem.id, true)
				break
			case 'unlock':
				if (targetItem) toggleItemLock(targetItem.id, false)
				break
			case 'refresh':
				refreshGrid()
				break
			case 'select-all':
				gridStore.selectAllVisible()
				emit('selection-changed', gridStore.selectedItems)
				break
			case 'grid-settings':
				openGridSettings()
				break
			// 更多菜单项处理...
		}

		closeContextMenu()
	}

	/**
	 * 处理拖拽开始
	 */
	const handleDragStart = (item: GridItemType, event: DragEvent): void => {
		if (!props.enableDrag || item.general.locked) {
			event.preventDefault()
			return
		}

		gridStore.startDrag(item)
	}

	/**
	 * 处理拖拽结束
	 */
	const handleDragEnd = (item: GridItemType, event: DragEvent): void => {
		const success = gridStore.finalizeDrop()
		if (success && gridStore.dragState.dropTarget) {
			emit('item-moved', item, gridStore.dragState.dragStartPosition!, gridStore.dragState.dropTarget)
		}
	}

	/**
	 * 处理容器尺寸变化
	 */
	const handleContainerResize = (dimensions: { width: number; height: number }): void => {
		console.log('容器尺寸变化:', dimensions)
	}

	/**
	 * 打开项目
	 */
	const openItem = (item: GridItemType): void => {
		console.log('打开项目:', item)
		// TODO: 实现应用启动逻辑
	}

	/**
	 * 删除项目
	 */
	const deleteItems = (itemIds: string[]): void => {
		for (const id of itemIds) {
			gridStore.removeGridItem(id)
		}
		emit('selection-changed', gridStore.selectedItems)
	}

	/**
	 * 切换项目锁定状态
	 */
	const toggleItemLock = (itemId: string, locked: boolean): void => {
		const item = gridStore.gridItems.get(itemId)
		if (item) {
			item.general.locked = locked
		}
	}

	/**
	 * 刷新网格
	 */
	const refreshGrid = (): void => {
		loadGridData()
	}

	/**
	 * 打开网格设置
	 */
	const openGridSettings = (): void => {
		console.log('打开网格设置')
		// TODO: 实现设置对话框
	}

	/**
	 * 检查是否有剪贴板内容
	 */
	const hasClipboardContent = (): boolean => {
		// TODO: 实现剪贴板检查
		return false
	}

	/**
	 * 加载网格数据
	 */
	const loadGridData = async (): Promise<void> => {
		try {
			// 尝试加载本地配置
			let config = configManager.loadLocalConfiguration()

			if (!config) {
				// 加载静态配置
				config = await configManager.loadStaticConfiguration()
			}

			// 应用配置到store
			gridStore.setGridConfig(config.gridConfig)
			gridStore.availableApps = config.apps

			// 加载网格项目
			gridStore.resetGrid()
			for (const item of config.items) {
				gridStore.addGridItem(item, { autoSave: false })
			}

			console.log('网格数据加载完成')
		} catch (error) {
			console.error('加载网格数据失败:', error)
		}
	}

	/**
	 * 自动保存定时器
	 */
	let autoSaveTimer: NodeJS.Timeout | null = null

	/**
	 * 启动自动保存
	 */
	const startAutoSave = (): void => {
		if (autoSaveTimer) return

		autoSaveTimer = setInterval(() => {
			const config = configManager.getCurrentConfiguration()
			if (config) {
				configManager.saveLocalConfiguration(config)
			}
		}, props.autoSaveInterval)
	}

	/**
	 * 停止自动保存
	 */
	const stopAutoSave = (): void => {
		if (autoSaveTimer) {
			clearInterval(autoSaveTimer)
			autoSaveTimer = null
		}
	}

	// 生命周期
	onMounted(async () => {
		await loadGridData()
		startAutoSave()

		// 监听全局点击以清除选择
		document.addEventListener('click', (event) => {
			if (!containerRef.value?.containerElement?.contains(event.target as Node)) {
				gridStore.clearSelection()
				emit('selection-changed', gridStore.selectedItems)
			}
		})

		// 监听键盘事件
		document.addEventListener('keydown', handleKeydown)
	})

	onUnmounted(() => {
		stopAutoSave()
		document.removeEventListener('keydown', handleKeydown)
	})

	/**
	 * 处理键盘事件
	 */
	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.target !== document.body && !(event.target as HTMLElement).closest('.grid-container')) {
			return
		}

		switch (event.key) {
			case 'Delete':
			case 'Backspace':
				if (gridStore.hasSelectedItems) {
					deleteItems(Array.from(gridStore.selectedItems))
					event.preventDefault()
				}
				break
			case 'Escape':
				gridStore.clearSelection()
				closeContextMenu()
				emit('selection-changed', gridStore.selectedItems)
				break
			case 'a':
				if (event.ctrlKey || event.metaKey) {
					gridStore.selectAllVisible()
					emit('selection-changed', gridStore.selectedItems)
					event.preventDefault()
				}
				break
		}
	}

	// 暴露给父组件的方法
	defineExpose({
		loadData: loadGridData,
		refresh: refreshGrid,
		clearSelection: () => {
			gridStore.clearSelection()
			emit('selection-changed', gridStore.selectedItems)
		},
	})
</script>

<style scoped>
	/* 拖拽目标指示器动画 */
	.drop-target-indicator {
		animation: pulse 1s infinite alternate;
	}

	@keyframes pulse {
		from {
			opacity: 0.3;
		}
		to {
			opacity: 0.7;
		}
	}

	/* 空位置指示器 */
	.empty-position-indicator {
		transition: opacity 0.2s ease;
	}

	.empty-position-indicator:hover {
		opacity: 0.5;
	}

	/* 确保网格系统占满容器 */
	:deep(.grid-container) {
		width: 100%;
		height: 100%;
	}
</style>
