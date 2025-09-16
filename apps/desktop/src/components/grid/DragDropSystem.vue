<template>
	<div
		ref="containerRef"
		class="drag-drop-container"
		@dragover="handleDragOver"
		@drop="handleDrop"
		@dragenter="handleDragEnter"
		@dragleave="handleDragLeave"
	>
		<VueDraggable
			v-model="internalItems"
			:animation="150"
			:delay="0"
			:delayOnTouchStart="true"
			:touchStartThreshold="5"
			:disabled="!enableDrag"
			:ghost-class="'drag-ghost'"
			:chosen-class="'drag-chosen'"
			:drag-class="'drag-active'"
			:force-fallback="true"
			:fallback-class="'drag-fallback'"
			:scroll-sensitivity="100"
			:scroll-speed="20"
			:bubble-scroll="true"
			@start="handleDragStart"
			@end="handleDragEnd"
			@add="handleAdd"
			@update="handleUpdate"
			@remove="handleRemove"
			@move="handleMove"
		>
			<template #item="{ element, index }">
				<DragWrapper
					:key="element.id"
					:item="element"
					:index="index"
					:grid-config="gridConfig"
					:is-dragging="dragState.isDragging && dragState.dragItem?.id === element.id"
					:enable-drag="enableDrag"
					@drag-start="handleItemDragStart(element, $event)"
					@drag-end="handleItemDragEnd(element, $event)"
				>
					<slot :item="element" :index="index" />
				</DragWrapper>
			</template>
		</VueDraggable>

		<!-- 拖拽预览指示器 -->
		<div v-if="showDropZones && dragState.isDragging" class="drop-zones">
			<div
				v-for="position in availableDropZones"
				:key="`drop-${position.x}-${position.y}`"
				class="drop-zone"
				:style="getDropZoneStyle(position)"
				@dragover.prevent="handleDropZoneOver(position)"
				@drop="handleDropZoneDrop(position, $event)"
			/>
		</div>

		<!-- 自定义拖拽预览 -->
		<div
			v-if="customDragPreview && dragState.isDragging"
			ref="dragPreviewRef"
			class="drag-preview"
			:style="dragPreviewStyle"
		>
			<slot name="drag-preview" :item="dragState.dragItem" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, watch, nextTick } from 'vue'
	import { VueDraggable } from 'vue-draggable-plus'
	import { useGridStore } from '@/stores/grid'
	import DragWrapper from './DragWrapper.vue'
	import type { GridItem, GridConfig, GridPosition, DragState } from '@/types/grid'

	/**
	 * 拖拽系统组件
	 * @description 集成vue-draggable-plus实现网格项目的拖拽功能
	 */

	// Props
	interface Props {
		/** 网格项目列表 */
		items: GridItem[]
		/** 网格配置 */
		gridConfig: GridConfig
		/** 是否启用拖拽 */
		enableDrag?: boolean
		/** 是否显示放置区域 */
		showDropZones?: boolean
		/** 是否使用自定义拖拽预览 */
		customDragPreview?: boolean
		/** 拖拽延迟（毫秒） */
		dragDelay?: number
		/** 是否启用自动滚动 */
		autoScroll?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		enableDrag: true,
		showDropZones: true,
		customDragPreview: false,
		dragDelay: 0,
		autoScroll: true,
	})

	// Emits
	interface Emits {
		(e: 'drag-start', item: GridItem, event: DragEvent): void
		(e: 'drag-end', item: GridItem, event: DragEvent): void
		(e: 'item-moved', item: GridItem, from: GridPosition, to: GridPosition): void
		(e: 'items-reordered', items: GridItem[]): void
	}

	const emit = defineEmits<Emits>()

	// Store
	const gridStore = useGridStore()

	// Refs
	const containerRef = ref<HTMLElement>()
	const dragPreviewRef = ref<HTMLElement>()

	// Reactive data
	const dragCounter = ref(0)
	const mousePosition = ref({ x: 0, y: 0 })

	// 内部项目列表（用于vue-draggable）
	const internalItems = ref<GridItem[]>([])

	// 计算属性
	const dragState = computed(() => gridStore.dragState)

	/**
	 * 可用的放置区域
	 */
	const availableDropZones = computed(() => {
		if (!dragState.value.isDragging) return []

		return gridStore.availablePositions.slice(0, 50) // 限制显示数量以提高性能
	})

	/**
	 * 拖拽预览样式
	 */
	const dragPreviewStyle = computed(() => ({
		position: 'fixed',
		left: `${mousePosition.value.x - 32}px`,
		top: `${mousePosition.value.y - 32}px`,
		pointerEvents: 'none',
		zIndex: 10000,
		transform: 'rotate(5deg)',
		opacity: 0.8,
	}))

	// 方法
	/**
	 * 获取放置区域样式
	 */
	const getDropZoneStyle = (position: GridPosition) => {
		const { x, y } = position
		const { cellSize, gap } = props.gridConfig

		return {
			position: 'absolute',
			left: `${x * (cellSize + gap)}px`,
			top: `${y * (cellSize + gap)}px`,
			width: `${cellSize}px`,
			height: `${cellSize}px`,
		}
	}

	/**
	 * 坐标转换：像素位置到网格位置
	 */
	const pixelToGridPosition = (x: number, y: number): GridPosition | null => {
		if (!containerRef.value) return null

		const rect = containerRef.value.getBoundingClientRect()
		const { cellSize, gap, padding } = props.gridConfig

		const relativeX = x - rect.left - padding.left
		const relativeY = y - rect.top - padding.top

		const gridX = Math.floor(relativeX / (cellSize + gap))
		const gridY = Math.floor(relativeY / (cellSize + gap))

		// 边界检查
		if (gridX < 0 || gridX >= props.gridConfig.columns || gridY < 0 || gridY >= props.gridConfig.rows) {
			return null
		}

		return { x: gridX, y: gridY }
	}

	/**
	 * 处理拖拽开始
	 */
	const handleDragStart = (event: any): void => {
		const { item, oldIndex } = event

		if (!item || item.general?.locked) {
			event.preventDefault?.()
			return
		}

		gridStore.startDrag(item)
		emit('drag-start', item, event.originalEvent)
	}

	/**
	 * 处理拖拽结束
	 */
	const handleDragEnd = (event: any): void => {
		const { item } = event

		if (item) {
			emit('drag-end', item, event.originalEvent)
		}

		// 延迟清理拖拽状态，确保动画完成
		setTimeout(() => {
			gridStore.cancelDrag()
		}, 200)
	}

	/**
	 * 处理项目添加
	 */
	const handleAdd = (event: any): void => {
		console.log('项目添加:', event)
	}

	/**
	 * 处理项目更新
	 */
	const handleUpdate = (event: any): void => {
		const { newIndex, oldIndex } = event

		if (newIndex !== oldIndex) {
			emit('items-reordered', [...internalItems.value])
		}
	}

	/**
	 * 处理项目移除
	 */
	const handleRemove = (event: any): void => {
		console.log('项目移除:', event)
	}

	/**
	 * 处理拖拽移动（验证是否允许放置）
	 */
	const handleMove = (event: any): boolean => {
		const { related, willInsertAfter } = event

		// 检查目标位置是否有效
		// 这里可以添加更复杂的验证逻辑
		return true
	}

	/**
	 * 处理单个项目拖拽开始
	 */
	const handleItemDragStart = (item: GridItem, event: DragEvent): void => {
		if (item.general.locked) {
			event.preventDefault()
			return
		}

		gridStore.startDrag(item)
	}

	/**
	 * 处理单个项目拖拽结束
	 */
	const handleItemDragEnd = (item: GridItem, event: DragEvent): void => {
		// 处理拖拽结束逻辑
	}

	/**
	 * 处理原生拖拽悬停
	 */
	const handleDragOver = (event: DragEvent): void => {
		event.preventDefault()

		// 更新鼠标位置（用于自定义预览）
		if (props.customDragPreview) {
			mousePosition.value = { x: event.clientX, y: event.clientY }
		}

		// 计算拖拽目标位置
		const gridPosition = pixelToGridPosition(event.clientX, event.clientY)
		if (gridPosition && dragState.value.isDragging) {
			gridStore.updateDragTarget(gridPosition)
		}
	}

	/**
	 * 处理原生拖拽放置
	 */
	const handleDrop = (event: DragEvent): void => {
		event.preventDefault()

		const gridPosition = pixelToGridPosition(event.clientX, event.clientY)
		if (gridPosition && dragState.value.isDragging && dragState.value.dragItem) {
			const oldPosition = dragState.value.dragStartPosition!
			const newPosition = gridPosition

			// 验证并执行移动
			const success = gridStore.moveGridItem(dragState.value.dragItem.id, newPosition)

			if (success) {
				emit('item-moved', dragState.value.dragItem, oldPosition, newPosition)
			}
		}

		dragCounter.value = 0
	}

	/**
	 * 处理拖拽进入
	 */
	const handleDragEnter = (event: DragEvent): void => {
		event.preventDefault()
		dragCounter.value++
	}

	/**
	 * 处理拖拽离开
	 */
	const handleDragLeave = (event: DragEvent): void => {
		dragCounter.value--

		if (dragCounter.value === 0) {
			// 完全离开容器
			gridStore.updateDragTarget({ x: -1, y: -1 })
		}
	}

	/**
	 * 处理放置区域悬停
	 */
	const handleDropZoneOver = (position: GridPosition): void => {
		if (dragState.value.isDragging) {
			gridStore.updateDragTarget(position)
		}
	}

	/**
	 * 处理放置区域放置
	 */
	const handleDropZoneDrop = (position: GridPosition, event: DragEvent): void => {
		event.stopPropagation()

		if (dragState.value.isDragging && dragState.value.dragItem) {
			const oldPosition = dragState.value.dragStartPosition!

			const success = gridStore.moveGridItem(dragState.value.dragItem.id, position)

			if (success) {
				emit('item-moved', dragState.value.dragItem, oldPosition, position)
			}
		}
	}

	/**
	 * 更新内部项目列表
	 */
	const updateInternalItems = (): void => {
		internalItems.value = [...props.items]
	}

	// 监听器
	watch(() => props.items, updateInternalItems, { immediate: true, deep: true })

	// 监听内部项目变化，同步到外部
	watch(
		internalItems,
		(newItems) => {
			// 检查是否有位置变化需要同步
			const hasChanges = newItems.some((item, index) => {
				const originalItem = props.items[index]
				return !originalItem || originalItem.id !== item.id
			})

			if (hasChanges) {
				emit('items-reordered', [...newItems])
			}
		},
		{ deep: true },
	)

	// 监听拖拽状态变化
	watch(
		() => dragState.value.isDragging,
		(isDragging) => {
			if (isDragging) {
				document.addEventListener('mousemove', handleMouseMove)
			} else {
				document.removeEventListener('mousemove', handleMouseMove)
			}
		},
	)

	/**
	 * 处理鼠标移动（用于自定义拖拽预览）
	 */
	const handleMouseMove = (event: MouseEvent): void => {
		if (props.customDragPreview && dragState.value.isDragging) {
			mousePosition.value = { x: event.clientX, y: event.clientY }
		}
	}

	// 暴露给父组件的方法
	defineExpose({
		container: containerRef,
		updateItems: updateInternalItems,
	})
