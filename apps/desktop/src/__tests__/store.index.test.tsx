import { describe, test, expect } from 'vitest'
import { Provider } from 'react-redux'
import { render, screen, fireEvent } from '@testing-library/react'
import { store, useAppDispatch, useAppSelector } from '@store/index'
import { setIconSize, fetchConfig } from '@store/slices/desktop.slice'
import type { FullConfig, GridSize } from '@/types/config'

/**
 * makeConfig
 * 构造一个最小可用的配置对象，提供不同图标尺寸档位对应的网格尺寸。
 */
function makeConfig(
  iconSize: 'small' | 'medium' | 'large' = 'medium',
  grid?: Partial<Record<'small' | 'medium' | 'large', GridSize>>,
): FullConfig {
  return {
    desktop: {
      gridSize: {
        small: { width: 80, height: 100, gap: 4 },
        medium: { width: 100, height: 120, gap: 6 },
        large: { width: 120, height: 140, gap: 8 },
        ...(grid || {}),
      } as any,
      padding: 10,
      iconSize,
      background: { type: 'gradient', value: 'linear-gradient(#000,#fff)' },
      theme: { iconTextColor: '#fff', selectionColor: '#09f', selectionBorder: '#09f' },
    },
    layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
    apps: [],
    categories: {},
  }
}

/**
 * HookTester
 * 使用 store/index 导出的类型安全 hooks（useAppDispatch/useAppSelector），
 * 展示当前图标尺寸与网格宽度，并通过按钮触发尺寸切换。
 */
function HookTester() {
  const dispatch = useAppDispatch()
  const { iconSize, grid } = useAppSelector(s => s.desktop)
  return (
    <div>
      <div data-testid="size">{iconSize}</div>
      <div data-testid="grid-width">{grid.width}</div>
      <button onClick={() => dispatch(setIconSize('small'))}>small</button>
    </div>
  )
}

describe('store/index - 集成与类型安全 hooks', () => {
  test('useAppSelector/useAppDispatch：读取与更新全局状态', () => {
    // 预先写入配置（模拟 fetchConfig.fulfilled）以便根据图标尺寸计算网格
    const cfg = makeConfig('medium')
    store.dispatch({ type: fetchConfig.fulfilled.type, payload: cfg })

    render(
      <Provider store={store}>
        <HookTester />
      </Provider>
    )

    // 初始状态来自配置：medium 对应的 grid.width = 100
    expect(screen.getByTestId('size').textContent).toBe('medium')
    expect(screen.getByTestId('grid-width').textContent).toBe('100')

    // 触发切换到 small，grid.width 应变为 80
    fireEvent.click(screen.getByText('small'))
    expect(screen.getByTestId('size').textContent).toBe('small')
    expect(screen.getByTestId('grid-width').textContent).toBe('80')
  })
})