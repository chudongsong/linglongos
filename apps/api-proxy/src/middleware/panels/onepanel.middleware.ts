import { Request, Response, NextFunction } from 'express'
import { UserCredentials, ProxyRequest } from '@/types'
import { logger } from '@/utils/logger'
import { panelConfig } from '@/config'
import { createProxyError } from '@/middleware/error-handler'

export interface OnePanelApiResponse {
	code: number
	success: boolean
	data?: any
	message?: string
	timestamp?: string
}

export class OnePanelMiddleware {
	private readonly pathPrefix = panelConfig.onePanel.pathPrefix
	private readonly timeout = panelConfig.onePanel.defaultTimeout

	/**
	 * Process headers for 1Panel API requests
	 */
	private processHeaders(headers: Record<string, string>, credentials: UserCredentials): Record<string, string> {
		const processedHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'User-Agent': 'API-Proxy-Service/1.0',
		}

		// Add authentication
		if (credentials.apiKey) {
			// 1Panel typically uses Bearer token authentication
			processedHeaders['Authorization'] = `Bearer ${credentials.apiKey}`
		}

		// Copy safe headers from original request
		const safeHeaders = ['accept-language', 'accept-encoding', 'cache-control', 'pragma', 'x-requested-with']

		for (const headerName of safeHeaders) {
			const headerValue = headers[headerName.toLowerCase()]
			if (headerValue) {
				processedHeaders[headerName] = headerValue
			}
		}

		// Add custom headers for 1Panel
		processedHeaders['X-Panel-Type'] = '1panel'
		processedHeaders['X-API-Source'] = 'proxy-service'

