import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * setupLoadingDOM
 * 在 JSDOM 中构建加载遮罩的 DOM 结构，供 LoadingManager 查询与更新。
 */
function setupLoadingDOM() {
  document.body.innerHTML = `
    <div id="loadingOverlay">
      <div id="progressFill" style="width:0%"></div>
      <div id="progressText"></div>
    </div>
  `
}

/**
 * installRAFStub
 * 使用 setTimeout 模拟 requestAnimationFrame，提供单调递增的“当前时间”，
 * 避免 jsdom 中 performance.now 恒定导致动画步进 dt=0 的问题。
 */
function installRAFStub() {
  const originalRAF = (globalThis as any).requestAnimationFrame
  let rafNow = 0
  const raf = (cb: FrameRequestCallback): number => {
    rafNow += 16
    return setTimeout(() => cb(rafNow), 16) as unknown as number
  }
  ;(globalThis as any).requestAnimationFrame = raf
  return () => {
    ;(globalThis as any).requestAnimationFrame = originalRAF as any
  }
}

/**
 * installImageMock
 * 使 new Image() 在设置 src 后立即触发 onload，以便预加载逻辑快速完成。
 */
function installImageMock() {
  const OriginalImage = (globalThis as any).Image
  class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_v: string) {
      setTimeout(() => {
        if (this.onload) this.onload()
      }, 0)
    }
  }
  ;(globalThis as any).Image = MockImage as any
  return () => {
    ;(globalThis as any).Image = OriginalImage
  }
}

/**
 * advanceAll
 * 推进假定时器指定毫秒，并清空微任务队列，帮助异步流程完成。
 */
