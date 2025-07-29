import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@linglongos/shared-types'

interface LoginCredentials {
  username: string
  password: string
  rememberMe: boolean
}

interface LoginResult {
  success: boolean
  requires2FA: boolean
  user?: User
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const token = ref<string | null>(null)

  /**
   * 登录
   */
  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模拟登录逻辑
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        const mockUser: User = {
          id: '1',
          username: credentials.username,
          email: 'admin@linglongos.com',
          avatar: '',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          is2FAEnabled: false, // 可以设置为true来测试2FA
        }

        if (mockUser.is2FAEnabled) {
          // 需要2FA验证
          user.value = mockUser
          return { success: true, requires2FA: true }
        } else {
          // 直接登录成功
          user.value = mockUser
          isAuthenticated.value = true
          token.value = 'mock-jwt-token'

          // 如果选择记住我，保存到localStorage
          if (credentials.rememberMe) {
            localStorage.setItem('linglongos_token', token.value)
            localStorage.setItem('linglongos_user', JSON.stringify(mockUser))
          }

          return { success: true, requires2FA: false, user: mockUser }
        }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 2FA验证
   */
  const verify2FA = async (code: string): Promise<void> => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟2FA验证逻辑
      if (code === '123456') {
        isAuthenticated.value = true
        token.value = 'mock-jwt-token-2fa'

        // 保存到localStorage
        localStorage.setItem('linglongos_token', token.value)
        if (user.value) {
          localStorage.setItem('linglongos_user', JSON.stringify(user.value))
        }
      } else {
        throw new Error('验证码错误')
      }
    } catch (error) {
      console.error('2FA验证失败:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  const logout = (): void => {
    user.value = null
    isAuthenticated.value = false
    token.value = null

    // 清除localStorage
    localStorage.removeItem('linglongos_token')
    localStorage.removeItem('linglongos_user')
  }

  /**
   * 检查认证状态
   */
  const checkAuth = (): boolean => {
    try {
      const savedToken = localStorage.getItem('linglongos_token')
      const savedUser = localStorage.getItem('linglongos_user')

      if (savedToken && savedUser) {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        isAuthenticated.value = true
        return true
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      logout()
    }

    return false
  }

  /**
   * 刷新用户信息
   */
  const refreshUser = async (): Promise<void> => {
    if (!token.value) {
      throw new Error('未登录')
    }

    try {
      // 模拟API调用获取最新用户信息
      await new Promise(resolve => setTimeout(resolve, 500))

      // 这里应该调用真实的API
      console.log('刷新用户信息')
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }

  return {
    // 状态
    user,
    isAuthenticated,
    token,

    // 方法
    login,
    verify2FA,
    logout,
    checkAuth,
    refreshUser,
  }
})
