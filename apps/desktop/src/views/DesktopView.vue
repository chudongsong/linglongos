<template>
	<div class="desktop-container">
		<!-- 桌面顶部栏 -->
		<header class="desktop-header">
			<div
				class="flex items-center justify-between h-12 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
			>
				<!-- 左侧：系统信息 -->
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2">
						<div
							class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
						>
							<span class="text-white text-xs font-bold">OS</span>
						</div>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">玲珑OS</span>
					</div>

					<!-- 当前时间 -->
					<div class="text-sm text-gray-600 dark:text-gray-400">
						{{ currentTime }}
					</div>
				</div>

				<!-- 中间：网格控制工具 -->
				<div class="flex items-center space-x-2">
					<!-- 网格尺寸切换 -->
					<div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
						<button
							v-for="preset in gridPresets"
							:key="preset.size"
							@click="switchGridSize(preset.size)"
							:class="{
								'bg-white dark:bg-gray-600 shadow-sm': currentGridSize === preset.size,
								'text-gray-700 dark:text-gray-300': currentGridSize === preset.size,
								'text-gray-500 dark:text-gray-400': currentGridSize !== preset.size,
							}"
							class="px-2 py-1 text-xs rounded transition-all duration-200"
							:title="preset.description"
						>
							{{ preset.name }}
						</button>
					</div>

					<!-- 网格线切换 -->
					<button
						@click="toggleGridLines"
						:class="{
							'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': showGridLines,
							'text-gray-600 dark:text-gray-400': !showGridLines,
						}"
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
						title="切换网格线显示"
					>
						<GridIcon class="w-4 h-4" />
					</button>
				</div>

				<!-- 右侧：用户信息和操作 -->
				<div class="flex items-center space-x-4">
					<!-- 项目统计信息 -->
					<div class="text-xs text-gray-500 dark:text-gray-400">
						项目: {{ totalItems }} | 选中: {{ selectedItemsCount }}
					</div>

					<!-- 用户信息 -->
					<div class="flex items-center space-x-2">
						<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
							<UserIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
						</div>
						<span class="text-sm text-gray-700 dark:text-gray-300">{{ userDisplayName }}</span>
					</div>

					<!-- 设置按钮 -->
					<button
						@click="openSettings"
						class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
						title="设置"
					>
						<SettingsIcon class="w-4 h-4" />
					</button>

					<!-- 登出按钮 -->
					<button
						@click="handleLogout"
						class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
						title="登出"
					>
						<LogOutIcon class="w-4 h-4" />
					</button>
				</div>
			</div>
		</header>

		<!-- 桌面主体区域 - 网格系统 -->
		<main class="desktop-main">
			<div
				class="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative"
			>
				<!-- 背景装饰 -->
				<div class="absolute inset-0 opacity-20">
					<div
						class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
					/>
					<div
						class="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
						style="animation-delay: 2s"
					/>
					<div
						class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
						style="animation-delay: 4s"
					/>
				</div>

				<!-- 网格系统容器 -->
				<div class="relative z-10 h-full">
					<GridSystem
						ref="gridSystemRef"
						:show-grid-lines="showGridLines"
						:show-debug-info="isDevelopment"
						:responsive="true"
						:enable-multi-select="true"
						:enable-drag="true"
						:auto-save-interval="5000"
						@item-click="handleItemClick"
						@item-double-click="handleItemDoubleClick"
						@item-moved="handleItemMoved"
						@selection-changed="handleSelectionChanged"
						@grid-context-menu="handleGridContextMenu"
					/>
				</div>

				<!-- 加载遮罩 -->
				<div
					v-if="isLoading"
					class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50"
				>
					<div class="text-center">
						<div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p class="text-gray-600 dark:text-gray-400">{{ loadingText }}</p>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted } from 'vue'
	import { useRouter } from 'vue-router'
	import { useAuthStore } from '@/stores/auth'
	import { useGridStore } from '@/stores/grid'
	import { UserIcon, SettingsIcon, LogOutIcon, GridIcon } from 'lucide-vue-next'
	import GridSystem from '@/components/grid/GridSystem.vue'
	import type { GridItem, GridPosition, GridSize, GridPreset } from '@/types/grid'

	/**
	 * 桌面主界面组件
	 * @description 系统桌面环境，集成网格系统提供应用管理功能
	 */

	// 路由和状态管理
	const router = useRouter()
	const authStore = useAuthStore()
	const gridStore = useGridStore()

	// 组件引用
	const gridSystemRef = ref<InstanceType<typeof GridSystem>>()

	// 响应式数据
	const currentTime = ref('')
	const showGridLines = ref(false)
	const isLoading = ref(false)
	const loadingText = ref('加载中...')
	const selectedItemsCount = ref(0)
	let timeInterval: NodeJS.Timeout | null = null

	// 网格预设
	const gridPresets: GridPreset[] = [
		{ size: 'small', cellSize: 48, gap: 8, columns: 16, rows: 10, name: '小', description: '密集排列' },
		{ size: 'medium', cellSize: 64, gap: 12, columns: 12, rows: 8, name: '中', description: '平衡布局' },
		{ size: 'large', cellSize: 80, gap: 16, columns: 10, rows: 6, name: '大', description: '清晰视觉' },
	]

	// 计算属性
	const userDisplayName = computed(() => authStore.userDisplayName)
	const currentConfig = computed(() => gridStore.currentConfig)
	const currentGridSize = computed(() => gridStore.currentConfig.gridSize)
	const totalItems = computed(() => gridStore.visibleGridItems.length)
	const isDevelopment = computed(() => import.meta.env.DEV)

	/**
	 * 切换网格大小
	 */
	const switchGridSize = (size: GridSize): void => {
		gridStore.switchPreset(size)
	}

	/**
	 * 切换网格线显示
	 */
	const toggleGridLines = (): void => {
		showGridLines.value = !showGridLines.value
	}

	/**
	 * 更新当前时间
	 */
	const updateTime = (): void => {
		const now = new Date()
		currentTime.value = now.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
	}

	/**
	 * 打开设置
	 */
	const openSettings = (): void => {
		console.log('打开系统设置')
		// TODO: 实现设置页面导航
	}

	/**
	 * 处理网格项目点击
	 */
	const handleItemClick = (item: GridItem, event: MouseEvent): void => {
		console.log('项目点击:', item)
	}

	/**
	 * 处理网格项目双击
	 */
	const handleItemDoubleClick = (item: GridItem, event: MouseEvent): void => {
		console.log('项目双击:', item)
		// 打开应用
		openItem(item)
	}

	/**
	 * 处理项目移动
	 */
	const handleItemMoved = (item: GridItem, from: GridPosition, to: GridPosition): void => {
		console.log('项目移动:', item.id, 'from', from, 'to', to)
	}

	/**
	 * 处理选择变化
	 */
	const handleSelectionChanged = (selectedItems: Set<string>): void => {
		selectedItemsCount.value = selectedItems.size
	}

	/**
	 * 处理网格右键菜单
	 */
	const handleGridContextMenu = (position: GridPosition, event: MouseEvent): void => {
		console.log('网格右键菜单:', position)
	}

	/**
	 * 打开项目
	 */
	const openItem = (item: GridItem): void => {
		console.log('打开项目:', item)
		// TODO: 实现应用启动逻辑
	}

	/**
	 * 处理用户登出
	 */
	const handleLogout = async (): Promise<void> => {
		try {
			await authStore.logout()
			router.push('/login')
		} catch (error) {
			console.error('登出失败:', error)
		}
	}

	// 生命周期钩子
	onMounted(async () => {
		// 初始化时间显示
		updateTime()

		// 设置定时器更新时间
		timeInterval = setInterval(updateTime, 1000)

		// 检查认证状态
		if (!authStore.isAuthenticated) {
			router.push('/login')
			return
		}

		// 初始化网格系统
		try {
			isLoading.value = true
			loadingText.value = '初始化网格系统...'

			// 加载网格数据
			await gridStore.loadDesktopData()

			console.log('网格系统初始化完成')
		} catch (error) {
			console.error('网格系统初始化失败:', error)
		} finally {
			isLoading.value = false
		}
	})

	onUnmounted(() => {
		// 清理定时器
		if (timeInterval) {
			clearInterval(timeInterval)
		}
	})
</script>

<style scoped>
	/* 桌面容器样式 */
	.desktop-container {
		@apply w-full h-screen flex flex-col overflow-hidden;
	}

	.desktop-header {
		@apply flex-shrink-0;
	}

	.desktop-main {
		@apply flex-1 overflow-hidden;
	}

	/* 动画效果 */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	/* 网格控制工具栏样式增强 */
	.desktop-header button:hover {
		@apply scale-105;
	}

	/* 响应式调整 */
	@media (max-width: 768px) {
		.desktop-header {
			@apply px-2;
		}

		.desktop-header .flex {
			@apply space-x-2;
		}
	}

	/* 高对比度模式支持 */
	@media (prefers-contrast: high) {
		.desktop-header {
			@apply border-b-2;
		}
	}

	/* 减少动画的用户偏好 */
	@media (prefers-reduced-motion: reduce) {
		.desktop-container *,
		.desktop-header button {
			@apply transition-none;
			animation: none !important;
		}
	}
</style>
