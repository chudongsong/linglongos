import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { AuthState, User, LoginCredentials, Permission } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const currentUser = computed(() => user.value)
  const userPermissions = computed(() => permissions.value)

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 模拟API调用
      const response = await mockLogin(credentials)
      
      if (response.success) {
        user.value = response.user
        token.value = response.token
        permissions.value = response.permissions
        
        // 存储到本地存储
        if (credentials.remember) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('user_data', JSON.stringify(response.user))
          localStorage.setItem('user_permissions', JSON.stringify(response.permissions))
        } else {
          sessionStorage.setItem('auth_token', response.token)
          sessionStorage.setItem('user_data', JSON.stringify(response.user))
          sessionStorage.setItem('user_permissions', JSON.stringify(response.permissions))
        }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    
    try {
      // 清除本地状态
      user.value = null
      token.value = null
      permissions.value = []
      error.value = null
      
      // 清除存储
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_permissions')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user_data')
      sessionStorage.removeItem('user_permissions')
      
      // 模拟API调用通知服务器
      await mockLogout()
    } finally {
      loading.value = false
    }
  }

  async function refreshToken(): Promise<void> {
    if (!token.value) return

    try {
      const response = await mockRefreshToken(token.value)
      if (response.success) {
        token.value = response.token
        // 更新存储中的token
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('auth_token', response.token)
      } else {
        // token无效，登出
        await logout()
      }
    } catch {
      await logout()
    }
  }

  function restoreSession(): void {
    // 优先从localStorage恢复，然后是sessionStorage
    const token_storage = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const user_storage = localStorage.getItem('user_data') || sessionStorage.getItem('user_data')
    const permissions_storage = localStorage.getItem('user_permissions') || sessionStorage.getItem('user_permissions')

    if (token_storage && user_storage && permissions_storage) {
      try {
        token.value = token_storage
        user.value = JSON.parse(user_storage)
        permissions.value = JSON.parse(permissions_storage)
      } catch {
        // 解析失败，清除无效数据
        logout()
      }
    }
  }

  function checkPermission(permission: string): boolean {
    return permissions.value.some(p => 
      p.resource === permission || 
      p.action === permission ||
      `${p.resource}:${p.action}` === permission
    )
  }

  function updateUser(userData: Partial<User>): void {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      
      // 更新存储
      const storage = localStorage.getItem('user_data') ? localStorage : sessionStorage
      storage.setItem('user_data', JSON.stringify(user.value))
    }
  }

  function setError(errorMessage: string): void {
    error.value = errorMessage
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    isAuthenticated,
    currentUser,
    userPermissions,
    
    // Actions
    login,
    logout,
    refreshToken,
    restoreSession,
    checkPermission,
    updateUser,
    setError,
    clearError
  }
})

// Mock API functions
async function mockLogin(credentials: LoginCredentials) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 简单的模拟验证
  if (credentials.username === 'admin' && credentials.password === 'admin') {
    return {
      success: true,
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@linglongos.com',
        avatar: '/avatars/admin.png',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        is2FAEnabled: false
      } as User,
      token: 'mock_jwt_token_' + Date.now(),
      permissions: [
        { id: '1', name: '系统管理', resource: 'system', action: 'admin' },
        { id: '2', name: '文件管理', resource: 'files', action: 'manage' },
        { id: '3', name: '应用管理', resource: 'apps', action: 'manage' }
      ] as Permission[]
    }
  } else {
    return {
      success: false,
      message: '用户名或密码错误'
    }
  }
}

async function mockLogout() {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  return { success: true }
}

async function mockRefreshToken(token: string) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 简单验证token格式
  if (token.startsWith('mock_jwt_token_')) {
    return {
      success: true,
      token: 'mock_jwt_token_' + Date.now()
    }
  } else {
    return {
      success: false,
      message: 'Invalid token'
    }
  }
}