async function advanceAll(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('services/loadingManager - 基础工具与流程', () => {
  beforeEach(() => {
    setupLoadingDOM()
    vi.useFakeTimers()
    // 关键：重置模块缓存，保证后续 import 的单例绑定到当前 DOM
    vi.resetModules()
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  test('normalizeAssetUrl：规范化静态资源前缀', async () => {
    const { normalizeAssetUrl } = await import('@/services/loadingManager')
    expect(normalizeAssetUrl(undefined)).toBeUndefined()
    expect(normalizeAssetUrl('/images/a.png')).toBe('/images/a.png')
    expect(normalizeAssetUrl('./static/images/bg.jpg')).toBe('/images/bg.jpg')
  })

  test('collectImageUrlsFromConfig：收集背景与应用图标并去重', async () => {
    const { collectImageUrlsFromConfig } = await import('@/services/loadingManager')
    const cfg: any = {
      desktop: { background: { type: 'image', value: './static/images/bg.jpg' } },
      apps: [
        { id: 'a', name: 'A', icon: './static/images/app-a.png' },
        { id: 'b', name: 'B', icon: '/images/app-b.png' },
        { id: 'c', name: 'C', icon: './static/images/app-a.png' }, // 与 A 重复
        { id: 'd', name: 'D' }, // 无 icon
      ],
    }
    const urls = collectImageUrlsFromConfig(cfg)
    expect(urls.sort()).toEqual(['/images/app-a.png', '/images/app-b.png', '/images/bg.jpg'].sort())
  })

  test('smoothProgress：在设定步数与时长内平滑推进', async () => {
    const { smoothProgress } = await import('@/services/loadingManager')
    const updates: Array<{ v: number; l?: string | undefined }> = []
    const update = (v: number, l?: string) => updates.push({ v: Math.round(v), l })
    const cancelRAF = installRAFStub()
    // 关键顺序：先启动 Promise，再推进假定时器，最后等待 Promise 完成
    const p = smoothProgress(update, 0, 60, 3, 300, '加载中')
    await advanceAll(400)
    await p
    cancelRAF()
    expect(updates.length).toBe(3)
    expect(updates.map(u => u.v)).toEqual([20, 40, 60])
    expect(updates.every(u => u.l === '加载中')).toBe(true)
  })

  test('LoadingManager.init：推进样式与 DOM 阶段，更新进度文本与条宽', async () => {
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    const p = loadingManager.init()
    // 推进 6*50ms DOM 推进与若干 RAF 帧
    await advanceAll(600)
    await p
    cancelRAF()
    const fill = document.getElementById('progressFill') as HTMLElement
    const text = document.getElementById('progressText') as HTMLElement
    expect(fill.style.width).not.toBe('0%')
    expect(text.textContent || '').toMatch(/正在启动桌面/)
  })

  test('LoadingManager.finishWithConfig：触发收尾补齐与遮罩淡出隐藏', async () => {
    const cancelRAF = installRAFStub()
    const restoreImage = installImageMock()
    const { loadingManager } = await import('@/services/loadingManager')

    // 先初始化，确保 startTs 设置
    const pInit = loadingManager.init()
    await advanceAll(400)
    await pInit

    // 提交配置，包含若干图片以走预加载分支
    const cfg: any = {
      desktop: { background: { type: 'image', value: './static/images/bg.jpg' } },
      apps: [
        { id: 'x', name: 'X', icon: './static/images/app-x.png' },
        { id: 'y', name: 'Y', icon: './static/images/app-y.png' },
      ],
    }

    const pFinish = loadingManager.finishWithConfig(cfg)
    // 推进“最短展示 + 收尾补齐”的时间线
    await advanceAll(1000)
    await pFinish
    // 额外推进 350ms 以完成淡出隐藏
    await advanceAll(400)

    const overlay = document.getElementById('loadingOverlay') as HTMLElement
    expect(overlay.classList.contains('fade-out')).toBe(true)
    expect(overlay.style.display).toBe('none')

    cancelRAF()
    restoreImage()
  })
})


// 辅助：模拟 document.styleSheets 的不同状态（空或轮询后可访问）
function installStyleSheetsMock(mode: 'empty' | 'polling-ready') {
  const original = Object.getOwnPropertyDescriptor(document, 'styleSheets')
  let tickCount = 0
  const sheets = mode === 'empty'
    ? ([] as any[])
    : ([{
        get cssRules() {
          // 前两次访问抛异常，第三次起可访问，模拟跨域或未加载完成的样式表
          tickCount += 1
          if (tickCount < 3) {
            throw new Error('cssRules not accessible yet')
          }
          return [] as any
        },
      }] as any[])
  Object.defineProperty(document, 'styleSheets', { configurable: true, get() { return sheets as any } })
  return () => {
    if (original) Object.defineProperty(document, 'styleSheets', original)
  }
}

// 为扩展分支覆盖用例提供独立的生命周期，确保每个测试都有假定时器与全新 DOM
describe('services/loadingManager - 扩展分支覆盖', () => {
  beforeEach(() => {
    setupLoadingDOM()
    vi.useFakeTimers()
    vi.resetModules()
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /**
   * 用例：waitForStylesLoaded 在样式表为空时应立即完成（onProgress(1) 并返回），通过 init 间接覆盖
   */
  test('waitForStylesLoaded：样式表为空时立即完成', async () => {
    const restoreSheets = installStyleSheetsMock('empty')
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    const p = loadingManager.init()
    await advanceAll(400)
    await p
    cancelRAF()
    restoreSheets()
    const fill = document.getElementById('progressFill') as HTMLElement
    // 至少应有非零的推进（styles=1 与 DOM 推进），用以证明流程完成
    expect(fill.style.width).not.toBe('0%')
  })

  /**
   * 用例：waitForStylesLoaded 的轮询路径——前两次访问 cssRules 抛错，第三次开始可访问，应清除定时器并完成
   */
  test('waitForStylesLoaded：轮询至样式可访问后完成', async () => {
    const restoreSheets = installStyleSheetsMock('polling-ready')
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    const p = loadingManager.init()
    // 轮询间隔为 80ms + DOM 阶段 6*50ms，总推进至少 ~460ms，这里取 600ms 充分覆盖
    await advanceAll(600)
    await p
    cancelRAF()
    restoreSheets()
    const text = document.getElementById('progressText') as HTMLElement
    expect(text.textContent || '').toMatch(/正在启动桌面/)
  })

  /**
   * 用例：animateStep 的基础速率路径（rampMode=false），单帧推进约 6%（38%/s * 16ms）
   */
  test('animateStep：基础速率单帧推进约 6%', async () => {
    const cancelRAF = installRAFStub()
    const mod: any = await import('@/services/loadingManager')
    const lm: any = mod.loadingManager
    // 通过私有方法 setStage 触发 updateComposite 与 RAF
    lm.lastPercent = 0
    lm.rampMode = false
    lm.setStage('dom', 1)
    await advanceAll(20)
    cancelRAF()
    const fill = document.getElementById('progressFill') as HTMLElement
    // 四舍五入为 6%
    expect(fill.style.width).toBe('6%')
  })

  /**
   * 用例：finishWithConfig 的异常路径——强制 setStage 抛错，仍应走收尾补齐并淡出隐藏
   */
  test('finishWithConfig：异常时也应完成收尾并隐藏遮罩', async () => {
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')

    // 初始化以设置 startTs
    const pInit = loadingManager.init()
    await advanceAll(400)
    await pInit

    // 打桩使 setStage 第一次调用抛错，随后恢复原方法
    const lm: any = loadingManager as any
    const originalSetStage = lm.setStage
    let thrown = false
    lm.setStage = (...args: any[]) => {
      if (!thrown) {
        thrown = true
        throw new Error('stage error')
      }
      return originalSetStage.apply(lm, args)
    }

    const cfg: any = { desktop: { background: { type: 'color', value: '#000' } }, apps: [] }
    const pFinish = loadingManager.finishWithConfig(cfg)
    await advanceAll(1000)
    await pFinish
    await advanceAll(400)

    const overlay = document.getElementById('loadingOverlay') as HTMLElement
    expect(overlay.classList.contains('fade-out')).toBe(true)
    expect(overlay.style.display).toBe('none')

    // 恢复原方法
    lm.setStage = originalSetStage
    cancelRAF()
  })

  /**
   * 用例：finishWithConfig 在遮罩不存在时应 graceful（不抛错），但不添加 fade-out
   */
  test('finishWithConfig：遮罩缺失时 graceful', async () => {
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    // 初始化
    const pInit = loadingManager.init()
    await advanceAll(400)
    await pInit
    // 移除遮罩元素，使 hideOverlay 早退
    document.getElementById('loadingOverlay')?.remove()
    const cfg: any = { desktop: { background: { type: 'color', value: '#111' } }, apps: [] }
    const pFinish = loadingManager.finishWithConfig(cfg)
    await advanceAll(800)
    await expect(pFinish).resolves.toBeUndefined()
    cancelRAF()
  })

  /**
   * 用例：animateStep 在收尾补齐模式且截止时间已过时，直接补齐至目标并关闭 rampMode
   */
  test('animateStep：收尾截止已过直接补齐并关闭 rampMode', async () => {
    const cancelRAF = installRAFStub()
    const mod: any = await import('@/services/loadingManager')
    const lm: any = mod.loadingManager
    // 设置当前状态：尚未达到目标，但收尾时间已过
    lm.lastPercent = 50
    lm.targetPercent = 60
    lm.rampMode = true
    lm.rampStartTs = performance.now() - 1000 // 远大于 postConfigRampMs=160
    lm.lastAnimTs = 0
    // 直接调用动画帧函数，模拟“当前时间 now”
    lm.animateStep(200)
    cancelRAF()
    expect(lm.rampMode).toBe(false)
    expect(Math.round(lm.lastPercent)).toBe(60)
  })

  /**
   * 用例：waitUntil 条件立即满足时应立即 resolve
   */
  test('waitUntil：条件立即满足时立即返回', async () => {
    const { loadingManager } = await import('@/services/loadingManager')
    const lm: any = loadingManager as any
    await expect(lm.waitUntil(() => true, 240)).resolves.toBeUndefined()
  })

  /**
   * 用例：waitUntil 条件始终不满足，触发超时退出
   */
  test('waitUntil：条件不满足时在超时后返回', async () => {
    const { loadingManager } = await import('@/services/loadingManager')
    const lm: any = loadingManager as any
    const p = lm.waitUntil(() => false, 50)
    await advanceAll(100)
    await expect(p).resolves.toBeUndefined()
  })
})


// 为异常分支补齐提供独立的生命周期，覆盖 init 的 catch 路径与 finishWithConfig 的 catch 中 rafId 为空分支
describe('services/loadingManager - 异常分支补齐', () => {
  beforeEach(() => {
    setupLoadingDOM()
    vi.useFakeTimers()
    vi.resetModules()
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /**
   * init：当 setStage 抛出异常时，应进入 catch 分支并将 styles/dom 兜底推进到 1
   * 验证点：进度条宽度不为 0%，说明兜底推进发生（对应 src/services/loadingManager.ts 的 309-311 行）
   */
  test('init：setStage 抛错时进入 catch 并兜底推进 styles/dom 到 1', async () => {
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    const lm: any = loadingManager as any
    const originalSetStage = lm.setStage
    let thrown = false
    lm.setStage = (...args: any[]) => {
      if (!thrown) {
        thrown = true
        throw new Error('init stage error')
      }
      return originalSetStage.apply(lm, args)
    }

    const p = loadingManager.init()
    await advanceAll(600)
    await p

    // 兜底推进后，进度条应已更新为非 0
    const fill = document.getElementById('progressFill') as HTMLElement
    expect(fill.style.width).not.toBe('0%')

    // 恢复原方法
    lm.setStage = originalSetStage
    cancelRAF()
  })

  /**
   * finishWithConfig：未初始化且 rafId 为空时，走 try 分支应启动 RAF 并完成收尾
   * 目的：命中 src/services/loadingManager.ts 中 try 内的 352-354 行（rafId==null 时设置 lastAnimTs 并 requestAnimationFrame）
   */
  test('finishWithConfig：未初始化 rafId 为空时 try 分支应启动 RAF 并完成', async () => {
    const cancelRAF = installRAFStub()
    const { loadingManager } = await import('@/services/loadingManager')
    const lm: any = loadingManager as any
    // 确保 rafId 为空
    lm.rafId = null
  
    // 关键：临时覆盖 updateComposite，使 setStage 不会提前启动 RAF，从而让 finishWithConfig 自身的分支命中
    const originalUpdateComposite = lm.updateComposite
    lm.updateComposite = function () {
      const { styles, dom, config, preload } = lm.stageFractions
      const sum = styles * lm.weights.styles + dom * lm.weights.dom + config * lm.weights.config + preload * lm.weights.preload
      const target = Math.max(lm.targetPercent, Math.min(100, Math.round(sum * 100)))
      lm.targetPercent = target
      // 故意不设置 lastAnimTs 与 rafId，以便在 finishWithConfig 的 if (rafId==null) 里触发
    }
  
    const cfg: any = { desktop: { background: { type: 'color', value: '#222' } }, apps: [] }
    const pFinish = loadingManager.finishWithConfig(cfg)
    await advanceAll(1000)
    await pFinish
    await advanceAll(400)
  
    const overlay = document.getElementById('loadingOverlay') as HTMLElement
    expect(overlay.classList.contains('fade-out')).toBe(true)
    expect(overlay.style.display).toBe('none')
  
    // 恢复原方法
    lm.updateComposite = originalUpdateComposite
    cancelRAF()
  })
})