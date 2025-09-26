/**
 * 统一配置管理模块
 *
 * 集中管理所有配置相关的导出，提供统一的配置访问接口
 */

// 日志配置
export { createLogger, logger, logUtils } from './logger.config'

// 认证配置
export {
	readGoogleAuthConfig,
	saveGoogleAuthConfig,
	markGoogleAuthConfigured,
	resetGoogleAuthConfig,
	isGoogleAuthConfigured,
} from './auth.config'

// 环境变量配置
export const config = {
	port: Number(process.env.PORT) || 4000,
	nodeEnv: process.env.NODE_ENV || 'development',
	isDevelopment: process.env.NODE_ENV === 'development',
	isProduction: process.env.NODE_ENV === 'production',

	// 数据库配置（如果有）
	database: {
		// 预留数据库配置空间
	},

	// 安全配置
	security: {
		sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
		maxLoginAttempts: 5,
		lockoutDuration: 15 * 60 * 1000, // 15分钟
	},

	// API配置
	api: {
		prefix: '/api/v1',
		timeout: 30000, // 30秒
		maxRequestSize: '10mb',
	},

	// 代理配置
	proxy: {
		timeout: 30000,
		maxRedirects: 5,
		ignoreSslErrors: process.env.IGNORE_SSL_ERRORS === 'true',
	},
} as const

/**
 * 获取完整的应用配置
 *
 * @returns 应用配置对象
 */
export function getAppConfig() {
	return {
		...config,
	}
}

/**
 * 验证必要的环境变量是否存在
 *
 * @throws {Error} 当必要的环境变量缺失时抛出错误
 */
export function validateEnvironment(): void {
	const requiredEnvVars: string[] = [
		// 根据实际需要添加必要的环境变量
	]

	const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

	if (missingVars.length > 0) {
		throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
	}
}
