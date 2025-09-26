import type { Middleware } from 'koa'
import { logger, logUtils } from '../config/logger.config'

/**
 * HTTP 请求日志中间件
 *
 * 记录所有 HTTP 请求的详细信息，包括：
 * - 请求方法和 URL
 * - 响应状态码
 * - 响应时间
 * - 用户代理和 IP 地址
 * - 请求体大小（POST/PUT 请求）
 *
 * @returns Koa 中间件函数
 */
export const httpLoggerMiddleware: Middleware = async (ctx, next) => {
	const startTime = Date.now()
	const { method, url, ip } = ctx.request
	const userAgent = ctx.get('User-Agent')

	// 记录请求开始
	logger.debug('HTTP Request Started', {
		method,
		url,
		ip,
		userAgent,
		contentLength: ctx.get('Content-Length') || '0',
	})

	try {
		await next()
	} catch (error) {
		// 记录请求过程中的错误
		logUtils.logError(error as Error, {
			method,
			url,
			ip,
			userAgent,
		})
		throw error // 重新抛出错误，让错误处理中间件处理
	} finally {
		// 计算响应时间
		const responseTime = Date.now() - startTime

		// 记录请求完成
		logUtils.logHttpRequest(method, url, ctx.status, responseTime, userAgent, ip)

		// 记录慢请求（超过1秒）
		if (responseTime > 1000) {
			logger.warn('Slow Request Detected', {
				method,
				url,
				responseTime: `${responseTime}ms`,
				status: ctx.status,
			})
		}
	}
}

/**
 * 错误日志中间件
 *
 * 捕获并记录应用中的所有错误，提供详细的错误上下文信息
 *
 * @returns Koa 中间件函数
 */
export const errorLoggerMiddleware: Middleware = async (ctx, next) => {
	try {
		await next()
	} catch (error: any) {
		// 记录错误详情
		const errorInfo = {
			message: error?.message || 'Unknown error',
			stack: error?.stack,
			status: error?.status || 500,
			method: ctx.method,
			url: ctx.url,
			ip: ctx.ip,
			userAgent: ctx.get('User-Agent'),
			requestBody: ctx.request.body,
			headers: ctx.headers,
		}

		// 根据错误类型选择日志级别
		if (error?.status >= 500) {
			logger.error('Server Error', errorInfo)
		} else if (error?.status >= 400) {
			logger.warn('Client Error', errorInfo)
		} else {
			logger.error('Unexpected Error', errorInfo)
		}

		// 重新抛出错误，让应用的错误处理器处理
		throw error
	}
}

/**
 * 业务操作日志装饰器
 *
 * 用于包装业务操作函数，自动记录操作日志
 *
 * @param operation 操作名称
 * @param getUserId 获取用户 ID 的函数（可选）
 * @returns 装饰器函数
 */
export function logBusinessOperation(operation: string, getUserId?: (ctx: any) => string | undefined) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value

		descriptor.value = async function (ctx: any, ...args: any[]) {
			const userId = getUserId ? getUserId(ctx) : undefined
			const startTime = Date.now()

			try {
				// 记录操作开始
				logUtils.logBusinessAction(`${operation} - Started`, userId, {
					method: ctx.method,
					url: ctx.url,
				})

				const result = await originalMethod.apply(this, [ctx, ...args])

				// 记录操作成功
				const duration = Date.now() - startTime
				logUtils.logBusinessAction(`${operation} - Completed`, userId, {
					duration: `${duration}ms`,
					success: true,
				})

				return result
			} catch (error) {
				// 记录操作失败
				const duration = Date.now() - startTime
				logUtils.logBusinessAction(`${operation} - Failed`, userId, {
					duration: `${duration}ms`,
					success: false,
					error: error instanceof Error ? error.message : String(error),
				})

				throw error
			}
		}

		return descriptor
	}
}

/**
 * 性能监控中间件
 *
 * 监控应用性能指标，记录关键性能数据
 *
 * @returns Koa 中间件函数
 */
export const performanceLoggerMiddleware: Middleware = async (ctx, next) => {
	const startTime = process.hrtime.bigint()
	const startMemory = process.memoryUsage()

	await next()

	const endTime = process.hrtime.bigint()
	const endMemory = process.memoryUsage()

	const responseTime = Number(endTime - startTime) / 1000000 // 转换为毫秒
	const memoryDelta = endMemory.heapUsed - startMemory.heapUsed

	// 记录性能指标
	logUtils.logMetric('response_time', responseTime, 'ms', {
		method: ctx.method,
		route: ctx.url,
		status: ctx.status.toString(),
	})

	logUtils.logMetric('memory_usage', memoryDelta, 'bytes', {
		method: ctx.method,
		route: ctx.url,
	})

	// 记录内存使用情况（每100个请求记录一次）
	if (Math.random() < 0.01) {
		// 1% 的概率
		logger.info('Memory Usage', {
			heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
			heapTotal: `${Math.round(endMemory.heapTotal / 1024 / 1024)}MB`,
			external: `${Math.round(endMemory.external / 1024 / 1024)}MB`,
			rss: `${Math.round(endMemory.rss / 1024 / 1024)}MB`,
		})
	}
}

/**
 * 安全事件日志记录器
 *
 * 记录安全相关的事件，如认证失败、权限检查等
 */
export const securityLogger = {
	/**
	 * 记录认证事件
	 *
	 * @param event 事件类型
	 * @param userId 用户 ID
	 * @param ip 客户端 IP
	 * @param details 事件详情
	 */
	logAuthEvent(
		event: 'login_success' | 'login_failed' | 'logout' | 'token_expired' | 'token_invalid',
		userId?: string,
		ip?: string,
		details?: Record<string, unknown>,
	) {
		logger.info('Security Event - Authentication', {
			event,
			userId,
			ip,
			timestamp: new Date().toISOString(),
			...details,
		})
	},

	/**
	 * 记录权限检查事件
	 *
	 * @param event 事件类型
	 * @param userId 用户 ID
	 * @param resource 资源名称
	 * @param action 操作类型
	 * @param granted 是否授权
	 * @param ip 客户端 IP
	 */
	logAuthorizationEvent(
		event: 'permission_check',
		userId: string,
		resource: string,
		action: string,
		granted: boolean,
		ip?: string,
	) {
		const level = granted ? 'info' : 'warn'
		logger.log(level, 'Security Event - Authorization', {
			event,
			userId,
			resource,
			action,
			granted,
			ip,
			timestamp: new Date().toISOString(),
		})
	},

	/**
	 * 记录可疑活动
	 *
	 * @param activity 活动类型
	 * @param description 活动描述
	 * @param ip 客户端 IP
	 * @param details 详细信息
	 */
	logSuspiciousActivity(activity: string, description: string, ip?: string, details?: Record<string, unknown>) {
		logger.warn('Security Event - Suspicious Activity', {
			activity,
			description,
			ip,
			timestamp: new Date().toISOString(),
			...details,
		})
	},
}
