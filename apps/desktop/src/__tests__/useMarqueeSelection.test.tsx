import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { render, act } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { useMarqueeSelection } from '@hooks/useMarqueeSelection'
import type { FullConfig } from '@/types/config'

/**
 * 构建最小配置：包含 3 个应用，提供 positions 与 toPixels 映射
 */
function makeConfig(): FullConfig {
  return {
    desktop: {
      gridSize: {
        small: { width: 80, height: 80, gap: 8 },
        medium: { width: 100, height: 100, gap: 10 },
        large: { width: 120, height: 120, gap: 12 },
      },
      padding: 0,
      iconSize: 'medium',
      background: { type: 'image', value: '/images/bg.png' },
      theme: { iconTextColor: '#fff', selectionColor: '#09f', selectionBorder: '#09f' },
    },
    layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
    hotReload: { enabled: false, interval: 0 },
    apps: [
      { id: 'a1', name: 'A1', icon: '', type: 'application' },
      { id: 'a2', name: 'A2', icon: '', type: 'application' },
      { id: 'a3', name: 'A3', icon: '', type: 'application' },
    ],
    categories: {},
    startup: { autoStart: [], delay: 0 },
  }
}

/**
 * 测试驱动组件：在容器元素上绑定事件，暴露 Hook 的方法以便测试调用。
 */
const MarqueeTester = forwardRef((_props: {}, ref) => {
  const config = makeConfig()
  const positions: Record<string, { row: number; col: number }> = {
    a1: { row: 1, col: 1 },
    a2: { row: 1, col: 2 },
    a3: { row: 2, col: 1 },
  }
  const grid = { width: 100, height: 100 }
  const toPixels = (row: number, col: number) => ({ left: (col - 1) * 100, top: (row - 1) * 100 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelectedState] = useState<Set<string>>(new Set())
  const suppressNextClickClearRef = useRef<boolean>(false)

  const setSelected = (updater: (prev: Set<string>) => Set<string>) => {
    setSelectedState(updater)
  }

  const hook = useMarqueeSelection({
    grid,
    config,
    positions,
    toPixels,
    selected,
    setSelected,
    suppressNextClickClearRef,
  })

  useImperativeHandle(ref, () => ({
    getSelected: () => selected,
    getVisualSelected: () => hook.visualSelected,
    // 模拟鼠标在容器上的事件（传入容器元素计算坐标）
    mousedown: (x: number, y: number, additive = false) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const e: any = { button: 0, clientX: rect.left + x, clientY: rect.top + y, metaKey: additive, ctrlKey: additive, target: containerRef.current }
      hook.handleMouseDown(e as unknown as React.MouseEvent, containerRef.current)
    },
    mousemove: (x: number, y: number) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const e: any = { clientX: rect.left + x, clientY: rect.top + y, buttons: 1 }
      hook.handleMouseMove(e as unknown as React.MouseEvent, containerRef.current)
    },
    mouseup: () => {
      hook.handleMouseUp()
    },
  }))

  return <div ref={containerRef} style={{ position: 'relative', width: 400, height: 400 }} />
})
MarqueeTester.displayName = 'MarqueeTester'

/**
 * 用例覆盖：
 * - 基础框选（包含内的图标命中）
 * - 追加选择（meta/ctrl）
 * - 视觉选中集实时更新
 */

describe('hooks/useMarqueeSelection', () => {
  test('基础框选：矩形包围命中图标并更新选中集', () => {
    const ref = { current: null as any }
    render(<MarqueeTester ref={ref} />)

    // 框选覆盖 a1 / a2 (行1列1~2)
    act(() => ref.current.mousedown(10, 10))
    act(() => ref.current.mousemove(250, 90))
    act(() => ref.current.mouseup())

    const sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a2']))
  })

  test('追加选择：按住 meta/ctrl 执行 toggle', () => {
    const ref = { current: null as any }
    render(<MarqueeTester ref={ref} />)

    // 先框选 a1 / a2
    act(() => ref.current.mousedown(10, 10))
    act(() => ref.current.mousemove(250, 90))
    act(() => ref.current.mouseup())
    let sel: Set<string> = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a2']))

    // 先单独框选 a2 并按住 additive -> a2 被 toggle 移除
    act(() => ref.current.mousedown(110, 10, true))
    act(() => ref.current.mousemove(190, 90))
    act(() => ref.current.mouseup())
    sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1']))

    // 再单独框选 a3 并按住 additive -> a3 被追加
    act(() => ref.current.mousedown(10, 110, true))
    act(() => ref.current.mousemove(90, 190))
    act(() => ref.current.mouseup())
    sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a3']))
  })

  test('视觉选中集：进行中时实时反映命中项', () => {
    const ref = { current: null as any }
    render(<MarqueeTester ref={ref} />)

    // 进行框选：覆盖 a1/a2
    act(() => ref.current.mousedown(10, 10))
    act(() => ref.current.mousemove(250, 90))
    const vsel: Set<string> = ref.current.getVisualSelected()
    expect(new Set(vsel)).toEqual(new Set(['a1', 'a2']))

    // 移动到覆盖 a1/a2/a3
    act(() => ref.current.mousemove(150, 250))
    const vsel2: Set<string> = ref.current.getVisualSelected()
    expect(new Set(vsel2)).toEqual(new Set(['a1', 'a2', 'a3']))
  })
})