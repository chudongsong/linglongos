import type { Context } from 'egg'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import { promisify } from 'util'

const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)
const gzip = promisify(zlib.gzip)

/**
 * 静态资源中间件配置接口
 */
interface StaticOptions {
	/** 静态资源根目录 */
	root: string
	/** 允许的文件扩展名 */
	allowedExtensions: string[]
	/** 缓存控制头 */
	maxAge: number
	/** 是否启用gzip压缩 */
	gzip: boolean
	/** 是否启用ETag */
	etag: boolean
}

/**
 * MIME类型映射表
 */
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.htm': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.mjs': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.pdf': 'application/pdf',
	'.zip': 'application/zip',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',
}

/**
 * 可压缩的MIME类型
 */
const COMPRESSIBLE_TYPES = ['text/', 'application/javascript', 'application/json', 'application/xml', 'image/svg+xml']

/**
 * 静态文件服务中间件
 *
 * 功能特性：
 * - 支持GET方法访问静态文件
 * - 自动MIME类型识别
 * - 缓存控制（Cache-Control、ETag）
 * - gzip压缩支持
 * - 安全防护（目录遍历、文件扩展名限制）
 * - 错误处理（404、403）
 *
 * @param {StaticOptions} options - 中间件配置选项
 * @returns {(ctx: Context, next: () => Promise<any>) => Promise<void>} - Egg中间件函数
 */
