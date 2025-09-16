# 玲珑OS Vue3+TypeScript 前端开发规范

## 概述

本规范基于Vue3和TypeScript构建，严格遵循MVC（Model-View-Controller）架构模式，旨在提供统一、可维护、高质量的前端代码标准。

## 架构设计原则

### MVC架构模式

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Model       │    │   Controller    │    │      View       │
│   (数据层)       │◄───┤   (控制层)       │───►│    (视图层)      │
│                 │    │                 │    │                 │
│ • TypeScript    │    │ • Composables   │    │ • Vue3 SFC      │
│   接口/类       │    │ • 业务逻辑       │    │ • Composition    │
│ • Pinia Store   │    │ • 用户交互       │    │   API           │
│ • API 模块      │    │ • 路由管理       │    │ • 响应式组件     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. 数据层（Model）规范

### 1.1 TypeScript 类型定义

#### 接口定义规范

```typescript
/**
 * 用户信息接口
 * @description 定义用户基本信息结构
 */
interface IUser {
	/** 用户唯一标识 */
	readonly id: string
	/** 用户名 */
	username: string
	/** 邮箱地址 */
	email: string
	/** 创建时间 */
	readonly createdAt: Date
	/** 更新时间 */
	updatedAt: Date
}

/**
 * 用户创建请求参数
 */
interface ICreateUserRequest {
	username: string
	email: string
	password: string
}

/**
 * API 响应基础结构
 */
interface IApiResponse<T = any> {
	/** 响应状态码 */
	code: number
	/** 响应消息 */
	message: string
	/** 响应数据 */
	data: T
	/** 时间戳 */
	timestamp: number
}
```

#### 类定义规范

```typescript
/**
 * 用户实体类
 * @description 用户数据模型，包含业务逻辑方法
 */
export class User implements IUser {
	readonly id: string
	username: string
	email: string
	readonly createdAt: Date
	updatedAt: Date

	constructor(data: IUser) {
		this.id = data.id
		this.username = data.username
		this.email = data.email
		this.createdAt = data.createdAt
		this.updatedAt = data.updatedAt
	}

	/**
	 * 验证邮箱格式
	 * @returns 是否为有效邮箱
	 */
	isValidEmail(): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(this.email)
	}

	/**
	 * 获取用户显示名称
	 * @returns 用户显示名称
	 */
	getDisplayName(): string {
		return this.username || this.email.split('@')[0]
	}

	/**
	 * 更新用户信息
	 * @param updates 更新数据
	 */
	update(updates: Partial<Pick<IUser, 'username' | 'email'>>): void {
		Object.assign(this, updates, { updatedAt: new Date() })
	}
}
```

### 1.2 Pinia 状态管理

#### Store 定义规范

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUser } from '@/types/user'
import { User } from '@/models/User'
import { userApi } from '@/api/user'

/**
 * 用户状态管理
 * @description 管理用户相关的全局状态
 */
export const useUserStore = defineStore('user', () => {
	// State
	const currentUser = ref<User | null>(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// Getters
	const isAuthenticated = computed(() => currentUser.value !== null)
	const userDisplayName = computed(() => currentUser.value?.getDisplayName() || '未登录用户')

	// Actions
	/**
	 * 用户登录
	 * @param credentials 登录凭据
	 */
	const login = async (credentials: { email: string; password: string }) => {
		try {
			isLoading.value = true
			error.value = null

			const response = await userApi.login(credentials)
			currentUser.value = new User(response.data)

			return { success: true }
		} catch (err) {
			error.value = err instanceof Error ? err.message : '登录失败'
			return { success: false, error: error.value }
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 用户登出
	 */
	const logout = async () => {
		try {
			await userApi.logout()
		} finally {
			currentUser.value = null
			error.value = null
		}
	}

	/**
	 * 更新用户信息
	 * @param updates 更新数据
	 */
	const updateUser = async (updates: Partial<IUser>) => {
		if (!currentUser.value) return { success: false, error: '用户未登录' }

		try {
			isLoading.value = true
			error.value = null

			const response = await userApi.updateUser(currentUser.value.id, updates)
			currentUser.value.update(response.data)

			return { success: true }
		} catch (err) {
			error.value = err instanceof Error ? err.message : '更新失败'
			return { success: false, error: error.value }
		} finally {
			isLoading.value = false
		}
	}

	return {
		// State
		currentUser: readonly(currentUser),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Getters
		isAuthenticated,
		userDisplayName,

		// Actions
		login,
		logout,
		updateUser,
	}
})
```

### 1.3 API 请求模块

#### HTTP 客户端封装

```typescript
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { IApiResponse } from '@/types/api'

/**
 * HTTP 客户端类
 * @description 封装 axios，提供统一的请求处理
 */
class HttpClient {
	private instance: AxiosInstance

	constructor(baseURL: string) {
		this.instance = axios.create({
			baseURL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		})

		this.setupInterceptors()
	}

	/**
	 * 设置请求和响应拦截器
	 */
	private setupInterceptors(): void {
		// 请求拦截器
		this.instance.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem('auth_token')
				if (token) {
					config.headers.Authorization = `Bearer ${token}`
				}
				return config
			},
			(error) => Promise.reject(error),
		)

		// 响应拦截器
		this.instance.interceptors.response.use(
			(response) => response.data,
			(error) => {
				if (error.response?.status === 401) {
					// 处理未授权错误
					localStorage.removeItem('auth_token')
					window.location.href = '/login'
				}
				return Promise.reject(error)
			},
		)
	}

	/**
	 * GET 请求
	 * @param url 请求地址
	 * @param config 请求配置
	 */
	async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
		return this.instance.get(url, config)
	}

	/**
	 * POST 请求
	 * @param url 请求地址
	 * @param data 请求数据
	 * @param config 请求配置
	 */
	async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
		return this.instance.post(url, data, config)
	}

	/**
	 * PUT 请求
	 * @param url 请求地址
	 * @param data 请求数据
	 * @param config 请求配置
	 */
	async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
		return this.instance.put(url, data, config)
	}

	/**
	 * DELETE 请求
	 * @param url 请求地址
	 * @param config 请求配置
	 */
	async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
		return this.instance.delete(url, config)
	}
}

