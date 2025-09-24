/**
 * useContainerDrop 测试覆盖点：
 * - 通过 mock react-dnd 的 useDrop，直接触发 drop 回调
 * - 基础落点换算与网格取整
 * - 目标网格被占用时调用 findNearestEmptySlot 回退到最近空位
 */

// 在被测模块导入前完成 mock
vi.mock('react-dnd', () => {
  let lastDrop: ((item: any, monitor: any) => void) | null = null
  return {
    /**
     * 模拟 useDrop：返回 dropRef，并收集 drop 回调供测试触发
     */
    useDrop: (specFactory: any, _deps: unknown[]) => {
      const spec = typeof specFactory === 'function' ? specFactory() : specFactory
      lastDrop = spec.drop || null
      const dropRef = (_node: any) => {}
      return [{}, dropRef]
    },
    /**
     * 测试辅助：触发 drop 事件
     */
    __invokeDrop: (item: any, monitor: any) => lastDrop && lastDrop(item, monitor),
  }
})

import React, { useRef } from 'react'
import { render } from '@testing-library/react'
import { useContainerDrop } from '@hooks/useContainerDrop'
import type { IconDragItem } from '@/types/dnd'
import { describe, test, expect, vi } from 'vitest'
import * as ReactDndMock from 'react-dnd'

const { __invokeDrop } = ReactDndMock as any

/**
 * 构造监视器对象的工厂
 * - 提供拖拽落点与初始点位信息
 */
function makeMonitor(params: {
  client: { x: number; y: number }
  initClient: { x: number; y: number }
  initSource: { x: number; y: number }
}) {
  return {
    getClientOffset: () => params.client,
    getInitialClientOffset: () => params.initClient,
    getInitialSourceClientOffset: () => params.initSource,
  }
}

/**
 * 测试组件：调用 useContainerDrop 完成注册
 * - 连接返回的 dropRef 到一个虚拟节点
 */
function DropProbe(props: {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  containerWidth: number
  containerHeight: number
  grid: { width: number; height: number; gap: number }
  getMaxColsRows: () => { maxCols: number; maxRows: number; padding: number }
  toPixels: (row: number, col: number) => { left: number; top: number }
  positions: Record<string, { row: number; col: number }>
  setPositions: (updater: (prev: Record<string, { row: number; col: number }>) => Record<string, { row: number; col: number }>) => void
  findNearestEmptySlot: (row: number, col: number, excl: string) => { row: number; col: number }
}) {
  const dropRef = useContainerDrop(props)
  const dummyRef = useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    dropRef(dummyRef.current)
  }, [dropRef])
  return <div ref={dummyRef} />
}

describe('hooks/useContainerDrop', () => {
  test('基础落点：根据 dx/dy 计算目标网格并更新位置', () => {
    // 容器与网格设置
    const padding = 10
    const grid = { width: 80, height: 80, gap: 20 }
    const cellW = grid.width + grid.gap // 100
    const cellH = grid.height + grid.gap // 100

    // 初始位置：row=1, col=1 -> (left, top) = (110, 110)
    let positions: Record<string, { row: number; col: number }> = { a1: { row: 1, col: 1 } }
    const toPixels = (row: number, col: number) => ({ left: padding + col * cellW, top: padding + row * cellH })
    const containerRef = { current: {} as any }

    // setPositions 立即应用更新，便于断言
    const setPositions = (updater: (prev: typeof positions) => typeof positions) => {
      positions = updater(positions)
    }

    render(
      <DropProbe
        containerRef={containerRef}
        containerWidth={800}
        containerHeight={600}
        grid={grid}
        getMaxColsRows={() => ({ maxCols: 6, maxRows: 4, padding })}
        toPixels={toPixels}
        positions={positions}
        setPositions={setPositions}
        findNearestEmptySlot={(r, c) => ({ row: r, col: c })}
      />,
    )

    // 触发一次 drop：dx=+120, dy=+120 -> 目标网格 (2,2)
    const item: IconDragItem = { type: 'ICON', id: 'a1' }
    const monitor = makeMonitor({ client: { x: 200, y: 200 }, initClient: { x: 80, y: 80 }, initSource: { x: 30, y: 30 } })
    __invokeDrop(item, monitor)

    expect(positions['a1']).toEqual({ row: 2, col: 2 })
  })

  test('目标网格被占用时调用 findNearestEmptySlot 选择最近空位', () => {
    const padding = 10
    const grid = { width: 80, height: 80, gap: 20 }
    const cellW = grid.width + grid.gap
    const cellH = grid.height + grid.gap

    let positions: Record<string, { row: number; col: number }> = {
      a1: { row: 1, col: 1 },
      b2: { row: 2, col: 2 }, // 占用 (2,2)
    }
    const toPixels = (row: number, col: number) => ({ left: padding + col * cellW, top: padding + row * cellH })
    const containerRef = { current: {} as any }
    const setPositions = (updater: (prev: typeof positions) => typeof positions) => {
      positions = updater(positions)
    }

    // 返回最近空位 (2,3)
    const findNearestEmptySlot = (r: number, c: number, _excl: string) => {
      if (r === 2 && c === 2) return { row: 2, col: 3 }
      return { row: r, col: c }
    }

    render(
      <DropProbe
        containerRef={containerRef}
        containerWidth={800}
        containerHeight={600}
        grid={grid}
        getMaxColsRows={() => ({ maxCols: 6, maxRows: 4, padding })}
        toPixels={toPixels}
        positions={positions}
        setPositions={setPositions}
        findNearestEmptySlot={findNearestEmptySlot}
      />,
    )

    // 移动至 (2,2)（将被视为占用）
    const item: IconDragItem = { type: 'ICON', id: 'a1' }
    const monitor = makeMonitor({ client: { x: 200, y: 200 }, initClient: { x: 80, y: 80 }, initSource: { x: 30, y: 30 } })
    __invokeDrop(item, monitor)

    expect(positions['a1']).toEqual({ row: 2, col: 3 })
  })
})