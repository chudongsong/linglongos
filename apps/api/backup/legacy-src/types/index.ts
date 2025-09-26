/**
 * API 类型定义文件
 *
 * 统一管理所有 API 相关的类型定义，确保类型安全和一致性。
 */

/**
 * API 响应状态类型
 */
export type ApiStatus = 'success' | 'error' | 'info' | 'warning'

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = unknown> {
	/** HTTP 状态码 */
	code: number
	/** 响应状态 */
	status: ApiStatus
	/** 响应消息 */
	message: string
	/** 响应数据 */
	data: T
}

/**
 * 成功响应格式
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
	code: 200
	status: 'success'
}

/**
 * 错误响应格式
 */
export interface ErrorResponse extends ApiResponse<unknown> {
	status: 'error'
}

/**
 * 会话数据接口
 */
export interface Session {
	/** 会话唯一标识符 */
	id: string
	/** 会话创建时间戳 */
	createdAt: number
	/** 会话过期时间戳 */
	expiresAt: number
	/** 面板绑定信息映射表，键为面板类型，值为连接信息 */
	panelBindings: Map<string, PanelBinding>
}

/**
 * 面板绑定信息接口
 */
export interface PanelBinding {
	/** 面板访问地址 */
	url: string
	/** 面板 API 密钥 */
	key: string
}

/**
 * 面板类型枚举
 */
export type PanelType = 'bt' | '1panel'

/**
 * HTTP 请求方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * 代理请求输入参数接口
 */
export interface ProxyRequestInput {
	/** HTTP 请求方法 */
	method: HttpMethod
	/** 请求路径 */
	path: string
	/** 面板类型 */
	panelType: PanelType
	/** 请求参数 */
	params: Record<string, unknown>
	/** 面板绑定信息 */
	binding: PanelBinding
	/** 是否忽略SSL证书验证（可选，默认false） */
	ignoreSslErrors?: boolean
}

/**
 * Google Auth 验证请求体接口
 */
export interface GoogleAuthVerifyRequest {
	/** 6 位字符串（TOTP 验证码） */
	token: string
}

/**
 * Google Auth 配置完成请求体接口
 */
export interface GoogleAuthCompleteRequest {
	/** 用户 ID 字符串 */
	userId: string
}

/**
 * 面板密钥绑定请求体接口
 */
export interface BindPanelKeyRequest {
	/** 面板类型 */
	type: PanelType
	/** 面板访问地址 */
	url: string
	/** 面板 API 密钥 */
	key: string
}

/**
 * 代理请求参数接口
 */
export interface ProxyRequest {
	/** 请求路径 */
	url: string
	/** 面板类型 */
	panelType: PanelType
	/** 请求参数（可选） */
	params?: Record<string, unknown>
	/** 是否忽略SSL证书验证（可选） */
	ignoreSslErrors?: boolean
}

/**
 * 代理请求查询参数接口
 */
export interface ProxyRequestQuery {
	/** 请求路径 */
	url: string
	/** 面板类型 */
	panelType: PanelType
	/** 是否忽略SSL证书验证（可选） */
	ignoreSslErrors?: boolean
}

/**
 * Google Auth 配置状态接口
 */
export interface GoogleAuthConfig {
	/** 是否已配置 */
	isConfigured: boolean
	/** 配置时间戳（可选） */
	configuredAt?: number
	/** 配置的用户 ID（可选） */
	userId?: string
}

/**
 * Google Auth 绑定响应接口
 */
export interface GoogleAuthBindResponse {
	/** 二维码 URL */
	qrCodeUrl: string
	/** TOTP 密钥 */
	secret: string
}

/**
 * 日志级别类型
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'

/**
 * 日志配置接口
 */
export interface LoggerConfig {
	level: LogLevel
	enableConsole: boolean
	enableFile: boolean
	logDir: string
	maxFiles: number
	maxSize: string
}

/**
 * 安全事件类型
 */
export type SecurityEventType = 'login_success' | 'login_failed' | 'logout' | 'token_expired' | 'token_invalid'

/**
 * 权限检查事件类型
 */
export type AuthorizationEventType = 'permission_check'

/**
 * 路由文档元数据接口
 */
export interface RouteDocMeta {
	/** 标签分组 */
	tag: string
	/** HTTP 方法 */
	method: string
	/** 路由路径 */
	path: string
	/** 请求体 schema */
	requestSchema?: any
	/** 查询参数 schema */
	querySchema?: any
}
