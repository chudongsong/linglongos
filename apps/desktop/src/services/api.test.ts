/**
 * api.test.ts - 覆盖 src/services/api.ts 中请求拦截器的错误回调路径
 *
 * 目标：触发请求阶段的上游拦截器返回拒绝，从而命中我们在 api.ts 中注册的 onRejected 回调
 * 验证：getJson 调用在请求阶段被拦截并以错误拒绝结束，覆盖未命中的行（约 30-31 行）
 */
import { describe, test, expect, afterEach } from 'vitest'
import api, { getJson } from '@services/api'

// 记录新增的请求拦截器 id，测试结束后移除避免影响其他用例
let interceptorId: number

describe('api.ts 请求拦截器错误路径', () => {
  afterEach(() => {
    if (typeof interceptorId === 'number') {
      api.interceptors.request.eject(interceptorId)
    }
  })

  /**
   * 用例：当上游请求拦截器返回拒绝时，应触发我们在 api.ts 中注册的 onRejected 回调
   * 期望：getJson 返回拒绝 Promise，错误信息为自定义的拦截器错误
   */
  test('当上游拦截器返回拒绝时，应触发请求拦截器的错误回调并返回拒绝', async () => {
    // 上游拦截器返回拒绝以模拟请求阶段错误
    interceptorId = api.interceptors.request.use(() => Promise.reject(new Error('req fail')))

    // getJson 将在请求阶段被拦截并直接以错误拒绝
    await expect(getJson<any>('/health')).rejects.toThrow('req fail')
  })

  /**
   * 用例：当请求通过默认拦截器成功回调（return config）时，仍可继续正常发起请求
   * 期望：适配器返回的响应被 getJson 解包返回，同时命中 api.ts 中的成功回调行（return config）
   */
  test('请求通过成功拦截器后应继续执行并返回数据', async () => {
    // 额外注册一个成功拦截器，确保不会短路为拒绝
    interceptorId = api.interceptors.request.use((cfg) => {
      // 标记以确认被执行（不影响后续流程）
      if (cfg.headers) {
        const h: any = cfg.headers as any
        if (typeof h.set === 'function') {
          h.set('X-Test', 'hit')
        } else {
          ;(cfg.headers as any)['X-Test'] = 'hit'
        }
      } else {
        // 适配 Axios v1 类型的 headers 定义
        cfg.headers = { 'X-Test': 'hit' } as any
      }
      return cfg
    })

    // 使用自定义 adapter 避免真实网络请求，返回一个成功响应
    const result = await getJson<{ ok: boolean }>('/ok', {
      adapter: (config) => {
        return Promise.resolve({
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        })
      },
    })

    expect(result).toEqual({ ok: true })
  })
})