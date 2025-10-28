/**
 * useDragPreview 测试
 * - 通过 mock react-dnd 的 useDragLayer，控制拖拽监视器返回值
 * - 覆盖：未拖拽/缺少位置信息/完整信息与 app 解析
 */

// 在被测模块导入前完成 mock，并在工厂内部维护可变状态
vi.mock('react-dnd', () => {
  /**
   * 模拟 DragMonitor 的可变状态（仅在此工厂作用域内维护）
   */
  const monitorState: {
    isDragging: boolean
    item: { type: 'ICON'; id: string } | null
    clientOffset: { x: number; y: number } | null
    initialClientOffset: { x: number; y: number } | null
    initialSourceClientOffset: { x: number; y: number } | null
  } = {
    isDragging: false,
    item: null,
    clientOffset: null,
    initialClientOffset: null,
    initialSourceClientOffset: null,
  }

  return {
    /**
     * 模拟 useDragLayer：用传入的 selector 从我们内部的 monitorState 中取数据
     */
    useDragLayer: (selector: (monitor: any) => any) => {
      const monitor = {
        isDragging: () => monitorState.isDragging,
        getItem: () => monitorState.item,
        getClientOffset: () => monitorState.clientOffset,
        getInitialClientOffset: () => monitorState.initialClientOffset,
        getInitialSourceClientOffset: () => monitorState.initialSourceClientOffset,
      }
      return selector(monitor)
    },
    /**
     * 测试辅助：允许在用例中更新模拟状态
     */
    __setMockDragLayerState: (partial: Partial<typeof monitorState>) => {
      Object.assign(monitorState, partial)
    },
    /**
     * 测试辅助：重置状态
     */
    __resetMockDragLayerState: () => {
      monitorState.isDragging = false
      monitorState.item = null
      monitorState.clientOffset = null
      monitorState.initialClientOffset = null
      monitorState.initialSourceClientOffset = null
    },
  }
})


import { render, screen } from '@testing-library/react'
import { useDragPreview } from '@hooks/useDragPreview'
import { ITEM_TYPE } from '@/types/dnd'
import type { FullConfig } from '@/types/config'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as ReactDndMock from 'react-dnd'

/**
 * 从被 mock 的模块中获取测试辅助方法
 */
const { __setMockDragLayerState, __resetMockDragLayerState } = ReactDndMock as any

/**
 * 测试探针组件：渲染 useDragPreview 的返回 JSON 字符串
 */
function PreviewProbe({ cfg }: { cfg?: FullConfig | null }) {
  const data = useDragPreview(cfg)
  return <div data-testid="preview">{JSON.stringify(data)}</div>
}

/**
 * 创建基础配置：包含一个 id 为 a1 的应用
 */
function makeConfig(): FullConfig {
  return {
    desktop: {
      background: { type: 'gradient', value: 'linear-gradient(#000,#fff)' },
      gridSize: undefined as any,
      iconTextColor: undefined as any,
      selectionColor: undefined as any,
      selectionBorder: undefined as any,
    } as any,
    layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
    apps: [
      {
        id: 'a1',
        name: 'App 1',
        icon: '/a1.png',
        type: 'internal',
        position: undefined as any,
        category: undefined as any,
        action: undefined as any,
        metadata: undefined as any,
      },
    ],
    categories: {},
  }
}

describe('hooks/useDragPreview', () => {
  beforeEach(() => {
    // 重置监视器状态
    __resetMockDragLayerState()
  })

  test('未拖拽时返回 null', () => {
    const cfg = makeConfig()
    render(<PreviewProbe cfg={cfg} />)
    expect(screen.getByTestId('preview').textContent).toBe('null')
  })

  test('缺少必要位置信息时返回 null', () => {
    const cfg = makeConfig()
    const { rerender } = render(<PreviewProbe cfg={cfg} />)
    __setMockDragLayerState({ isDragging: true, item: { type: ITEM_TYPE, id: 'a1' }, clientOffset: { x: 10, y: 10 } })
    rerender(<PreviewProbe cfg={cfg} />)
    expect(screen.getByTestId('preview').textContent).toBe('null')
  })

  test('完整信息时计算 left/top 且解析 app', () => {
    const cfg = makeConfig()
    const { rerender } = render(<PreviewProbe cfg={cfg} />)
    __setMockDragLayerState({
      isDragging: true,
      item: { type: ITEM_TYPE, id: 'a1' },
      clientOffset: { x: 150, y: 120 },
      initialClientOffset: { x: 100, y: 100 },
      initialSourceClientOffset: { x: 40, y: 60 },
    })
    rerender(<PreviewProbe cfg={cfg} />)
    const obj = JSON.parse(screen.getByTestId('preview').textContent || 'null')
    expect(obj.left).toBe(40 + (150 - 100))
    expect(obj.top).toBe(60 + (120 - 100))
    expect(obj.app).toBeTruthy()
    expect(obj.app.id).toBe('a1')
  })

  test('非 ICON 类型项时返回 null', () => {
    const cfg = makeConfig()
    const { rerender } = render(<PreviewProbe cfg={cfg} />)
    __setMockDragLayerState({
      isDragging: true,
      item: { type: 'OTHER', id: 'a1' },
      clientOffset: { x: 150, y: 120 },
      initialClientOffset: { x: 100, y: 100 },
      initialSourceClientOffset: { x: 40, y: 60 },
    })
    rerender(<PreviewProbe cfg={cfg} />)
    expect(screen.getByTestId('preview').textContent).toBe('null')
  })
})