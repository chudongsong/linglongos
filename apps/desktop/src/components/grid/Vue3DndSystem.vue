<template>
	<div
		ref="containerRef"
		class="vue3-dnd-container"
		:class="{ 'drag-over': isOver && canDrop }"
	>
		<!-- 网格项目 -->
		<DraggableGridItem
			v-for="item in items"
			:key="item.id"
			:item="item"
			:grid-config="gridConfig"
			:enable-drag="enableDrag"
			@item-moved="handleItemMoved"
		>
			<slot :item="item" />
		</DraggableGridItem>

		<!-- 放置区域指示器 -->
		<div v-if="showDropZones && isDragging" class="drop-zones">
			<DropZone
				v-for="position in availableDropZones"
				:key="`drop-${position.x}-${position.y}`"
				:position="position"
				:grid-config="gridConfig"
				@item-dropped="handleDropZoneDrop"
			/>
		</div>
		
		<!-- 拖拽预览 -->
		<DragPreview />
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useDrop } from 'vue3-dnd'
	import { useGridStore } from '@/stores/grid'
	import DraggableGridItem from './DraggableGridItem.vue'
	import DropZone from './DropZone.vue'
	import DragPreview from './DragPreview.vue'
	import type { GridItem, GridConfig, GridPosition } from '@/types/grid'

	/**
	 * Vue3 DnD 拖拽系统组件
	 * @description 使用vue3-dnd实现的网格拖拽系统
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
	}

	const props = withDefaults(defineProps<Props>(), {
		enableDrag: true,
		showDropZones: true,
	})

	// Emits
	interface Emits {
		(e: 'item-moved', item: GridItem, from: GridPosition, to: GridPosition): void
		(e: 'items-reordered', items: GridItem[]): void
	}

	const emit = defineEmits<Emits>()

	// Store
	const gridStore = useGridStore()

	// Refs
	const containerRef = ref<HTMLElement>()

	// 计算属性
	const dragState = computed(() => gridStore.dragState)
	const isDragging = computed(() => dragState.value.isDragging)

	/**
	 * 可用的放置区域
	 */
	const availableDropZones = computed(() => {
		if (!isDragging.value) return []
		return gridStore.availablePositions.slice(0, 50) // 限制显示数量
	})

	// 设置容器为放置目标
	const [collect, drop] = useDrop(() => ({
		accept: 'GRID_ITEM',
		drop: (item: { id: string; position: GridPosition }, monitor) => {
			if (!monitor.didDrop()) {
				// 如果没有被子组件处理，则处理容器级别的放置
				handleContainerDrop(item, monitor)
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver({ shallow: true }),
			canDrop: monitor.canDrop(),
		}),
	}))

	const isOver = computed(() => collect.value.isOver)
	const canDrop = computed(() => collect.value.canDrop)

	// 将drop连接器应用到容器
	drop(containerRef as any)

	/**
	 * 处理容器级别的放置
	 */
	const handleContainerDrop = (draggedItem: { id: string; position: GridPosition }, monitor: any) => {
		const clientOffset = monitor.getClientOffset()
		if (!clientOffset || !containerRef.value) return

		const containerRect = containerRef.value.getBoundingClientRect()
		const gridPosition = pixelToGridPosition(
			clientOffset.x - containerRect.left,
			clientOffset.y - containerRect.top
		)

		if (gridPosition) {
			const success = gridStore.moveGridItemWithReplacement(draggedItem.id, gridPosition)
			if (success) {
				const item = gridStore.gridItems.get(draggedItem.id)
				if (item) {
					emit('item-moved', item, draggedItem.position, gridPosition)
				}
			}
		}
	}

	/**
	 * 坐标转换：像素位置到网格位置
	 */
	const pixelToGridPosition = (x: number, y: number): GridPosition | null => {
		const { cellSize, gap, padding } = props.gridConfig

		const relativeX = x - padding.left
		const relativeY = y - padding.top

		const gridX = Math.floor(relativeX / (cellSize + gap))
		const gridY = Math.floor(relativeY / (cellSize + gap))

		// 边界检查
		if (gridX < 0 || gridX >= props.gridConfig.columns || gridY < 0 || gridY >= props.gridConfig.rows) {
			return null
		}

		return { x: gridX, y: gridY }
	}

	/**
	 * 处理项目移动
	 */
	const handleItemMoved = (item: GridItem, from: GridPosition, to: GridPosition) => {
		emit('item-moved', item, from, to)
	}

	/**
	 * 处理放置区域放置
	 */
	const handleDropZoneDrop = (position: GridPosition, draggedItem: { id: string; position: GridPosition }) => {
		const success = gridStore.moveGridItemWithReplacement(draggedItem.id, position)
		if (success) {
			const item = gridStore.gridItems.get(draggedItem.id)
			if (item) {
				emit('item-moved', item, draggedItem.position, position)
			}
		}
	}
</script>

<style scoped>
	.vue3-dnd-container {
		@apply relative w-full h-full;
		@apply overflow-hidden;
	}

	.vue3-dnd-container.drag-over {
		@apply bg-blue-50/50 dark:bg-blue-900/10;
	}

	/* 放置区域 */
	.drop-zones {
		@apply absolute inset-0 pointer-events-none;
		@apply z-10;
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.vue3-dnd-container {
			@apply transition-none;
		}
	}
</style>