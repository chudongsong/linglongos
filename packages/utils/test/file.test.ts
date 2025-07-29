import { describe, it, expect } from 'vitest'
import { FileUtils, getMimeType } from '../src/file'

describe('文件工具测试', () => {
  describe('getExtension', () => {
    it('应该正确获取文件扩展名', () => {
      expect(FileUtils.getExtension('file.txt')).toBe('.txt')
      expect(FileUtils.getExtension('image.jpg')).toBe('.jpg')
      expect(FileUtils.getExtension('document.pdf')).toBe('.pdf')
      expect(FileUtils.getExtension('archive.tar.gz')).toBe('.gz')
      expect(FileUtils.getExtension('noextension')).toBe('')
    })
  })

  describe('getBasename', () => {
    it('应该正确获取文件名（不包含扩展名）', () => {
      expect(FileUtils.getBasename('file.txt')).toBe('file')
      expect(FileUtils.getBasename('image.jpg')).toBe('image')
      expect(FileUtils.getBasename('/path/to/document.pdf')).toBe('document')
      expect(FileUtils.getBasename('C:\\path\\to\\archive.tar.gz')).toBe('archive.tar')
      expect(FileUtils.getBasename('noextension')).toBe('noextension')
    })
  })

  describe('getDirname', () => {
    it('应该正确获取文件路径（不包含文件名）', () => {
      expect(FileUtils.getDirname('/path/to/file.txt')).toBe('/path/to')
      expect(FileUtils.getDirname('C:\\path\\to\\image.jpg')).toBe('C:\\path\\to')
      expect(FileUtils.getDirname('file.txt')).toBe('')
    })
  })

  describe('getFileType', () => {
    it('应该正确判断文件类型', () => {
      expect(FileUtils.getFileType('image.jpg')).toBe('image')
      expect(FileUtils.getFileType('video.mp4')).toBe('video')
      expect(FileUtils.getFileType('audio.mp3')).toBe('audio')
      expect(FileUtils.getFileType('document.pdf')).toBe('document')
      expect(FileUtils.getFileType('archive.zip')).toBe('archive')
      expect(FileUtils.getFileType('code.js')).toBe('code')
      expect(FileUtils.getFileType('unknown.xyz')).toBe('unknown')
    })
  })

  describe('isImage', () => {
    it('应该正确判断是否为图片文件', () => {
      expect(FileUtils.isImage('image.jpg')).toBe(true)
      expect(FileUtils.isImage('image.png')).toBe(true)
      expect(FileUtils.isImage('image.gif')).toBe(true)
      expect(FileUtils.isImage('document.pdf')).toBe(false)
    })
  })

  describe('formatSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(FileUtils.formatSize(0)).toBe('0 B')
      expect(FileUtils.formatSize(1024)).toBe('1.00 KB')
      expect(FileUtils.formatSize(1024 * 1024)).toBe('1.00 MB')
      expect(FileUtils.formatSize(1024 * 1024 * 1024)).toBe('1.00 GB')
    })
  })

  describe('sanitizeFilename', () => {
    it('应该正确生成安全的文件名', () => {
      expect(FileUtils.sanitizeFilename('file<>:"/\\|?*name')).toBe('file________name')
      expect(FileUtils.sanitizeFilename('file   name')).toBe('file_name')
      expect(FileUtils.sanitizeFilename('_file_name_')).toBe('file_name')
    })
  })

  describe('joinPath', () => {
    it('应该正确连接路径', () => {
      expect(FileUtils.joinPath('path', 'to', 'file')).toBe('path/to/file')
      expect(FileUtils.joinPath('/path/', '/to/', '/file')).toBe('/path/to/file')
      expect(FileUtils.joinPath('', 'file')).toBe('file')
      expect(FileUtils.joinPath('path', '')).toBe('path')
    })
  })

  describe('getMimeType', () => {
    it('应该正确获取MIME类型', () => {
      expect(getMimeType('image.jpg')).toBe('image/jpeg')
      expect(getMimeType('document.pdf')).toBe('application/pdf')
      expect(getMimeType('code.js')).toBe('text/javascript')
      expect(getMimeType('unknown.xyz')).toBe('application/octet-stream')
    })
  })
})
