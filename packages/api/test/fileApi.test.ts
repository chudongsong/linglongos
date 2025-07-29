import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileApi } from '../src/services/fileApi'
import { request } from '../src/core/request'

// 模拟request模块
vi.mock('../src/core/request', () => {
  return {
    request: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      upload: vi.fn(),
      download: vi.fn(),
    },
  }
})

describe('文件API服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listFiles', () => {
    it('应该正确调用获取文件列表API', async () => {
      const mockResponse = { data: [{ name: 'file.txt', path: '/home/file.txt' }] }
      ;(request.get as any).mockResolvedValueOnce(mockResponse)

      const result = await fileApi.listFiles('/home')

      expect(request.get).toHaveBeenCalledWith('/api/files', { path: '/home' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getFileInfo', () => {
    it('应该正确调用获取文件信息API', async () => {
      const mockResponse = { data: { name: 'file.txt', path: '/home/file.txt' } }
      ;(request.get as any).mockResolvedValueOnce(mockResponse)

      const result = await fileApi.getFileInfo('/home/file.txt')

      expect(request.get).toHaveBeenCalledWith('/api/files/info', { path: '/home/file.txt' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createFolder', () => {
    it('应该正确调用创建文件夹API', async () => {
      const mockResponse = { data: { success: true } }
      ;(request.post as any).mockResolvedValueOnce(mockResponse)

      const result = await fileApi.createFolder('/home/newfolder')

      expect(request.post).toHaveBeenCalledWith('/api/files/folder', { path: '/home/newfolder' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('delete', () => {
    it('应该正确调用删除文件API', async () => {
      const mockResponse = { data: { success: true } }
      ;(request.delete as any).mockResolvedValueOnce(mockResponse)

      const result = await fileApi.delete('/home/file.txt')

      expect(request.delete).toHaveBeenCalledWith('/api/files', { path: '/home/file.txt' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('rename', () => {
    it('应该正确调用重命名文件API', async () => {
      const mockResponse = { data: { success: true } }
      ;(request.put as any).mockResolvedValueOnce(mockResponse)

      const result = await fileApi.rename('/home/oldname.txt', '/home/newname.txt')

      expect(request.put).toHaveBeenCalledWith('/api/files/rename', {
        oldPath: '/home/oldname.txt',
        newPath: '/home/newname.txt',
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('upload', () => {
    it('应该正确调用上传文件API', async () => {
      const mockResponse = { data: { success: true } }
      ;(request.upload as any).mockResolvedValueOnce(mockResponse)

      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = await fileApi.upload('/home', file)

      expect(request.upload).toHaveBeenCalledWith('/api/files/upload', file, 'file', {
        path: '/home',
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('download', () => {
    it('应该正确调用下载文件API', async () => {
      ;(request.download as any).mockResolvedValueOnce(undefined)

      await fileApi.download('/home/file.txt')

      expect(request.download).toHaveBeenCalledWith('/api/files/download', {
        path: '/home/file.txt',
      })
    })
  })
})
