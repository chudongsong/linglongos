import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { UserCredentials, ProxyRequest } from '@/types'
import { logger } from '@/utils/logger'
import { panelConfig } from '@/config'
import { createProxyError } from '@/middleware/error-handler'

export interface BaotaApiResponse {
	status: boolean
	msg: string
	data?: any
	code?: number
}

export class BaotaMiddleware {
	private readonly pathPrefix = panelConfig.baota.pathPrefix
	private readonly timeout = panelConfig.baota.defaultTimeout
	private readonly signatureRequired = panelConfig.baota.signatureRequired

	/**
	 * Generate request signature for Baota panel
	 */
	private generateSignature(data: any, secretKey: string): string {
		const timestamp = Date.now()
		const requestData = typeof data === 'object' ? JSON.stringify(data) : String(data)
		const signatureData = `${timestamp}${requestData}`

		return crypto.createHmac('sha256', secretKey).update(signatureData).digest('hex')
	}

	/**
	 * Process headers for Baota API requests
	 */
	private processHeaders(headers: Record<string, string>, credentials: UserCredentials): Record<string, string> {
		const processedHeaders: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			'User-Agent': 'API-Proxy-Service/1.0',
		}

		// Baota typically uses API key in headers or request body
		if (credentials.apiKey) {
			processedHeaders['X-BT-Key'] = credentials.apiKey
		}

		// Copy safe headers from original request
		const safeHeaders = ['accept-language', 'accept-encoding', 'cache-control', 'pragma', 'x-requested-with']

		for (const headerName of safeHeaders) {
			const headerValue = headers[headerName.toLowerCase()]
			if (headerValue) {
				processedHeaders[headerName] = headerValue
			}
		}

		// Add custom headers for Baota
		processedHeaders['X-Panel-Type'] = 'baota'
		processedHeaders['X-API-Source'] = 'proxy-service'

