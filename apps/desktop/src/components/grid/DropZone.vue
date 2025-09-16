<template>
	<div
		ref="dropZoneRef"
		class="drop-zone"
		:class="{
			'is-over': isOver && canDrop,
			'can-drop': canDrop,
		}"
		:style="dropZoneStyle"
	>
		<div class="drop-indicator">
			<svg class="drop-icon" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
			</svg>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useDrop } from 'vue3-dnd'
	import type { GridPosition, GridConfig } from '@/types/grid'

	/**
	 * 放置区域组件
	 * @description 显示可放置的网格位置
	 */

	// Props
	interface Props {
		/** 网格位置 */
		position: GridPosition
		/** 网格配置 */
		gridConfig: GridConfig
	}

	const props = defineProps<Props>()

	// Emits
	interface Emits {
		(e: 'item-dropped', position: GridPosition, draggedItem: { id: string; position: GridPosition }): void
	}

	const emit = defineEmits<Emits>()

	// Refs
	const dropZoneRef = ref<HTMLElement>()

	// 放置目标配置
	const [collect, drop] = useDrop(() => ({
		accept: 'GRID_ITEM',
		drop: (draggedItem: { id: string; position: GridPosition }, monitor) => {
			emit('item-dropped', props.position, draggedItem)
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	}))

	const isOver = computed(() => collect.value.isOver)
	const canDrop = computed(() => collect.value.canDrop)

	// 连接放置目标
	drop(dropZoneRef as any)

	// 计算放置区域样式
	const dropZoneStyle = computed(() => {
		const { cellSize, gap, padding } = props.gridConfig
		const { x, y } = props.position

		return {
			position: 'absolute' as const,
			left: `${padding.left + x * (cellSize + gap)}px`,
			top: `${padding.top + y * (cellSize + gap)}px`,
			width: `${cellSize}px`,
			height: `${cellSize}px`,
			pointerEvents: 'auto' as const,
		}
	})
</script>

<style scoped>
	.drop-zone {
		@apply border-2 border-dashed border-transparent;
		@apply rounded-lg;
		@apply transition-all duration-200;
		@apply flex items-center justify-center;
		@apply z-20;
	}

	.drop-zone.can-drop {
		@apply border-blue-300 dark:border-blue-600;
		@apply bg-blue-50/30 dark:bg-blue-900/20;
	}

	.drop-zone.is-over {
		@apply border-blue-500 dark:border-blue-400;
		@apply bg-blue-100/50 dark:bg-blue-800/30;
		@apply scale-105;
	}

	.drop-indicator {
		@apply opacity-0 transition-opacity duration-200;
		@apply text-blue-500 dark:text-blue-400;
	}

	.drop-zone.can-drop .drop-indicator {
		@apply opacity-60;
	}

	.drop-zone.is-over .drop-indicator {
		@apply opacity-100;
	}

	.drop-icon {
		@apply w-6 h-6;
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.drop-zone {
			@apply transition-none;
		}
	}
</style>