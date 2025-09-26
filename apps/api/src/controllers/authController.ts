import Router from '@koa/router'
import type { Middleware } from 'koa'
import { formatSuccess, withResponse, HttpError } from '../middlewares/commonMiddleware'
import {
	BIND_COOKIE_NAME,
	SESSION_COOKIE_NAME,
	createSession,
	generateBindSecret,
	verifyTokenWithBindId,
} from '../services/authService'
import { markGoogleAuthConfigured, readGoogleAuthConfig, resetGoogleAuthConfig } from '../config/auth.config'
import { z } from 'zod'
import type { RouteDocMeta } from '../docs/openapi.js'

export const authRoutes = new Router({ prefix: '/auth' })

/**
 * googleAuthVerifySchema - Google Auth 验证请求体 Zod 模式
 *
 * 字段：
 * - token: 6 位字符串（TOTP 验证码）
 */
export const googleAuthVerifySchema = z.object({
  token: z.string().min(6).max(6),
})

/**
 * googleAuthCompleteSchema - Google Auth 配置完成请求体 Zod 模式
 *
 * 字段：
 * - userId: 用户 ID 字符串
 */
export const googleAuthCompleteSchema = z.object({
  userId: z.string(),
})

/**
 * authRouteDocs - Auth 路由文档元数据导出
 *
 * 提供 /auth 下的接口文档描述，用于文档生成自动聚合。
 * - 覆盖 POST /auth/google-auth-verify 与 POST /auth/google-auth-config/complete 的请求体模式
 */
export const authRouteDocs: RouteDocMeta[] = [
  { tag: 'Auth', method: 'post', path: '/auth/google-auth-verify', requestSchema: googleAuthVerifySchema },
  { tag: 'Auth', method: 'post', path: '/auth/google-auth-config/complete', requestSchema: googleAuthCompleteSchema },
]

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
 *   "status": "success",
 *   "message": "success",
 *   "data": {
 *     "qrCodeUrl": "otpauth://totp/LingLongOS:user?secret=...",
 *     "secret": "ABCD1234..."
 *   }
 * }
 * ```
 */
const googleAuthBind: Middleware = withResponse(async (ctx) => {
	const { bindId, secret, otpauthUrl } = generateBindSecret('LingLongOS')
	ctx.cookies.set(BIND_COOKIE_NAME, bindId, {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 10 * 60 * 1000, // 10 minutes to verify
	})
	return { qrCodeUrl: otpauthUrl, secret }
})

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
 *   "status": "success",
 *   "message": "认证成功，会话已创建"
 * }
 * ```
 */
const googleAuthVerify: Middleware = withResponse(async (ctx) => {
	const token: string | undefined = (ctx.request.body as any)?.token
	if (!token) {
		throw new HttpError(400, '需要令牌')
	}
	const bindId = ctx.cookies.get(BIND_COOKIE_NAME)
	if (!bindId) {
		throw new HttpError(401, '令牌无效或会话已过期')
	}
	const ok = verifyTokenWithBindId(bindId, token)
	if (!ok) {
		throw new HttpError(401, '令牌无效或会话已过期')
	}
	const session = createSession(4)
	ctx.cookies.set(SESSION_COOKIE_NAME, session.id, {
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: session.expiresAt - Date.now(),
	})
	// 需要自定义消息，直接设置 body，withResponse 将尊重它
	ctx.body = formatSuccess(null, '认证成功，会话已创建')
})

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
 *   "status": "success",
 *   "message": "success",
 *   "data": {
 *     "isConfigured": true,
 *     "configuredAt": 1640995200000
 *   }
 * }
 * ```
 */
const checkGoogleAuthConfig: Middleware = withResponse(async (ctx) => {
	try {
		const config = await readGoogleAuthConfig()
		return config
	} catch (error) {
		throw new HttpError(500, `读取配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
	}
})

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
 *   "status": "success",
 *   "message": "Google Auth configuration marked as completed."
 * }
 * ```
 */
const markGoogleAuthComplete: Middleware = withResponse(async (ctx) => {
	try {
		const { userId } = (ctx.request.body as any) || {}
		await markGoogleAuthConfigured(userId)
		ctx.body = formatSuccess(null, '已标记 Google 身份验证配置完成')
	} catch (error) {
		throw new HttpError(
			500,
			`Failed to mark config as completed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
})

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
 *   "status": "success",
 *   "message": "Google Auth configuration has been reset."
 * }
 * ```
 */
const resetGoogleAuthConfigHandler: Middleware = withResponse(async (ctx) => {
	try {
		await resetGoogleAuthConfig()
		ctx.body = formatSuccess(null, 'Google 身份验证配置已重置')
	} catch (error) {
		throw new HttpError(500, `重置配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
	}
})

// 注册路由
authRoutes.get('/google-auth-bind', googleAuthBind)
authRoutes.post('/google-auth-verify', googleAuthVerify)
authRoutes.get('/google-auth-config', checkGoogleAuthConfig)
authRoutes.post('/google-auth-config/complete', markGoogleAuthComplete)
authRoutes.post('/google-auth-config/reset', resetGoogleAuthConfigHandler)
