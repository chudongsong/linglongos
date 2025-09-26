/**
 * 统一服务层导出模块
 *
 * 集中管理所有服务层的导出，提供统一的服务访问接口
 */

// 认证服务
export {
	generateBindSecret,
	verifyTokenWithBindId,
	createSession,
	getSession,
	setPanelBinding,
	getPanelBinding,
	BIND_COOKIE_NAME,
	SESSION_COOKIE_NAME,
} from './authService'

// 代理服务
export { proxyRequest } from './proxyService'

// 服务层类型定义（如果需要对外暴露）
export type { Session, PanelBinding, PanelType, ProxyRequestInput } from '../types/index'
