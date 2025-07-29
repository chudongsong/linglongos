import { ref, reactive, nextTick } from 'vue'
import type {
  ContextMenuConfig,
  ContextMenuState,
  MenuPosition,
  ContextMenuManager,
} from '../types'

/**
 * 右键菜单管理
 */
export function useContextMenu(): ContextMenuManager {
  // 状态
  const state = reactive<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    activeItem: undefined,
    openSubmenuPath: [],
  })

  const config = ref<ContextMenuConfig>({
    items: [],
    theme: 'auto',
    showIcons: true,
    showAccelerators: true,
    zIndex: 1000,
  })

  /**
   * 显示菜单
   */
  const show = async (position: MenuPosition, menuConfig: ContextMenuConfig): Promise<void> => {
    // 更新配置
    config.value = {
      theme: 'auto',
      showIcons: true,
      showAccelerators: true,
      zIndex: 1000,
      ...menuConfig,
    }

    // 更新状态
    state.position = position
    state.visible = true
    state.activeItem = undefined
    state.openSubmenuPath = []

    // 等待DOM更新
    await nextTick()
  }

  /**
   * 隐藏菜单
   */
  const hide = (): void => {
    state.visible = false
    state.activeItem = undefined
    state.openSubmenuPath = []
  }

  /**
   * 更新菜单配置
   */
  const update = (newConfig: Partial<ContextMenuConfig>): void => {
    config.value = {
      ...config.value,
      ...newConfig,
    }
  }

  /**
   * 获取当前状态
   */
  const getState = (): ContextMenuState => {
    return { ...state }
  }

  /**
   * 销毁菜单
   */
  const destroy = (): void => {
    hide()
  }

  return {
    show,
    hide,
    update,
    getState,
    destroy,
  }
}

/**
 * 右键菜单指令
 */
export function createContextMenuDirective(contextMenu: ContextMenuManager) {
  return {
    mounted(el: HTMLElement, binding: any) {
      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()

        const menuConfig =
          typeof binding.value === 'function' ? binding.value(event) : binding.value

        if (menuConfig && menuConfig.items && menuConfig.items.length > 0) {
          contextMenu.show({ x: event.clientX, y: event.clientY }, menuConfig)
        }
      }

      el.addEventListener('contextmenu', handleContextMenu)

      // 保存处理函数以便清理
      ;(el as any).__contextMenuHandler = handleContextMenu
    },

    unmounted(el: HTMLElement) {
      const handler = (el as any).__contextMenuHandler
      if (handler) {
        el.removeEventListener('contextmenu', handler)
        delete (el as any).__contextMenuHandler
      }
    },
  }
}
