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

				<!-- 右侧：用户信息和操作 -->
				<div class="flex items-center space-x-4">
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

		<!-- 桌面主体区域 -->
		<main class="desktop-main">
			<div
				class="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden"
			>
				<!-- 背景装饰 -->
				<div class="absolute inset-0 opacity-30">
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

				<!-- 桌面内容区域 -->
				<div class="relative z-10 h-full flex flex-col items-center justify-center p-8">
					<!-- 欢迎信息 -->
					<div class="text-center mb-12">
						<h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-4">欢迎使用玲珑OS</h1>
						<p class="text-lg text-gray-600 dark:text-gray-300 mb-8">您的个人桌面环境已准备就绪</p>

						<!-- 快速操作卡片 -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
							<!-- 文件管理器 -->
							<div class="desktop-app-card" @click="openApp('file-manager')">
								<div class="app-icon bg-blue-500">
									<FolderIcon class="w-8 h-8 text-white" />
								</div>
								<h3 class="app-title">文件管理器</h3>
								<p class="app-description">管理您的文件和文件夹</p>
							</div>

							<!-- 终端 -->
							<div class="desktop-app-card" @click="openApp('terminal')">
								<div class="app-icon bg-gray-800">
									<TerminalIcon class="w-8 h-8 text-white" />
								</div>
								<h3 class="app-title">终端</h3>
								<p class="app-description">命令行界面</p>
							</div>

							<!-- 设置 -->
							<div class="desktop-app-card" @click="openApp('settings')">
								<div class="app-icon bg-green-500">
									<SettingsIcon class="w-8 h-8 text-white" />
								</div>
								<h3 class="app-title">系统设置</h3>
								<p class="app-description">配置系统选项</p>
							</div>
						</div>
					</div>

					<!-- 系统状态信息 -->
					<div class="mt-auto">
						<div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
							<div class="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
								<div class="flex items-center space-x-2">
									<div class="w-2 h-2 bg-green-500 rounded-full"></div>
									<span>系统运行正常</span>
								</div>
								<div>版本: 1.0.0</div>
								<div>用户: {{ userDisplayName }}</div>
							</div>
						</div>
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
	import { UserIcon, SettingsIcon, LogOutIcon, FolderIcon, TerminalIcon } from 'lucide-vue-next'

	/**
	 * 桌面主界面组件
	 * @description 系统桌面环境，提供应用启动和系统管理功能
	 */

	// 路由和状态管理
	const router = useRouter()
	const authStore = useAuthStore()

	// 响应式数据
	const currentTime = ref('')
	let timeInterval: NodeJS.Timeout | null = null

	// 计算属性
	const userDisplayName = computed(() => authStore.userDisplayName)

	// 方法
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
	 * 打开应用
	 * @param appName 应用名称
	 */
	const openApp = (appName: string): void => {
		console.log(`打开应用: ${appName}`)
		// TODO: 实现应用启动逻辑
		// 这里可以根据应用名称路由到不同的应用页面
		// 或者打开模态窗口显示应用内容
	}

	/**
	 * 打开设置
	 */
	const openSettings = (): void => {
		console.log('打开系统设置')
		// TODO: 实现设置页面导航
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
	onMounted(() => {
		// 初始化时间显示
		updateTime()

		// 设置定时器更新时间
		timeInterval = setInterval(updateTime, 1000)

		// 检查认证状态
		if (!authStore.isAuthenticated) {
			router.push('/login')
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

	/* 应用卡片样式 */
	.desktop-app-card {
		@apply bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border border-gray-200/50 dark:border-gray-700/50;
	}

	.desktop-app-card:hover {
		@apply bg-white/90 dark:bg-gray-800/90;
	}

	.app-icon {
		@apply w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg;
	}

	.app-title {
		@apply text-lg font-semibold text-gray-800 dark:text-white mb-2;
	}

	.app-description {
		@apply text-sm text-gray-600 dark:text-gray-400;
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

	.desktop-app-card {
		animation: float 6s ease-in-out infinite;
	}

	.desktop-app-card:nth-child(2) {
		animation-delay: 2s;
	}

	.desktop-app-card:nth-child(3) {
		animation-delay: 4s;
	}
</style>
