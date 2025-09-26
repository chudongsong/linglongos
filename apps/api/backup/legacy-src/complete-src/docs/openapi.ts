import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { proxyRouteDocs, authRouteDocs } from '../controllers/index'
import { btpanelRouteDocs } from '../btpanel/index'
import type { RouteDocMeta } from '../types/index'

/**
 * OpenAPI 文档生成模块
 *
 * 提供 getOpenApiSpec 方法，动态生成符合 OpenAPI 3.0.3 规范的接口文档。
 * 文档基于当前 Koa 路由与统一响应结构（formatSuccess/formatError）。
 *
 * 该模块不依赖运行时上下文，便于在路由与导出脚本中复用。
 */

/** OpenAPI 规范对象类型（简化版，使用 any 以兼容导出） */
export type OpenAPIObject = Record<string, unknown>

/**
 * getAggregatedRouteDocs - 自动聚合各模块导出的 Zod Schema 到路由元数据列表
 *
 * 说明：
 * - 聚合来源：proxyController、btpanel、authController 导出的路由文档元数据
 * - 仅对 POST 请求体进行自动注入；GET 的查询参数保持显式 parameters 声明
 *
 * @returns 路由文档元数据数组
 */
function getAggregatedRouteDocs(): RouteDocMeta[] {
	return [...proxyRouteDocs, ...btpanelRouteDocs, ...authRouteDocs]
}

/**
 * applyAggregatedDocs - 将聚合到的 Zod 请求体模式自动注入到 OpenAPI 文档
 *
 * 行为：
 * - 遍历 RouteDocMeta 列表，定位 spec.paths[path][method]
 * - 若存在 requestSchema，则通过 zod-to-json-schema 转换为 OpenAPI 3.0 兼容 Schema
 * - 将转换结果覆盖/写入 requestBody（application/json）位置
 *
 * @param spec OpenAPI 文档对象
 */
function applyAggregatedDocs(spec: OpenAPIObject): void {
	const docs = getAggregatedRouteDocs()
	const paths = (spec as any).paths || {}
	docs.forEach((doc) => {
		const pathItem = paths[doc.path]
		if (!pathItem) return
		const operation = pathItem[doc.method]
		if (!operation) return
		// 注入请求体
		if (doc.requestSchema) {
			operation.requestBody = jsonBody(zodToOpenApi(doc.requestSchema))
		}
		// 注入查询参数（覆盖已有 parameters）
		if (doc.querySchema) {
			operation.parameters = zodToOpenApiParameters(doc.querySchema, 'query')
		}
	})
}

/**
 * getOpenApiSpec - 生成 OpenAPI 3.0 文档对象
 *
 * @returns OpenAPIObject - OpenAPI 3.0.3 规范对象，包含基本信息、服务器、路径与组件
 */
