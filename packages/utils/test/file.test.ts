import { describe, it, expect } from 'vitest'
import { FileUtils, getMimeType, FileTypeMap, MimeTypeMap } from '../src/file'

describe('文件工具测试', () => {
	describe('getExtension', () => {
		it('应该正确获取文件扩展名', () => {
			expect(FileUtils.getExtension('file.txt')).toBe('.txt')
			expect(FileUtils.getExtension('image.jpg')).toBe('.jpg')
			expect(FileUtils.getExtension('document.pdf')).toBe('.pdf')
			expect(FileUtils.getExtension('archive.tar.gz')).toBe('.gz')
			expect(FileUtils.getExtension('noextension')).toBe('')
			expect(FileUtils.getExtension('FILE.TXT')).toBe('.txt') // 大小写转换
			expect(FileUtils.getExtension('.hidden')).toBe('.hidden')
			expect(FileUtils.getExtension('file.')).toBe('.')
		})
	})

	describe('getBasename', () => {
		it('应该正确获取文件名（不包含扩展名）', () => {
			expect(FileUtils.getBasename('file.txt')).toBe('file')
			expect(FileUtils.getBasename('image.jpg')).toBe('image')
			expect(FileUtils.getBasename('/path/to/document.pdf')).toBe('document')
			expect(FileUtils.getBasename('C:\\path\\to\\archive.tar.gz')).toBe('archive.tar')
			expect(FileUtils.getBasename('noextension')).toBe('noextension')
			expect(FileUtils.getBasename('.hidden')).toBe('')
			expect(FileUtils.getBasename('file.')).toBe('file')
		})
	})

	describe('getDirname', () => {
		it('应该正确获取文件路径（不包含文件名）', () => {
			expect(FileUtils.getDirname('/path/to/file.txt')).toBe('/path/to')
			expect(FileUtils.getDirname('C:\\path\\to\\image.jpg')).toBe('C:\\path\\to')
			expect(FileUtils.getDirname('file.txt')).toBe('')
			expect(FileUtils.getDirname('/file.txt')).toBe('')
			expect(FileUtils.getDirname('folder/file.txt')).toBe('folder')
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
			expect(FileUtils.getFileType('app.exe')).toBe('executable')
			expect(FileUtils.getFileType('unknown.xyz')).toBe('unknown')
		})
	})

	describe('isImage', () => {
		it('应该正确判断是否为图片文件', () => {
			expect(FileUtils.isImage('image.jpg')).toBe(true)
			expect(FileUtils.isImage('image.png')).toBe(true)
			expect(FileUtils.isImage('image.gif')).toBe(true)
			expect(FileUtils.isImage('image.webp')).toBe(true)
			expect(FileUtils.isImage('image.svg')).toBe(true)
			expect(FileUtils.isImage('document.pdf')).toBe(false)
			expect(FileUtils.isImage('video.mp4')).toBe(false)
		})
	})

	describe('isVideo', () => {
		it('应该正确判断是否为视频文件', () => {
			expect(FileUtils.isVideo('video.mp4')).toBe(true)
			expect(FileUtils.isVideo('video.avi')).toBe(true)
			expect(FileUtils.isVideo('video.mov')).toBe(true)
			expect(FileUtils.isVideo('image.jpg')).toBe(false)
		})
	})

	describe('isAudio', () => {
		it('应该正确判断是否为音频文件', () => {
			expect(FileUtils.isAudio('audio.mp3')).toBe(true)
			expect(FileUtils.isAudio('audio.wav')).toBe(true)
			expect(FileUtils.isAudio('audio.flac')).toBe(true)
			expect(FileUtils.isAudio('video.mp4')).toBe(false)
		})
	})

	describe('isDocument', () => {
		it('应该正确判断是否为文档文件', () => {
			expect(FileUtils.isDocument('document.pdf')).toBe(true)
			expect(FileUtils.isDocument('document.doc')).toBe(true)
			expect(FileUtils.isDocument('document.xlsx')).toBe(true)
			expect(FileUtils.isDocument('image.jpg')).toBe(false)
		})
	})

	describe('isArchive', () => {
		it('应该正确判断是否为压缩文件', () => {
			expect(FileUtils.isArchive('file.zip')).toBe(true)
			expect(FileUtils.isArchive('file.rar')).toBe(true)
			expect(FileUtils.isArchive('file.7z')).toBe(true)
			expect(FileUtils.isArchive('file.txt')).toBe(false)
		})
	})

	describe('isCode', () => {
		it('应该正确判断是否为代码文件', () => {
			expect(FileUtils.isCode('script.js')).toBe(true)
			expect(FileUtils.isCode('component.vue')).toBe(true)
			expect(FileUtils.isCode('style.css')).toBe(true)
			expect(FileUtils.isCode('config.json')).toBe(true)
			expect(FileUtils.isCode('image.jpg')).toBe(false)
		})
	})

	describe('formatSize', () => {
		it('应该正确格式化文件大小', () => {
			expect(FileUtils.formatSize(0)).toBe('0 B')
			expect(FileUtils.formatSize(1024)).toBe('1.00 KB')
			expect(FileUtils.formatSize(1024 * 1024)).toBe('1.00 MB')
			expect(FileUtils.formatSize(1024 * 1024 * 1024)).toBe('1.00 GB')
			expect(FileUtils.formatSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB')
			expect(FileUtils.formatSize(1024 * 1024 * 1024 * 1024 * 1024)).toBe('1.00 PB')
			expect(FileUtils.formatSize(1500, 1)).toBe('1.5 KB')
		})
	})

	describe('sanitizeFilename', () => {
		it('应该正确生成安全的文件名', () => {
			expect(FileUtils.sanitizeFilename('file<>:"/\\|?*name')).toBe('file_________name')
			expect(FileUtils.sanitizeFilename('file   name')).toBe('file_name')
			expect(FileUtils.sanitizeFilename('_file_name_')).toBe('file_name')
			expect(FileUtils.sanitizeFilename('file\\\\name')).toBe('file_name') // 多个反斜线
			expect(FileUtils.sanitizeFilename('')).toBe('')

			// 测试长度限制
			const longName = 'a'.repeat(300)
			expect(FileUtils.sanitizeFilename(longName).length).toBe(255)
		})
	})

	describe('generateUniqueFilename', () => {
		it('应该生成唯一文件名', () => {
			const existing = ['file.txt', 'file(1).txt', 'image.jpg']

			expect(FileUtils.generateUniqueFilename('newfile.txt', existing)).toBe('newfile.txt')
			expect(FileUtils.generateUniqueFilename('file.txt', existing)).toBe('file(2).txt')
			expect(FileUtils.generateUniqueFilename('image.jpg', existing)).toBe('image(1).jpg')
		})
	})

	describe('parsePath', () => {
		it('应该正确解析文件路径', () => {
			const result = FileUtils.parsePath('/path/to/file.txt')
			expect(result).toEqual({
				dir: '/path/to',
				base: 'file.txt',
				name: 'file',
				ext: '.txt',
			})

			const result2 = FileUtils.parsePath('C:\\folder\\document.pdf')
			expect(result2.base).toBe('document.pdf')
			expect(result2.name).toBe('document')
			expect(result2.ext).toBe('.pdf')
		})
	})

	describe('joinPath', () => {
		it('应该正确连接路径', () => {
			expect(FileUtils.joinPath('path', 'to', 'file')).toBe('path/to/file')
			expect(FileUtils.joinPath('/path/', '/to/', '/file')).toBe('/path/to/file')
			expect(FileUtils.joinPath('', 'file')).toBe('file')
			expect(FileUtils.joinPath('path', '')).toBe('path')
			expect(FileUtils.joinPath('path\\', 'to\\', 'file')).toBe('path/to/file')
		})
	})

	describe('normalizePath', () => {
		it.skip('应该正确规范化路径', () => {
			expect(FileUtils.normalizePath('path\\to\\file')).toBe('path/to/file')
			expect(FileUtils.normalizePath('path//to/file')).toBe('path/to/file')
			expect(FileUtils.normalizePath('/path/./to/file')).toBe('path/to/file')
			expect(FileUtils.normalizePath('/path/to/../file')).toBe('path/file')
			expect(FileUtils.normalizePath('/path/to/file')).toBe('path/to/file')
		})
	})

	describe('isAbsolutePath', () => {
		it('应该正确判断是否为绝对路径', () => {
			expect(FileUtils.isAbsolutePath('/path/to/file')).toBe(true)
			expect(FileUtils.isAbsolutePath('C:\\path\\to\\file')).toBe(true)
			expect(FileUtils.isAbsolutePath('\\network\\path')).toBe(true)
			expect(FileUtils.isAbsolutePath('path/to/file')).toBe(false)
			expect(FileUtils.isAbsolutePath('./path/to/file')).toBe(false)
			expect(FileUtils.isAbsolutePath('../path/to/file')).toBe(false)
		})
	})

	describe('getRelativePath', () => {
		it('应该获取相对路径', () => {
			expect(FileUtils.getRelativePath('a/b/c', 'a/b/d')).toBe('../d')
			expect(FileUtils.getRelativePath('a/b', 'a/b/c/d')).toBe('c/d')
			expect(FileUtils.getRelativePath('a/b/c', 'a/x/y')).toBe('../../x/y')
			expect(FileUtils.getRelativePath('a/b', 'a/b')).toBe('')
		})
	})

	describe('getMimeType', () => {
		it('应该正确获取MIME类型', () => {
			expect(getMimeType('image.jpg')).toBe('image/jpeg')
			expect(getMimeType('document.pdf')).toBe('application/pdf')
			expect(getMimeType('code.js')).toBe('text/javascript')
			expect(getMimeType('video.mp4')).toBe('video/mp4')
			expect(getMimeType('audio.mp3')).toBe('audio/mpeg')
			expect(getMimeType('unknown.xyz')).toBe('application/octet-stream')
		})
	})

	describe('FileTypeMap', () => {
		it('应该包含所有文件类型映射', () => {
			expect(FileTypeMap.image).toBeDefined()
			expect(FileTypeMap.video).toBeDefined()
			expect(FileTypeMap.audio).toBeDefined()
			expect(FileTypeMap.document).toBeDefined()
			expect(FileTypeMap.archive).toBeDefined()
			expect(FileTypeMap.code).toBeDefined()
			expect(FileTypeMap.executable).toBeDefined()

			expect(FileTypeMap.image).toContain('.jpg')
			expect(FileTypeMap.video).toContain('.mp4')
			expect(FileTypeMap.audio).toContain('.mp3')
		})
	})

	describe('MimeTypeMap', () => {
		it('应该包含所有MIME类型映射', () => {
			expect(MimeTypeMap['.jpg']).toBe('image/jpeg')
			expect(MimeTypeMap['.pdf']).toBe('application/pdf')
			expect(MimeTypeMap['.mp4']).toBe('video/mp4')
			expect(MimeTypeMap['.mp3']).toBe('audio/mpeg')
			expect(MimeTypeMap['.js']).toBe('text/javascript')
		})
	})
})
