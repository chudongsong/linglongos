import { describe, test, expect, beforeEach, vi } from 'vitest'

// 使用 hoisted 变量提供给 mock 工厂，承载拦截器的捕获
const axiosMock = vi.hoisted(() => ({
  requestHandlers: [] as Array<(c: any) => any>,
  requestErrorHandlers: [] as Array<(e: any) => any>,
  responseHandlers: [] as Array<(r: any) => any>,
  responseErrorHandlers: [] as Array<(e: any) => any>,
}))

// 模拟 axios.create 返回的实例，并捕获拦截器注册
vi.mock('axios', () => {
  const inst = {
    interceptors: {
      request: {
        use: (onFulfilled: (c: any) => any, onRejected?: (e: any) => any) => {
          axiosMock.requestHandlers.push(onFulfilled)
          if (onRejected) axiosMock.requestErrorHandlers.push(onRejected)
        },
      },
      response: {
        use: (onFulfilled: (r: any) => any, onRejected?: (e: any) => any) => {
          axiosMock.responseHandlers.push(onFulfilled)
          if (onRejected) axiosMock.responseErrorHandlers.push(onRejected)
        },
      },
    },
    get: vi.fn(async (url: string, cfg?: any) => ({ data: { ok: true, url, cfg } })),
    post: vi.fn(async (url: string, data?: any, cfg?: any) => ({ data: { ok: true, url, data, cfg } })),
    put: vi.fn(async (url: string, data?: any, cfg?: any) => ({ data: { ok: true, url, data, cfg } })),
    delete: vi.fn(async (url: string, cfg?: any) => ({ data: { ok: true, url, cfg } })),
  }
  return {
    default: { create: vi.fn(() => inst) },
    create: vi.fn(() => inst),
  }
})

beforeEach(() => {
  // 重置模块缓存，确保每个用例重新执行 services/api 的初始化逻辑
  vi.resetModules()
  // 不清空 create 计数，避免初始化调用被清空
  axiosMock.requestHandlers.length = 0
  axiosMock.requestErrorHandlers.length = 0
  axiosMock.responseHandlers.length = 0
  axiosMock.responseErrorHandlers.length = 0
})

describe('services/api - 拦截器行为', () => {
  test('模块初始化时注册 request/response 拦截器', async () => {
    const apiModule = await import('@/services/api')
    expect(axiosMock.requestHandlers.length).toBe(1)
    expect(axiosMock.responseHandlers.length).toBe(1)

    // 发起一次请求以验证实例方法工作（不深入验证链式）
    const data = await apiModule.getJson<{ ok: boolean }>('x')
    expect(data.ok).toBe(true)
  })

  test('request 拦截器错误处理：直接传播错误', async () => {
    await import('@/services/api')
    expect(axiosMock.requestErrorHandlers.length).toBe(1)
    const errFn = axiosMock.requestErrorHandlers[0]!
    await expect(errFn(new Error('req error'))).rejects.toBeInstanceOf(Error)
  })

  test('response 拦截器错误处理：直接传播错误', async () => {
    await import('@/services/api')
    expect(axiosMock.responseErrorHandlers.length).toBe(1)
    const errFn = axiosMock.responseErrorHandlers[0]!
    await expect(errFn(new Error('resp error'))).rejects.toBeInstanceOf(Error)
  })
})