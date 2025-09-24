import { loadFullConfig, validateFullConfig } from '@services/config.service'
import type { AppsConfig, DesktopSettings, FullConfig } from '@/types/config'
import { describe, test, expect, beforeEach, vi } from 'vitest'

// 通过相对路径与被测文件保持一致，便于 mock 命中
vi.mock('@services/api', () => ({
  getJson: vi.fn(),
}))

import { getJson } from '@services/api'

/**
 * 构造最小可用的 DesktopSettings
 */
function makeDesktopSettings(): DesktopSettings {
  return {
    desktop: {
      gridSize: {
        small: { width: 80, height: 80, gap: 8 },
        medium: { width: 100, height: 100, gap: 10 },
        large: { width: 120, height: 120, gap: 12 },
      },
      padding: 16,
      iconSize: 'medium',
      background: {
        type: 'image',
        value: './static/images/bg.png',
      },
      theme: {
        iconTextColor: '#fff',
        selectionColor: '#09f',
        selectionBorder: '#09f',
      },
    },
    layout: {
      autoArrange: false,
      snapToGrid: true,
      allowOverlap: false,
    },
    hotReload: { enabled: false, interval: 0 },
  }
}

/**
 * 构造最小可用的 AppsConfig
 */
function makeAppsConfig(): AppsConfig {
  return {
    apps: [
      {
        id: 'a1',
        name: 'App1',
        icon: './static/images/a1.svg',
        type: 'application',
        category: 'system',
        action: { type: 'open', target: '/a1' },
      },
    ],
    categories: { system: { name: '系统工具' } },
    startup: { autoStart: ['a1'], delay: 1000 },
  }
}

describe('services/config.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  /**
   * 用例：验证 loadFullConfig 能正确合并配置并规范化应用图标 URL
   */
  test('loadFullConfig: 合并并规范化图标 URL', async () => {
    const ds = makeDesktopSettings()
    const ac = makeAppsConfig()
    vi.mocked(getJson).mockResolvedValueOnce(ds).mockResolvedValueOnce(ac)

    const cfg = await loadFullConfig()
    expect(cfg.desktop).toBe(ds.desktop)
    expect(cfg.layout).toBe(ds.layout)
    expect(cfg.categories).toEqual(ac.categories)
    expect(cfg.apps.length).toBe(1)
    const first = cfg.apps[0]!
    expect(first.icon).toBe('/images/a1.svg')
    // 背景值不会在此处替换（只在真实使用 normalizeAssetUrl 时），但应保持原值
    expect(cfg.desktop.background.value).toBe('./static/images/bg.png')
  })

  /**
   * 用例：validateFullConfig 的有效/无效判断
   */
  test('validateFullConfig: 有效/无效判断', () => {
    const valid: FullConfig = {
      desktop: makeDesktopSettings().desktop,
      layout: makeDesktopSettings().layout,
      hotReload: { enabled: false, interval: 0 },
      apps: makeAppsConfig().apps,
      categories: makeAppsConfig().categories,
      startup: makeAppsConfig().startup,
    }
    expect(validateFullConfig(valid)).toBe(true)
    // 缺少必须字段
    // @ts-expect-error - 故意传入不完整对象
    expect(validateFullConfig({})).toBe(false)
  })

  /**
   * 用例：normalizeIcon 的空值分支覆盖（icon 为空字符串时保持不变）
   */
  test('normalizeIcon: 空字符串保持不变', async () => {
    const ds = makeDesktopSettings()
    const acEmptyIcon: AppsConfig = {
      apps: [
        {
          id: 'a2',
          name: 'App2',
          icon: '',
          type: 'application',
          category: 'system',
          action: { type: 'open', target: '/a2' },
        },
      ],
      categories: { system: { name: '系统工具' } },
      startup: { autoStart: [], delay: 0 },
    }
    vi.mocked(getJson).mockResolvedValueOnce(ds).mockResolvedValueOnce(acEmptyIcon)

    const cfg = await loadFullConfig()
    expect(cfg.apps.length).toBe(1)
    expect(cfg.apps[0]?.icon).toBe('')
  })
})