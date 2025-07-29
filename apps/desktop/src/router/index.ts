import type { RouteRecordRaw } from 'vue-router'
import DesktopView from '../views/DesktopView.vue'
import LoginView from '../views/LoginView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Desktop',
    component: DesktopView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export default routes
