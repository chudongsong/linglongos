import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/index.css'

/**
 * 应用程序入口文件
 * @description 初始化 Vue 应用、路由和状态管理
 */
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')