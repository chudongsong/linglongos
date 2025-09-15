import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 路由配置
 * @description 定义应用的路由规则和导航守卫
 */

/**
 * 路由记录定义
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    redirect: '/desktop'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: '登录 - 玲珑OS',
      requiresAuth: false,
      hideForAuth: true // 已登录用户隐藏此页面
    }
  },
  {
    path: '/desktop',
    name: 'Desktop',
    component: () => import('@/views/DesktopView.vue'),
    meta: {
      title: '桌面 - 玲珑OS',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '页面未找到 - 玲珑OS',
      requiresAuth: false
    }
  }
]

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * 全局前置守卫
 * @description 处理路由认证和权限控制
 */
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 检查认证状态
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth
  const hideForAuth = to.meta.hideForAuth

  // 如果页面需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 如果用户已登录但访问登录页，重定向到桌面
  if (hideForAuth && isAuthenticated) {
    next({ name: 'Desktop' })
    return
  }

  next()
})

/**
 * 全局后置钩子
 * @description 路由切换完成后的处理
 */
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
  console.log(`路由切换: ${String(from.name)} -> ${String(to.name)}`)
})

export default router