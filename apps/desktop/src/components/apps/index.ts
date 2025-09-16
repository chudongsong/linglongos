// 应用组件注册表
import { defineAsyncComponent } from 'vue'

// 动态导入应用组件
export const AppComponents = {
  'FileManager': defineAsyncComponent(() => import('./FileManager.vue')),
  'Terminal': defineAsyncComponent(() => import('./Terminal.vue')),
  'TaskManager': defineAsyncComponent(() => import('./TaskManager.vue')),
  'Settings': defineAsyncComponent(() => import('./Settings.vue')),
  'Calculator': defineAsyncComponent(() => import('./Calculator.vue')),
  'TextEditor': defineAsyncComponent(() => import('./TextEditor.vue'))
}

// 注册所有应用组件
export function registerAppComponents(app: any) {
  Object.entries(AppComponents).forEach(([name, component]) => {
    app.component(name, component)
  })
}