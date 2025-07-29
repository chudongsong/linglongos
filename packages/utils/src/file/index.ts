/**
 * 文件处理工具方法
 */

/**
 * 文件类型映射
 */
export const FileTypeMap = {
  // 图片文件
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff'],

  // 视频文件
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'],

  // 音频文件
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],

  // 文档文件
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],

  // 压缩文件
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],

  // 代码文件
  code: [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.vue',
    '.html',
    '.css',
    '.scss',
    '.less',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
  ],

  // 可执行文件
  executable: ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app'],
} as const

/**
 * 文件工具类
 */
export const FileUtils = {
  /**
   * 获取文件扩展名
   * @param filename 文件名
   * @returns 扩展名（包含点号）
   */
  getExtension: (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex).toLowerCase()
  },

  /**
   * 获取文件名（不包含扩展名）
   * @param filename 文件名
   * @returns 文件名
   */
  getBasename: (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.')
    const lastSlashIndex = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
    const start = lastSlashIndex + 1
    const end = lastDotIndex === -1 ? filename.length : lastDotIndex
    return filename.slice(start, end)
  },

  /**
   * 获取文件路径（不包含文件名）
   * @param filepath 文件路径
   * @returns 目录路径
   */
  getDirname: (filepath: string): string => {
    const lastSlashIndex = Math.max(filepath.lastIndexOf('/'), filepath.lastIndexOf('\\'))
    return lastSlashIndex === -1 ? '' : filepath.slice(0, lastSlashIndex)
  },

  /**
   * 判断文件类型
   * @param filename 文件名
   * @returns 文件类型
   */
  getFileType: (filename: string): string => {
    const ext = FileUtils.getExtension(filename)

    for (const [type, extensions] of Object.entries(FileTypeMap)) {
      if ((extensions as readonly string[]).includes(ext)) {
        return type
      }
    }

    return 'unknown'
  },

  /**
   * 判断是否为图片文件
   * @param filename 文件名
   * @returns 是否为图片
   */
  isImage: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'image'
  },

  /**
   * 判断是否为视频文件
   * @param filename 文件名
   * @returns 是否为视频
   */
  isVideo: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'video'
  },

  /**
   * 判断是否为音频文件
   * @param filename 文件名
   * @returns 是否为音频
   */
  isAudio: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'audio'
  },

  /**
   * 判断是否为文档文件
   * @param filename 文件名
   * @returns 是否为文档
   */
  isDocument: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'document'
  },

  /**
   * 判断是否为压缩文件
   * @param filename 文件名
   * @returns 是否为压缩文件
   */
  isArchive: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'archive'
  },

  /**
   * 判断是否为代码文件
   * @param filename 文件名
   * @returns 是否为代码文件
   */
  isCode: (filename: string): boolean => {
    return FileUtils.getFileType(filename) === 'code'
  },

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @param decimals 小数位数
   * @returns 格式化后的文件大小
   */
  formatSize: (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
  },

  /**
   * 生成安全的文件名
   * @param filename 原始文件名
   * @returns 安全的文件名
   */
  sanitizeFilename: (filename: string): string => {
    // 移除或替换不安全的字符
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // 替换不安全字符
      .replace(/\s+/g, '_') // 替换空格
      .replace(/_{2,}/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, '') // 移除首尾下划线
      .slice(0, 255) // 限制长度
  },

  /**
   * 生成唯一文件名
   * @param filename 原始文件名
   * @param existingFiles 已存在的文件名列表
   * @returns 唯一的文件名
   */
  generateUniqueFilename: (filename: string, existingFiles: string[]): string => {
    const basename = FileUtils.getBasename(filename)
    const extension = FileUtils.getExtension(filename)

    let counter = 1
    let newFilename = filename

    while (existingFiles.includes(newFilename)) {
      newFilename = `${basename}(${counter})${extension}`
      counter++
    }

    return newFilename
  },

  /**
   * 解析文件路径
   * @param filepath 文件路径
   * @returns 路径信息对象
   */
  parsePath: (
    filepath: string
  ): {
    dir: string
    base: string
    name: string
    ext: string
  } => {
    const dir = FileUtils.getDirname(filepath)
    const base = filepath.slice(dir.length + 1)
    const name = FileUtils.getBasename(base)
    const ext = FileUtils.getExtension(base)

    return { dir, base, name, ext }
  },

  /**
   * 连接路径
   * @param paths 路径片段
   * @returns 连接后的路径
   */
  joinPath: (...paths: string[]): string => {
    return paths
      .filter(path => path && path.length > 0)
      .map((path, index) => {
        // 移除开头的斜杠（除了第一个路径）
        if (index > 0) {
          path = path.replace(/^[/\\]+/, '')
        }
        // 移除结尾的斜杠
        path = path.replace(/[/\\]+$/, '')
        return path
      })
      .join('/')
  },

  /**
   * 规范化路径
   * @param filepath 文件路径
   * @returns 规范化后的路径
   */
  normalizePath: (filepath: string): string => {
    return filepath
      .replace(/\\/g, '/') // 统一使用正斜杠
      .replace(/\/+/g, '/') // 合并多个斜杠
      .replace(/\/\./g, '/') // 移除 /.
      .replace(/\/[^/]+\/\.\./g, '') // 处理 /..
      .replace(/^\//, '') // 移除开头斜杠
  },

  /**
   * 判断是否为绝对路径
   * @param filepath 文件路径
   * @returns 是否为绝对路径
   */
  isAbsolutePath: (filepath: string): boolean => {
    return /^([a-zA-Z]:[\\/]|[\\/])/.test(filepath)
  },

  /**
   * 获取相对路径
   * @param from 起始路径
   * @param to 目标路径
   * @returns 相对路径
   */
  getRelativePath: (from: string, to: string): string => {
    const fromParts = FileUtils.normalizePath(from).split('/')
    const toParts = FileUtils.normalizePath(to).split('/')

    // 找到公共前缀
    let commonLength = 0
    const minLength = Math.min(fromParts.length, toParts.length)

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++
      } else {
        break
      }
    }

    // 构建相对路径
    const upLevels = fromParts.length - commonLength
    const relativeParts = Array(upLevels).fill('..').concat(toParts.slice(commonLength))

    return relativeParts.join('/')
  },
} as const

