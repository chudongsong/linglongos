import React from 'react'
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useStyleVars } from '@hooks/useStyleVars'
import type { FullConfig } from '@/types/config'

/**
 * 读取 useStyleVars 输出到文本，便于断言。
 */
function VarsProbe(props: { config?: FullConfig | null; grid: { width: number; height: number; gap: number }; bg: React.CSSProperties }) {
  const style = useStyleVars({ config: props.config ?? null, grid: props.grid, backgroundStyle: props.bg })
  return <div data-testid="vars">{JSON.stringify(style)}</div>
}

function makeConfig(theme?: FullConfig['desktop']['theme'], padding = 12): FullConfig {
  return {
    desktop: {
      padding,
      theme: theme as any,
      gridSize: undefined as any,
      iconSize: undefined as any,
      background: undefined as any,
    } as any,
    layout: { autoArrange: false, snapToGrid: true, allowOverlap: false },
    apps: [],
    categories: {},
  }
}

describe('hooks/useStyleVars', () => {
  test('生成网格与主题 CSS 变量，并合并背景样式', () => {
    const cfg = makeConfig({ selectionColor: 'rgba(1,2,3,0.5)', selectionBorder: '#123456', iconTextColor: '#ff0', iconTextShadow: '0 0 2px #000' } as any, 16)
    render(<VarsProbe config={cfg} grid={{ width: 80, height: 96, gap: 12 }} bg={{ background: 'red', backgroundImage: 'url(x.png)' }} />)
    const obj = JSON.parse(screen.getByTestId('vars').textContent || '{}')

    // 网格变量
    expect(obj['--grid-width']).toBe('80px')
    expect(obj['--grid-height']).toBe('96px')
    expect(obj['--grid-gap']).toBe('12px')
    expect(obj['--grid-padding']).toBe('16px')

    // 主题变量
    expect(obj['--selection-color']).toBe('rgba(1,2,3,0.5)')
    expect(obj['--selection-border']).toBe('#123456')
    expect(obj['--icon-text-color']).toBe('#ff0')
    expect(obj['--icon-text-shadow']).toBe('0 0 2px #000')

    // 合并背景样式
    expect(obj.background).toBe('red')
    expect(obj.backgroundImage).toBe('url(x.png)')

    // 同步 padding 字段
    expect(obj.padding).toBe('16px')
  })

  test('缺省主题与 padding 时使用默认值', () => {
    // 显式设为 null，触发 useStyleVars 的默认值逻辑（?? 10）
    const cfg = makeConfig(undefined as any, null as any)
    render(<VarsProbe config={cfg} grid={{ width: 50, height: 60, gap: 10 }} bg={{}} />)
    const obj = JSON.parse(screen.getByTestId('vars').textContent || '{}')

    expect(obj['--grid-padding']).toBe('10px')
    expect(obj['--selection-color']).toBe('rgba(74, 144, 226, 0.3)')
    expect(obj['--selection-border']).toBe('#4a90e2')
    expect(obj['--icon-text-color']).toBe('#ffffff')
    expect(obj['--icon-text-shadow']).toBe('1px 1px 2px rgba(0, 0, 0, 0.5)')
  })
})