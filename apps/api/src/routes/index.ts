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
import { authRoutes } from '../controllers/authController.js'
import { proxyRoutes } from '../controllers/proxyController.js'
import { btpanelRoutes } from '../btpanel/index.js'

/** 主路由实例，包含 API 版本前缀 */
export const router = new Router({ prefix: '/api/v1' })

// 注册认证路由
router.use(authRoutes.routes(), authRoutes.allowedMethods())

// 注册代理路由
router.use(proxyRoutes.routes(), proxyRoutes.allowedMethods())

// 注册 btpanel 路由
router.use(btpanelRoutes.routes(), btpanelRoutes.allowedMethods())
