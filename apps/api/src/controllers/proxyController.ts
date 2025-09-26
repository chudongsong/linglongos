import Router from '@koa/router'
import type { Middleware } from 'koa'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { formatError, formatSuccess } from '../middlewares/commonMiddleware.js'
import { getPanelBinding, setPanelBinding } from '../services/authService.js'
import { proxyRequest } from '../services/proxyService.js'
import { withResponse, HttpError } from '../middlewares/commonMiddleware.js'
import type { RouteDocMeta } from '../docs/openapi.js'

export const proxyRoutes = new Router({ prefix: '/proxy' })

/** 面板密钥绑定请求参数验证模式 */
export const bindPanelKeySchema = z.object({
	type: z.enum(['bt', '1panel']),
	url: z.string().url(),
	key: z.string().min(32).max(64),
})

/**
 * 面板密钥绑定处理器
 *
 * 为当前会话绑定面板的访问信息，包括面板类型、URL 和 API 密钥。
 * 绑定后用户可以通过代理接口访问对应的面板 API。
 *
 * 支持的面板类型：
 * - 'bt': 宝塔面板
 * - '1panel': 1Panel 面板
 *
 * @param ctx - Koa 上下文对象，需要包含有效的会话信息
 *
 * @example
 * 请求格式：
 * ```json
 * {
 *   "type": "bt",
 *   "url": "http://panel.example.com:8888",
 *   "key": "your-32-character-api-key"
 * }
 * ```
 *
 * 成功响应：
 * ```json
 * {
 *   "code": 200,
 *   "message": "Panel key bound successfully."
 * }
 * ```
 */
const bindPanelKey: Middleware = async (ctx) => {
	const sessionId: string = (ctx.state as any).sessionId
	const parsed = bindPanelKeySchema.safeParse(ctx.request.body)
	if (!parsed.success) {
		ctx.status = 400
		ctx.body = formatError(400, '参数无效', parsed.error.flatten())
		return
	}
	const { type, url, key } = parsed.data
	setPanelBinding(sessionId, type, url, key)
	ctx.body = formatSuccess(null, '面板密钥绑定成功')
}

/** 代理请求参数验证模式 */
export const proxyRequestSchema = z.object({
	url: z.string().min(1),
	panelType: z.enum(['bt', '1panel']),
	params: z.record(z.string(), z.any()).optional(),
	ignoreSslErrors: z.boolean().optional(),
})
/** GET /proxy/request 查询参数验证模式 */
export const proxyRequestQuerySchema = z.object({
	url: z.string().min(1),
	panelType: z.enum(['bt', '1panel']),
	ignoreSslErrors: z.boolean().optional(),
})

/**
 * 代理请求处理器
 *
 * 将客户端请求代理到指定的面板 API，自动处理认证参数。
 *
 * 处理流程：
 * 1. 验证请求参数
 * 2. 获取会话对应的面板绑定信息
 * 3. 根据面板类型自动添加认证参数
 * 4. 发送请求到目标面板
 * 5. 返回面板响应数据
 *
 * @param ctx - Koa 上下文对象，需要包含有效的会话信息
 *
 * @example
 * GET 请求：
 * ```
 * GET /api/v1/proxy/request?url=/api/panel/get_sys_info&panelType=bt
 * ```
 *
 * POST 请求：
 * ```json
 * {
 *   "url": "/api/panel/get_sys_info",
 *   "panelType": "bt",
 *   "params": {
 *     "action": "get_sys_info"
 *   }
 * }
 * ```
 *
 * 成功响应：
 * ```json
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": {
 *     // 面板返回的数据
 *   }
 * }
 * ```
 */
const doProxy: Middleware = withResponse(async (ctx) => {
	const sessionId: string = (ctx.state as any).sessionId
	const method = ctx.method.toUpperCase()
	const parsed = proxyRequestSchema.safeParse(method === 'GET' ? ctx.request.query : ctx.request.body)
	if (!parsed.success) {
		throw new HttpError(400, '参数无效', parsed.error.flatten())
	}
	const { url: path, panelType, params = {}, ignoreSslErrors = false } = parsed.data
	const binding = getPanelBinding(sessionId, panelType)
	if (!binding) {
		throw new HttpError(400, '未找到面板绑定')
	}

	try {
		const data = await proxyRequest({
			method: method === 'GET' ? 'GET' : 'POST',
			path,
			panelType,
			params,
			binding,
			ignoreSslErrors,
		})
		// 统一成功返回
		return data
	} catch (error: any) {
		const errorMessage = error?.message || '代理请求失败'
		if (errorMessage.includes('SSL证书验证失败') && !ignoreSslErrors) {
			ctx.status = 400
			ctx.body = formatError(400, 'SSL证书验证失败', {
				message: errorMessage,
				suggestion: '您可以在请求中添加 "ignoreSslErrors": true 来跳过SSL证书验证，但这会降低安全性。',
				example: {
					ignoreSslErrors: true,
				},
			})
			return
		}
		throw new HttpError(error?.response?.status || 500, errorMessage, error?.response?.data)
	}
})

// 注册路由（所有代理路由都需要认证）
proxyRoutes.post('/bind-panel-key', authMiddleware, bindPanelKey)
proxyRoutes.get('/request', authMiddleware, doProxy)
proxyRoutes.post('/request', authMiddleware, doProxy)

/**
 * proxyRouteDocs - Proxy 路由文档元数据导出
 *
 * 提供 /proxy 下的接口文档描述，用于文档生成自动聚合。
 * - 覆盖 POST /proxy/bind-panel-key 与 POST /proxy/request 的请求体模式
 * - GET /proxy/request 的查询参数暂不在聚合器中自动注入（保留显式 parameters）
 */
export const proxyRouteDocs: RouteDocMeta[] = [
  { tag: 'Proxy', method: 'post', path: '/proxy/bind-panel-key', requestSchema: bindPanelKeySchema },
  { tag: 'Proxy', method: 'post', path: '/proxy/request', requestSchema: proxyRequestSchema },
  { tag: 'Proxy', method: 'get', path: '/proxy/request', querySchema: proxyRequestQuerySchema },
]
