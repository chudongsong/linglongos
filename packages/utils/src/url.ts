/**
 * URL处理工具方法
 */

/**
 * 解析URL参数
 * @param url URL字符串，默认为当前页面URL
 * @returns 参数对象
 */
export function parseUrlParams(url?: string): Record<string, string> {
	const params: Record<string, string> = {}

	const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

	try {
		const urlObj = new URL(targetUrl)
		const searchParams = urlObj.search.substr(1)

		if (searchParams) {
			searchParams.split('&').forEach((param) => {
				const [key, value] = param.split('=')
				if (key) {
					params[decodeURIComponent(key)] = decodeURIComponent(value || '')
				}
			})
		}
	} catch (error) {
		// 如果URL无效，尝试解析查询字符串部分
		const queryString = targetUrl.split('?')[1]
		if (queryString) {
			queryString.split('&').forEach((param) => {
				const [key, value] = param.split('=')
				if (key) {
					params[decodeURIComponent(key)] = decodeURIComponent(value || '')
				}
			})
		}
	}

	return params
}

/**
 * 构建URL参数字符串
 * @param params 参数对象
 * @returns 参数字符串
 */
export function buildUrlParams(params: Record<string, any>): string {
	const paramArray: string[] = []

	Object.keys(params).forEach((key) => {
		const value = params[key]
		if (value !== null && value !== undefined && value !== '') {
			paramArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		}
	})

	return paramArray.join('&')
}

/**
 * 向URL添加参数
 * @param url 原始URL
 * @param params 要添加的参数
 * @returns 新的URL
 */
export function addUrlParams(url: string, params: Record<string, any>): string {
	try {
		const urlObj = new URL(url)

		Object.keys(params).forEach((key) => {
			const value = params[key]
			if (value !== null && value !== undefined && value !== '') {
				const searchParamsStr = urlObj.search || ''
				const newParam = `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`

				if (searchParamsStr) {
					urlObj.search = searchParamsStr + '&' + newParam
				} else {
					urlObj.search = '?' + newParam
				}
			}
		})

		return urlObj.toString()
	} catch (error) {
		// 如果URL无效，手动拼接
		const separator = url.indexOf('?') !== -1 ? '&' : '?'
		const paramString = buildUrlParams(params)
		return paramString ? `${url}${separator}${paramString}` : url
	}
}

/**
 * 从URL中移除参数
 * @param url 原始URL
 * @param keys 要移除的参数键名数组
 * @returns 新的URL
 */
export function removeUrlParams(url: string, keys: string[]): string {
	try {
		const urlObj = new URL(url)
		const searchParams = parseUrlParams(url)

		keys.forEach((key) => {
			delete searchParams[key]
		})

		const newParamString = buildUrlParams(searchParams)
		const urlParts = url.split('?')
		const baseUrl = urlParts[0] || ''

		return newParamString ? `${baseUrl}?${newParamString}` : baseUrl
	} catch (error) {
		return url
	}
}

/**
 * 获取URL的域名
 * @param url URL字符串
 * @returns 域名
 */
export function getDomain(url: string): string {
	try {
		return new URL(url).hostname
	} catch (error) {
		const match = url.match(/^https?:\/\/([^\/]+)/)
		return match && match[1] ? match[1] : ''
	}
}

/**
 * 获取URL的协议
 * @param url URL字符串
 * @returns 协议（如 'https:'）
 */
export function getProtocol(url: string): string {
	try {
		return new URL(url).protocol
	} catch (error) {
		const match = url.match(/^(https?):/)
		return match ? match[1] + ':' : ''
	}
}

/**
 * 获取URL的路径
 * @param url URL字符串
 * @returns 路径
 */
