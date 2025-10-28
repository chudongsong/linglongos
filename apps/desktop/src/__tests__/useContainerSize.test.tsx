import { forwardRef, useImperativeHandle } from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useContainerSize } from '@hooks/useContainerSize'

/**
 * 测试探针：导出 hook 返回的状态以供断言
 */
const SizeProbe = forwardRef((_props: {}, ref) => {
  const { containerRef, containerWidth, containerHeight } = useContainerSize()
  useImperativeHandle(ref, () => ({ containerRef, containerWidth, containerHeight }), [containerRef, containerWidth, containerHeight])
  return null
})
SizeProbe.displayName = 'SizeProbe'

let spyW: ReturnType<typeof vi.spyOn> | null = null
let spyH: ReturnType<typeof vi.spyOn> | null = null

afterEach(() => {
  spyW?.mockRestore()
  spyH?.mockRestore()
  spyW = null
  spyH = null
})

describe('hooks/useContainerSize', () => {
  test('ref 为空时使用 window 尺寸作为回退', () => {
    const ref: any = { current: null }
    render(<SizeProbe ref={ref} />)

    // 让 ref 为空以触发回退路径
    ref.current.containerRef.current = null
    spyW = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    spyH = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(ref.current.containerWidth).toBe(1024)
    expect(ref.current.containerHeight).toBe(768)
  })

  test('读取容器 clientWidth/clientHeight 并随 resize 更新', () => {
    const ref: any = { current: null }
    render(<SizeProbe ref={ref} />)

    // 使用自定义对象模拟可测量的容器
    const fakeEl1 = {
      get clientWidth() { return 300 },
      get clientHeight() { return 200 },
    }
    ref.current.containerRef.current = fakeEl1 as any
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(ref.current.containerWidth).toBe(300)
    expect(ref.current.containerHeight).toBe(200)

    // 更新为新的尺寸
    const fakeEl2 = {
      get clientWidth() { return 640 },
      get clientHeight() { return 480 },
    }
    ref.current.containerRef.current = fakeEl2 as any
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(ref.current.containerWidth).toBe(640)
    expect(ref.current.containerHeight).toBe(480)
  })
})