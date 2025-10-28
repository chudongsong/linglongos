import { describe, test, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import reducer, { openWindow, closeWindow, focusWindow, moveWindow, resizeWindow, toggleMinimize, toggleMaximize } from '@store/slices/window.slice'
import type { AppItem } from '@/types/config'

/**
 * 构建测试用的 Redux store
 */
function makeStore() {
  return configureStore({ reducer: { window: reducer } })
}

/**
 * 生成最小化且类型完整的 AppItem
 */
function makeApp(id: string, name?: string, target?: string): AppItem {
  const base: AppItem = {
    id,
    name: name ?? id,
    icon: '',
    type: 'application',
  }
  return target ? { ...base, action: { type: 'open', target } } : base
}

describe('window.slice', () => {
  test('openWindow: 打开窗口并聚焦置顶', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1', 'A1', 'https://example.com') }))
    const st = store.getState().window
    expect(st.windows).toHaveLength(1)
    const w = st.windows[0]!
    expect(w.isActive).toBe(true)
    expect(w.zIndex).toBe(st.topZ)
    expect(w.url).toBe('https://example.com')
  })

  test('focusWindow: 聚焦并置顶', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    store.dispatch(openWindow({ app: makeApp('a2') }))
    const ws = store.getState().window.windows
    expect(ws).toHaveLength(2)
    const w1 = ws[0]!
    store.dispatch(focusWindow(w1.id))
    const st = store.getState().window
    const nw1 = st.windows.find(w => w.id === w1.id)!
    expect(nw1.isActive).toBe(true)
    expect(nw1.zIndex).toBe(st.topZ)
  })

  test('moveWindow/resizeWindow: 更新位置与尺寸并做约束', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const w = store.getState().window.windows[0]!
    store.dispatch(moveWindow({ id: w.id, left: 123.7, top: 456.4 }))
    store.dispatch(resizeWindow({ id: w.id, width: 100, height: 100 }))
    const st = store.getState().window
    const nw = st.windows[0]!
    expect(nw.left).toBe(124) // Math.round
    expect(nw.top).toBe(456)  // Math.round
    expect(nw.width).toBeGreaterThanOrEqual(320)
    expect(nw.height).toBeGreaterThanOrEqual(240)
  })

  test('toggleMinimize: 最小化/还原切换与聚焦状态', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const w = store.getState().window.windows[0]!
    store.dispatch(toggleMinimize(w.id))
    let nw = store.getState().window.windows[0]!
    expect(nw.isMinimized).toBe(true)
    expect(nw.isActive).toBe(false)
    store.dispatch(toggleMinimize(w.id))
    nw = store.getState().window.windows[0]!
    expect(nw.isMinimized).toBe(false)
    expect(nw.isActive).toBe(true)
  })

  test('toggleMaximize: 记录还原位置与尺寸', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const w = store.getState().window.windows[0]!
    store.dispatch(toggleMaximize(w.id))
    let nw = store.getState().window.windows[0]!
    expect(nw.isMaximized).toBe(true)
    // 模拟改变位置尺寸后还原
    store.dispatch(toggleMaximize(w.id))
    nw = store.getState().window.windows[0]!
    expect(nw.isMaximized).toBe(false)
  })

  test('closeWindow: 关闭并从列表移除', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const w = store.getState().window.windows[0]!
    store.dispatch(closeWindow(w.id))
    const st = store.getState().window
    expect(st.windows).toHaveLength(0)
  })

  test('openWindow: 非 URL target 不写入 url 字段', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a3', 'A3', 'foo') }))
    const w = store.getState().window.windows[0]!
    // 仅 http(s) 或以 / 开头的字符串会被视为 URL
    expect((w as any).url).toBeUndefined()
  })

  test('openWindow: 多实例层叠位置与激活态切换', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const w1 = store.getState().window.windows[0]!
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const st = store.getState().window
    const w2 = st.windows[1]!
    // 第二个窗口应为激活态，且第一个窗口取消激活
    expect(w2.isActive).toBe(true)
    expect(st.windows[0]!.isActive).toBe(false)
    // 层叠位置递进（根据 openCount 计算）
    expect(w2.left).toBeGreaterThan(w1.left)
    expect(w2.top).toBeGreaterThan(w1.top)
  })

  test('focusWindow: 传入不存在的 id，不改变 zIndex 且全部取消激活', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    store.dispatch(openWindow({ app: makeApp('a2') }))
    const prevTopZ = store.getState().window.topZ
    store.dispatch(focusWindow('non-exist-id'))
    const st = store.getState().window
    // 顶层 zIndex 不应增长（只有找到窗口才增长）
    expect(st.topZ).toBe(prevTopZ)
    // 所有窗口 isActive 应为 false（因为没有匹配的 id）
    expect(st.windows.every((w) => w.isActive === false)).toBe(true)
  })

  test('moveWindow/resizeWindow: 传入不存在的 id 不产生变更', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const before = store.getState().window.windows[0]!
    store.dispatch(moveWindow({ id: 'xx', left: 999, top: 888 }))
    store.dispatch(resizeWindow({ id: 'yy', width: 50, height: 50 }))
    const after = store.getState().window.windows[0]!
    expect(after.left).toBe(before.left)
    expect(after.top).toBe(before.top)
    expect(after.width).toBe(before.width)
    expect(after.height).toBe(before.height)
  })

  test('toggleMinimize/toggleMaximize: 不存在的 id 早退', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const before = store.getState().window
    store.dispatch(toggleMinimize('nope'))
    store.dispatch(toggleMaximize('nope'))
    const after = store.getState().window
    expect(after.windows[0]!.isMinimized).toBe(before.windows[0]!.isMinimized)
    expect(after.windows[0]!.isMaximized).toBe(before.windows[0]!.isMaximized)
    expect(after.topZ).toBe(before.topZ)
  })

  test('toggleMaximize: 最大化后修改位置尺寸，再次切换应还原', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a1') }))
    const original = store.getState().window.windows[0]!
    const origLeft = original.left
    const origTop = original.top
    const origWidth = original.width
    const origHeight = original.height

    // 最大化，记录还原信息
    store.dispatch(toggleMaximize(original.id))

    // 修改位置与尺寸（模拟最大化期间发生变化）
    store.dispatch(moveWindow({ id: original.id, left: origLeft + 100, top: origTop + 80 }))
    store.dispatch(resizeWindow({ id: original.id, width: origWidth + 200, height: origHeight + 160 }))

    // 再次切换（还原）
    store.dispatch(toggleMaximize(original.id))
    const restored = store.getState().window.windows[0]!
    expect(restored.isMaximized).toBe(false)
    expect(restored.left).toBe(origLeft)
    expect(restored.top).toBe(origTop)
    expect(restored.width).toBe(origWidth)
    expect(restored.height).toBe(origHeight)
  })

  /**
   * openWindow: 以“/”开头的 target 应被视为 URL 并写入到窗口记录中
   */
  test('openWindow: 以“/”开头的 target 写入 url 字段', () => {
    const store = makeStore()
    store.dispatch(openWindow({ app: makeApp('a4', 'A4', '/docs/readme') }))
    const st = store.getState().window
    expect(st.windows).toHaveLength(1)
    const w = st.windows[0]!
    expect(w.isActive).toBe(true)
    expect(w.url).toBe('/docs/readme')
  })
})