/**
 * MIME类型映射
 */
export const MimeTypeMap: Record<string, string> = {
  // 图片
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',

  // 视频
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',

  // 音频
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma',
  '.m4a': 'audio/mp4',

  // 文档
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',

  // 压缩文件
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',

  // 代码文件
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
}

/**
 * 获取文件的MIME类型
 * @param filename 文件名
 * @returns MIME类型
 */
export function getMimeType(filename: string): string {
  const ext = FileUtils.getExtension(filename)
  return MimeTypeMap[ext] || 'application/octet-stream'
}

/**
 * 文件上传相关工具
 */
export const FileUploadUtils = {
  /**
   * 验证文件类型
   * @param file 文件对象
   * @param allowedTypes 允许的文件类型
   * @returns 是否通过验证
   */
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    const ext = FileUtils.getExtension(file.name)
    return allowedTypes.includes(ext)
  },

  /**
   * 验证文件大小
   * @param file 文件对象
   * @param maxSize 最大文件大小（字节）
   * @returns 是否通过验证
   */
  validateFileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize
  },

  /**
   * 读取文件为Base64
   * @param file 文件对象
   * @returns Promise<string>
   */
  readAsBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // 移除data:xxx;base64,前缀
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  /**
   * 读取文件为文本
   * @param file 文件对象
   * @param encoding 编码格式
   * @returns Promise<string>
   */
  readAsText: (file: File, encoding: string = 'UTF-8'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file, encoding)
    })
  },

  /**
   * 压缩图片
   * @param file 图片文件
   * @param quality 压缩质量（0-1）
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns Promise<Blob>
   */
  compressImage: (
    file: File,
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!FileUtils.isImage(file.name)) {
        reject(new Error('不是图片文件'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // 绘制并压缩
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('压缩失败'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  },
} as const
