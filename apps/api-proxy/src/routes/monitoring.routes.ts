import { Router, Request, Response } from 'express'
import Joi from 'joi'
import { authenticateToken, requireAdmin } from '@/auth/auth.middleware'
import { apiLogRepository } from '@/models/api-log.repository'
import { panelConfigRepository } from '@/models/panel-config.repository'
import { userRepository } from '@/models/user.repository'
import { databaseService } from '@/services/database.service'
import { asyncHandler } from '@/middleware/error-handler'
import { createValidationError, createAuthError } from '@/middleware/error-handler'
import { logger } from '@/utils/logger'

const router = Router()

// 对所有路由应用认证
router.use(authenticateToken)

// 验证模式
const statsQuerySchema = Joi.object({
	dateFrom: Joi.string().isoDate().optional(),
	dateTo: Joi.string().isoDate().optional(),
	panelConfigId: Joi.number().integer().optional(),
})

const logsQuerySchema = Joi.object({
	method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
	statusCode: Joi.number().integer().min(100).max(599).optional(),
	dateFrom: Joi.string().isoDate().optional(),
	dateTo: Joi.string().isoDate().optional(),
	hasError: Joi.boolean().optional(),
	search: Joi.string().max(100).optional(),
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(20),
})

/**
 * GET /api/monitoring/stats
 * 获取当前用户的 API 使用统计
 */
router.get(
	'/stats',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		// Validate query parameters
		const { error, value } = statsQuerySchema.validate(req.query)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		const { dateFrom, dateTo, panelConfigId } = value

		// 获取统计信息
		const stats = await apiLogRepository.getStats({
			userId: req.user.userId,
			dateFrom,
			dateTo,
			panelConfigId,
		})

		// 如果没有指定日期范围，获取过去 30 天的日统计
		const dailyDateFrom = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
		const dailyDateTo = dateTo || new Date().toISOString()

		const dailyStats = await apiLogRepository.getDailyStats(dailyDateFrom, dailyDateTo, req.user.userId)

		res.json({
			success: true,
			data: {
				stats,
				dailyStats,
				period: {
					from: dailyDateFrom,
					to: dailyDateTo,
				},
			},
			message: 'Statistics retrieved successfully',
		})
	}),
)

/**
 * GET /api/monitoring/logs
 * 获取当前用户的 API 访问日志
 */
router.get(
	'/logs',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		// Validate query parameters
		const { error, value } = logsQuerySchema.validate(req.query)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		const { method, statusCode, dateFrom, dateTo, hasError, search, page, limit } = value
		const offset = (page - 1) * limit

		// 获取日志
		const logs = await apiLogRepository.list({
			userId: req.user.userId,
			method,
			statusCode,
			dateFrom,
			dateTo,
			hasError,
			search,
			limit,
			offset,
		})

		// 获取总数
		const total = await apiLogRepository.count({
			userId: req.user.userId,
			method,
			statusCode,
			dateFrom,
			dateTo,
			hasError,
			search,
		})

		res.json({
			success: true,
			data: {
				logs,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
			message: 'Logs retrieved successfully',
		})
	}),
)

/**
 * GET /api/monitoring/health
 * 获取系统健康状态
 */
router.get(
	'/health',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		try {
			// 检查数据库健康状态
			const dbHealthy = await databaseService.healthCheck()

			// 获取数据库统计信息
			const dbStats = await databaseService.getStats()

			// 获取面板配置健康状态
			const userPanelConfigs = await panelConfigRepository.list({
				userId: req.user.userId,
				isActive: true,
			})

			const panelHealth = userPanelConfigs.map((config) => ({
				id: config.id,
				name: config.name,
				panelType: config.panel_type,
				healthStatus: config.health_status,
				lastCheck: config.last_health_check,
			}))

			// 最近错误数量（过去 24 小时）
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
			const recentErrors = await apiLogRepository.count({
				userId: req.user.userId,
				dateFrom: yesterday,
				hasError: true,
			})

			// 最近请求数量（过去 24 小时）
			const recentRequests = await apiLogRepository.count({
				userId: req.user.userId,
				dateFrom: yesterday,
			})

			const healthStatus = {
				overall: dbHealthy ? 'healthy' : 'unhealthy',
				database: {
					status: dbHealthy ? 'healthy' : 'unhealthy',
					stats: dbStats,
				},
				panels: {
					total: panelHealth.length,
					healthy: panelHealth.filter((p) => p.healthStatus === 'healthy').length,
					unhealthy: panelHealth.filter((p) => p.healthStatus === 'unhealthy').length,
					unknown: panelHealth.filter((p) => p.healthStatus === 'unknown').length,
					configs: panelHealth,
				},
				activity: {
					recentRequests,
					recentErrors,
					errorRate: recentRequests > 0 ? (recentErrors / recentRequests) * 100 : 0,
				},
				timestamp: new Date().toISOString(),
			}

			res.json({
				success: true,
				data: healthStatus,
				message: 'Health status retrieved successfully',
			})
		} catch (error) {
			logger.error('Health check failed:', error)

			res.status(503).json({
				success: false,
				data: {
					overall: 'unhealthy',
					error: 'Health check failed',
					timestamp: new Date().toISOString(),
				},
				message: 'Health check failed',
			})
		}
	}),
)

/**
 * GET /api/monitoring/system (Admin only)
 * Get system-wide statistics
 */
router.get(
	'/system',
	requireAdmin,
	asyncHandler(async (req: Request, res: Response) => {
		try {
			// Get system-wide statistics
			const [dbStats, totalUsers, totalConfigs, systemStats] = await Promise.all([
				databaseService.getStats(),
				userRepository.count({ isActive: true }),
				panelConfigRepository.count({ isActive: true }),
				apiLogRepository.getStats(),
			])

			// Get recent activity (last 7 days)
			const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
			const weeklyStats = await apiLogRepository.getDailyStats(weekAgo, new Date().toISOString())

			const systemInfo = {
				database: dbStats,
				users: {
					total: totalUsers,
					active: totalUsers, // All counted users are active
				},
				panelConfigs: {
					total: totalConfigs,
				},
				apiUsage: systemStats,
				weeklyActivity: weeklyStats,
				uptime: process.uptime(),
				memory: process.memoryUsage(),
				nodeVersion: process.version,
				timestamp: new Date().toISOString(),
			}

			res.json({
				success: true,
				data: systemInfo,
				message: 'System statistics retrieved successfully',
			})
		} catch (error) {
			logger.error('System stats failed:', error)
			throw error
		}
	}),
)

/**
 * DELETE /api/monitoring/logs/cleanup
 * Clean up old logs (Admin only)
 */
router.delete(
	'/logs/cleanup',
	requireAdmin,
	asyncHandler(async (req: Request, res: Response) => {
		const cleanupSchema = Joi.object({
			retentionDays: Joi.number().integer().min(1).max(365).default(30),
		})

		const { error, value } = cleanupSchema.validate(req.body)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		const { retentionDays } = value

		// Clean up old logs
		const deletedCount = await apiLogRepository.deleteOldLogs(retentionDays)

		// Also clean up database
		await databaseService.cleanup({
			logRetentionDays: retentionDays,
			inactiveSessionDays: 7,
		})

		logger.info('Manual log cleanup performed', {
			deletedCount,
			retentionDays,
			adminUserId: req.user?.userId,
		})

		res.json({
			success: true,
			data: {
				deletedLogs: deletedCount,
				retentionDays,
			},
			message: 'Log cleanup completed successfully',
		})
	}),
)

export default router