// 创建默认实例
export const httpClient = new HttpClient(import.meta.env.VITE_API_BASE_URL)
```

#### API 模块定义

```typescript
import { httpClient } from '@/utils/http'
import type { IUser, ICreateUserRequest } from '@/types/user'

/**
 * 用户相关 API
 * @description 封装用户相关的所有 API 请求
 */
export const userApi = {
	/**
	 * 用户登录
	 * @param credentials 登录凭据
	 */
	login: (credentials: { email: string; password: string }) => httpClient.post<IUser>('/auth/login', credentials),

	/**
	 * 用户登出
	 */
	logout: () => httpClient.post('/auth/logout'),

	/**
	 * 获取当前用户信息
	 */
	getCurrentUser: () => httpClient.get<IUser>('/user/profile'),

	/**
	 * 更新用户信息
	 * @param id 用户ID
	 * @param updates 更新数据
	 */
	updateUser: (id: string, updates: Partial<IUser>) => httpClient.put<IUser>(`/user/${id}`, updates),

	/**
	 * 创建用户
	 * @param userData 用户数据
	 */
	createUser: (userData: ICreateUserRequest) => httpClient.post<IUser>('/user', userData),

	/**
	 * 删除用户
	 * @param id 用户ID
	 */
	deleteUser: (id: string) => httpClient.delete(`/user/${id}`),

	/**
	 * 获取用户列表
	 * @param params 查询参数
	 */
	getUserList: (params?: { page?: number; limit?: number; search?: string }) =>
		httpClient.get<{ users: IUser[]; total: number }>('/user', { params }),
}
```

## 2. 视图层（View）规范

### 2.1 Vue3 单文件组件结构

#### 基础组件模板

```vue
<template>
	<div class="user-profile">
		<!-- 加载状态 -->
		<div v-if="isLoading" class="loading">
			<LoadingSpinner />
		</div>

		<!-- 错误状态 -->
		<div v-else-if="error" class="error">
			<ErrorMessage :message="error" @retry="handleRetry" />
		</div>

		<!-- 正常内容 -->
		<div v-else class="content">
			<UserAvatar :src="user?.avatar" :alt="user?.username" size="large" @click="handleAvatarClick" />

			<div class="user-info">
				<h2 class="username">{{ user?.username }}</h2>
				<p class="email">{{ user?.email }}</p>

				<div class="actions">
					<BaseButton variant="primary" @click="handleEdit"> 编辑资料 </BaseButton>

					<BaseButton variant="secondary" @click="handleLogout"> 退出登录 </BaseButton>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import { useUserStore } from '@/stores/user'
	import { useUserProfile } from '@/composables/useUserProfile'
	import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
	import ErrorMessage from '@/components/ui/ErrorMessage.vue'
	import UserAvatar from '@/components/user/UserAvatar.vue'
	import BaseButton from '@/components/ui/BaseButton.vue'

	/**
	 * 用户资料组件
	 * @description 展示和管理用户个人资料
	 */

	// Props 定义
	interface Props {
		/** 用户ID，可选，默认显示当前用户 */
		userId?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		userId: undefined,
	})

	// Emits 定义
	interface Emits {
		/** 用户信息更新事件 */
		userUpdated: [user: IUser]
		/** 用户登出事件 */
		userLoggedOut: []
	}

	const emit = defineEmits<Emits>()

	// 组合式函数
	const router = useRouter()
	const userStore = useUserStore()
	const { user, isLoading, error, refreshUser } = useUserProfile(props.userId)

	// 计算属性
	const isCurrentUser = computed(() => !props.userId || props.userId === userStore.currentUser?.id)

	// 事件处理
	/**
	 * 处理头像点击
	 */
	const handleAvatarClick = (): void => {
		if (isCurrentUser.value) {
			// 打开头像上传对话框
			console.log('打开头像上传')
		}
	}

	/**
	 * 处理编辑按钮点击
	 */
	const handleEdit = (): void => {
		router.push('/profile/edit')
	}

	/**
	 * 处理登出
	 */
	const handleLogout = async (): Promise<void> => {
		const result = await userStore.logout()
		if (result.success) {
			emit('userLoggedOut')
			router.push('/login')
		}
	}

	/**
	 * 处理重试
	 */
	const handleRetry = (): void => {
		refreshUser()
	}
