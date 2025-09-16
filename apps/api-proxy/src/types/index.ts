export interface ServerConfig {
	port: number
	host: string
	cors: {
		origin: string[]
		credentials: boolean
	}
	encryption: {
		masterKey: string
		algorithm: string
	}
	database: {
		type: 'sqlite' | 'mysql' | 'postgresql'
		connectionString: string
	}
	logging: {
		level: 'debug' | 'info' | 'warn' | 'error'
		file: string
	}
}

export interface UserCredentials {
	userId: string
	apiKey: string
	panelType: 'onePanel' | 'baota'
	endpoint: string
}

export interface PanelDetectionResult {
	panelType: 'onePanel' | 'baota' | 'unknown'
	version?: string
	capabilities: string[]
}

export interface ProxyRequest {
	originalUrl: string
	method: string
	headers: Record<string, string>
	body: any
	panelType: string
	userCredentials: UserCredentials
}

export interface ProxyResponse {
	statusCode: number
	headers: Record<string, string>
	body: any
	processingTime: number
}

export interface ApiError {
	code: string
	category: ErrorCategory
	message: string
	details?: any
	timestamp: string
	requestId: string
}

export enum ErrorCategory {
	AUTHENTICATION = 'AUTH',
	AUTHORIZATION = 'AUTHZ',
	VALIDATION = 'VALIDATION',
	PANEL_CONNECTION = 'PANEL_CONN',
	PROXY_ERROR = 'PROXY',
	INTERNAL = 'INTERNAL',
}

export interface AuthConfig {
	jwtSecret: string
	tokenExpiry: string
	rateLimiting: {
		windowMs: number
		maxRequests: number
	}
}

export interface PanelConfig {
	onePanel: {
		defaultTimeout: number
		retryAttempts: number
		pathPrefix: string
		supportedVersions: string[]
	}
	baota: {
		defaultTimeout: number
		signatureRequired: boolean
		pathPrefix: string
		supportedVersions: string[]
	}
}

export interface Metrics {
	requests: {
		total: number
		success: number
		failed: number
		averageResponseTime: number
	}
	panels: {
		onePanel: PanelMetrics
		baota: PanelMetrics
	}
	security: {
		authFailures: number
		rateLimitHits: number
	}
}

export interface PanelMetrics {
	totalRequests: number
	errorRate: number
	averageLatency: number
	lastHealthCheck: string
}