</script>

<style scoped>
	.drag-drop-container {
		@apply relative w-full h-full;
		@apply overflow-hidden;
	}

	/* Vue Draggable 样式类 */
	:deep(.drag-ghost) {
		@apply opacity-30;
	}

	:deep(.drag-chosen) {
		@apply cursor-grabbing;
	}

	:deep(.drag-active) {
		@apply rotate-3 scale-105;
		@apply shadow-lg;
		@apply z-50;
	}

	:deep(.drag-fallback) {
		@apply opacity-80;
		@apply cursor-grabbing;
	}

	/* 放置区域 */
	.drop-zones {
		@apply absolute inset-0 pointer-events-none;
		@apply z-10;
	}

	.drop-zone {
		@apply border-2 border-dashed border-blue-400;
		@apply bg-blue-100/30 dark:bg-blue-900/20;
		@apply rounded-lg;
		@apply transition-all duration-200;
		@apply pointer-events-auto;
	}

	.drop-zone:hover {
		@apply border-blue-600 bg-blue-200/40;
		@apply scale-105;
	}

	/* 拖拽预览 */
	.drag-preview {
		@apply pointer-events-none;
		@apply transition-transform duration-100;
	}

	/* 拖拽状态时的容器样式 */
	.drag-drop-container.dragging {
		@apply cursor-grabbing;
	}

	/* 拖拽悬停状态 */
	.drag-drop-container.drag-over {
		@apply bg-blue-50/50 dark:bg-blue-900/10;
	}

	/* 动画 */
	.drop-zone {
		animation: dropZonePulse 2s infinite;
	}

	@keyframes dropZonePulse {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* 确保拖拽元素在最上层 */
	:deep(.sortable-drag) {
		@apply z-[9999] !important;
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.drop-zone,
		.drag-preview,
		:deep(.drag-active) {
			@apply transition-none;
			animation: none !important;
		}
	}

	/* 触摸设备优化 */
	@media (hover: none) and (pointer: coarse) {
		.drop-zone {
			@apply border-4;
			@apply min-h-[60px] min-w-[60px];
		}
	}
</style>
