/**
 * useGridSystem 测试
 * 覆盖：
 * - getMaxColsRows：根据容器与 padding 计算最大列/行
 * - toPixels：row/col -> 像素坐标
 * - 初始化 positions：按配置显式位置与自动排列规则
 * - iconLayout：返回样式字符串（px）
 * - findNearestEmptySlot：从目标格出发扫描最近空位
 */

import React, { forwardRef, useImperativeHandle } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { useGridSystem } from '@hooks/useGridSystem'
import type { FullConfig } from '@/types/config'

/**
 * 构造一个最小可用的配置对象
 * - 仅使用 desktop.padding 与 apps 列表
 */
function makeConfig(apps: FullConfig['apps'], padding = 10): FullConfig {
  return {
    desktop: {
      padding,
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

/**
 * 暴露 useGridSystem 返回值的接口
 */
interface GridHandle {
  api: ReturnType<typeof useGridSystem>
}

/**
 * 测试探针组件
 * - 调用 useGridSystem 并以 ref 暴露返回对象
 */
const GridProbe = forwardRef<GridHandle, {
  config: FullConfig | null
  grid: { width: number; height: number; gap: number }
  containerWidth: number
  containerHeight: number
}>((props, ref) => {
  const api = useGridSystem(props)
  useImperativeHandle(ref, () => ({ api }), [api])
  return <div data-testid="grid-probe" />
})

GridProbe.displayName = 'GridProbe'

describe('hooks/useGridSystem', () => {
  test('getMaxColsRows 与 toPixels 计算正确', async () => {
    const ref = React.createRef<GridHandle>()
    const grid = { width: 80, height: 80, gap: 20 } // cell = 100
    const config = makeConfig([], 10)

    render(
      <GridProbe ref={ref} config={config} grid={grid} containerWidth={800} containerHeight={600} />,
    )

    // getMaxColsRows：availableW=780 => (780+20)/100=8, availableH=580 => (580+20)/100=6
    const { maxCols, maxRows, padding } = ref.current!.api.getMaxColsRows()
    expect({ maxCols, maxRows, padding }).toEqual({ maxCols: 8, maxRows: 6, padding: 10 })

    // toPixels：row=1, col=2 -> left=10+2*100=210, top=10+1*100=110
    const px = ref.current!.api.toPixels(1, 2)
    expect(px).toEqual({ left: 210, top: 110 })
  })

  test('初始化 positions：显式位置与自动排列', async () => {
    const ref = React.createRef<GridHandle>()
    const grid = { width: 80, height: 80, gap: 20 }
    // 容器 420x320：padding=10 -> availableW=400 -> (400+20)/100=4 列; availableH=300 -> (300+20)/100=3 行
    const apps: FullConfig['apps'] = [
      { id: 'a1', name: 'A1', icon: '/a1.png', type: 'application' }, // 自动 (0,0)
      { id: 'a2', name: 'A2', icon: '/a2.png', type: 'application' }, // 自动 (0,1)
      { id: 'a3', name: 'A3', icon: '/a3.png', type: 'application', position: { row: 0, col: 3 } }, // 显式
    ]
    const config = makeConfig(apps, 10)

    render(
      <GridProbe ref={ref} config={config} grid={grid} containerWidth={420} containerHeight={320} />,
    )

    // 等待 useEffect 初始化 positions
    await waitFor(() => {
      expect(Object.keys(ref.current!.api.positions).length).toBe(3)
    })

    // 校验自动与显式位置
    expect(ref.current!.api.positions['a1']).toEqual({ row: 0, col: 0 })
    expect(ref.current!.api.positions['a2']).toEqual({ row: 0, col: 1 })
    expect(ref.current!.api.positions['a3']).toEqual({ row: 0, col: 3 })

    // iconLayout 样式字符串
    const layout = ref.current!.api.iconLayout
    expect(layout).toHaveLength(3)
    const find = (id: string) => layout.find((x) => x.app.id === id)!
    expect(find('a1').style).toEqual({ left: '10px', top: '10px' }) // (0,0)
    expect(find('a2').style).toEqual({ left: '110px', top: '10px' }) // (0,1)
    expect(find('a3').style).toEqual({ left: '310px', top: '10px' }) // (0,3)
  })

  test('findNearestEmptySlot：返回从目标起最近可用网格', async () => {
    const ref = React.createRef<GridHandle>()
    const grid = { width: 80, height: 80, gap: 20 }
    const config = makeConfig([], 10)

    render(
      <GridProbe ref={ref} config={config} grid={grid} containerWidth={420} containerHeight={320} />,
    )

    // 设置占用：占 (0,0) 与 (0,1)
    act(() => {
      ref.current!.api.setPositions({ 'occ1': { row: 0, col: 0 }, 'occ2': { row: 0, col: 1 } })
    })

    // 目标 (0,0) 被占，应返回 (0,2)
    const slot = ref.current!.api.findNearestEmptySlot(0, 0, 'x')
    expect(slot).toEqual({ row: 0, col: 2 })

    // 目标越界也会被 clamp 在范围内并扫描
    const slot2 = ref.current!.api.findNearestEmptySlot(-10, -10, 'x')
    expect(slot2).toEqual({ row: 0, col: 2 })
  })
})