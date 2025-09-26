import Router from '@koa/router'
import { z } from 'zod'
import type { Middleware } from 'koa'
import { authMiddleware } from '../middlewares/authMiddleware'
import { formatError, withResponse, HttpError } from '../middlewares/commonMiddleware'
import { getPanelBinding } from '../services/authService'
import { proxyRequest } from '../services/proxyService'
import type { RouteDocMeta } from '../types/index'

/**
 * btpanel 路由 - 固定面板类型为宝塔（bt）的转发代理
 *
 * 目标：提供更简洁的转发接口，避免每次都传递 panelType
 * 前缀：/api/v1/btpanel
 */
export const btpanelRoutes = new Router({ prefix: '/btpanel' })

/**
 * 请求参数校验模式
 */
export const btProxySchema = z.object({
	url: z.string().min(1),
	params: z.record(z.string(), z.any()).optional(),
	ignoreSslErrors: z.boolean().optional(),
})

/**
 * GET/POST /btpanel/request
 *
 * 使用示例：
 * - GET /api/v1/btpanel/request?url=/api/panel/get_sys_info
 * - POST /api/v1/btpanel/request { url, params }
 */
const btProxyHandler: Middleware = withResponse(async (ctx) => {
	const method = ctx.method.toUpperCase()
	const parsed = btProxySchema.safeParse(method === 'GET' ? ctx.request.query : ctx.request.body)
	if (!parsed.success) {
		throw new HttpError(400, '参数无效', parsed.error.flatten())
	}
	const { url: path, params = {}, ignoreSslErrors = false } = parsed.data
	const sessionId: string = (ctx.state as any).sessionId
	const binding = getPanelBinding(sessionId, 'bt')
	if (!binding) {
		throw new HttpError(400, '未找到面板绑定')
	}

	try {
		const data = await proxyRequest({
			method: method === 'GET' ? 'GET' : 'POST',
			path,
			panelType: 'bt',
			params,
			binding,
			ignoreSslErrors,
		})
		// 返回统一成功结构
		return data
	} catch (error: any) {
		const errorMessage = error?.message || '代理请求失败'
		if (errorMessage.includes('SSL证书验证失败') && !ignoreSslErrors) {
			// 直接设置自定义错误响应，withResponse 将尊重已设置的 ctx.body
			ctx.status = 400
			ctx.body = formatError(400, 'SSL证书验证失败', {
				message: errorMessage,
				suggestion: '您可以在请求中添加 "ignoreSslErrors": true 来跳过SSL证书验证，但这会降低安全性。',
				example: { ignoreSslErrors: true },
			})
			return
		}
		throw new HttpError(error?.response?.status || 500, errorMessage, error?.response?.data)
	}
})

// 注册路由（需要认证）
btpanelRoutes.get('/request', authMiddleware, btProxyHandler)
btpanelRoutes.post('/request', authMiddleware, btProxyHandler)

/**
 * btpanelRouteDocs - BtPanel 路由文档元数据导出
 *
 * 提供 /btpanel 下的接口文档描述，用于文档生成自动聚合。
 * - 覆盖 POST /btpanel/request 的请求体模式
 * - GET /btpanel/request 的查询参数暂不在聚合器中自动注入（保留显式 parameters）
 */
/** GET /btpanel/request 查询参数验证模式 */
export const btProxyQuerySchema = z.object({
	url: z.string().min(1),
	ignoreSslErrors: z.boolean().optional(),
})
export const btpanelRouteDocs: RouteDocMeta[] = [
	{ tag: 'BtPanel', method: 'post', path: '/btpanel/request', requestSchema: btProxySchema },
	{ tag: 'BtPanel', method: 'get', path: '/btpanel/request', querySchema: btProxyQuerySchema },
]