</script>

<style scoped lang="scss">
	.user-profile {
		@apply max-w-md mx-auto p-6 bg-white rounded-lg shadow-md;

		.loading,
		.error {
			@apply flex items-center justify-center min-h-[200px];
		}

		.content {
			@apply text-center;

			.user-info {
				@apply mt-4;

				.username {
					@apply text-2xl font-bold text-gray-900 mb-2;
				}

				.email {
					@apply text-gray-600 mb-4;
				}

				.actions {
					@apply flex gap-3 justify-center;
				}
			}
		}
	}
</style>
```

### 2.2 组件分类规范

#### 展示型组件（Presentational Components）

```vue
<!-- UserCard.vue - 纯展示组件 -->
<template>
	<div class="user-card">
		<UserAvatar :src="user.avatar" :alt="user.username" />
		<div class="user-info">
			<h3>{{ user.username }}</h3>
			<p>{{ user.email }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { IUser } from '@/types/user'
	import UserAvatar from './UserAvatar.vue'

	/**
	 * 用户卡片组件
	 * @description 纯展示型组件，只负责UI渲染
	 */

	interface Props {
		/** 用户信息 */
		user: IUser
	}

	defineProps<Props>()
</script>
```

#### 容器型组件（Container Components）

```vue
<!-- UserList.vue - 容器组件 -->
<template>
	<div class="user-list">
		<div class="header">
			<h2>用户列表</h2>
			<BaseButton @click="handleRefresh">刷新</BaseButton>
		</div>

		<div v-if="isLoading" class="loading">
			<LoadingSpinner />
		</div>

		<div v-else-if="error" class="error">
			<ErrorMessage :message="error" @retry="handleRefresh" />
		</div>

		<div v-else class="content">
			<UserCard v-for="user in users" :key="user.id" :user="user" @click="handleUserClick(user)" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted } from 'vue'
	import { useUserList } from '@/composables/useUserList'
	import UserCard from '@/components/user/UserCard.vue'
	import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
	import ErrorMessage from '@/components/ui/ErrorMessage.vue'
	import BaseButton from '@/components/ui/BaseButton.vue'

	/**
	 * 用户列表容器组件
	 * @description 负责数据获取和业务逻辑处理
	 */

	// 使用组合式函数获取数据和状态
	const { users, isLoading, error, fetchUsers } = useUserList()

	// 事件处理
	const handleRefresh = (): void => {
		fetchUsers()
	}

	const handleUserClick = (user: IUser): void => {
		// 处理用户点击事件
		console.log('用户点击:', user)
	}

	// 组件挂载时获取数据
	onMounted(() => {
		fetchUsers()
	})
</script>
```

### 2.3 响应式UI组件库

#### 基础按钮组件

```vue
<!-- BaseButton.vue -->
<template>
	<button :class="buttonClasses" :disabled="disabled || loading" :type="type" @click="handleClick">
		<LoadingSpinner v-if="loading" size="small" />
		<slot v-else />
	</button>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import LoadingSpinner from './LoadingSpinner.vue'

	/**
	 * 基础按钮组件
	 * @description 提供统一的按钮样式和行为
	 */

	interface Props {
		/** 按钮变体 */
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
		/** 按钮尺寸 */
		size?: 'small' | 'medium' | 'large'
		/** 是否禁用 */
		disabled?: boolean
		/** 是否加载中 */
		loading?: boolean
		/** 按钮类型 */
		type?: 'button' | 'submit' | 'reset'
		/** 是否为块级按钮 */
		block?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		variant: 'primary',
		size: 'medium',
		disabled: false,
		loading: false,
		type: 'button',
		block: false,
	})

	interface Emits {
		click: [event: MouseEvent]
	}

	const emit = defineEmits<Emits>()

	// 计算按钮样式类
	const buttonClasses = computed(() => [
		'base-button',
		`base-button--${props.variant}`,
		`base-button--${props.size}`,
		{
			'base-button--disabled': props.disabled,
			'base-button--loading': props.loading,
			'base-button--block': props.block,
		},
	])

	// 处理点击事件
	const handleClick = (event: MouseEvent): void => {
		if (!props.disabled && !props.loading) {
			emit('click', event)
		}
	}
</script>

