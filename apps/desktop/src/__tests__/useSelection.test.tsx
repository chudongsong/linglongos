import React, { forwardRef, useImperativeHandle } from 'react'
import { render, act } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { useSelection } from '@hooks/useSelection'

/**
 * 测试用封装组件：对 useSelection 的 API 进行透出，便于在单测中直接调用。
 */
const SelectionTester = forwardRef((props: { initial?: string[] }, ref) => {
  const hook = useSelection()
  // 允许在测试中设置初始选中集
  if (props.initial && props.initial.length) {
    act(() => {
      hook.setSelected(() => new Set(props.initial))
    })
  }
  useImperativeHandle(ref, () => ({
    // 获取当前选中集合（快照）
    getSelected: () => hook.selected,
    // 触发图标点击
    click: (id: string, opts?: { meta?: boolean; ctrl?: boolean }) => {
      const e: any = {
        stopPropagation: () => {},
        metaKey: !!opts?.meta,
        ctrlKey: !!opts?.ctrl,
      }
      hook.handleIconClick(e as React.MouseEvent, id)
    },
    // 触发图标按下（用于标记多选键）
    mousedown: (opts?: { meta?: boolean; ctrl?: boolean; shift?: boolean }) => {
      const e: any = {
        metaKey: !!opts?.meta,
        ctrlKey: !!opts?.ctrl,
        shiftKey: !!opts?.shift,
      }
      hook.handleIconMouseDown(e as React.MouseEvent)
    },
    // 触发拖拽开始的选择逻辑
    dragStartSelect: (id: string) => hook.handleDragStartSelect(id),
    // 获取多选键记录
    getDragMultiKey: () => hook.dragMultiKeyRef.current,
    // 获取“抑制下一次点击清空”的标志（供一致性断言用）
    getSuppressFlag: () => hook.suppressNextClickClearRef.current,
  }))
  return null
})
SelectionTester.displayName = 'SelectionTester'

describe('hooks/useSelection', () => {
  test('单选点击：无修饰键时清空并仅选中当前图标', () => {
    const ref = { current: null as any }
    render(<SelectionTester ref={ref} />)

    act(() => ref.current.click('a1'))
    let sel: Set<string> = ref.current.getSelected()
    expect([...sel]).toEqual(['a1'])

    act(() => ref.current.click('a2'))
    sel = ref.current.getSelected()
    expect([...sel]).toEqual(['a2'])
  })

  test('追加/切换：按住 meta/ctrl 时进行 toggle', () => {
    const ref = { current: null as any }
    render(<SelectionTester ref={ref} />)

    // 先选中 a2
    act(() => ref.current.click('a2'))
    let sel: Set<string> = ref.current.getSelected()
    expect([...sel]).toEqual(['a2'])

    // 再对 a2 使用 meta 切换 -> 取消选中
    act(() => ref.current.click('a2', { meta: true }))
    sel = ref.current.getSelected()
    expect([...sel]).toEqual([])

    // 依次追加 a1 / a2
    act(() => ref.current.click('a1', { ctrl: true }))
    act(() => ref.current.click('a2', { ctrl: true }))
    sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a2']))

    // 再次对 a1 使用 ctrl 切换 -> 从集合移除 a1
    act(() => ref.current.click('a1', { ctrl: true }))
    sel = ref.current.getSelected()
    expect([...sel]).toEqual(['a2'])
  })

  test('拖拽开始选择：依据按下时修饰键决定追加或覆盖', () => {
    const ref = { current: null as any }
    render(<SelectionTester ref={ref} />)

    // 预置选中 a2
    act(() => {
      ref.current.click('a2')
    })

    // 未按多选键：覆盖为 a1
    act(() => ref.current.mousedown())
    act(() => ref.current.dragStartSelect('a1'))
    let sel: Set<string> = ref.current.getSelected()
    expect([...sel]).toEqual(['a1'])

    // 按住 shift 进行多选追加
    act(() => ref.current.mousedown({ shift: true }))
    act(() => ref.current.dragStartSelect('a3'))
    sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a3']))

    // 再次拖拽选择已存在的 a1：集合应保持不变
    act(() => ref.current.mousedown())
    act(() => ref.current.dragStartSelect('a1'))
    sel = ref.current.getSelected()
    expect(new Set(sel)).toEqual(new Set(['a1', 'a3']))

    // 标志位存在且默认为 false
    expect(ref.current.getSuppressFlag()).toBe(false)
  })
})