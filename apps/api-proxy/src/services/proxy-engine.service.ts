import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { Request, Response, NextFunction } from 'express'
import { ProxyRequest, ProxyResponse, UserCredentials } from '@/types'
import { logger } from '@/utils/logger'
import { panelConfig } from '@/config'
import { createProxyError, createPanelConnectionError } from '@/middleware/error-handler'

export interface ProxyEngineOptions {
	timeout?: number
	retryAttempts?: number
	retryDelay?: number
	validateSsl?: boolean
}

export class ProxyEngine {
	private defaultOptions: ProxyEngineOptions = {
		timeout: 10000,
		retryAttempts: 3,
		retryDelay: 1000,
		validateSsl: false,
	}

	constructor(options?: Partial<ProxyEngineOptions>) {
		this.defaultOptions = { ...this.defaultOptions, ...options }
	}

	/**
	 * 使用 axios 执行代理请求
	 */
	public async executeRequest(
		proxyRequest: ProxyRequest,
		targetPath: string,
		options?: Partial<ProxyEngineOptions>,
	): Promise<ProxyResponse> {
		const startTime = Date.now()
		const mergedOptions = { ...this.defaultOptions, ...options }

		try {
			// 构建目标 URL
			const targetUrl = this.buildTargetUrl(proxyRequest.userCredentials.endpoint, targetPath)

			// 准备请求配置
			const axiosConfig: AxiosRequestConfig = {
				method: proxyRequest.method.toLowerCase() as any,
				url: targetUrl,
				headers: proxyRequest.headers,
				timeout: mergedOptions.timeout,
				validateStatus: () => true, // 接受所有状态码
				httpsAgent: mergedOptions.validateSsl
					? undefined
					: new (require('https').Agent)({
							rejectUnauthorized: false,
						}),
			}

			// 为非-GET 请求添加请求体
			if (proxyRequest.method !== 'GET' && proxyRequest.body) {
				if (proxyRequest.headers['content-type']?.includes('application/json')) {
					axiosConfig.data = JSON.stringify(proxyRequest.body)
				} else if (proxyRequest.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
					axiosConfig.data = this.serializeFormData(proxyRequest.body)
				} else {
					axiosConfig.data = proxyRequest.body
				}
			}

			// 使用重试逻辑执行请求
			const response = await this.executeWithRetry(axiosConfig, mergedOptions)

			const processingTime = Date.now() - startTime

			logger.info('Proxy request successful', {
				url: targetUrl,
				method: proxyRequest.method,
				statusCode: response.status,
				processingTime: `${processingTime}ms`,
				panelType: proxyRequest.panelType,
			})

			return {
				statusCode: response.status,
				headers: response.headers as Record<string, string>,
				body: response.data,
				processingTime,
			}
		} catch (error) {
			const processingTime = Date.now() - startTime

			logger.error('Proxy request failed', {
				url: proxyRequest.userCredentials.endpoint,
				method: proxyRequest.method,
				error: error instanceof Error ? error.message : 'Unknown error',
				processingTime: `${processingTime}ms`,
				panelType: proxyRequest.panelType,
			})

			throw createProxyError(`Proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
				endpoint: proxyRequest.userCredentials.endpoint,
				method: proxyRequest.method,
				processingTime,
			})
		}
	}

	/**
	 * 使用重试逻辑执行请求
	 */
	private async executeWithRetry(config: AxiosRequestConfig, options: ProxyEngineOptions): Promise<AxiosResponse> {
		let lastError: Error | null = null

		for (let attempt = 1; attempt <= options.retryAttempts!; attempt++) {
			try {
				const response = await axios(config)

				// 对成功响应（甚至 4xx/5xx）不进行重试
				if (response.status < 500 || attempt === options.retryAttempts) {
					return response
				}

				throw new Error(`Server error: ${response.status} ${response.statusText}`)
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error')

				// 对客户端错误（4xx）或最后一次尝试不进行重试
				if (axios.isAxiosError(error)) {
					if (error.response && error.response.status < 500) {
						return error.response
					}
					if (attempt === options.retryAttempts) {
						throw lastError
					}
				} else if (attempt === options.retryAttempts) {
					throw lastError
				}

				// 在重试前等待
				if (attempt < options.retryAttempts!) {
					const delay = options.retryDelay! * Math.pow(2, attempt - 1) // 指数退让
					logger.debug(`Retrying request in ${delay}ms (attempt ${attempt}/${options.retryAttempts})`, {
						url: config.url,
						error: lastError.message,
					})
					await this.sleep(delay)
				}
			}
		}

		throw lastError
	}

	/**
	 * 为流请求创建 HTTP 代理中间件
	 */
	public createProxyMiddleware(credentials: UserCredentials, options?: Partial<ProxyEngineOptions>): any {
		const mergedOptions = { ...this.defaultOptions, ...options }

		const proxyOptions: Options = {
			target: credentials.endpoint,
			changeOrigin: true,
			secure: mergedOptions.validateSsl,
			timeout: mergedOptions.timeout,

			// 根据面板类型添加认证头
			onProxyReq: (proxyReq, req: Request) => {
				// 根据面板类型添加认证头
				if (credentials.panelType === 'onePanel') {
					proxyReq.setHeader('Authorization', `Bearer ${credentials.apiKey}`)
				} else if (credentials.panelType === 'baota') {
					proxyReq.setHeader('X-BT-Key', credentials.apiKey)
				}

				// 添加跟踪头
				proxyReq.setHeader('X-Proxy-Source', 'api-proxy-service')
				proxyReq.setHeader('X-Request-ID', req.requestId || 'unknown')

				logger.debug('Proxy request headers set', {
					requestId: req.requestId,
					target: credentials.endpoint,
					panelType: credentials.panelType,
				})
			},

			// 处理代理响应
			onProxyRes: (proxyRes, req: Request, res: Response) => {
				// 添加响应头
				res.setHeader('X-Proxy-Target', credentials.endpoint)
				res.setHeader('X-Panel-Type', credentials.panelType)

				logger.debug('Proxy response received', {
					requestId: req.requestId,
					statusCode: proxyRes.statusCode,
					target: credentials.endpoint,
				})
			},

			// 处理错误
			onError: (err, req: Request, res: Response) => {
				logger.error('Proxy middleware error', {
					requestId: req.requestId,
					error: err.message,
					target: credentials.endpoint,
				})

				if (!res.headersSent) {
					res.status(502).json({
						success: false,
						error: {
							code: 'PROXY_ERROR',
							message: 'Proxy request failed',
							details: {
								target: credentials.endpoint,
								error: err.message,
							},
							timestamp: new Date().toISOString(),
						},
					})
				}
			},

			// 路径重写
			pathRewrite: (path, req: Request) => {
				// 如果可用，使用映射路径
				const mappedPath = req.mappedPath || path

				logger.debug('Path rewritten for proxy', {
					requestId: req.requestId,
					originalPath: path,
					mappedPath,
					panelType: credentials.panelType,
				})

				return mappedPath
			},
		}

		return createProxyMiddleware(proxyOptions)
	}

	/**
	 * 构建目标 URL
	 */
	private buildTargetUrl(endpoint: string, path: string): string {
		try {
			const baseUrl = new URL(endpoint)
			const targetUrl = new URL(path, baseUrl)
			return targetUrl.toString()
		} catch (error) {
			throw createPanelConnectionError(`Invalid endpoint or path: ${endpoint}${path}`, endpoint)
		}
	}

	/**
	 * 为 URL 编码序列化表单数据
	 */
	private serializeFormData(data: any): string {
		const params = new URLSearchParams()

		for (const [key, value] of Object.entries(data)) {
			if (value !== null && value !== undefined) {
				params.append(key, String(value))
			}
		}

		return params.toString()
	}

	/**
	 * 用于重试延迟的睡眠工具
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * 目标端点的健康检查
	 */
	public async healthCheck(credentials: UserCredentials): Promise<boolean> {
		try {
			const healthPath = credentials.panelType === 'onePanel' ? '/api/v1/system/info' : '/ajax'

			const response = await axios({
				method: 'GET',
				url: this.buildTargetUrl(credentials.endpoint, healthPath),
				timeout: 5000,
				validateStatus: () => true,
				httpsAgent: new (require('https').Agent)({
					rejectUnauthorized: false,
				}),
			})

			const isHealthy = response.status < 500

			logger.debug('Health check completed', {
				endpoint: credentials.endpoint,
				panelType: credentials.panelType,
				statusCode: response.status,
				isHealthy,
			})

			return isHealthy
		} catch (error) {
			logger.warn('Health check failed', {
				endpoint: credentials.endpoint,
				panelType: credentials.panelType,
				error: error instanceof Error ? error.message : 'Unknown error',
			})

			return false
		}
	}
}

export const proxyEngine = new ProxyEngine({
	timeout: panelConfig.onePanel.defaultTimeout,
	retryAttempts: panelConfig.onePanel.retryAttempts,
	retryDelay: 1000,
	validateSsl: false,
})
