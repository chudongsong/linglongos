import { forwardRef, useImperativeHandle } from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useAppLauncher } from '@hooks/useAppLauncher'
import { openWindow } from '@store/slices/window.slice'
import type { FullConfig, AppItem } from '@/types/config'

// 使用模块级 mock 来替换 useAppDispatch，使其返回我们可断言的 mockDispatch
const mockDispatch = vi.fn()
vi.mock('@store/index', () => {
  return {
    // 函数组件/Hook 中调用该方法会拿到同一个 mockDispatch
    useAppDispatch: () => mockDispatch,
  }
})

/**
 * 测试探针组件：暴露 useAppLauncher 的两个处理函数，便于直接触发。
 * - handleIconDoubleClick(appId)
 * - handleIconKeyDown(event, appId)
 */
const LauncherProbe = forwardRef(
  (props: { config?: FullConfig | null }, ref) => {
    const { handleIconDoubleClick, handleIconKeyDown } = useAppLauncher(props.config)
    useImperativeHandle(ref, () => ({ handleIconDoubleClick, handleIconKeyDown }), [handleIconDoubleClick, handleIconKeyDown])
    return null
  },
)
LauncherProbe.displayName = 'LauncherProbe'

/**
 * 构造最小可用的配置对象
 * @param apps 应用列表
 */
function makeConfig(apps: AppItem[]): FullConfig {
  return {
    desktop: {
      padding: 10,
      gridSize: undefined as any,
      iconSize: undefined as any,
      background: undefined as any,
      theme: undefined as any,
    } as any,
    layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
    apps,
    categories: {},
  }
}

describe('hooks/useAppLauncher', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
  })

  test('未知 appId 双击：不触发 dispatch', () => {
    const ref: any = { current: null }
    render(<LauncherProbe ref={ref} config={makeConfig([])} />)

    act(() => {
      ref.current.handleIconDoubleClick('not-exists')
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  test('双击已知应用（带 URL/路径 target）触发 openWindow', () => {
    const app: AppItem = { id: 'a1', name: 'A1', icon: '/a1.png', type: 'application', action: { target: '/foo' } as any }
    const cfg = makeConfig([app])

    const ref: any = { current: null }
    render(<LauncherProbe ref={ref} config={cfg} />)

    act(() => {
      ref.current.handleIconDoubleClick('a1')
    })

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith(openWindow({ app }))
  })

  test('键盘 Enter/Space 触发 handleIconDoubleClick 并派发', () => {
    const app: AppItem = { id: 'a2', name: 'A2', icon: '/a2.png', type: 'application' }
    const cfg = makeConfig([app])

    const ref: any = { current: null }
    render(<LauncherProbe ref={ref} config={cfg} />)

    // Enter
    act(() => {
      ref.current.handleIconKeyDown({ key: 'Enter', preventDefault: () => {} } as any, 'a2')
    })
    // Space
    act(() => {
      ref.current.handleIconKeyDown({ key: ' ', preventDefault: () => {} } as any, 'a2')
    })

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    expect(mockDispatch).toHaveBeenNthCalledWith(1, openWindow({ app }))
    expect(mockDispatch).toHaveBeenNthCalledWith(2, openWindow({ app }))
  })
})