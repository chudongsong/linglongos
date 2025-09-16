import { Router, Request, Response } from 'express'
import Joi from 'joi'
import { panelConfigRepository } from '@/models/panel-config.repository'
import { authenticateToken } from '@/auth/auth.middleware'
import { asyncHandler } from '@/middleware/error-handler'
import { createValidationError, createAuthError } from '@/middleware/error-handler'
import { proxyEngine } from '@/services/proxy-engine.service'
import { logger } from '@/utils/logger'

const router = Router()

// 对所有路由应用认证
router.use(authenticateToken)

// 验证模式
const createConfigSchema = Joi.object({
	name: Joi.string().min(1).max(100).required(),
	panelType: Joi.string().valid('onePanel', 'baota').required(),
	endpoint: Joi.string().uri().required(),
	apiKey: Joi.string().min(1).max(500).required(),
})

const updateConfigSchema = Joi.object({
	name: Joi.string().min(1).max(100).optional(),
	endpoint: Joi.string().uri().optional(),
	apiKey: Joi.string().min(1).max(500).optional(),
})

const listQuerySchema = Joi.object({
	panelType: Joi.string().valid('onePanel', 'baota').optional(),
	isActive: Joi.boolean().optional(),
	healthStatus: Joi.string().valid('healthy', 'unhealthy', 'unknown').optional(),
	search: Joi.string().max(100).optional(),
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(20),
})

/**
 * GET /api/config/panels
 * 获取已认证用户的面板配置列表
 */
router.get(
	'/panels',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		// 验证查询参数
		const { error, value } = listQuerySchema.validate(req.query)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		const { panelType, isActive, healthStatus, search, page, limit } = value
		const offset = (page - 1) * limit

		// 获取面板配置
		const configs = await panelConfigRepository.list({
			userId: req.user.userId,
			panelType,
			isActive,
			healthStatus,
			search,
			limit,
			offset,
		})

		// 获取总数
		const total = await panelConfigRepository.count({
			userId: req.user.userId,
			panelType,
			isActive,
			healthStatus,
			search,
		})

		// 从响应中移除敏感数据
		const sanitizedConfigs = configs.map((config) => ({
			id: config.id,
			name: config.name,
			panelType: config.panel_type,
			endpoint: config.endpoint,
			isActive: config.is_active,
			healthStatus: config.health_status,
			lastHealthCheck: config.last_health_check,
			createdAt: config.created_at,
			updatedAt: config.updated_at,
		}))

		res.json({
			success: true,
			data: {
				configs: sanitizedConfigs,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
			message: 'Panel configurations retrieved successfully',
		})
	}),
)

/**
 * GET /api/config/panels/:id
 * 获取特定的面板配置
 */
router.get(
	'/panels/:id',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		const configId = parseInt(req.params.id, 10)
		if (isNaN(configId)) {
			throw createValidationError('Invalid configuration ID')
		}

		const config = await panelConfigRepository.findById(configId)
		if (!config) {
			return res.status(404).json({
				success: false,
				error: {
					code: 'CONFIG_NOT_FOUND',
					message: 'Panel configuration not found',
				},
			})
		}

		// 检查用户是否拥有此配置
		if (config.user_id !== req.user.userId) {
			throw createAuthError('Access denied', 'ACCESS_DENIED')
		}

		// 返回清理后的配置（不包含 API 密钥）
		res.json({
			success: true,
			data: {
				config: {
					id: config.id,
					name: config.name,
					panelType: config.panel_type,
					endpoint: config.endpoint,
					isActive: config.is_active,
					healthStatus: config.health_status,
					lastHealthCheck: config.last_health_check,
					createdAt: config.created_at,
					updatedAt: config.updated_at,
				},
			},
			message: 'Panel configuration retrieved successfully',
		})
	}),
)

/**
 * POST /api/config/panels
 * 创建新的面板配置
 */
router.post(
	'/panels',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		// Validate request body
		const { error, value } = createConfigSchema.validate(req.body)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		const { name, panelType, endpoint, apiKey } = value

		// 检查该用户的配置名称是否已存在
		const nameExists = await panelConfigRepository.existsForUser(req.user.userId, name)
		if (nameExists) {
			throw createValidationError('Configuration name already exists')
		}

		// 创建配置
		const newConfig = await panelConfigRepository.create({
			userId: req.user.userId,
			name,
			panelType,
			endpoint,
			apiKey,
		})

		logger.info('Panel configuration created', {
			configId: newConfig.id,
			userId: req.user.userId,
			name,
			panelType,
			requestId: req.requestId,
		})

		// Return sanitized configuration
		res.status(201).json({
			success: true,
			data: {
				config: {
					id: newConfig.id,
					name: newConfig.name,
					panelType: newConfig.panel_type,
					endpoint: newConfig.endpoint,
					isActive: newConfig.is_active,
					healthStatus: newConfig.health_status,
					createdAt: newConfig.created_at,
					updatedAt: newConfig.updated_at,
				},
			},
			message: 'Panel configuration created successfully',
		})
	}),
)

