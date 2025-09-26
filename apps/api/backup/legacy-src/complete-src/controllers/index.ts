/**
 * 统一控制器导出模块
 * 
 * 集中管理所有控制器的导出，提供统一的控制器访问接口
 */

// 认证控制器
export { 
  authRoutes,
  authRouteDocs,
  googleAuthVerifySchema,
  googleAuthCompleteSchema
} from './authController.js'

// 代理控制器
export { 
  proxyRoutes,
  proxyRouteDocs,
  bindPanelKeySchema,
  proxyRequestSchema,
  proxyRequestQuerySchema
} from './proxyController.js'

// 控制器相关类型定义
export type {
  RouteDocMeta,
  GoogleAuthBindResponse,
  GoogleAuthVerifyRequest,
  GoogleAuthCompleteRequest,
  BindPanelKeyRequest,
  ProxyRequest,
  ProxyRequestQuery
} from '../types/index.js'