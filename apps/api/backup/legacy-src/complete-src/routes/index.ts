/**
 * API 路由配置
 *
 * 统一管理所有 API 路由，包括认证相关路由和代理相关路由。
 * 所有路由都使用 `/api/v1` 前缀。
 *
 * 路由结构：
 * - /api/v1/auth/* - 认证相关接口
 * - /api/v1/proxy/* - 代理相关接口（需要认证）
 */

import Router from '@koa/router'
import YAML from 'yaml'
import { authRoutes, proxyRoutes } from '../controllers/index'
import { btpanelRoutes } from '../btpanel/index'
import { getOpenApiSpec } from '../docs/openapi'

/** 主路由实例，包含 API 版本前缀 */
export const router = new Router({ prefix: '/api/v1' })

// 注册认证路由
router.use(authRoutes.routes(), authRoutes.allowedMethods())

// 注册代理路由
router.use(proxyRoutes.routes(), proxyRoutes.allowedMethods())

// 注册 btpanel 路由
router.use(btpanelRoutes.routes(), btpanelRoutes.allowedMethods())

/**
 * GET /api/v1/docs/openapi.json - 提供 OpenAPI 3.0 JSON 文档
 *
 * 返回标准化的接口文档，供前端或第三方工具（如 Swagger UI、Postman）使用。
 */
router.get('/docs/openapi.json', async (ctx) => {
	// 生成并返回 OpenAPI 规范对象
	ctx.type = 'application/json'
	ctx.body = getOpenApiSpec()
})

/**
 * GET /api/v1/docs/openapi.yaml - 提供 OpenAPI 3.0 YAML 文档
 *
 * 便于开发团队以 YAML 格式下载与查看接口文档。
 */
router.get('/docs/openapi.yaml', async (ctx) => {
	const spec = getOpenApiSpec()
	const yaml = YAML.stringify(spec)
	ctx.type = 'text/yaml'
	ctx.body = yaml
})
