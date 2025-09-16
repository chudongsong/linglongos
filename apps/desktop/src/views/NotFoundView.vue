<template>
	<div class="not-found-container">
		<div class="text-center">
			<!-- 404 图标 -->
			<div class="mb-8">
				<div
					class="mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
				>
					<span class="text-white text-4xl font-bold">404</span>
				</div>
			</div>

			<!-- 错误信息 -->
			<div class="mb-8">
				<h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-4">页面未找到</h1>
				<p class="text-lg text-gray-600 dark:text-gray-400 mb-2">抱歉，您访问的页面不存在或已被移除</p>
				<p class="text-sm text-gray-500 dark:text-gray-500">请检查URL是否正确，或返回首页继续浏览</p>
			</div>

			<!-- 操作按钮 -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
				<button
					@click="goBack"
					class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
				>
					<ArrowLeftIcon class="w-4 h-4" />
					<span>返回上页</span>
				</button>

				<button
					@click="goHome"
					class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
				>
					<HomeIcon class="w-4 h-4" />
					<span>回到首页</span>
				</button>
			</div>

			<!-- 建议链接 -->
			<div class="mt-12">
				<p class="text-sm text-gray-500 dark:text-gray-500 mb-4">您可能想要访问：</p>
				<div class="flex flex-wrap justify-center gap-4">
					<router-link
						to="/desktop"
						class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm"
					>
						桌面环境
					</router-link>
					<router-link
						to="/login"
						class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm"
					>
						登录页面
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useRouter } from 'vue-router'
	import { ArrowLeftIcon, HomeIcon } from 'lucide-vue-next'

	/**
	 * 404 页面组件
	 * @description 处理未找到的路由，提供导航选项
	 */

	// 路由实例
	const router = useRouter()

	// 方法
	/**
	 * 返回上一页
	 */
	const goBack = (): void => {
		if (window.history.length > 1) {
			router.go(-1)
		} else {
			router.push('/desktop')
		}
	}

	/**
	 * 返回首页
	 */
	const goHome = (): void => {
		router.push('/desktop')
	}
</script>

<style scoped>
	.not-found-container {
		@apply min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4;
	}

	/* 添加一些动画效果 */
	@keyframes bounce {
		0%,
		20%,
		53%,
		80%,
		100% {
			transform: translate3d(0, 0, 0);
		}
		40%,
		43% {
			transform: translate3d(0, -10px, 0);
		}
		70% {
			transform: translate3d(0, -5px, 0);
		}
		90% {
			transform: translate3d(0, -2px, 0);
		}
	}

	.not-found-container > div {
		animation: bounce 2s ease-in-out;
	}
</style>
