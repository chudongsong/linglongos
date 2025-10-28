import { describe, test, expect, beforeEach, vi } from 'vitest'

// 使用 hoisted 工厂提前声明可被 mock 工厂安全访问的引用
const axiosMock = vi.hoisted(() => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockDel = vi.fn()
  const instance = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDel,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  const mockCreate = vi.fn(() => instance)
  return { mockGet, mockPost, mockPut, mockDel, mockCreate, instance }
})

// 使用工厂函数 Mock axios，返回可控的 AxiosInstance 对象
vi.mock('axios', () => ({
  default: { create: axiosMock.mockCreate },
}))

// 在 mock 注册之后再导入被测模块
import { getJson, postJson, putJson, delJson } from '@/services/api'

beforeEach(() => {
  // 仅重置请求相关方法的调用记录，避免清空 axios.create 的初始化调用次数
  axiosMock.mockGet.mockReset()
  axiosMock.mockPost.mockReset()
  axiosMock.mockPut.mockReset()
  axiosMock.mockDel.mockReset()
})

/**
 * makeResp
 * 构造 axios 风格的响应对象，仅包含 data 字段
 */
function makeResp<T>(data: T) {
  return Promise.resolve({ data } as any)
}

/**
 * expectCalledWith
 * 断言某个 mock 函数按顺序被以特定参数调用
 */
function expectCalledWith(fn: ReturnType<typeof vi.fn>, ...args: any[]) {
  expect(fn).toHaveBeenCalledTimes(1)
  expect(fn).toHaveBeenCalledWith(...args)
}

describe('services/api - axios 包装器', () => {
  test('初始化时创建单一实例', () => {
    expect(axiosMock.mockCreate).toHaveBeenCalledTimes(1)
  })

  test('getJson：返回已解包的数据体，并传递 config', async () => {
    axiosMock.mockGet.mockImplementationOnce(() => makeResp({ ok: true, value: 1 }))
    const data = await getJson<{ ok: boolean; value: number }>('/foo', { headers: { X: '1' } })
    expect(data).toEqual({ ok: true, value: 1 })
    expectCalledWith(axiosMock.mockGet, '/foo', { headers: { X: '1' } })
  })

  test('postJson：返回数据体', async () => {
    axiosMock.mockPost.mockImplementationOnce(() => makeResp({ id: 101 }))
    const payload = { name: 'abc' }
    const data = await postJson<{ id: number }>('/bar', payload)
    expect(data).toEqual({ id: 101 })
    expectCalledWith(axiosMock.mockPost, '/bar', payload, undefined)
  })

  test('putJson：返回数据体', async () => {
    axiosMock.mockPut.mockImplementationOnce(() => makeResp({ updated: true }))
    const payload = { flag: 1 }
    const data = await putJson<{ updated: boolean }>('/res/1', payload, { timeout: 5000 })
    expect(data).toEqual({ updated: true })
    expectCalledWith(axiosMock.mockPut, '/res/1', payload, { timeout: 5000 })
  })

  test('delJson：返回数据体', async () => {
    axiosMock.mockDel.mockImplementationOnce(() => makeResp({ removed: 1 }))
    const data = await delJson<{ removed: number }>('/res/2')
    expect(data).toEqual({ removed: 1 })
    expectCalledWith(axiosMock.mockDel, '/res/2', undefined)
  })

  test('错误传播：getJson 在底层失败时抛出', async () => {
    axiosMock.mockGet.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
    await expect(getJson('/err')).rejects.toThrow('Network error')
  })
})