/**
 * 文件操作API服务
 */

import { request } from '../core/request'
import type { FileItem } from '../types'

/**
 * 文件API服务
 */
export const fileApi = {
  /**
   * 获取文件列表
   * @param path 目录路径
   * @returns 文件列表
   */
  listFiles: (path: string) => {
    return request.get<FileItem[]>('/api/files', { path })
  },

  /**
   * 获取文件详情
   * @param path 文件路径
   * @returns 文件详情
   */
  getFileInfo: (path: string) => {
    return request.get<FileItem>('/api/files/info', { path })
  },

  /**
   * 创建文件夹
   * @param path 文件夹路径
   * @returns 创建结果
   */
  createFolder: (path: string) => {
    return request.post('/api/files/folder', { path })
  },

  /**
   * 删除文件或文件夹
   * @param path 文件或文件夹路径
   * @returns 删除结果
   */
  delete: (path: string) => {
    return request.delete('/api/files', { path })
  },

  /**
   * 重命名文件或文件夹
   * @param oldPath 原路径
   * @param newPath 新路径
   * @returns 重命名结果
   */
  rename: (oldPath: string, newPath: string) => {
    return request.put('/api/files/rename', { oldPath, newPath })
  },

  /**
   * 移动文件或文件夹
   * @param sourcePath 源路径
   * @param targetPath 目标路径
   * @returns 移动结果
   */
  move: (sourcePath: string, targetPath: string) => {
    return request.put('/api/files/move', { sourcePath, targetPath })
  },

  /**
   * 复制文件或文件夹
   * @param sourcePath 源路径
   * @param targetPath 目标路径
   * @returns 复制结果
   */
  copy: (sourcePath: string, targetPath: string) => {
    return request.put('/api/files/copy', { sourcePath, targetPath })
  },

  /**
   * 上传文件
   * @param path 目标路径
   * @param file 文件对象
   * @returns 上传结果
   */
  upload: (path: string, file: File) => {
    return request.upload('/api/files/upload', file, 'file', { path })
  },

  /**
   * 下载文件
   * @param path 文件路径
   * @returns 下载结果
   */
  download: (path: string) => {
    return request.download('/api/files/download', { path })
  },

  /**
   * 读取文本文件内容
   * @param path 文件路径
   * @returns 文件内容
   */
  readText: (path: string) => {
    return request.get<string>('/api/files/content', { path })
  },

  /**
   * 写入文本文件内容
   * @param path 文件路径
   * @param content 文件内容
   * @returns 写入结果
   */
  writeText: (path: string, content: string) => {
    return request.post('/api/files/content', { path, content })
  },
}

export default fileApi