		return processedHeaders
	}

	/**
	 * Map API paths to 1Panel specific paths
	 */
	private mapApiPath(originalPath: string): string {
		// Remove any existing API prefix
		let cleanPath = originalPath
		if (cleanPath.startsWith('/api/')) {
			cleanPath = cleanPath.substring(4)
		}
		if (cleanPath.startsWith('/v1/')) {
			cleanPath = cleanPath.substring(3)
		}

		// Common path mappings for 1Panel
		const pathMappings: Record<string, string> = {
			// Authentication
			'/auth/login': '/api/v1/auth/login',
			'/auth/logout': '/api/v1/auth/logout',
			'/auth/captcha': '/api/v1/auth/captcha',

			// System information
			'/system/info': '/api/v1/system/info',
			'/system/status': '/api/v1/system/status',
			'/system/load': '/api/v1/system/load',

			// Container management
			'/containers': '/api/v1/containers',
			'/containers/list': '/api/v1/containers',
			'/containers/create': '/api/v1/containers',
			'/containers/start': '/api/v1/containers/operate',
			'/containers/stop': '/api/v1/containers/operate',
			'/containers/restart': '/api/v1/containers/operate',

			// Image management
			'/images': '/api/v1/images',
			'/images/list': '/api/v1/images',
			'/images/pull': '/api/v1/images/pull',
			'/images/build': '/api/v1/images/build',

			// Application management
			'/apps': '/api/v1/apps',
			'/apps/installed': '/api/v1/apps/installed',
			'/apps/store': '/api/v1/apps/store',

			// File management
			'/files': '/api/v1/files',
			'/files/list': '/api/v1/files',
			'/files/upload': '/api/v1/files/upload',
			'/files/download': '/api/v1/files/download',

			// Database management
			'/databases': '/api/v1/databases',
			'/databases/mysql': '/api/v1/databases/mysql',
			'/databases/redis': '/api/v1/databases/redis',

			// Website management
			'/websites': '/api/v1/websites',
			'/websites/list': '/api/v1/websites',
			'/websites/create': '/api/v1/websites',

			// Backup management
			'/backups': '/api/v1/backups',
			'/backups/list': '/api/v1/backups',
			'/backups/create': '/api/v1/backups',
		}

		// Check for exact match
		if (pathMappings[cleanPath]) {
			return pathMappings[cleanPath]
		}

		// Check for pattern matches (e.g., /containers/123/logs)
		for (const [pattern, replacement] of Object.entries(pathMappings)) {
			if (pattern.includes('*') || cleanPath.startsWith(pattern + '/')) {
				const suffix = cleanPath.substring(pattern.length)
				return replacement + suffix
			}
		}

		// Default: prepend API prefix if not already present
		if (!cleanPath.startsWith('/api/v1/')) {
			return `/api/v1${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`
		}

		return cleanPath
	}

	/**
	 * Process request body for 1Panel API
	 */
	private processRequestBody(body: any, method: string): any {
		if (!body || method === 'GET') {
			return body
		}

		// 1Panel expects specific request formats
		let processedBody = { ...body }

		// Add common fields that 1Panel might expect
		if (!processedBody.timestamp) {
			processedBody.timestamp = Date.now()
		}

		// Handle specific request types
		if (processedBody.operation && processedBody.containerName) {
			// Container operation request
			processedBody = {
				operation: processedBody.operation,
				names: Array.isArray(processedBody.containerName) ? processedBody.containerName : [processedBody.containerName],
				...processedBody,
			}
		}

		return processedBody
	}

	/**
	 * Transform 1Panel API response to standardized format
	 */
	private transformResponse(onePanelResponse: any): any {
		// 1Panel typically returns responses in format: { code, success, data, message }
		if (onePanelResponse && typeof onePanelResponse === 'object') {
			// If it's already in 1Panel format, return as-is
			if ('code' in onePanelResponse && 'success' in onePanelResponse) {
				return onePanelResponse
			}

			// If it's raw data, wrap it in 1Panel format
			return {
				code: 200,
				success: true,
				data: onePanelResponse,
				message: 'Success',
				timestamp: new Date().toISOString(),
			}
		}

		// For primitive responses
		return {
			code: 200,
			success: true,
			data: onePanelResponse,
			message: 'Success',
			timestamp: new Date().toISOString(),
		}
	}

	/**
	 * Handle 1Panel specific error responses
	 */
	private handleErrorResponse(error: any, response?: any): any {
		let errorCode = 500
		let errorMessage = 'Internal server error'
		let errorData = null

		if (response) {
			errorCode = response.status || 500

			// Parse 1Panel error response
			if (response.data && typeof response.data === 'object') {
				if ('message' in response.data) {
					errorMessage = response.data.message
				}
				if ('code' in response.data) {
					errorCode = response.data.code
				}
				if ('data' in response.data) {
					errorData = response.data.data
				}
			}
		} else if (error) {
			errorMessage = error.message || errorMessage
			if (error.code) {
				errorCode = error.code
			}
		}

		return {
			code: errorCode,
			success: false,
			message: errorMessage,
			data: errorData,
			timestamp: new Date().toISOString(),
		}
	}

	/**
	 * Middleware function to process 1Panel requests
	 */
	public middleware() {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				// Ensure we have user credentials
				if (!req.user) {
					throw createProxyError('User authentication required for 1Panel middleware')
				}

				// Get user credentials (this would normally come from database)
				// For now, we'll assume credentials are attached to the request
				const credentials = req.body.credentials as UserCredentials
				if (!credentials || credentials.panelType !== 'onePanel') {
					throw createProxyError('Valid 1Panel credentials required')
				}

				// Process headers
				const processedHeaders = this.processHeaders(req.headers as Record<string, string>, credentials)

				// Map API path
				const mappedPath = this.mapApiPath(req.path)

				// Process request body
				const processedBody = this.processRequestBody(req.body, req.method)

				// Create processed request
				const proxyRequest: ProxyRequest = {
					originalUrl: req.originalUrl,
					method: req.method,
					headers: processedHeaders,
					body: processedBody,
					panelType: 'onePanel',
					userCredentials: credentials,
				}

				// Store processed request data for proxy engine
				req.proxyRequest = proxyRequest
				req.mappedPath = mappedPath

				logger.debug('1Panel request processed', {
					requestId: req.requestId,
					originalPath: req.path,
					mappedPath,
					method: req.method,
					userId: req.user.userId,
				})

				next()
			} catch (error) {
				logger.error('1Panel middleware error', {
					requestId: req.requestId,
					error: error instanceof Error ? error.message : 'Unknown error',
					path: req.path,
					method: req.method,
				})

				// Send 1Panel formatted error response
				const errorResponse = this.handleErrorResponse(error)
				res.status(errorResponse.code).json(errorResponse)
			}
		}
	}

	/**
	 * Response transformation middleware
	 */
	public responseTransform() {
		return (req: Request, res: Response, next: NextFunction) => {
			// Store original json method
			const originalJson = res.json

			// Override json method to transform response
			res.json = function (body: any) {
				const transformedResponse = new OnePanelMiddleware().transformResponse(body)
				return originalJson.call(this, transformedResponse)
			}

			next()
		}
	}
}

// Extend Request type to include processed request data
declare global {
	namespace Express {
		interface Request {
			proxyRequest?: ProxyRequest
			mappedPath?: string
		}
	}
}

export const onePanelMiddleware = new OnePanelMiddleware()
