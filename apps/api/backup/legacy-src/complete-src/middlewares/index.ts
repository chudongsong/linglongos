/**
 * 统一中间件导出模块
 *
 * 集中管理所有中间件的导出，提供统一的中间件访问接口
 */

// 通用中间件
export { formatSuccess, formatError, HttpError, withResponse } from './commonMiddleware'

// 认证中间件
export { authMiddleware } from './authMiddleware'

// 日志中间件
export {
	httpLoggerMiddleware,
	errorLoggerMiddleware,
	logBusinessOperation,
	performanceLoggerMiddleware,
	securityLogger,
} from './loggerMiddleware'

// 中间件相关类型定义
export type {
	ApiStatus,
	SuccessResponse,
	ErrorResponse,
	SecurityEventType,
	AuthorizationEventType,
} from '../types/index'
