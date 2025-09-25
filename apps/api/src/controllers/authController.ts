import Router from '@koa/router'
import type { Middleware } from 'koa'
import { formatError, formatSuccess } from '../middlewares/commonMiddleware.js'
import {
	BIND_COOKIE_NAME,
	SESSION_COOKIE_NAME,
	createSession,
	generateBindSecret,
	verifyTokenWithBindId,
} from '../services/authService.js'
import {
	isGoogleAuthConfigured,
	markGoogleAuthConfigured,
	readGoogleAuthConfig,
	resetGoogleAuthConfig,
} from '../config/auth.config.js'

export const authRoutes = new Router({ prefix: '/auth' })

/**
 * Google 身份验证器绑定处理器
 *
 * 生成新的 TOTP 密钥和二维码 URL，用户可以使用 Google Authenticator 扫描绑定。
 * 同时设置绑定 Cookie，有效期 10 分钟，用于后续的令牌验证。
 *
 * @param ctx - Koa 上下文对象
 *
 * @example
 * 响应格式：
 * ```json
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": {
 *     "qrCodeUrl": "otpauth://totp/LingLongOS:user?secret=...",
 *     "secret": "ABCD1234..."
 *   }
 * }
 * ```
 */
const googleAuthBind: Middleware = async (ctx) => {
	const { bindId, secret, otpauthUrl } = generateBindSecret('LingLongOS')
	ctx.cookies.set(BIND_COOKIE_NAME, bindId, {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 10 * 60 * 1000, // 10 minutes to verify
	})
	ctx.body = formatSuccess({ qrCodeUrl: otpauthUrl, secret })
}

/**
 * Google 身份验证器令牌验证处理器
 *
 * 验证用户提供的 6 位数 TOTP 令牌，验证成功后创建会话并设置会话 Cookie。
 *
 * 验证流程：
 * 1. 检查请求体中是否包含 token 参数
 * 2. 从 Cookie 中获取绑定 ID
 * 3. 使用绑定 ID 和 token 进行 TOTP 验证
 * 4. 验证成功后创建 4 小时有效期的会话
 * 5. 设置会话 Cookie
 *
 * @param ctx - Koa 上下文对象
 *
 * @example
 * 请求格式：
 * ```json
 * {
 *   "token": "123456"
 * }
 * ```
 *
 * 成功响应：
 * ```json
 * {
 *   "code": 200,
 *   "message": "Authentication successful, session created."
 * }
 * ```
 */
const googleAuthVerify: Middleware = async (ctx) => {
	const token: string | undefined = (ctx.request.body as any)?.token
	if (!token) {
		ctx.status = 400
		ctx.body = formatError(400, 'Token is required')
		return
	}
	const bindId = ctx.cookies.get(BIND_COOKIE_NAME)
	if (!bindId) {
		ctx.status = 401
		ctx.body = formatError(401, 'Invalid token or session expired.')
		return
	}
	const ok = verifyTokenWithBindId(bindId, token)
	if (!ok) {
		ctx.status = 401
		ctx.body = formatError(401, 'Invalid token or session expired.')
		return
	}
	const session = createSession(4)
	ctx.cookies.set(SESSION_COOKIE_NAME, session.id, {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: session.expiresAt - Date.now(),
	})
	ctx.body = { code: 200, message: 'Authentication successful, session created.' }
}

/**
 * 检查Google Auth配置状态处理器
 *
 * 检查当前系统是否已完成Google Auth配置。
 *
 * @param ctx - Koa 上下文对象
 *
 * @example
 * 响应格式：
 * ```json
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": {
 *     "isConfigured": true,
 *     "configuredAt": 1640995200000
 *   }
 * }
 * ```
 */
const checkGoogleAuthConfig: Middleware = async (ctx) => {
	try {
		const config = await readGoogleAuthConfig()
		ctx.body = formatSuccess(config)
	} catch (error) {
		ctx.status = 500
		ctx.body = formatError(500, `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * 标记Google Auth配置完成处理器
 *
 * 将Google Auth标记为已配置状态，用于跳过后续的配置步骤。
 *
 * @param ctx - Koa 上下文对象
 *
 * @example
 * 请求格式：
 * ```json
 * {
 *   "userId": "user123"
 * }
 * ```
 *
 * 响应格式：
 * ```json
 * {
 *   "code": 200,
 *   "message": "Google Auth configuration marked as completed."
 * }
 * ```
 */
const markGoogleAuthComplete: Middleware = async (ctx) => {
	try {
		const { userId } = (ctx.request.body as any) || {}
		await markGoogleAuthConfigured(userId)
		ctx.body = formatSuccess(null, 'Google Auth configuration marked as completed.')
	} catch (error) {
		ctx.status = 500
		ctx.body = formatError(500, `Failed to mark config as completed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * 重置Google Auth配置处理器
 *
 * 重置Google Auth配置为未配置状态，用于重新配置。
 *
 * @param ctx - Koa 上下文对象
 *
 * @example
 * 响应格式：
 * ```json
 * {
 *   "code": 200,
 *   "message": "Google Auth configuration has been reset."
 * }
 * ```
 */
const resetGoogleAuthConfigHandler: Middleware = async (ctx) => {
	try {
		await resetGoogleAuthConfig()
		ctx.body = formatSuccess(null, 'Google Auth configuration has been reset.')
	} catch (error) {
		ctx.status = 500
		ctx.body = formatError(500, `Failed to reset config: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

// 注册路由
authRoutes.get('/google-auth-bind', googleAuthBind)
authRoutes.post('/google-auth-verify', googleAuthVerify)
authRoutes.get('/google-auth-config', checkGoogleAuthConfig)
authRoutes.post('/google-auth-config/complete', markGoogleAuthComplete)
authRoutes.post('/google-auth-config/reset', resetGoogleAuthConfigHandler)
