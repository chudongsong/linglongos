import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createRequestLogger } from '@/utils/logger'
import { apiLogRepository } from '@/models/api-log.repository'
import { logger } from '@/utils/logger'

// 扩展 Request 类型以包含 requestId
declare global {
	namespace Express {
		interface Request {
			requestId: string
			startTime: number
		}
	}
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
	// 生成唯一请求 ID
	req.requestId = uuidv4()
	req.startTime = Date.now()

	// 将请求 ID 添加到响应头
	res.setHeader('X-Request-ID', req.requestId)

	// 记录请求完成
	res.on('finish', async () => {
		const responseTime = Date.now() - req.startTime
		const { method, originalUrl, ip } = req
		const { statusCode } = res

		const logData = {
			method,
			url: originalUrl,
			statusCode,
			responseTime,
			ip,
			userAgent: req.get('User-Agent'),
			requestId: req.requestId,
		}

		// 记录到控制台/文件
		if (statusCode >= 400) {
			logger.warn('HTTP Request', logData)
		} else {
			logger.info('HTTP Request', logData)
		}

		// 保存到数据库用于 API 端点（排除健康检查）
		if (req.user && originalUrl.startsWith('/api/') && !originalUrl.includes('/health')) {
			try {
				await apiLogRepository.create({
					userId: req.user.userId,
					panelConfigId: req.body?.configId || req.params?.configId || undefined,
					requestId: req.requestId,
					method,
					path: originalUrl,
					statusCode,
					responseTime,
					errorMessage: statusCode >= 400 ? res.get('X-Error-Message') : undefined,
				})
			} catch (error) {
				logger.error('Failed to save API log to database:', error)
			}
		}
	})

	// 使用 winston 请求日志记录器
	createRequestLogger()(req, res, next)
}
