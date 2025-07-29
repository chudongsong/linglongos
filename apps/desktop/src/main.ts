import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LinglongUI from '@linglongos/components'
import { appConfig, isDev } from '@linglongos/config'
import App from './App.vue'
import routes from './router'

// 导入样式
import 'uno.css'
import './styles/main.css'

// 输出环境信息
console.log(`应用名称: ${appConfig.appName}`)
console.log(`当前环境: ${isDev() ? '开发环境' : '生产环境'}`)

// 创建应用实例
const app = createApp(App)

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 创建状态管理
const pinia = createPinia()

// 使用插件
app.use(pinia)
app.use(router)
app.use(LinglongUI)

// 挂载应用
app.mount('#app')