/**
 * PUT /api/config/panels/:id
 * Update a panel configuration
 */
router.put(
	'/panels/:id',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		const configId = parseInt(req.params.id, 10)
		if (isNaN(configId)) {
			throw createValidationError('Invalid configuration ID')
		}

		// Validate request body
		const { error, value } = updateConfigSchema.validate(req.body)
		if (error) {
			throw createValidationError(error.details[0].message)
		}

		// Check if configuration exists and user owns it
		const existingConfig = await panelConfigRepository.findById(configId)
		if (!existingConfig) {
			return res.status(404).json({
				success: false,
				error: {
					code: 'CONFIG_NOT_FOUND',
					message: 'Panel configuration not found',
				},
			})
		}

		if (existingConfig.user_id !== req.user.userId) {
			throw createAuthError('Access denied', 'ACCESS_DENIED')
		}

		// Check if new name conflicts with existing configurations
		if (value.name && value.name !== existingConfig.name) {
			const nameExists = await panelConfigRepository.existsForUser(req.user.userId, value.name, configId)
			if (nameExists) {
				throw createValidationError('Configuration name already exists')
			}
		}

		// Update configuration
		const updatedConfig = await panelConfigRepository.update(configId, value)
		if (!updatedConfig) {
			throw new Error('Failed to update configuration')
		}

		logger.info('Panel configuration updated', {
			configId,
			userId: req.user.userId,
			updatedFields: Object.keys(value),
			requestId: req.requestId,
		})

		// Return sanitized configuration
		res.json({
			success: true,
			data: {
				config: {
					id: updatedConfig.id,
					name: updatedConfig.name,
					panelType: updatedConfig.panel_type,
					endpoint: updatedConfig.endpoint,
					isActive: updatedConfig.is_active,
					healthStatus: updatedConfig.health_status,
					lastHealthCheck: updatedConfig.last_health_check,
					createdAt: updatedConfig.created_at,
					updatedAt: updatedConfig.updated_at,
				},
			},
			message: 'Panel configuration updated successfully',
		})
	}),
)

/**
 * DELETE /api/config/panels/:id
 * Delete a panel configuration
 */
router.delete(
	'/panels/:id',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		const configId = parseInt(req.params.id, 10)
		if (isNaN(configId)) {
			throw createValidationError('Invalid configuration ID')
		}

		// Check if configuration exists and user owns it
		const existingConfig = await panelConfigRepository.findById(configId)
		if (!existingConfig) {
			return res.status(404).json({
				success: false,
				error: {
					code: 'CONFIG_NOT_FOUND',
					message: 'Panel configuration not found',
				},
			})
		}

		if (existingConfig.user_id !== req.user.userId) {
			throw createAuthError('Access denied', 'ACCESS_DENIED')
		}

		// Delete configuration
		const deleted = await panelConfigRepository.delete(configId)
		if (!deleted) {
			throw new Error('Failed to delete configuration')
		}

		logger.info('Panel configuration deleted', {
			configId,
			userId: req.user.userId,
			requestId: req.requestId,
		})

		res.json({
			success: true,
			message: 'Panel configuration deleted successfully',
		})
	}),
)

/**
 * POST /api/config/panels/:id/test
 * Test panel configuration connectivity
 */
router.post(
	'/panels/:id/test',
	asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		const configId = parseInt(req.params.id, 10)
		if (isNaN(configId)) {
			throw createValidationError('Invalid configuration ID')
		}

		// Get configuration with decrypted API key
		const config = await panelConfigRepository.findByIdDecrypted(configId)
		if (!config) {
			return res.status(404).json({
				success: false,
				error: {
					code: 'CONFIG_NOT_FOUND',
					message: 'Panel configuration not found',
				},
			})
		}

		if (config.user_id !== req.user.userId) {
			throw createAuthError('Access denied', 'ACCESS_DENIED')
		}

		// Test connectivity
		const credentials = {
			userId: config.user_id,
			panelType: config.panel_type,
			endpoint: config.endpoint,
			apiKey: config.apiKey,
		}

		const isHealthy = await proxyEngine.healthCheck(credentials)

		// Update health status
		const healthStatus = isHealthy ? 'healthy' : 'unhealthy'
		await panelConfigRepository.updateHealthStatus(configId, healthStatus)

		logger.info('Panel configuration test completed', {
			configId,
			userId: req.user.userId,
			isHealthy,
			requestId: req.requestId,
		})

		res.json({
			success: true,
			data: {
				isHealthy,
				healthStatus,
				testedAt: new Date().toISOString(),
			},
			message: `Panel configuration test ${isHealthy ? 'successful' : 'failed'}`,
		})
	}),
)

export default router