export default function staticFilesMiddleware(options: StaticOptions) {
	const {
		root,
		allowedExtensions,
		maxAge = 86400, // 默认1天
		gzip: enableGzip = true,
		etag: enableEtag = true,
	} = options

	return async (ctx: Context, next: () => Promise<any>) => {
		// 只处理GET和HEAD请求
		if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
			return await next()
		}

		// 解析请求路径
		const requestPath = ctx.path

		// 直接使用请求路径作为文件路径
		const filePath = requestPath

		// 安全检查：防止目录遍历攻击
		if (filePath.includes('..') || filePath.includes('\\') || filePath.includes('\0')) {
			ctx.status = 403
			ctx.body = 'Forbidden: Invalid path'
			return
		}

		// 构建完整文件路径
		const fullPath = path.join(root, filePath)

		// 确保文件路径在允许的根目录内
		const resolvedPath = path.resolve(fullPath)
		const resolvedRoot = path.resolve(root)
		if (!resolvedPath.startsWith(resolvedRoot)) {
			ctx.status = 403
			ctx.body = 'Forbidden: Path outside root directory'
			return
		}

		try {
			// 检查文件是否存在
			const stats = await stat(resolvedPath)

			// 如果是目录，尝试直接返回index.html内容
			if (stats.isDirectory()) {
				const indexPath = path.join(resolvedPath, 'index.html')
				try {
					const indexStats = await stat(indexPath)
					if (indexStats.isFile()) {
						// 直接返回index.html内容，不进行重定向
						// 检查文件扩展名是否被允许
						const ext = '.html'
						if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
							ctx.status = 403
							ctx.body = 'Forbidden: File type not allowed'
							return
						}

						// 设置MIME类型
						const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
						ctx.type = mimeType

						// 生成ETag
						let etag = ''
						if (enableEtag) {
							const hash = crypto.createHash('md5')
							hash.update(`${indexStats.mtime.getTime()}-${indexStats.size}`)
							etag = `"${hash.digest('hex')}"`
							ctx.set('ETag', etag)
						}

						// 检查If-None-Match头（ETag缓存验证）
						const ifNoneMatch = ctx.get('If-None-Match')
						if (ifNoneMatch && ifNoneMatch === etag) {
							ctx.status = 304
							return
						}

						// 检查If-Modified-Since头
						const ifModifiedSince = ctx.get('If-Modified-Since')
						if (ifModifiedSince && typeof ifModifiedSince === 'string') {
							const modifiedSince = new Date(ifModifiedSince)
							if (indexStats.mtime <= modifiedSince) {
								ctx.status = 304
								return
							}
						}

						// 设置缓存控制头
						ctx.set('Cache-Control', `public, max-age=${maxAge}`)
						ctx.set('Last-Modified', indexStats.mtime.toUTCString())

						// 读取index.html文件内容
						let content = await readFile(indexPath)

						// 检查是否支持gzip压缩
						const acceptEncoding = ctx.get('Accept-Encoding') || ''
						const shouldCompress =
							enableGzip &&
							acceptEncoding.includes('gzip') &&
							indexStats.size > 1024 && // 只压缩大于1KB的文件
							COMPRESSIBLE_TYPES.some((type) => mimeType.startsWith(type))

						if (shouldCompress) {
							try {
								content = await gzip(content)
								ctx.set('Content-Encoding', 'gzip')
								ctx.set('Vary', 'Accept-Encoding')
							} catch (error) {
								// 压缩失败时使用原始内容
								ctx.app.logger.warn('Gzip compression failed:', error)
							}
						}

						// 设置内容长度
						ctx.set('Content-Length', content.length.toString())

						// 对于HEAD请求，只返回头部信息
						if (ctx.method === 'HEAD') {
							ctx.status = 200
							return
						}

						// 返回文件内容
						ctx.status = 200
						ctx.body = content
						return
					}
				} catch (indexError) {
					// index.html不存在，返回403
				}
				ctx.status = 403
				ctx.body = 'Forbidden: Directory access not allowed'
				return
			}

			// 检查文件扩展名是否被允许
			const ext = path.extname(resolvedPath).toLowerCase()
			if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
				ctx.status = 403
				ctx.body = 'Forbidden: File type not allowed'
				return
			}

			// 设置MIME类型
			const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
			ctx.type = mimeType

			// 生成ETag
			let etag = ''
			if (enableEtag) {
				const hash = crypto.createHash('md5')
				hash.update(`${stats.mtime.getTime()}-${stats.size}`)
				etag = `"${hash.digest('hex')}"`
				ctx.set('ETag', etag)
			}

			// 检查If-None-Match头（ETag缓存验证）
			const ifNoneMatch = ctx.get('If-None-Match')
			if (ifNoneMatch && ifNoneMatch === etag) {
				ctx.status = 304
				return
			}

			// 检查If-Modified-Since头
			const ifModifiedSince = ctx.get('If-Modified-Since')
			if (ifModifiedSince && typeof ifModifiedSince === 'string') {
				const modifiedSince = new Date(ifModifiedSince)
				if (stats.mtime <= modifiedSince) {
					ctx.status = 304
					return
				}
			}

			// 设置缓存控制头
			ctx.set('Cache-Control', `public, max-age=${maxAge}`)
			ctx.set('Last-Modified', stats.mtime.toUTCString())

			// 读取文件内容
			let content = await readFile(resolvedPath)

			// 检查是否支持gzip压缩
			const acceptEncoding = ctx.get('Accept-Encoding') || ''
			const shouldCompress =
				enableGzip &&
				acceptEncoding.includes('gzip') &&
				stats.size > 1024 && // 只压缩大于1KB的文件
				COMPRESSIBLE_TYPES.some((type) => mimeType.startsWith(type))

			if (shouldCompress) {
				try {
					content = await gzip(content)
					ctx.set('Content-Encoding', 'gzip')
					ctx.set('Vary', 'Accept-Encoding')
				} catch (error) {
					// 压缩失败时使用原始内容
					ctx.app.logger.warn('Gzip compression failed:', error)
				}
			}

			// 设置内容长度
			ctx.set('Content-Length', content.length.toString())

			// 对于HEAD请求，只返回头部信息
			if (ctx.method === 'HEAD') {
				ctx.status = 200
				return
			}

			// 返回文件内容
			ctx.status = 200
			ctx.body = content
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				// 文件不存在，继续到下一个中间件
				return await next()
			} else if (error.code === 'EACCES') {
				// 权限不足
				ctx.status = 403
				ctx.body = 'Forbidden: Access denied'
				return
			} else {
				// 其他错误
				ctx.app.logger.error('Static file serving error:', error)
				ctx.status = 500
				ctx.body = 'Internal Server Error'
				return
			}
		}
	}
}