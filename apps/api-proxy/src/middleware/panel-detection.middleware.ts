import { Request, Response, NextFunction } from 'express'
import { panelDetectionService } from './panel-detection.service'
import { PanelDetectionResult } from '@/types'
import { logger } from '@/utils/logger'
import { createValidationError } from '@/middleware/error-handler'

// 扩展 Request 类型以包含面板检测结果
declare global {
	namespace Express {
		interface Request {
			panelDetection?: PanelDetectionResult
			targetEndpoint?: string
		}
	}
}

/**
 * 从目标端点检测面板类型的中间件
 */
export const detectPanelType = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// 从请求中提取目标端点
		const endpoint = extractEndpointFromRequest(req)

		if (!endpoint) {
			throw createValidationError('Target endpoint not found in request')
		}

		// 将端点存储在请求中以供后续使用
		req.targetEndpoint = endpoint

		// 检测面板类型
		const detectionResult = await panelDetectionService.detectPanelType(endpoint, req.headers as Record<string, string>)

		// 将检测结果存储在请求中
		req.panelDetection = detectionResult

		logger.debug('Panel detection completed', {
			requestId: req.requestId,
			endpoint,
			panelType: detectionResult.panelType,
			version: detectionResult.version,
		})

		next()
	} catch (error) {
		logger.error('Panel detection middleware failed', {
			requestId: req.requestId,
			error: error instanceof Error ? error.message : 'Unknown error',
		})

		next(error)
	}
}

/**
 * 需要特定面板类型的中间件
 */
export const requirePanelType = (expectedPanelType: 'onePanel' | 'baota') => {
	return (req: Request, res: Response, next: NextFunction) => {
		const panelDetection = req.panelDetection

		if (!panelDetection) {
			throw createValidationError('Panel detection not performed')
		}

		if (panelDetection.panelType !== expectedPanelType) {
			throw createValidationError(
				`Expected panel type ${expectedPanelType}, but detected ${panelDetection.panelType}`,
				{
					expected: expectedPanelType,
					detected: panelDetection.panelType,
				},
			)
		}

		logger.debug('Panel type requirement satisfied', {
			requestId: req.requestId,
			expectedPanelType,
			detectedPanelType: panelDetection.panelType,
		})

		next()
	}
}

/**
 * 需要特定面板能力的中间件
 */
export const requireCapabilities = (requiredCapabilities: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const panelDetection = req.panelDetection

		if (!panelDetection) {
			throw createValidationError('Panel detection not performed')
		}

		const missingCapabilities = requiredCapabilities.filter(
			(capability) => !panelDetection.capabilities.includes(capability),
		)

		if (missingCapabilities.length > 0) {
			throw createValidationError(`Panel missing required capabilities: ${missingCapabilities.join(', ')}`, {
				required: requiredCapabilities,
				available: panelDetection.capabilities,
				missing: missingCapabilities,
			})
		}

		logger.debug('Panel capabilities requirement satisfied', {
			requestId: req.requestId,
			requiredCapabilities,
			availableCapabilities: panelDetection.capabilities,
		})

		next()
	}
}

/**
 * 从请求中提取目标端点
 */
function extractEndpointFromRequest(req: Request): string | null {
	// 检查头中的显式端点
	const headerEndpoint = req.headers['x-target-endpoint'] as string
	if (headerEndpoint) {
		return headerEndpoint
	}

	// 检查查询参数中的端点
	const queryEndpoint = req.query.endpoint as string
	if (queryEndpoint) {
		return queryEndpoint
	}

	// 检查请求体中的端点
	if (req.body && req.body.endpoint) {
		return req.body.endpoint
	}

	// 尝试从 URL 路径中提取（用于代理路由）
	const pathSegments = req.path.split('/').filter((segment) => segment)

	// 在路径段中查找 URL 模式
	for (const segment of pathSegments) {
		if (segment.startsWith('http%3A%2F%2F') || segment.startsWith('https%3A%2F%2F')) {
			// URL 编码的端点
			return decodeURIComponent(segment)
		}

		if (segment.startsWith('http://') || segment.startsWith('https://')) {
			return segment
		}
	}

	return null
}

/**
 * 验证端点格式的中间件
 */
export const validateEndpoint = (req: Request, res: Response, next: NextFunction) => {
	try {
		const endpoint = extractEndpointFromRequest(req)

		if (!endpoint) {
			throw createValidationError(
				'Target endpoint is required. Provide it via X-Target-Endpoint header, endpoint query parameter, or request body.',
			)
		}

		// 验证 URL 格式
		try {
			const url = new URL(endpoint)

			// 检查协议
			if (!['http:', 'https:'].includes(url.protocol)) {
				throw createValidationError('Endpoint must use HTTP or HTTPS protocol')
			}

			// 检查主机名
			if (!url.hostname) {
				throw createValidationError('Endpoint must have a valid hostname')
			}
		} catch (urlError) {
			throw createValidationError('Invalid endpoint URL format', {
				endpoint,
				error: urlError instanceof Error ? urlError.message : 'Unknown error',
			})
		}

		req.targetEndpoint = endpoint

		logger.debug('Endpoint validation passed', {
			requestId: req.requestId,
			endpoint,
		})

		next()
	} catch (error) {
		next(error)
	}
}