export function getPath(url: string): string {
	try {
		return new URL(url).pathname
	} catch (error) {
		const match = url.match(/^https?:\/\/[^\/]+(\/[^?#]*)?/)
		return match && match[1] ? match[1] : '/'
	}
}

/**
 * 判断是否为有效的URL
 * @param url URL字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
	try {
		new URL(url)
		return true
	} catch (error) {
		return false
	}
}

/**
 * 判断是否为HTTP/HTTPS URL
 * @param url URL字符串
 * @returns 是否为HTTP/HTTPS
 */
export function isHttpUrl(url: string): boolean {
	try {
		const protocol = new URL(url).protocol
		return protocol === 'http:' || protocol === 'https:'
	} catch (error) {
		return /^https?:\/\//.test(url)
	}
}

/**
 * 判断是否为相对URL
 * @param url URL字符串
 * @returns 是否为相对URL
 */
export function isRelativeUrl(url: string): boolean {
	return !isValidUrl(url) && url.indexOf('//') !== 0
}

/**
 * 将相对URL转换为绝对URL（仅在浏览器环境中有效）
 * @param relativeUrl 相对URL
 * @param baseUrl 基础URL，默认为当前页面URL
 * @returns 绝对URL
 */
export function toAbsoluteUrl(relativeUrl: string, baseUrl?: string): string {
	try {
		const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : '')
		return new URL(relativeUrl, base).toString()
	} catch (error) {
		return relativeUrl
	}
}

/**
 * 格式化URL（移除末尾斜杠、统一协议等）
 * @param url URL字符串
 * @param options 格式化选项
 * @returns 格式化后的URL
 */
export function formatUrl(
	url: string,
	options: {
		removeTrailingSlash?: boolean
		forceHttps?: boolean
		removeWww?: boolean
	} = {},
): string {
	const { removeTrailingSlash = true, forceHttps = false, removeWww = false } = options

	try {
		const urlObj = new URL(url)

		// 强制使用HTTPS
		if (forceHttps && urlObj.protocol === 'http:') {
			urlObj.protocol = 'https:'
		}

		// 移除www
		if (removeWww && urlObj.hostname.indexOf('www.') === 0) {
			urlObj.hostname = urlObj.hostname.substring(4)
		}

		let result = urlObj.toString()

		// 移除末尾斜杠
		if (removeTrailingSlash && result.charAt(result.length - 1) === '/' && urlObj.pathname === '/') {
			result = result.slice(0, -1)
		}

		return result
	} catch (error) {
		return url
	}
}

/**
 * 获取文件名从URL
 * @param url URL字符串
 * @returns 文件名
 */
export function getFilenameFromUrl(url: string): string {
	try {
		const pathname = new URL(url).pathname
		const parts = pathname.split('/')
		return parts[parts.length - 1] || ''
	} catch (error) {
		const parts = url.split('/')
		return parts[parts.length - 1] || ''
	}
}

/**
 * 获取文件扩展名从URL
 * @param url URL字符串
 * @returns 文件扩展名
 */
export function getExtensionFromUrl(url: string): string {
	const filename = getFilenameFromUrl(url)
	const lastDotIndex = filename.lastIndexOf('.')
	return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex)
}

/**
 * 构建API URL
 * @param baseUrl 基础URL
 * @param endpoint 端点
 * @param params 参数
 * @returns 完整的API URL
 */
export function buildApiUrl(baseUrl: string, endpoint: string, params?: Record<string, any>): string {
	// 确保baseUrl不以斜杠结尾
	const cleanBaseUrl = baseUrl.replace(/\/$/, '')

	// 确保endpoint以斜杠开头
	const cleanEndpoint = endpoint.charAt(0) === '/' ? endpoint : `/${endpoint}`

	let url = `${cleanBaseUrl}${cleanEndpoint}`

	if (params && Object.keys(params).length > 0) {
		const paramString = buildUrlParams(params)
		url += `?${paramString}`
	}

	return url
}

/**
 * 解析URL路径参数（如 /users/:id）
 * @param pattern 路径模式
 * @param path 实际路径
 * @returns 参数对象
 */
export function parsePathParams(pattern: string, path: string): Record<string, string> {
	const params: Record<string, string> = {}

	const patternParts = pattern.split('/')
	const pathParts = path.split('/')

	if (patternParts.length !== pathParts.length) {
		return params
	}

	for (let i = 0; i < patternParts.length; i++) {
		const patternPart = patternParts[i]
		const pathPart = pathParts[i]

		if (patternPart && pathPart) {
			if (patternPart.charAt(0) === ':') {
				const paramName = patternPart.slice(1)
				params[paramName] = decodeURIComponent(pathPart)
			} else if (patternPart !== pathPart) {
				return {} // 路径不匹配
			}
		}
	}

	return params
}