export function getOpenApiSpec(): OpenAPIObject {
	const spec: OpenAPIObject = {
		openapi: '3.0.3',
		info: {
			title: 'LingLongOS API',
			description: '基于 Koa 的接口服务，支持 Google Auth 认证与多面板代理。该文档由代码生成，确保与路由实现一致。',
			version: '1.0.0',
			contact: { name: 'LingLongOS Team' },
		},
		servers: [{ url: '/api/v1', description: 'API v1 前缀' }],
		tags: [
			{ name: 'Auth', description: '认证相关接口' },
			{ name: 'Proxy', description: '通用代理接口（支持宝塔与 1Panel）' },
			{ name: 'BtPanel', description: '宝塔面板专用快捷代理接口' },
		],
		paths: {
			// Auth
			'/auth/google-auth-bind': {
				get: {
					tags: ['Auth'],
					summary: '获取 Google 身份验证器绑定信息',
					description: '返回 otpauth 二维码 URL 与密钥。',
					responses: {
						'200': {
							description: '成功',
							content: {
								'application/json': {
									schema: apiResponse({
										type: 'object',
										properties: { qrCodeUrl: { type: 'string' }, secret: { type: 'string' } },
									}),
								},
							},
						},
					},
				},
			},
			'/auth/google-auth-verify': {
				post: {
					tags: ['Auth'],
					summary: '验证 Google 身份验证器令牌',
					// 请求体将由自动聚合扫描注入（保持占位或省略）
					responses: {
						'200': {
							description: '认证成功',
							content: { 'application/json': { schema: apiResponse({ type: 'null' }) } },
						},
						'400': { description: '需要令牌', content: { 'application/json': { schema: apiError() } } },
						'401': { description: '令牌无效或会话已过期', content: { 'application/json': { schema: apiError() } } },
					},
				},
			},
			'/auth/google-auth-config': {
				get: {
					tags: ['Auth'],
					summary: '检查 Google Auth 配置状态',
					responses: {
						'200': {
							description: '成功',
							content: {
								'application/json': {
									schema: apiResponse({
										type: 'object',
										properties: { isConfigured: { type: 'boolean' }, configuredAt: { type: 'number', nullable: true } },
									}),
								},
							},
						},
						'500': { description: '读取配置失败', content: { 'application/json': { schema: apiError() } } },
					},
				},
			},
			'/auth/google-auth-config/complete': {
				post: {
					tags: ['Auth'],
					summary: '标记 Google Auth 配置完成',
					// 请求体将由自动聚合扫描注入
					responses: {
						'200': { description: '成功', content: { 'application/json': { schema: apiResponse({ type: 'null' }) } } },
						'500': { description: '内部错误', content: { 'application/json': { schema: apiError() } } },
					},
				},
			},
			'/auth/google-auth-config/reset': {
				post: {
					tags: ['Auth'],
					summary: '重置 Google Auth 配置',
					responses: {
						'200': { description: '成功', content: { 'application/json': { schema: apiResponse({ type: 'null' }) } } },
						'500': { description: '内部错误', content: { 'application/json': { schema: apiError() } } },
					},
				},
			},
			// Proxy
			'/proxy/bind-panel-key': {
				post: {
					tags: ['Proxy'],
					summary: '绑定面板密钥',
					// 请求体将由自动聚合扫描注入
					responses: {
						'200': {
							description: '绑定成功',
							content: { 'application/json': { schema: apiResponse({ type: 'null' }) } },
						},
						'400': { description: '参数无效', content: { 'application/json': { schema: apiError() } } },
					},
					security: [{ CookieAuth: [] }],
				},
			},
			'/proxy/request': {
				get: {
					tags: ['Proxy'],
					summary: '代理 GET 请求',
					parameters: [
						{ in: 'query', name: 'url', schema: { type: 'string' }, required: true },
						{ in: 'query', name: 'panelType', schema: { type: 'string', enum: ['bt', '1panel'] }, required: true },
						{ in: 'query', name: 'ignoreSslErrors', schema: { type: 'boolean' }, required: false },
					],
					responses: {
						'200': {
							description: '成功',
							content: { 'application/json': { schema: apiResponse({ type: 'object' }) } },
						},
						'400': { description: '参数无效', content: { 'application/json': { schema: apiError() } } },
						'401': { description: '需要认证', content: { 'application/json': { schema: apiError() } } },
					},
					security: [{ CookieAuth: [] }],
				},
				post: {
					tags: ['Proxy'],
					summary: '代理 POST 请求',
					// 请求体将由自动聚合扫描注入
					responses: {
						'200': {
							description: '成功',
							content: { 'application/json': { schema: apiResponse({ type: 'object' }) } },
						},
						'400': { description: '参数无效', content: { 'application/json': { schema: apiError() } } },
						'401': { description: '需要认证', content: { 'application/json': { schema: apiError() } } },
					},
					security: [{ CookieAuth: [] }],
				},
			},
			// BtPanel
			'/btpanel/request': {
				get: {
					tags: ['BtPanel'],
					summary: '宝塔快捷代理（GET）',
					parameters: [
						{ in: 'query', name: 'url', schema: { type: 'string' }, required: true },
						{ in: 'query', name: 'ignoreSslErrors', schema: { type: 'boolean' }, required: false },
					],
					responses: {
						'200': {
							description: '成功',
							content: { 'application/json': { schema: apiResponse({ type: 'object' }) } },
						},
						'400': { description: '参数无效', content: { 'application/json': { schema: apiError() } } },
						'401': { description: '需要认证', content: { 'application/json': { schema: apiError() } } },
					},
					security: [{ CookieAuth: [] }],
				},
				post: {
					tags: ['BtPanel'],
					summary: '宝塔快捷代理（POST）',
					// 请求体将由自动聚合扫描注入
					responses: {
						'200': {
							description: '成功',
							content: { 'application/json': { schema: apiResponse({ type: 'object' }) } },
						},
						'400': { description: '参数无效', content: { 'application/json': { schema: apiError() } } },
						'401': { description: '需要认证', content: { 'application/json': { schema: apiError() } } },
					},
					security: [{ CookieAuth: [] }],
				},
			},
		},
		components: {
			securitySchemes: {
				CookieAuth: {
					type: 'apiKey',
					in: 'cookie',
					name: 'll_session',
					description: '会话 Cookie 鉴权',
				},
			},
			schemas: {
				ApiResponseSuccess: apiResponse({ type: 'object' }),
				ApiResponseError: apiError(),
			},
		},
	}

	// 自动聚合扫描：注入 Zod 请求体 Schema
	applyAggregatedDocs(spec)

	return spec
}