		return processedHeaders
	}

	/**
	 * Map API paths to Baota specific paths
	 */
	private mapApiPath(originalPath: string): string {
		// Remove any existing API prefix
		let cleanPath = originalPath
		if (cleanPath.startsWith('/api/')) {
			cleanPath = cleanPath.substring(4)
		}

		// Common path mappings for Baota panel
		const pathMappings: Record<string, string> = {
			// Authentication
			'/auth/login': '/login',
			'/auth/logout': '/logout',
			'/auth/check': '/GetToken',

			// System information
			'/system/info': '/ajax',
			'/system/status': '/ajax',
			'/system/load': '/ajax',
			'/system/network': '/ajax',
			'/system/disk': '/ajax',

			// File management
			'/files': '/files',
			'/files/list': '/files',
			'/files/upload': '/files',
			'/files/download': '/files',
			'/files/create': '/files',
			'/files/delete': '/files',
			'/files/edit': '/files',

			// Website management
			'/websites': '/site',
			'/websites/list': '/data',
			'/websites/create': '/site',
			'/websites/delete': '/site',
			'/websites/status': '/site',

			// Database management
			'/databases': '/database',
			'/databases/mysql': '/database',
			'/databases/list': '/data',
			'/databases/create': '/database',
			'/databases/delete': '/database',

			// FTP management
			'/ftp': '/ftp',
			'/ftp/list': '/data',
			'/ftp/create': '/ftp',
			'/ftp/delete': '/ftp',

			// SSL management
			'/ssl': '/acme',
			'/ssl/list': '/acme',
			'/ssl/create': '/acme',
			'/ssl/apply': '/acme',

			// Backup management
			'/backups': '/files',
			'/backups/list': '/files',
			'/backups/create': '/files',
			'/backups/restore': '/files',

			// Security management
			'/security': '/ajax',
			'/security/firewall': '/firewall',
			'/security/logs': '/ajax',

			// Software management
			'/software': '/ajax',
			'/software/list': '/ajax',
			'/software/install': '/ajax',
			'/software/uninstall': '/ajax',
		}

		// Check for exact match
		if (pathMappings[cleanPath]) {
			return pathMappings[cleanPath]
		}

		// Check for pattern matches
		for (const [pattern, replacement] of Object.entries(pathMappings)) {
			if (cleanPath.startsWith(pattern + '/')) {
				return replacement
			}
		}

		// Default to /ajax for most API calls
		return '/ajax'
	}

	/**
	 * Convert request to Baota API format
	 */
	private convertToBaotaFormat(path: string, method: string, body: any): any {
		const baotaRequest: any = {
			request_token: 'baota_api_request',
			request_time: Math.floor(Date.now() / 1000),
		}

		// Determine action based on path and method
		const action = this.determineAction(path, method, body)
		if (action) {
			baotaRequest.action = action
		}

		// Add request parameters
		if (body && typeof body === 'object') {
			Object.assign(baotaRequest, body)
		}

		// Convert specific request types
		if (path.includes('/websites')) {
			return this.convertWebsiteRequest(method, body, baotaRequest)
		} else if (path.includes('/databases')) {
			return this.convertDatabaseRequest(method, body, baotaRequest)
		} else if (path.includes('/files')) {
			return this.convertFileRequest(method, body, baotaRequest)
		} else if (path.includes('/system')) {
			return this.convertSystemRequest(method, body, baotaRequest)
		}

		return baotaRequest
	}

	/**
	 * Determine Baota action based on path and method
	 */
	private determineAction(path: string, method: string, body: any): string {
		const pathSegments = path.split('/').filter((segment) => segment)
		const resource = pathSegments[0]
		const operation = pathSegments[1] || body?.operation

		const actionMap: Record<string, Record<string, string>> = {
			websites: {
				GET: 'GetSites',
				POST: 'AddSite',
				PUT: 'WebSetEnable',
				DELETE: 'DeleteSite',
				list: 'GetSites',
				create: 'AddSite',
				delete: 'DeleteSite',
				status: 'WebSetEnable',
			},
			databases: {
				GET: 'GetDatabases',
				POST: 'AddDatabase',
				DELETE: 'DeleteDatabase',
				list: 'GetDatabases',
				create: 'AddDatabase',
				delete: 'DeleteDatabase',
			},
			files: {
				GET: 'GetDir',
				POST: 'CreateFile',
				PUT: 'SaveFileBody',
				DELETE: 'DeleteFile',
				list: 'GetDir',
				upload: 'UploadFile',
				download: 'DownloadFile',
				create: 'CreateFile',
				edit: 'SaveFileBody',
				delete: 'DeleteFile',
			},
			system: {
				GET: 'GetSystemTotal',
				info: 'GetSystemTotal',
				status: 'GetSystemTotal',
				load: 'GetLoadAverage',
				network: 'GetNetWork',
				disk: 'GetDiskInfo',
			},
		}

		if (resource && actionMap[resource]) {
			return actionMap[resource][method] || actionMap[resource][operation] || 'GetData'
		}

		return 'GetData'
	}

	/**
	 * Convert website management requests
	 */
	private convertWebsiteRequest(method: string, body: any, baseRequest: any): any {
		const request = { ...baseRequest }

		if (method === 'GET' || body?.operation === 'list') {
			request.action = 'GetSites'
			request.p = body?.page || 1
			request.limit = body?.limit || 20
			request.search = body?.search || ''
		} else if (method === 'POST' || body?.operation === 'create') {
			request.action = 'AddSite'
			request.webname = body?.domain || body?.name
			request.domains = Array.isArray(body?.domains) ? body.domains.join('\n') : body?.domain
			request.type_id = body?.php_version || 0
			request.port = body?.port || 80
			request.ps = body?.description || ''
		} else if (method === 'DELETE' || body?.operation === 'delete') {
			request.action = 'DeleteSite'
			request.id = body?.id || body?.site_id
			request.webname = body?.domain || body?.name
		}

		return request
	}

	/**
	 * Convert database management requests
	 */
	private convertDatabaseRequest(method: string, body: any, baseRequest: any): any {
		const request = { ...baseRequest }

		if (method === 'GET' || body?.operation === 'list') {
			request.action = 'GetDatabases'
			request.p = body?.page || 1
			request.limit = body?.limit || 20
			request.search = body?.search || ''
		} else if (method === 'POST' || body?.operation === 'create') {
			request.action = 'AddDatabase'
			request.name = body?.name
			request.username = body?.username || body?.name
			request.password = body?.password
			request.address = body?.host || '127.0.0.1'
			request.ps = body?.description || ''
		} else if (method === 'DELETE' || body?.operation === 'delete') {
			request.action = 'DeleteDatabase'
			request.id = body?.id
			request.name = body?.name
		}

		return request
	}

	/**
	 * Convert file management requests
	 */
	private convertFileRequest(method: string, body: any, baseRequest: any): any {
		const request = { ...baseRequest }

		if (method === 'GET' || body?.operation === 'list') {
			request.action = 'GetDir'
			request.path = body?.path || '/'
			request.p = body?.page || 1
			request.showHidden = body?.show_hidden || false
		} else if (body?.operation === 'upload') {
			request.action = 'UploadFile'
			request.path = body?.path || '/'
		} else if (body?.operation === 'download') {
			request.action = 'DownloadFile'
			request.filename = body?.filename
			request.path = body?.path
		}

		return request
	}

	/**
	 * Convert system information requests
	 */
	private convertSystemRequest(method: string, body: any, baseRequest: any): any {
		const request = { ...baseRequest }

		if (body?.operation === 'info' || method === 'GET') {
			request.action = 'GetSystemTotal'
		} else if (body?.operation === 'load') {
			request.action = 'GetLoadAverage'
		} else if (body?.operation === 'network') {
			request.action = 'GetNetWork'
		} else if (body?.operation === 'disk') {
			request.action = 'GetDiskInfo'
		}

		return request
	}

	/**
	 * Transform Baota API response to standardized format
	 */
	private transformResponse(baotaResponse: any): any {
		// Baota typically returns responses in format: { status, msg, data }
		if (baotaResponse && typeof baotaResponse === 'object') {
			// If it's already in Baota format, standardize it
			if ('status' in baotaResponse) {
				return {
					success: baotaResponse.status === true,
					data: baotaResponse.data || baotaResponse.msg,
					message: baotaResponse.msg || (baotaResponse.status ? 'Success' : 'Error'),
					code: baotaResponse.status ? 200 : 400,
					timestamp: new Date().toISOString(),
				}
			}

			// If it's raw data, wrap it in standard format
			return {
				success: true,
				data: baotaResponse,
				message: 'Success',
				code: 200,
				timestamp: new Date().toISOString(),
			}
		}

		// For primitive responses
		return {
			success: true,
			data: baotaResponse,
			message: 'Success',
			code: 200,
			timestamp: new Date().toISOString(),
		}
	}

	/**
	 * Handle Baota specific error responses
	 */
	private handleErrorResponse(error: any, response?: any): any {
		let errorCode = 500
		let errorMessage = 'Internal server error'
		let errorData = null

		if (response) {
			errorCode = response.status || 500

			// Parse Baota error response
			if (response.data && typeof response.data === 'object') {
				if ('msg' in response.data) {
					errorMessage = response.data.msg
				}
				if ('status' in response.data && !response.data.status) {
					errorCode = 400
				}
				if ('data' in response.data) {
					errorData = response.data.data
				}
			}
		} else if (error) {
			errorMessage = error.message || errorMessage
		}

		return {
			success: false,
			message: errorMessage,
			data: errorData,
			code: errorCode,
			timestamp: new Date().toISOString(),
		}
	}

	/**
	 * Middleware function to process Baota requests
	 */
	public middleware() {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				// Ensure we have user credentials
				if (!req.user) {
					throw createProxyError('User authentication required for Baota middleware')
				}

				// Get user credentials
				const credentials = req.body.credentials as UserCredentials
				if (!credentials || credentials.panelType !== 'baota') {
					throw createProxyError('Valid Baota credentials required')
				}

				// Process headers
				const processedHeaders = this.processHeaders(req.headers as Record<string, string>, credentials)

				// Map API path
				const mappedPath = this.mapApiPath(req.path)

				// Convert to Baota format
				const baotaRequestBody = this.convertToBaotaFormat(req.path, req.method, req.body)

				// Add signature if required
				if (this.signatureRequired && credentials.apiKey) {
					baotaRequestBody.request_token = this.generateSignature(baotaRequestBody, credentials.apiKey)
				}

				// Create processed request
				const proxyRequest: ProxyRequest = {
					originalUrl: req.originalUrl,
					method: 'POST', // Baota typically uses POST for all requests
					headers: processedHeaders,
					body: baotaRequestBody,
					panelType: 'baota',
					userCredentials: credentials,
				}

				// Store processed request data for proxy engine
				req.proxyRequest = proxyRequest
				req.mappedPath = mappedPath

				logger.debug('Baota request processed', {
					requestId: req.requestId,
					originalPath: req.path,
					mappedPath,
					action: baotaRequestBody.action,
					userId: req.user.userId,
				})

				next()
			} catch (error) {
				logger.error('Baota middleware error', {
					requestId: req.requestId,
					error: error instanceof Error ? error.message : 'Unknown error',
					path: req.path,
					method: req.method,
				})

				// Send Baota formatted error response
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
				const transformedResponse = new BaotaMiddleware().transformResponse(body)
				return originalJson.call(this, transformedResponse)
			}

			next()
		}
	}
}

export const baotaMiddleware = new BaotaMiddleware()
