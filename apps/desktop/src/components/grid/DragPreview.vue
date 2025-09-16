<template>
	<div
		v-if="isDragging && dragItem"
		ref="previewRef"
		class="drag-preview"
		:style="previewStyle"
	>
		<div class="preview-content">
			<!-- 图标 -->
			<div class="preview-icon">
				<img
					v-if="appInfo?.icon"
					:src="appInfo.icon"
					:alt="appInfo.name"
					class="icon-image"
				/>
				<div v-else class="icon-placeholder">
					{{ appInfo?.name?.charAt(0).toUpperCase() || '?' }}
				</div>
			</div>
			
			<!-- 文字说明 -->
			<div class="preview-text">
				{{ appInfo?.name || dragItem.appId }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted } from 'vue'
	import { useGridStore } from '@/stores/grid'
	import type { GridItem } from '@/types/grid'

	/**
	 * 拖拽预览组件
	 * @description 跟随鼠标光标的拖拽预览效果
	 */

	// Store
	const gridStore = useGridStore()

	// Refs
	const previewRef = ref<HTMLElement>()
	const mousePosition = ref({ x: 0, y: 0 })

	// 计算属性
	const dragState = computed(() => gridStore.dragState)
	const isDragging = computed(() => dragState.value.isDragging)
	const dragItem = computed(() => dragState.value.dragItem)
	
	/**
	 * 获取应用信息
	 */
	const appInfo = computed(() => {
		if (!dragItem.value) return null
		return gridStore.availableApps.find(app => app.id === dragItem.value!.appId)
	})

	/**
	 * 预览样式
	 */
	const previewStyle = computed(() => {
		if (!isDragging.value) return { display: 'none' }

		return {
			position: 'fixed' as const,
			left: `${mousePosition.value.x + 10}px`, // 偏移10px避免遮挡鼠标
			top: `${mousePosition.value.y - 30}px`,  // 向上偏移30px
			zIndex: 9999,
			pointerEvents: 'none' as const,
			transform: 'translate(0, 0)', // 确保不受其他transform影响
		}
	})

	/**
	 * 鼠标移动事件处理
	 */
	const handleMouseMove = (event: MouseEvent) => {
		mousePosition.value = {
			x: event.clientX,
			y: event.clientY,
		}
	}

	/**
	 * 组件挂载时添加事件监听
	 */
	onMounted(() => {
		document.addEventListener('mousemove', handleMouseMove, { passive: true })
	})

	/**
	 * 组件卸载时移除事件监听
	 */
	onUnmounted(() => {
		document.removeEventListener('mousemove', handleMouseMove)
	})
</script>

<style scoped>
	.drag-preview {
		@apply pointer-events-none;
		@apply select-none;
		@apply transition-none; /* 禁用过渡动画以确保流畅跟随 */
	}

	.preview-content {
		@apply flex flex-col items-center;
		@apply bg-white dark:bg-gray-800;
		@apply border border-gray-200 dark:border-gray-600;
		@apply rounded-lg shadow-lg;
		@apply p-2;
		@apply min-w-[60px];
		@apply opacity-90;
	}

	.preview-icon {
		@apply w-8 h-8 mb-1;
		@apply flex items-center justify-center;
	}

	.icon-image {
		@apply w-full h-full object-contain;
		@apply rounded;
	}

	.icon-placeholder {
		@apply w-full h-full;
		@apply bg-gradient-to-br from-blue-500 to-purple-600;
		@apply text-white text-sm font-bold;
		@apply flex items-center justify-center;
		@apply rounded;
	}

	.preview-text {
		@apply text-xs text-gray-700 dark:text-gray-300;
		@apply text-center;
		@apply max-w-[80px];
		@apply truncate;
		@apply leading-tight;
	}

	/* 确保在所有浏览器中都能正确显示 */
	.drag-preview {
		will-change: transform;
		backface-visibility: hidden;
	}
</style>