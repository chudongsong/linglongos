import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { useBackgroundStyle } from '@hooks/useBackgroundStyle'
import type { FullConfig } from '@/types/config'

/**
 * 测试组件：读取 useBackgroundStyle 的返回并展示在文本节点中
 */
function StyleProbe({ cfg }: { cfg?: FullConfig | null }) {
  const style = useBackgroundStyle(cfg)
  return <div data-testid="style">{JSON.stringify(style)}</div>
}

describe('hooks/useBackgroundStyle', () => {
  test('无配置时返回空对象', () => {
    render(<StyleProbe cfg={null} />)
    const el = screen.getByTestId('style')
    expect(el.textContent).toBe('{}')
  })

  test('image 背景生成正确样式', () => {
    const cfg: FullConfig = {
      desktop: {
        background: { type: 'image', value: '/bg.jpg', size: 'contain', position: 'left top', repeat: 'no-repeat' },
        gridSize: undefined as any,
        iconTextColor: undefined as any,
        selectionColor: undefined as any,
        selectionBorder: undefined as any,
      } as any,
      layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
      apps: [],
      categories: {},
    }
    render(<StyleProbe cfg={cfg} />)
    const obj = JSON.parse(screen.getByTestId('style').textContent || '{}')
    expect(obj.backgroundImage).toBe('url(/bg.jpg)')
    expect(obj.backgroundSize).toBe('contain')
    expect(obj.backgroundPosition).toBe('left top')
    expect(obj.backgroundRepeat).toBe('no-repeat')
  })

  test('gradient 背景生成正确样式', () => {
    const cfg: FullConfig = {
      desktop: {
        background: { type: 'gradient', value: 'linear-gradient(#000,#fff)' },
        gridSize: undefined as any,
        iconTextColor: undefined as any,
        selectionColor: undefined as any,
        selectionBorder: undefined as any,
      } as any,
      layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
      apps: [],
      categories: {},
    }
    render(<StyleProbe cfg={cfg} />)
    const obj = JSON.parse(screen.getByTestId('style').textContent || '{}')
    expect(obj.background).toBe('linear-gradient(#000,#fff)')
  })
})