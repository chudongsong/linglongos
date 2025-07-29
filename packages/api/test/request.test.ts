import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request } from '../src/core/request'
import axios from 'axios'

// 模拟axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        request: vi.fn(),
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
      })),
    },
  }
})

describe('请求模块测试', () => {
  let request: Request
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    request = new Request({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    })
    mockAxiosInstance = (axios.create as any).mock.results[0].value
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('构造函数', () => {
    it('应该使用默认配置创建axios实例', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.example.com',
          timeout: 5000,
        })
      )
    })

    it('应该设置请求和响应拦截器', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('请求方法', () => {
    it('应该正确调用GET请求', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true, code: 200, data: { id: 1 } },
      })

      await request.get('/users', { id: 1 })

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: { id: 1 },
      })
    })

    it('应该正确调用POST请求', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true, code: 200, data: { id: 1 } },
      })

      await request.post('/users', { name: '张三', age: 30 })

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data: { name: '张三', age: 30 },
      })
    })

    it('应该正确调用PUT请求', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true, code: 200, data: { id: 1 } },
      })

      await request.put('/users/1', { name: '李四', age: 25 })

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data: { name: '李四', age: 25 },
      })
    })

    it('应该正确调用DELETE请求', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true, code: 200, data: {} },
      })

      await request.delete('/users/1')

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/users/1',
        params: undefined,
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理请求错误', async () => {
      const error = new Error('网络错误')
      mockAxiosInstance.request.mockRejectedValueOnce(error)

      await expect(request.get('/users')).rejects.toThrow('网络错误')
    })

    it('应该处理响应错误', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: false, code: 401, message: '未授权', data: null },
      })

      await expect(request.get('/users')).rejects.toEqual({
        success: false,
        code: 401,
        message: '未授权',
        data: null,
      })
    })
  })
})
