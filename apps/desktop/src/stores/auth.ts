import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { IUser, ILoginRequest, ILoginResponse, AuthStatus } from '@/types/auth'

/**
 * 认证状态管理
 * @description 管理用户认证状态、登录、登出等功能
 */
export const useAuthStore = defineStore('auth', () => {
	// 状态定义
	const currentUser = ref<IUser | null>(null)
	const authStatus = ref<AuthStatus>('unauthenticated' as AuthStatus)
	const accessToken = ref<string | null>(null)
	const refreshToken = ref<string | null>(null)
	const isInitialized = ref(false)
	const loginError = ref<string | null>(null)

	// 计算属性
	const isAuthenticated = computed(() => authStatus.value === 'authenticated' && currentUser.value !== null)

	const isLoading = computed(() => authStatus.value === 'authenticating')

	const userDisplayName = computed(() => currentUser.value?.username || currentUser.value?.email || '未知用户')

	/**
	 * 初始化认证状态
	 * @description 从本地存储恢复认证状态
	 */
	const initializeAuth = async (): Promise<void> => {
		try {
			const storedToken = localStorage.getItem('auth_token')
			const storedUser = localStorage.getItem('auth_user')

			if (storedToken && storedUser) {
				accessToken.value = storedToken
				currentUser.value = JSON.parse(storedUser)
				authStatus.value = 'authenticated' as AuthStatus
			} else {
				authStatus.value = 'unauthenticated' as AuthStatus
			}
		} catch (error) {
			console.error('初始化认证状态失败:', error)
			authStatus.value = 'unauthenticated' as AuthStatus
		} finally {
			isInitialized.value = true
		}
	}

	/**
	 * 用户登录
	 * @param credentials 登录凭据
	 * @returns 登录结果
	 */
	const login = async (credentials: ILoginRequest): Promise<{ success: boolean; error?: string }> => {
		try {
			authStatus.value = 'authenticating' as AuthStatus
			loginError.value = null

			// 模拟 API 调用
			const response = await mockLoginApi(credentials)

			if (response.success) {
				const { accessToken: token, user } = response.data

				// 保存认证信息
				accessToken.value = token
				currentUser.value = user
				authStatus.value = 'authenticated' as AuthStatus

				// 持久化存储
				localStorage.setItem('auth_token', token)
				localStorage.setItem('auth_user', JSON.stringify(user))

				if (credentials.rememberMe) {
					localStorage.setItem('remember_me', 'true')
				}

				return { success: true }
			} else {
				throw new Error(response.message)
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登录失败'
			loginError.value = errorMessage
			authStatus.value = 'failed' as AuthStatus

			return { success: false, error: errorMessage }
		}
	}

	/**
	 * 用户登出
	 * @description 清除认证状态和本地存储
	 */
	const logout = async (): Promise<void> => {
		try {
			// 清除状态
			currentUser.value = null
			accessToken.value = null
			refreshToken.value = null
			authStatus.value = 'unauthenticated' as AuthStatus
			loginError.value = null

			// 清除本地存储
			localStorage.removeItem('auth_token')
			localStorage.removeItem('auth_user')
			localStorage.removeItem('remember_me')
		} catch (error) {
			console.error('登出失败:', error)
		}
	}

	/**
	 * 清除登录错误
	 */
	const clearError = (): void => {
		loginError.value = null
	}

	/**
	 * 模拟登录 API
	 * @param credentials 登录凭据
	 * @returns 模拟响应
	 */
	const mockLoginApi = async (
		credentials: ILoginRequest,
	): Promise<{ success: boolean; data: ILoginResponse; message: string }> => {
		// 模拟网络延迟
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// 模拟用户验证
		if (credentials.email === 'admin@admin.com' && credentials.password === 'admin') {
			const mockUser: IUser = {
				id: '1',
				username: 'admin',
				email: 'admin123@admin.com',
				avatar: '',
				role: 'admin',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
			}

			return {
				success: true,
				data: {
					accessToken: 'mock-jwt-token-' + Date.now(),
					refreshToken: 'mock-refresh-token-' + Date.now(),
					user: mockUser,
					expiresIn: 3600,
				},
				message: '登录成功',
			}
		} else {
			return {
				success: false,
				data: {} as ILoginResponse,
				message: '用户名或密码错误',
			}
		}
	}

	return {
		// 状态
		currentUser: readonly(currentUser),
		authStatus: readonly(authStatus),
		isInitialized: readonly(isInitialized),
		loginError: readonly(loginError),

		// 计算属性
		isAuthenticated,
		isLoading,
		userDisplayName,

		// 方法
		initializeAuth,
		login,
		logout,
		clearError,
	}
})
