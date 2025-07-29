import type { App } from 'vue'

// 导出类型
export type * from './types'

// 导出基础组件
export { default as LButton } from './components/base/LButton.vue'
export { default as LCard } from './components/base/LCard.vue'
export { default as LCheckbox } from './components/base/LCheckbox.vue'
export { default as LDivider } from './components/base/LDivider.vue'
export { default as LDropdown } from './components/base/LDropdown.vue'
export { default as LForm } from './components/base/LForm.vue'
export { default as LFormItem } from './components/base/LFormItem.vue'
export { default as LIcon } from './components/base/LIcon.vue'
export { default as LInput } from './components/base/LInput.vue'
export { default as LModal } from './components/base/LModal.vue'
export { default as LRadio } from './components/base/LRadio.vue'
export { default as LSelect } from './components/base/LSelect.vue'
export { default as LSwitch } from './components/base/LSwitch.vue'

// 导出功能组件
export { default as LCode } from './components/functional/LCode.vue'
export { default as LContextMenu } from './components/functional/LContextMenu.vue'
export { default as LIframe } from './components/functional/LIframe.vue'
export { default as LLog } from './components/functional/LLog.vue'
export { default as LQrcode } from './components/functional/LQrcode.vue'
export { default as LTable } from './components/functional/LTable.vue'
export { default as LWindow } from './components/functional/LWindow.vue'
export { default as LWindowContainer } from './components/functional/LWindowContainer.vue'

// 导出组合式函数
export { useContextMenu, createContextMenuDirective } from './composables/useContextMenu'
export { useIframeCommunication } from './composables/useIframeCommunication'
export { useWindowManager } from './composables/useWindowManager'

// 导出工具函数
export * from './utils/helpers'
export * from './utils/qrcode'

// 基础组件列表
const baseComponents = [
  LButton,
  LCard,
  LCheckbox,
  LDivider,
  LDropdown,
  LForm,
  LFormItem,
  LIcon,
  LInput,
  LModal,
  LRadio,
  LSelect,
  LSwitch,
]

// 功能组件列表
const functionalComponents = [
  LCode,
  LContextMenu,
  LIframe,
  LLog,
  LQrcode,
  LTable,
  LWindow,
  LWindowContainer,
]

// 所有组件列表
const components = [...baseComponents, ...functionalComponents]

// 安装函数
export const install = (app: App): void => {
  components.forEach(component => {
    const name = component.name || component.__name || 'UnknownComponent'
    app.component(name, component)
  })
}

// 默认导出
export default {
  install,
  // 分类导出
  base: {
    install: (app: App): void => {
      baseComponents.forEach(component => {
        const name = component.name || component.__name || 'UnknownComponent'
        app.component(name, component)
      })
    },
  },
  functional: {
    install: (app: App): void => {
      functionalComponents.forEach(component => {
        const name = component.name || component.__name || 'UnknownComponent'
        app.component(name, component)
      })
    },
  },
}
