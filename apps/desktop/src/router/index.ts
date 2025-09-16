import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { RouteMeta } from '@/types'
import { useAuthStore } from '@/stores/auth'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: '登录',
      layout: 'blank'
    }
  },
  {
    path: '/',
    name: 'Desktop',
    component: () => import('@/views/DesktopView.vue'),
    meta: {
      requiresAuth: true,
      title: '桌面',
      layout: 'desktop',
      keepAlive: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: '设置',
      permissions: ['system:configure']
    }
  },
  {
    path: '/lock',
    name: 'Lock',
    component: () => import('@/views/LockView.vue'),
    meta: {
      requiresAuth: true,
      title: '锁屏',
      layout: 'blank'
    }
  },
  {
    path: '/error',
    name: 'Error',
    component: () => import('@/views/ErrorView.vue'),
    meta: {
      requiresAuth: false,
      title: '错误',
      layout: 'blank'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
      title: '页面未找到',
      layout: 'blank'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const meta = to.meta as unknown as RouteMeta

  // 设置页面标题
  if (meta.title) {
    document.title = `${meta.title} - 玲珑OS`
  }

  // 先尝试恢复会话（如果还没有恢复）
  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  // 检查认证状态
  if (meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查权限
    if (meta.permissions && meta.permissions.length > 0) {
      const hasPermission = meta.permissions.some(permission => 
        authStore.checkPermission(permission)
      )
      
      if (!hasPermission) {
        // 无权限，重定向到错误页
        next({
          name: 'Error',
          query: { 
            code: '403', 
            message: '权限不足' 
          }
        })
        return
      }
    }

    // 刷新token（如果需要）
    try {
      await authStore.refreshToken()
    } catch (error) {
      // token刷新失败，重定向到登录页
      console.warn('Token refresh failed:', error)
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
  } else {
    // 不需要认证的页面，如果已登录且访问登录页，重定向到首页
    if (to.name === 'Login' && authStore.isAuthenticated) {
      next({ name: 'Desktop' })
      return
    }
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  const meta = to.meta as RouteMeta
  
  // 记录页面访问日志
  console.log(`Navigation: ${from.name || 'Unknown'} -> ${to.name || 'Unknown'}`)
  
  // 处理页面缓存
  if (meta.keepAlive) {
    // 可以在这里实现页面缓存逻辑
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
  
  // 可以显示全局错误提示
  // 或重定向到错误页面
  router.push({
    name: 'Error',
    query: {
      code: '500',
      message: '路由错误'
    }
  })
})

export default router

// 导出路由工具函数
export function useRouter() {
  return router
}

export function useRoute() {
  return router.currentRoute
}

// 编程式导航辅助函数
export const navigation = {
  toLogin(redirect?: string) {
    router.push({
      name: 'Login',
      query: redirect ? { redirect } : undefined
    })
  },
  
  toDesktop() {
    router.push({ name: 'Desktop' })
  },
  
  toSettings() {
    router.push({ name: 'Settings' })
  },
  
  toLock() {
    router.push({ name: 'Lock' })
  },
  
  toError(code: string, message: string) {
    router.push({
      name: 'Error',
      query: { code, message }
    })
  },
  
  back() {
    router.back()
  },
  
  forward() {
    router.forward()
  },
  
  go(delta: number) {
    router.go(delta)
  }
}