<style scoped lang="scss">
	.base-button {
		@apply inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;

		// 尺寸变体
		&--small {
			@apply px-3 py-1.5 text-sm;
		}

		&--medium {
			@apply px-4 py-2 text-base;
		}

		&--large {
			@apply px-6 py-3 text-lg;
		}

		// 颜色变体
		&--primary {
			@apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
		}

		&--secondary {
			@apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
		}

		&--danger {
			@apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
		}

		&--ghost {
			@apply bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500;
		}

		// 状态变体
		&--disabled {
			@apply opacity-50 cursor-not-allowed;
		}

		&--loading {
			@apply cursor-wait;
		}

		&--block {
			@apply w-full;
		}
	}
</style>
```

## 3. 控制层（Controller）规范

### 3.1 组合式函数（Composables）

#### 用户相关组合式函数

```typescript
// composables/useUserProfile.ts
import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import type { IUser } from '@/types/user'

/**
 * 用户资料组合式函数
 * @description 管理用户资料相关的状态和操作
 * @param userId 用户ID，可选
 */
export function useUserProfile(userId?: string) {
	const userStore = useUserStore()

	// 响应式状态
	const user = ref<IUser | null>(null)
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// 计算属性
	const isCurrentUser = computed(() => !userId || userId === userStore.currentUser?.id)

	/**
	 * 获取用户信息
	 */
	const fetchUser = async (): Promise<void> => {
		try {
			isLoading.value = true
			error.value = null

			if (isCurrentUser.value) {
				// 获取当前用户信息
				const response = await userApi.getCurrentUser()
				user.value = response.data
			} else if (userId) {
				// 获取指定用户信息
				const response = await userApi.getUserById(userId)
				user.value = response.data
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : '获取用户信息失败'
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 更新用户信息
	 * @param updates 更新数据
	 */
	const updateUser = async (updates: Partial<IUser>): Promise<{ success: boolean; error?: string }> => {
		if (!user.value) {
			return { success: false, error: '用户信息不存在' }
		}

		try {
			isLoading.value = true
			error.value = null

			const response = await userApi.updateUser(user.value.id, updates)
			user.value = response.data

			// 如果是当前用户，同步更新 store
			if (isCurrentUser.value) {
				await userStore.updateUser(updates)
			}

			return { success: true }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '更新用户信息失败'
			error.value = errorMessage
			return { success: false, error: errorMessage }
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 刷新用户信息
	 */
	const refreshUser = (): void => {
		fetchUser()
	}

	// 监听用户ID变化
	watch(
		() => userId,
		() => {
			if (userId) {
				fetchUser()
			}
		},
		{ immediate: true },
	)

	return {
		// 状态
		user: readonly(user),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// 计算属性
		isCurrentUser,

		// 方法
		fetchUser,
		updateUser,
		refreshUser,
	}
}
```

#### 列表管理组合式函数

```typescript
// composables/useList.ts
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

/**
 * 通用列表管理组合式函数
 * @description 提供列表数据的通用管理功能
 */
export function useList<T extends { id: string }>(fetchFn: () => Promise<T[]>) {
	// 响应式状态
	const items = ref<T[]>([]) as Ref<T[]>
	const isLoading = ref(false)
	const error = ref<string | null>(null)
	const selectedItems = ref<Set<string>>(new Set())

	// 计算属性
	const isEmpty = computed(() => items.value.length === 0)
	const selectedCount = computed(() => selectedItems.value.size)
	const isAllSelected = computed(() => items.value.length > 0 && selectedItems.value.size === items.value.length)
	const isPartiallySelected = computed(
		() => selectedItems.value.size > 0 && selectedItems.value.size < items.value.length,
	)

	/**
	 * 获取列表数据
	 */
	const fetchItems = async (): Promise<void> => {
		try {
			isLoading.value = true
			error.value = null

			const data = await fetchFn()
			items.value = data
		} catch (err) {
			error.value = err instanceof Error ? err.message : '获取数据失败'
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 添加项目
	 * @param item 新项目
	 */
	const addItem = (item: T): void => {
		items.value.unshift(item)
	}

	/**
	 * 更新项目
	 * @param id 项目ID
	 * @param updates 更新数据
	 */
	const updateItem = (id: string, updates: Partial<T>): void => {
		const index = items.value.findIndex((item) => item.id === id)
		if (index !== -1) {
			items.value[index] = { ...items.value[index], ...updates }
		}
	}

	/**
	 * 删除项目
	 * @param id 项目ID
	 */
	const removeItem = (id: string): void => {
		const index = items.value.findIndex((item) => item.id === id)
		if (index !== -1) {
			items.value.splice(index, 1)
			selectedItems.value.delete(id)
		}
	}

	/**
	 * 选择项目
	 * @param id 项目ID
	 * @param selected 是否选中
	 */
	const selectItem = (id: string, selected: boolean): void => {
		if (selected) {
			selectedItems.value.add(id)
		} else {
			selectedItems.value.delete(id)
		}
	}

	/**
	 * 全选/取消全选
	 * @param selected 是否全选
	 */
	const selectAll = (selected: boolean): void => {
		if (selected) {
			items.value.forEach((item) => selectedItems.value.add(item.id))
		} else {
			selectedItems.value.clear()
		}
	}

	/**
	 * 清空选择
	 */
	const clearSelection = (): void => {
		selectedItems.value.clear()
	}

	/**
	 * 获取选中的项目
	 */
	const getSelectedItems = (): T[] => {
		return items.value.filter((item) => selectedItems.value.has(item.id))
	}

	return {
		// 状态
		items: readonly(items),
		isLoading: readonly(isLoading),
		error: readonly(error),
		selectedItems: readonly(selectedItems),

		// 计算属性
		isEmpty,
		selectedCount,
		isAllSelected,
		isPartiallySelected,

		// 方法
		fetchItems,
		addItem,
		updateItem,
		removeItem,
		selectItem,
		selectAll,
		clearSelection,
		getSelectedItems,
	}
}
```

### 3.2 路由管理

#### 路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'Home',
		component: () => import('@/views/Home.vue'),
		meta: {
			title: '首页',
			requiresAuth: false,
		},
	},
	{
		path: '/login',
		name: 'Login',
		component: () => import('@/views/auth/Login.vue'),
		meta: {
			title: '登录',
			requiresAuth: false,
			hideForAuth: true, // 已登录用户隐藏
		},
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: () => import('@/views/Dashboard.vue'),
		meta: {
			title: '仪表板',
			requiresAuth: true,
		},
	},
	{
		path: '/profile',
		name: 'Profile',
		component: () => import('@/views/user/Profile.vue'),
		meta: {
			title: '个人资料',
			requiresAuth: true,
		},
	},
	{
		path: '/users',
		name: 'UserList',
		component: () => import('@/views/user/UserList.vue'),
		meta: {
			title: '用户管理',
			requiresAuth: true,
			roles: ['admin'], // 需要管理员权限
		},
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: () => import('@/views/error/NotFound.vue'),
		meta: {
			title: '页面未找到',
		},
	},
]

/**
 * 创建路由实例
 */
const router = createRouter({
	history: createWebHistory(),
	routes,
})

/**
 * 全局前置守卫
 */
router.beforeEach(async (to, from, next) => {
	const userStore = useUserStore()

	// 设置页面标题
	if (to.meta.title) {
		document.title = `${to.meta.title} - 玲珑OS`
	}

	// 检查认证要求
	if (to.meta.requiresAuth) {
		if (!userStore.isAuthenticated) {
			// 未登录，重定向到登录页
			next({ name: 'Login', query: { redirect: to.fullPath } })
			return
		}

		// 检查角色权限
		if (to.meta.roles && Array.isArray(to.meta.roles)) {
			const userRoles = userStore.currentUser?.roles || []
			const hasPermission = to.meta.roles.some((role) => userRoles.includes(role))

			if (!hasPermission) {
				// 权限不足，重定向到首页
				next({ name: 'Home' })
				return
			}
		}
	}

	// 已登录用户访问登录页，重定向到首页
	if (to.meta.hideForAuth && userStore.isAuthenticated) {
		next({ name: 'Home' })
		return
	}

	next()
})

/**
 * 全局后置钩子
 */
router.afterEach((to, from) => {
	// 页面切换后的处理
	console.log(`路由从 ${from.name} 切换到 ${to.name}`)
})

export default router
```

## 4. 项目结构规范

### 4.1 目录结构

```
src/
├── api/                    # API 请求模块
│   ├── user.ts            # 用户相关 API
│   ├── auth.ts            # 认证相关 API
│   └── index.ts           # API 统一导出
├── assets/                # 静态资源
│   ├── images/            # 图片资源
│   ├── icons/             # 图标资源
│   └── styles/            # 全局样式
├── components/            # 组件
│   ├── ui/                # 基础 UI 组件
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   └── index.ts
│   ├── user/              # 用户相关组件
│   │   ├── UserCard.vue
│   │   ├── UserAvatar.vue
│   │   └── index.ts
│   └── layout/            # 布局组件
│       ├── AppHeader.vue
│       ├── AppSidebar.vue
│       └── AppLayout.vue
├── composables/           # 组合式函数
│   ├── useUserProfile.ts
│   ├── useList.ts
│   └── index.ts
├── models/                # 数据模型
│   ├── User.ts
│   ├── BaseModel.ts
│   └── index.ts
├── router/                # 路由配置
│   ├── index.ts
│   ├── guards.ts
│   └── routes.ts
├── stores/                # Pinia 状态管理
│   ├── user.ts
│   ├── app.ts
│   └── index.ts
├── types/                 # TypeScript 类型定义
│   ├── user.ts
│   ├── api.ts
│   ├── common.ts
│   └── index.ts
├── utils/                 # 工具函数
│   ├── http.ts
│   ├── validation.ts
│   ├── format.ts
│   └── index.ts
├── views/                 # 页面组件
│   ├── Home.vue
│   ├── Dashboard.vue
│   ├── auth/
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── user/
│   │   ├── Profile.vue
│   │   └── UserList.vue
│   └── error/
│       ├── NotFound.vue
│       └── ServerError.vue
├── App.vue                # 根组件
└── main.ts               # 应用入口
```

### 4.2 命名规范

#### 文件命名

- **组件文件**: 使用 PascalCase，如 `UserProfile.vue`
- **工具文件**: 使用 camelCase，如 `httpClient.ts`
- **类型文件**: 使用 camelCase，如 `userTypes.ts`
- **常量文件**: 使用 SCREAMING_SNAKE_CASE，如 `API_CONSTANTS.ts`

#### 变量命名

- **变量和函数**: 使用 camelCase，如 `userName`, `getUserInfo()`
- **常量**: 使用 SCREAMING_SNAKE_CASE，如 `API_BASE_URL`
- **类名**: 使用 PascalCase，如 `UserService`
- **接口名**: 使用 PascalCase 并以 `I` 开头，如 `IUser`

## 5. 代码质量规范

### 5.1 TypeScript 规范

#### 严格类型检查

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 避免 any 类型

```typescript
// ❌ 错误示例
function processData(data: any): any {
	return data.someProperty
}

// ✅ 正确示例
interface IProcessableData {
	someProperty: string
	otherProperty?: number
}

function processData(data: IProcessableData): string {
	return data.someProperty
}

// 对于未知类型，使用 unknown
function handleUnknownData(data: unknown): string {
	if (typeof data === 'object' && data !== null && 'message' in data) {
		return String((data as { message: unknown }).message)
	}
	return 'Unknown data'
}
```

### 5.2 ESLint 配置

```javascript
// eslint.config.js
export default [
	{
		rules: {
			// TypeScript 规则
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',

			// Vue 规则
			'vue/component-name-in-template-casing': ['error', 'PascalCase'],
			'vue/define-props-declaration': ['error', 'type-based'],
			'vue/define-emits-declaration': ['error', 'type-based'],
			'vue/no-undef-components': 'error',
			'vue/no-unused-refs': 'error',

			// 通用规则
			'prefer-const': 'error',
			'no-var': 'error',
			'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		},
	},
]
```

### 5.3 单元测试规范

#### 组件测试示例

```typescript
// tests/components/UserCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from '@/components/user/UserCard.vue'
import type { IUser } from '@/types/user'

/**
 * UserCard 组件测试
 */
describe('UserCard', () => {
	const mockUser: IUser = {
		id: '1',
		username: 'testuser',
		email: 'test@example.com',
		createdAt: new Date('2023-01-01'),
		updatedAt: new Date('2023-01-01'),
	}

	it('应该正确渲染用户信息', () => {
		const wrapper = mount(UserCard, {
			props: {
				user: mockUser,
			},
		})

		expect(wrapper.text()).toContain(mockUser.username)
		expect(wrapper.text()).toContain(mockUser.email)
	})

	it('应该在点击时触发事件', async () => {
		const wrapper = mount(UserCard, {
			props: {
				user: mockUser,
			},
		})

		await wrapper.trigger('click')
		expect(wrapper.emitted('click')).toBeTruthy()
		expect(wrapper.emitted('click')?.[0]).toEqual([mockUser])
	})
})
```

#### 组合式函数测试

```typescript
// tests/composables/useUserProfile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserProfile } from '@/composables/useUserProfile'
import { userApi } from '@/api/user'

// Mock API
vi.mock('@/api/user', () => ({
	userApi: {
		getCurrentUser: vi.fn(),
		updateUser: vi.fn(),
	},
}))

/**
 * useUserProfile 组合式函数测试
 */
describe('useUserProfile', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('应该正确获取用户信息', async () => {
		const mockUser = {
			id: '1',
			username: 'testuser',
			email: 'test@example.com',
		}

		vi.mocked(userApi.getCurrentUser).mockResolvedValue({
			code: 200,
			message: 'success',
			data: mockUser,
			timestamp: Date.now(),
		})

		const { user, fetchUser, isLoading } = useUserProfile()

		expect(isLoading.value).toBe(false)

		await fetchUser()

		expect(user.value).toEqual(mockUser)
		expect(userApi.getCurrentUser).toHaveBeenCalledOnce()
	})

	it('应该正确处理错误', async () => {
		const errorMessage = '获取用户信息失败'
		vi.mocked(userApi.getCurrentUser).mockRejectedValue(new Error(errorMessage))

		const { error, fetchUser } = useUserProfile()

		await fetchUser()

		expect(error.value).toBe(errorMessage)
	})
})
```

## 6. 性能优化规范

### 6.1 组件优化

#### 使用 defineAsyncComponent 懒加载

```typescript
// router/routes.ts
import { defineAsyncComponent } from 'vue'

const routes = [
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: defineAsyncComponent(() => import('@/views/Dashboard.vue')),
	},
]
```

#### 使用 v-memo 优化列表渲染

```vue
<template>
	<div class="user-list">
		<div v-for="user in users" :key="user.id" v-memo="[user.id, user.updatedAt]" class="user-item">
			<UserCard :user="user" />
		</div>
	</div>
</template>
```

#### 使用 Suspense 处理异步组件

```vue
<template>
	<Suspense>
		<template #default>
			<AsyncUserList />
		</template>
		<template #fallback>
			<LoadingSpinner />
		</template>
	</Suspense>
</template>
```

### 6.2 状态管理优化

#### 使用 shallowRef 优化大对象

```typescript
import { shallowRef } from 'vue'

// 对于大型对象或数组，使用 shallowRef
const largeDataSet = shallowRef<LargeDataType[]>([])

// 更新时需要替换整个对象
const updateLargeDataSet = (newData: LargeDataType[]) => {
	largeDataSet.value = [...newData]
}
```

## 7. 文档规范

### 7.1 组件文档

每个组件都应包含完整的 JSDoc 注释：

````vue
<script setup lang="ts">
	/**
	 * 用户资料卡片组件
	 *
	 * @description 展示用户基本信息的卡片组件，支持头像、用户名、邮箱等信息展示
	 *
	 * @example
	 * ```vue
	 * <UserProfileCard
	 *   :user="userInfo"
	 *   :editable="true"
	 *   @edit="handleEdit"
	 * />
	 * ```
	 *
	 * @author 开发者姓名
	 * @since 1.0.0
	 */

	interface Props {
		/** 用户信息对象 */
		user: IUser
		/** 是否可编辑，默认为 false */
		editable?: boolean
		/** 卡片尺寸 */
		size?: 'small' | 'medium' | 'large'
	}

	interface Emits {
		/** 编辑按钮点击事件 */
		edit: [user: IUser]
		/** 删除按钮点击事件 */
		delete: [userId: string]
	}
</script>
````

### 7.2 API 文档

````typescript
/**
 * 用户管理 API
 *
 * @description 提供用户相关的所有 API 接口
 * @version 1.0.0
 */
export const userApi = {
	/**
	 * 获取用户列表
	 *
	 * @param params 查询参数
	 * @param params.page 页码，从 1 开始
	 * @param params.limit 每页数量，默认 20
	 * @param params.search 搜索关键词
	 * @returns 用户列表和总数
	 *
	 * @example
	 * ```typescript
	 * const result = await userApi.getUserList({ page: 1, limit: 10 })
	 * console.log(result.data.users) // 用户列表
	 * console.log(result.data.total) // 总数
	 * ```
	 */
	getUserList: (params?: { page?: number; limit?: number; search?: string }) =>
		httpClient.get<{ users: IUser[]; total: number }>('/users', { params }),
}
````

## 8. AI编程开发规范补充

### 8.1 AI辅助开发最佳实践

#### 代码生成规范

```typescript
/**
 * AI生成代码标识
 * @ai-generated true
 * @ai-model Claude/GPT-4
 * @generated-date 2024-01-01
 * @reviewed-by 开发者姓名
 * @review-date 2024-01-01
 */
export class AIGeneratedComponent {
	// AI生成的代码应包含详细注释
}
```

#### 提示词工程规范

```typescript
/**
 * 组件需求描述模板
 *
 * @prompt-template
 * 创建一个 {组件名称} 组件，需要满足以下要求：
 * 1. 功能需求：{具体功能描述}
 * 2. 技术栈：Vue3 + TypeScript + Composition API
 * 3. 样式要求：{UI/UX要求}
 * 4. 性能要求：{性能指标}
 * 5. 测试要求：{测试覆盖率要求}
 */
```

### 8.2 代码审查与质量保证

#### AI代码审查检查清单

- [ ] 类型安全：所有变量和函数都有明确类型定义
- [ ] 错误处理：包含完整的异常处理机制
- [ ] 性能优化：使用适当的Vue3优化技术
- [ ] 安全性：无安全漏洞和敏感信息泄露
- [ ] 可维护性：代码结构清晰，注释完整
- [ ] 测试覆盖：包含单元测试和集成测试

#### 自动化质量检测

```typescript
// .github/workflows/ai-code-review.yml
/**
 * AI代码审查工作流
 * @description 自动检测AI生成代码的质量
 */
name: 'AI Code Review'
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-code-review:
    runs-on: ubuntu-latest
    steps:
      - name: 'AI代码质量检测'
        run: |
          # 检测AI生成代码标识
          # 运行类型检查
          # 执行安全扫描
          # 性能基准测试
```

### 8.3 AI协作开发流程

#### 开发流程规范

1. **需求分析阶段**
   - 使用AI辅助需求分析和技术方案设计
   - 生成详细的技术规格文档
   - 创建组件设计原型

2. **代码实现阶段**
   - AI生成基础代码框架
   - 人工审查和优化代码
   - 添加业务逻辑和错误处理

3. **测试验证阶段**
   - AI生成测试用例
   - 人工编写复杂业务逻辑测试
   - 自动化测试执行和报告

4. **部署维护阶段**
   - AI监控代码性能和错误
   - 自动生成维护文档
   - 持续优化和重构建议

### 8.4 AI工具集成

#### 推荐AI开发工具

```typescript
/**
 * AI开发工具配置
 */
export const aiToolsConfig = {
	// 代码生成
	codeGeneration: {
		primary: 'GitHub Copilot',
		secondary: 'Tabnine',
		settings: {
			autoComplete: true,
			contextAware: true,
			multiLanguage: true,
		},
	},

	// 代码审查
	codeReview: {
		tools: ['DeepCode', 'SonarQube', 'CodeClimate'],
		aiAssisted: true,
		autoFix: false, // 需要人工确认
	},

	// 文档生成
	documentation: {
		autoGenerate: true,
		formats: ['JSDoc', 'Markdown', 'OpenAPI'],
		languages: ['zh-CN', 'en-US'],
	},
}
```

#### VS Code AI扩展配置

```json
{
	"ai.codeGeneration.enabled": true,
	"ai.codeReview.autoTrigger": true,
	"ai.documentation.autoUpdate": true,
	"ai.testing.generateTests": true,
	"ai.refactoring.suggestions": true,
	"ai.performance.monitoring": true
}
```

## 9. 安全与合规规范

### 9.1 数据安全

#### 敏感数据处理

```typescript
/**
 * 敏感数据处理工具类
 * @description 确保敏感信息不被意外泄露
 */
export class SecureDataHandler {
	/**
	 * 脱敏处理
	 * @param data 原始数据
	 * @param type 数据类型
	 */
	static mask(data: string, type: 'email' | 'phone' | 'idCard'): string {
		switch (type) {
			case 'email':
				return data.replace(/(\w{1,3})\w*@/, '$1***@')
			case 'phone':
				return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
			case 'idCard':
				return data.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
			default:
				return '***'
		}
	}

	/**
	 * 加密存储
	 * @param data 待加密数据
	 */
	static encrypt(data: string): string {
		// 使用AES加密
		return CryptoJS.AES.encrypt(data, process.env.VITE_ENCRYPT_KEY).toString()
	}
}
```

### 9.2 代码安全扫描

#### 安全检查规则

```typescript
// security-rules.ts
export const securityRules = {
	// 禁止硬编码敏感信息
	noHardcodedSecrets: {
		patterns: [/password\s*=\s*["'][^"']+["']/i, /api[_-]?key\s*=\s*["'][^"']+["']/i, /secret\s*=\s*["'][^"']+["']/i],
		severity: 'error',
	},

	// 防止XSS攻击
	preventXSS: {
		rules: ['no-innerHTML-assignment', 'no-eval-usage', 'sanitize-user-input'],
	},

	// 防止CSRF攻击
	preventCSRF: {
		requireCSRFToken: true,
		validateOrigin: true,
	},
}
```

## 10. 总结

本规范严格遵循 MVC 架构模式和AI编程开发最佳实践，通过以下方式确保代码质量：

1. **数据层（Model）**: 使用 TypeScript 强类型系统，Pinia 状态管理，统一的 API 封装
2. **视图层（View）**: Vue3 Composition API，组件化开发，响应式 UI 设计
3. **控制层（Controller）**: 组合式函数封装业务逻辑，路由管理，组件通信
4. **AI协作开发**: 规范化AI辅助开发流程，确保代码质量和安全性

### 关键原则

- **类型安全**: 全面使用 TypeScript，避免 any 类型
- **代码规范**: 严格的 ESLint + Prettier 约束
- **模块化**: 清晰的目录结构和职责分离
- **可测试**: 完善的单元测试覆盖
- **文档化**: 详细的代码注释和 API 文档
- **性能优化**: 合理的懒加载和缓存策略
- **AI协作**: 规范化AI辅助开发，提高开发效率
- **安全合规**: 完善的安全检查和数据保护机制

### AI编程开发核心要求

1. **代码可读性**: AI生成的代码必须包含详细注释和文档
2. **类型安全**: 严格的TypeScript类型检查，杜绝any类型
3. **错误处理**: 完善的异常处理和用户友好的错误提示
4. **性能优化**: 合理使用Vue3性能优化技术
5. **安全性**: 防范常见安全漏洞，保护用户数据
6. **可维护性**: 清晰的代码结构和模块化设计
7. **测试覆盖**: 自动化测试确保代码质量
8. **持续集成**: AI辅助的代码审查和质量监控

遵循本规范将确保项目具有良好的可维护性、可扩展性、安全性和团队协作效率，同时充分发挥AI辅助开发的优势。
