import { Request, Response, NextFunction } from 'express'
import { authService, TokenPayload } from '@/auth/auth.service'
import { createAuthError } from '@/middleware/error-handler'
import { logger } from '@/utils/logger'

// 扩展 Request 类型以包含用户信息
declare global {
	namespace Express {
		interface Request {
			user?: TokenPayload
		}
	}
}

/**
 * JWT 令牌认证中间件
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization
		const token = authService.extractTokenFromHeader(authHeader)

		// 验证令牌
		const payload = authService.verifyAccessToken(token)

		// 将用户信息附加到请求对象
		req.user = payload

		logger.debug('Token authenticated successfully', {
			userId: payload.userId,
			username: payload.username,
			requestId: req.requestId,
		})

		next()
	} catch (error) {
		logger.warn('Authentication failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			requestId: req.requestId,
			ip: req.ip,
			userAgent: req.get('User-Agent'),
		})

		next(error)
	}
}

/**
 * 可选认证中间件 - 当令牌缺失时不抛出错误
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization

		if (!authHeader) {
			return next()
		}

		const token = authService.extractTokenFromHeader(authHeader)
		const payload = authService.verifyAccessToken(token)

		req.user = payload

		logger.debug('Optional authentication successful', {
			userId: payload.userId,
			username: payload.username,
			requestId: req.requestId,
		})

		next()
	} catch (error) {
		logger.debug('Optional authentication failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			requestId: req.requestId,
		})

		// 对于可选认证，我们不传递错误给 next()
		next()
	}
}

/**
 * 需要特定权限的中间件（为将来实现预留）
 */
export const requirePermission = (permission: string) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		// TODO: 实现权限检查逻辑
		// 目前只检查用户是否已认证

		logger.debug('Permission check passed', {
			userId: req.user.userId,
			permission,
			requestId: req.requestId,
		})

		next()
	}
}

/**
 * 需要管理员角色的中间件（为将来实现预留）
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) {
		throw createAuthError('Authentication required', 'AUTH_REQUIRED')
	}

	// TODO: 实现管理员角色检查
	// 目前允许所有已认证用户

	logger.debug('Admin check passed', {
		userId: req.user.userId,
		requestId: req.requestId,
	})

	next()
}

/**
 * 验证用户拥有资源的中间件（为将来实现预留）
 */
export const requireOwnership = (resourceParam: string = 'id') => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw createAuthError('Authentication required', 'AUTH_REQUIRED')
		}

		const resourceId = req.params[resourceParam]

		// TODO: 实现所有权检查逻辑
		// 这通常会检查已认证用户是否拥有该资源

		logger.debug('Ownership check passed', {
			userId: req.user.userId,
			resourceId,
			requestId: req.requestId,
		})

		next()
	}
}
