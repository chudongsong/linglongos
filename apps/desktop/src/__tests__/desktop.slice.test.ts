import { describe, test, expect, vi, beforeEach } from 'vitest'
import reducer, { setIconSize, fetchConfig } from '@store/slices/desktop.slice'
import type { DesktopState } from '@store/slices/desktop.slice'
import type { FullConfig, GridSize } from '@/types/config'
import * as configService from '@/services/config.service'

/**
 * 构造一个最小可用的配置对象
 */
function makeConfig(iconSize: 'small' | 'medium' | 'large' = 'medium', grid?: Partial<Record<'small'|'medium'|'large', GridSize>>): FullConfig {
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

const initialState: DesktopState = {
  config: null,
  loading: false,
  error: null,
  iconSize: 'medium',
  grid: { width: 100, height: 120, gap: 5 },
}

// 简化 mock：仅提供被 fetchConfig 使用的导出
vi.mock('@/services/config.service', () => ({
  loadFullConfig: vi.fn(),
  validateFullConfig: vi.fn(),
}))

const mockedLoad = vi.mocked(configService.loadFullConfig)
const mockedValidate = vi.mocked(configService.validateFullConfig)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('store/desktop.slice', () => {
  test('setIconSize reducer：更新 iconSize 并重算 grid', () => {
    const cfg = makeConfig('medium')
    const state = reducer({ ...initialState, config: cfg }, setIconSize('small'))
    expect(state.iconSize).toBe('small')
    expect(state.grid).toEqual(cfg.desktop.gridSize.small)
  })

  test('fetchConfig pending/fulfilled：写入 config，派生 iconSize 与 grid', async () => {
    const cfg = makeConfig('large')
    mockedLoad.mockResolvedValueOnce(cfg as any)
    mockedValidate.mockReturnValueOnce(true)

    // pending
    let s = reducer(initialState, { type: fetchConfig.pending.type })
    expect(s.loading).toBe(true)
    expect(s.error).toBeNull()

    // fulfilled
    s = reducer(s, { type: fetchConfig.fulfilled.type, payload: cfg })
    expect(s.loading).toBe(false)
    expect(s.config).toBe(cfg)
    expect(s.iconSize).toBe('large')
    expect(s.grid).toEqual(cfg.desktop.gridSize.large)
  })

  test('fetchConfig rejected：写入错误信息', () => {
    const err = new Error('配置校验失败')
    const s = reducer(initialState, { type: fetchConfig.rejected.type, error: err })
    expect(s.loading).toBe(false)
    expect(s.error).toBe('配置校验失败')
  })
})

describe('store/desktop.slice - 额外分支覆盖', () => {
  test('setIconSize：当 config 为空时使用 fallback grid', () => {
    const s = reducer({ ...initialState, config: null }, setIconSize('small'))
    expect(s.grid).toEqual({ width: 100, height: 120, gap: 5 })
    expect(s.iconSize).toBe('small')
  })

  test('setIconSize：配置缺少对应 size 条目时回退到 fallback grid', () => {
    const cfg = makeConfig('medium', { large: undefined as any })
    const s = reducer({ ...initialState, config: cfg }, setIconSize('large'))
    expect(s.grid).toEqual({ width: 100, height: 120, gap: 5 })
  })

  test('fetchConfig fulfilled：非法 iconSize 回退为 medium 并据此计算 grid', () => {
    const cfg = makeConfig('medium')
    ;(cfg.desktop as any).iconSize = 'weird'
    const s = reducer(initialState, { type: fetchConfig.fulfilled.type, payload: cfg })
    expect(s.iconSize).toBe('medium')
    expect(s.grid).toEqual(cfg.desktop.gridSize.medium)
  })

  test('fetchConfig rejected：当 error.message 缺失时使用默认错误文案', () => {
    const s = reducer(initialState, { type: fetchConfig.rejected.type, error: {} as any })
    expect(s.loading).toBe(false)
    expect(s.error).toBe('配置加载失败')
  })
})