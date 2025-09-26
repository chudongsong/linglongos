import axios from 'axios'
import https from 'https'
import { attachBtAuth } from '../middlewares/btMiddleware'
import { logger } from '../config/logger.config'
import type { ProxyRequestInput } from '../types/index'

/**
 * 执行代理请求
 *
 * 根据面板类型自动处理认证参数，并发送请求到目标面板。
 *
 * 支持的面板类型：
 * - 'bt': 宝塔面板，自动添加 request_time 和 request_token 认证参数
 * - '1panel': 1Panel 面板，直接转发请求
 *
 * @param input - 代理请求参数
 * @returns 目标面板的响应数据
 * @throws 当请求失败时抛出 axios 错误
 *
 * @example
 * ```typescript
 * const result = await proxyRequest({
 *   method: 'POST',
 *   path: '/api/panel/get_sys_info',
 *   panelType: 'bt',
 *   params: { action: 'get_sys_info' },
 *   binding: { url: 'http://panel.example.com:8888', key: 'api-key' }
 * });
 * ```
 */
export async function proxyRequest({
	method,
	path,
	panelType,
	params,
	binding,
	ignoreSslErrors = false,
}: ProxyRequestInput): Promise<any> {
	const baseUrl = binding.url.replace(/\/$/, '')
	const targetUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
	let finalParams: Record<string, unknown> = { ...params }

	logger.debug('Proxy Request Started', {
		method,
		path,
		panelType,
		targetUrl: targetUrl.replace(/\/\/.*@/, '//***@'), // 隐藏认证信息
		ignoreSslErrors,
		paramsCount: Object.keys(params).length,
	})

	// 为宝塔面板添加认证参数
	if (panelType === 'bt') {
		finalParams = attachBtAuth(finalParams, binding.key)
		logger.debug('BT Auth Parameters Attached', {
			originalParamsCount: Object.keys(params).length,
			finalParamsCount: Object.keys(finalParams).length,
		})
	}

	// 创建HTTPS代理配置
	const httpsAgent = new https.Agent({
		// 是否拒绝未授权的证书（自签名证书等）
		rejectUnauthorized: !ignoreSslErrors,
		// 设置证书验证回调函数
		checkServerIdentity: ignoreSslErrors
			? () => undefined // 忽略服务器身份验证
			: undefined, // 使用默认的服务器身份验证
		// 设置超时时间
		timeout: 15000,
		// 保持连接活跃
		keepAlive: true,
		keepAliveMsecs: 1000,
		maxSockets: 256,
		maxFreeSockets: 256,
	})

	const axiosConfig = {
		method,
		url: targetUrl,
		params: method === 'GET' ? finalParams : undefined,
		data: method !== 'GET' ? finalParams : undefined,
		timeout: 15000,
		// 为HTTPS请求添加代理配置
		httpsAgent: targetUrl.startsWith('https://') ? httpsAgent : undefined,
		// 添加请求头
		headers: {
			'User-Agent': 'LingLongOS-Panel-Proxy/1.0',
			Accept: 'application/json, text/plain, */*',
			'Content-Type': method !== 'GET' ? 'application/json' : undefined,
		},
		// 验证状态码
		validateStatus: (status: number) => status >= 200 && status < 300,
	} as const

	try {
		const startTime = Date.now()
		const response = await axios(axiosConfig)
		const responseTime = Date.now() - startTime

		logger.info('Proxy Request Successful', {
			method,
			path,
			panelType,
			statusCode: response.status,
			responseTime: `${responseTime}ms`,
			responseSize: JSON.stringify(response.data).length,
		})
		return response.data
	} catch (error) {
		// 处理SSL证书相关错误
		if (axios.isAxiosError(error)) {
			const errorCode = error.code
			const errorMessage = error.message

			// 检查是否为SSL证书错误
			if (
				errorCode === 'CERT_UNTRUSTED' ||
				errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
				errorCode === 'SELF_SIGNED_CERT_IN_CHAIN' ||
				errorCode === 'CERT_HAS_EXPIRED' ||
				errorMessage.includes('certificate') ||
				errorMessage.includes('SSL')
			) {
				// 如果是SSL错误且未设置忽略SSL错误，则提供详细错误信息
				if (!ignoreSslErrors) {
					throw new Error(
						`SSL证书验证失败: ${errorMessage}. 请检查目标服务器的SSL证书配置，或在请求中设置 ignoreSslErrors: true 来跳过证书验证。`,
					)
				}
			}

			// 处理其他网络错误
			if (errorCode === 'ECONNREFUSED') {
				throw new Error(`连接被拒绝: 无法连接到 ${targetUrl}，请检查目标服务器是否正在运行。`)
			}

			if (errorCode === 'ENOTFOUND') {
				throw new Error(`域名解析失败: 无法解析域名 ${new URL(targetUrl).hostname}，请检查网络连接和域名配置。`)
			}

			if (errorCode === 'ETIMEDOUT') {
				throw new Error(`请求超时: 连接到 ${targetUrl} 超时，请检查网络连接或增加超时时间。`)
			}

			// 抛出原始错误
			throw new Error(`代理请求失败: ${errorMessage}`)
		}

		// 非axios错误，直接抛出
		throw error
	}
}
