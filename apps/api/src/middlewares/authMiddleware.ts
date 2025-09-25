import type { Middleware } from 'koa'
import { formatError } from './commonMiddleware.js'
import { getSession, SESSION_COOKIE_NAME } from '../services/authService.js'

/**
 * 会话认证中间件
 *
 * 验证用户的会话状态，确保只有已认证的用户才能访问受保护的路由。
 *
 * 工作流程：
 * 1. 从 Cookie 中获取会话 ID
 * 2. 验证会话是否存在且未过期
 * 3. 如果验证失败，返回 401 错误并提示重新认证
 * 4. 如果验证成功，将会话 ID 存储到 ctx.state 中供后续中间件使用
 *
 * @returns Koa 中间件函数
 *
 * @example
 * ```typescript
 * // 在路由中使用
 * router.post('/protected-route', authMiddleware, async (ctx) => {
 *   const sessionId = ctx.state.sessionId; // 可以获取到会话 ID
 *   // 处理受保护的业务逻辑
 * });
 * ```
 */
export const authMiddleware: Middleware = async (ctx, next) => {
	const sessionId = ctx.cookies.get(SESSION_COOKIE_NAME)
	if (!sessionId) {
		ctx.status = 401
		ctx.body = formatError(401, 'AUTH_REQUIRED')
		return
	}
	const session = getSession(sessionId)
	if (!session || session.expiresAt < Date.now()) {
		ctx.status = 401
		ctx.body = formatError(401, 'AUTH_REQUIRED')
		return
	}
	ctx.state.sessionId = sessionId
	await next()
}