/**
 * apiResponse - 统一成功响应结构 Schema
 *
 * @param dataSchema JSON Schema of data 字段
 * @returns OpenAPI Schema 对象
 */
function apiResponse(dataSchema: Record<string, unknown>) {
	return {
		type: 'object',
		properties: {
			code: { type: 'number', example: 200 },
			status: { type: 'string', example: 'success' },
			message: { type: 'string', example: 'success' },
			data: dataSchema,
		},
		required: ['code', 'status', 'message'],
	}
}

/**
 * apiError - 统一错误响应结构 Schema
 * @returns OpenAPI Schema 对象
 */
function apiError() {
	return {
		type: 'object',
		properties: {
			code: { type: 'number', example: 400 },
			status: { type: 'string', example: 'error' },
			message: { type: 'string', example: '错误信息' },
			data: { type: 'object', nullable: true },
		},
		required: ['code', 'status', 'message'],
	}
}

/**
 * jsonBody - 构造 OpenAPI 的 JSON 请求体定义
 *
 * @param schema 请求体的 JSON Schema 定义
 * @returns OpenAPI RequestBody 对象，带 application/json 内容类型
 */
function jsonBody(schema: Record<string, unknown>) {
	return {
		required: true,
		content: {
			'application/json': {
				schema,
			},
		},
	}
}

/**
 * zodToOpenApi - 将 Zod 模式转换为 OpenAPI 3.0 兼容的 Schema（基于 zod-to-json-schema for Zod v3）
 *
 * @param schema Zod 模式定义
 * @returns OpenAPI 3.0 兼容 Schema（使用 zod-to-json-schema 的 openApi3 目标）
 */
function zodToOpenApi(schema: z.ZodTypeAny): Record<string, unknown> {
	return zodToJsonSchema(schema, { target: 'openApi3' }) as Record<string, unknown>
}

/**
 * zodToOpenApiParameters - 将 Zod 对象模式转换为 OpenAPI parameters 数组
 *
 * 说明：
 * - 仅支持对象类型，将其 properties 映射为 in=query 的参数
 * - 根据 required 列表标记每个参数是否必填
 * - 保留 zod-to-json-schema 生成的属性约束（type/enum/format 等）
 *
 * @param schema Zod 模式（建议传入 z.object({...})）
 * @param location 参数位置，默认 'query'
 * @returns OpenAPI Parameter 数组
 */
function zodToOpenApiParameters(schema: z.ZodTypeAny, location: 'query' | 'path' = 'query'): any[] {
	const json = zodToJsonSchema(schema, 'params') as any
	if (!json || json.type !== 'object' || !json.properties) return []
	const required: string[] = Array.isArray(json.required) ? json.required : []
	return Object.entries(json.properties).map(([name, propSchema]) => ({
		in: location,
		name,
		schema: propSchema as Record<string, unknown>,
		required: required.includes(name),
	}))
}

// 在 paths 中的请求体由自动聚合扫描注入
