<template>
	<div
		ref="itemRef"
		class="draggable-grid-item"
		:class="{
			'is-dragging': isDragging,
			'is-over': isOver && canDrop,
			'can-drop': canDrop,
		}"
		:style="itemStyle"
	>
		<div class="item-content">
			<slot />
		</div>

		<!-- 拖拽句柄 -->
		<div
			v-if="enableDrag"
			ref="dragHandleRef"
			class="drag-handle"
			:class="{ 'is-dragging': isDragging }"
		>
			<svg class="drag-icon" viewBox="0 0 24 24" fill="currentColor">
				<path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
			</svg>
		</div>
		
		<!-- 隐藏的拖拽预览元素 -->
		<div ref="emptyPreviewRef" class="empty-preview"></div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useDrag, useDrop } from 'vue3-dnd'
	import { useGridStore } from '@/stores/grid'
	import type { GridItem, GridConfig, GridPosition } from '@/types/grid'

	/**
	 * 可拖拽的网格项组件
	 * @description 使用vue3-dnd实现的可拖拽网格项
	 */

	// Props
	interface Props {
		/** 网格项数据 */
		item: GridItem
		/** 网格配置 */
		gridConfig: GridConfig
		/** 是否启用拖拽 */
		enableDrag?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		enableDrag: true,
	})

	// Emits
	interface Emits {
		(e: 'item-moved', item: GridItem, from: GridPosition, to: GridPosition): void
	}

	const emit = defineEmits<Emits>()

	// Store
	const gridStore = useGridStore()

	// Refs
	const itemRef = ref<HTMLElement>()
	const dragHandleRef = ref<HTMLElement>()
	const emptyPreviewRef = ref<HTMLElement>()

	// 拖拽源配置
	const [dragCollect, drag, dragPreview] = useDrag(() => ({
		type: 'GRID_ITEM',
		item: () => {
			gridStore.startDrag(props.item)
			return {
				id: props.item.id,
				position: { ...props.item.position },
			}
		},
		end: (item, monitor) => {
			if (monitor.didDrop()) {
				// 拖拽成功完成
				gridStore.finalizeDrop()
			} else {
				// 拖拽被取消
				gridStore.cancelDrag()
			}
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
		canDrag: () => props.enableDrag,
	}))

	// 放置目标配置
	const [dropCollect, drop] = useDrop(() => ({
		accept: 'GRID_ITEM',
		drop: (draggedItem: { id: string; position: GridPosition }, monitor) => {
			if (draggedItem.id === props.item.id) return

			// 移动到当前位置
			const success = gridStore.moveGridItem(draggedItem.id, props.item.position)
			if (success) {
				emit('item-moved', props.item, draggedItem.position, props.item.position)
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	}))

	// 获取拖拽和放置状态
	const isDragging = computed(() => dragCollect.value.isDragging)
	const isOver = computed(() => dropCollect.value.isOver)
	const canDrop = computed(() => dropCollect.value.canDrop)

	// 连接拖拽和放置
	drag(dragHandleRef as any)
	// 使用空的预览元素，禁用默认预览
	dragPreview(emptyPreviewRef as any)
	drop(itemRef as any)

	// 计算项目样式
	const itemStyle = computed(() => {
		const { cellSize, gap, padding } = props.gridConfig
		const { x, y } = props.item.position
		// 默认尺寸为1x1
		const width = 1
		const height = 1

		return {
			position: 'absolute' as const,
			left: `${padding.left + x * (cellSize + gap)}px`,
			top: `${padding.top + y * (cellSize + gap)}px`,
			width: `${width * cellSize + (width - 1) * gap}px`,
			height: `${height * cellSize + (height - 1) * gap}px`,
			zIndex: isDragging.value ? 1000 : 1,
		}
	})
</script>

<style scoped>
	.draggable-grid-item {
		@apply relative;
		@apply transition-all duration-200 ease-in-out;
		@apply cursor-pointer;
	}

	.draggable-grid-item.is-dragging {
		@apply opacity-50;
		@apply transform scale-105;
		@apply shadow-2xl;
	}

	.draggable-grid-item.is-over {
		@apply ring-2 ring-blue-500 ring-opacity-50;
	}

	.draggable-grid-item.can-drop {
		@apply bg-blue-50/50 dark:bg-blue-900/10;
	}

	.item-content {
		@apply w-full h-full;
		@apply rounded-lg;
		@apply overflow-hidden;
	}

	/* 拖拽句柄 */
	.drag-handle {
		@apply absolute top-1 right-1;
		@apply w-6 h-6;
		@apply flex items-center justify-center;
		@apply bg-gray-200/80 dark:bg-gray-700/80;
		@apply rounded;
		@apply opacity-0 transition-opacity duration-200;
		@apply cursor-grab;
		@apply z-10;
	}

	.draggable-grid-item:hover .drag-handle {
		@apply opacity-100;
	}

	.drag-handle.is-dragging {
		@apply cursor-grabbing;
		@apply opacity-100;
	}

	.drag-icon {
		@apply w-4 h-4;
		@apply text-gray-600 dark:text-gray-300;
	}

	/* 隐藏的拖拽预览元素 */
	.empty-preview {
		@apply absolute;
		@apply w-0 h-0;
		@apply opacity-0;
		@apply pointer-events-none;
		@apply -z-10;
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.draggable-grid-item {
			@apply transition-none;
		}
	}
</style>