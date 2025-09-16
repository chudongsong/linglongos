<template>
	<div ref="containerRef" class="grid-container" :style="containerStyle" @contextmenu.prevent="handleContextMenu">
		<!-- 网格背景（可选的视觉辅助） -->
		<div v-if="showGridLines" class="grid-background" :style="gridBackgroundStyle" />

		<!-- 网格内容插槽 -->
		<div class="grid-content" :style="contentStyle">
			<slot :grid-config="gridConfig" :container-dimensions="containerDimensions" />
		</div>

		<!-- 调试信息（开发模式） -->
		<div v-if="showDebugInfo && isDevelopment" class="debug-info">
			<div class="debug-panel">
				<h4>网格调试信息</h4>
				<div>容器尺寸: {{ containerDimensions.width }}x{{ containerDimensions.height }}</div>
				<div>网格: {{ gridConfig.columns }}x{{ gridConfig.rows }}</div>
				<div>单元格: {{ gridConfig.cellSize }}px, 间距: {{ gridConfig.gap }}px</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
	import { useGridStore } from '@/stores/grid'
	import type { GridConfig } from '@/types/grid'

	/**
	 * 网格容器组件
	 * @description 网格系统的根容器，管理整体布局和响应式调整
	 */

	// Props
	interface Props {
		/** 是否显示网格线 */
		showGridLines?: boolean
		/** 是否显示调试信息 */
		showDebugInfo?: boolean
		/** 是否启用响应式调整 */
		responsive?: boolean
		/** 最小容器宽度 */
		minWidth?: number
		/** 最小容器高度 */
		minHeight?: number
	}

	const props = withDefaults(defineProps<Props>(), {
		showGridLines: false,
		showDebugInfo: false,
		responsive: true,
		minWidth: 800,
		minHeight: 600,
	})

	// Emits
	interface Emits {
		(e: 'resize', dimensions: { width: number; height: number }): void
		(e: 'contextmenu', event: MouseEvent): void
	}

	const emit = defineEmits<Emits>()

	// Store
	const gridStore = useGridStore()

	// Refs
	const containerRef = ref<HTMLElement>()

	// Reactive data
	const containerDimensions = ref({
		width: 0,
		height: 0,
	})

	// 计算属性
	const gridConfig = computed(() => gridStore.currentConfig)

	const isDevelopment = computed(() => import.meta.env.DEV)

	/**
	 * 容器样式
	 */
	const containerStyle = computed(() => ({
		'--grid-columns': gridConfig.value.columns,
		'--grid-rows': gridConfig.value.rows,
		'--cell-size': `${gridConfig.value.cellSize}px`,
		'--grid-gap': `${gridConfig.value.gap}px`,
		'--padding-top': `${gridConfig.value.padding.top}px`,
		'--padding-right': `${gridConfig.value.padding.right}px`,
		'--padding-bottom': `${gridConfig.value.padding.bottom}px`,
		'--padding-left': `${gridConfig.value.padding.left}px`,
		minWidth: `${props.minWidth}px`,
		minHeight: `${props.minHeight}px`,
	}))

	/**
	 * 内容区域样式
	 */
	const contentStyle = computed(() => ({
		padding: `${gridConfig.value.padding.top}px ${gridConfig.value.padding.right}px ${gridConfig.value.padding.bottom}px ${gridConfig.value.padding.left}px`,
		width: '100%',
		height: '100%',
		position: 'relative' as const,
	}))

	/**
	 * 网格背景样式
	 */
	const gridBackgroundStyle = computed(() => {
		const { cellSize, gap, columns, rows } = gridConfig.value
		const totalWidth = columns * cellSize + (columns - 1) * gap
		const totalHeight = rows * cellSize + (rows - 1) * gap

		return {
			position: 'absolute' as const,
			top: `${gridConfig.value.padding.top}px`,
			left: `${gridConfig.value.padding.left}px`,
			width: `${totalWidth}px`,
			height: `${totalHeight}px`,
			backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `,
			backgroundSize: `${cellSize + gap}px ${cellSize + gap}px`,
			pointerEvents: 'none' as const,
			zIndex: 0,
		}
	})

	// 方法
	/**
	 * 更新容器尺寸
	 */
	const updateContainerDimensions = (): void => {
		if (!containerRef.value) return

		const rect = containerRef.value.getBoundingClientRect()
		const newDimensions = {
			width: rect.width,
			height: rect.height,
		}

		// 只在尺寸发生变化时更新
		if (
			newDimensions.width !== containerDimensions.value.width ||
			newDimensions.height !== containerDimensions.value.height
		) {
			containerDimensions.value = newDimensions
			emit('resize', newDimensions)

			// 如果启用响应式，检查是否需要调整网格
			if (props.responsive) {
				checkAndAdjustGrid()
			}
		}
	}

	/**
	 * 检查并调整网格配置以适应容器
	 */
	const checkAndAdjustGrid = (): void => {
		const { width, height } = containerDimensions.value
		const config = gridConfig.value

		// 计算理论上的网格尺寸
		const availableWidth = width - config.padding.left - config.padding.right
		const availableHeight = height - config.padding.top - config.padding.bottom

		// 计算当前网格配置需要的尺寸
		const requiredWidth = config.columns * config.cellSize + (config.columns - 1) * config.gap
		const requiredHeight = config.rows * config.cellSize + (config.rows - 1) * config.gap

		// 如果容器太小，考虑调整网格
		if (availableWidth < requiredWidth || availableHeight < requiredHeight) {
			console.warn('容器尺寸小于网格要求，可能需要调整网格配置')
		}
	}

	/**
	 * 处理右键菜单
	 */
	const handleContextMenu = (event: MouseEvent): void => {
		emit('contextmenu', event)
	}

	/**
	 * ResizeObserver 实例
	 */
	let resizeObserver: ResizeObserver | null = null

	/**
	 * 初始化尺寸监听
	 */
	const initializeResizeObserver = (): void => {
		if (!containerRef.value || !window.ResizeObserver) {
			// 降级到监听 window resize
			window.addEventListener('resize', updateContainerDimensions)
			return
		}

		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === containerRef.value) {
					nextTick(() => {
						updateContainerDimensions()
					})
				}
			}
		})

		resizeObserver.observe(containerRef.value)
	}

	/**
	 * 清理资源
	 */
	const cleanup = (): void => {
		if (resizeObserver) {
			resizeObserver.disconnect()
			resizeObserver = null
		}

		window.removeEventListener('resize', updateContainerDimensions)
	}

	// 生命周期
	onMounted(() => {
		nextTick(() => {
			updateContainerDimensions()
			initializeResizeObserver()
		})
	})

	onUnmounted(() => {
		cleanup()
	})

	// 暴露给父组件的方法
	defineExpose({
		updateDimensions: updateContainerDimensions,
		containerElement: containerRef,
		dimensions: containerDimensions,
	})
</script>

<style scoped>
	.grid-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: transparent;
		user-select: none;
	}

	.grid-background {
		pointer-events: none;
		opacity: 0.3;
	}

	.grid-content {
		position: relative;
		z-index: 1;
	}

	/* 调试信息样式 */
	.debug-info {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1000;
		pointer-events: none;
	}

	.debug-panel {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-family: monospace;
		backdrop-filter: blur(4px);
	}

	.debug-panel h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: bold;
	}

	.debug-panel div {
		margin: 2px 0;
	}

	/* 响应式调整 */
	@media (max-width: 768px) {
		.grid-container {
			--cell-size: 48px;
			--grid-gap: 8px;
		}
	}

	@media (max-width: 480px) {
		.grid-container {
			--cell-size: 40px;
			--grid-gap: 6px;
		}
	}

	/* 确保容器可以滚动（如果内容超出） */
	.grid-container.scrollable {
		overflow: auto;
	}

	/* 高对比度模式支持 */
	@media (prefers-contrast: high) {
		.grid-background {
			opacity: 0.8;
		}

		.debug-panel {
			background: black;
			border: 1px solid white;
		}
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.grid-container * {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
