import type { Application } from 'egg'

/**
 * API 路由定义 - 动词+宾语格式
 *
 * 说明：采用"动词+宾语"（Verb+Object）的结构，使用 snake_case 命名，清晰表达接口意图；
 * 中间件绑定在 `config.default.ts` 中通过 `config.middleware` 管理：`common`, `auth`, `bt`。
 *
 * API 路由规范：
 * - 认证会话管理
 *   - `GET /api/v1/get_bind_info` → 获取绑定信息（原 google-auth-bind）
 *   - `POST /api/v1/create_session` → 创建会话（原 google-auth-confirm/verify）
 *   - `POST /api/v1/verify_session` → 验证会话
 *   - `POST /api/v1/delete_session` → 删除会话（登出）
 * - 代理面板设置
 *   - `POST /api/v1/set_proxy_panel` → 设置代理面板配置
 * - 代理请求处理
 *   - `POST /api/v1/proxy_request` → 处理代理请求（原 proxy/request）
 *
 * 兼容性路由（保持向后兼容）：
 * - `GET /ui` → `controller.ui.index`
 * - `GET /api/v1/docs/openapi.json` → 文档导出
 *
 * @param {Application} app - Egg 应用实例
 * @returns {void}
 */
export default (app: Application) => {
	const { controller, router } = app

	// 动词+宾语格式路由 - 符合API开发规范，添加控制器名称前缀

	// 认证会话管理 (Sessions Controller)
	router.get('/api/v1/sessions/get_bind_info', controller.sessions.new) // 获取绑定信息
	router.post('/api/v1/sessions/create_session', controller.sessions.create) // 创建会话(确认绑定)
	router.post('/api/v1/sessions/verify_session', controller.sessions.create) // 验证会话
	router.post('/api/v1/sessions/delete_session', controller.sessions.destroy) // 删除会话(登出)
	router.all('/api/v1/sessions/get_sessions', controller.sessions.index) // 获取会话列表
	router.get('/api/v1/sessions/show_session/:id', controller.sessions.show) // 获取单个会话
	router.post('/api/v1/sessions/update_session', controller.sessions.update) // 更新会话 (改为POST)

	// 代理面板设置 (Panels Controller - 重新定位为代理面板设置)
	router.post('/api/v1/panels/set_proxy_panel', controller.panels.create) // 设置代理面板配置

	// 代理请求处理 (Proxy Controller)
	router.post('/api/v1/proxy/proxy_request', controller.proxy.request) // 处理代理请求
	router.all('/api/v1/proxy/request', controller.proxy.request) // 处理代理请求(通用)

	// 向后兼容的 v1 API 路由 (保持原有路径以确保兼容性)
	router.all('/api/v1/init/status', controller.init.checkStatus)
	router.all('/api/v1/auth/google-auth-bind', controller.auth.googleAuthBind)
	router.post('/api/v1/auth/google-auth-confirm', controller.auth.googleAuthConfirm)
	router.post('/api/v1/auth/google-auth-verify', controller.auth.googleAuthVerify)
	router.all('/api/v1/proxy/request', controller.proxy.request)

	// 新增带控制器前缀的路由 (推荐使用)
	// 初始化控制器 (Init Controller)
	router.all('/api/v1/init/check_status', controller.init.checkStatus)

	// 认证控制器 (Auth Controller)
	router.all('/api/v1/auth/google_auth_bind', controller.auth.googleAuthBind) // 获取绑定信息
	router.post('/api/v1/auth/google_auth_confirm', controller.auth.googleAuthConfirm) // 创建会话(确认绑定)
	router.post('/api/v1/auth/google_auth_verify', controller.auth.googleAuthVerify) // 验证会话

	// 文档控制器 (Docs Controller)
	router.get('/api/v1/docs/openapi_json', controller.docs.openapi)

	// 其他路由
	router.get('/ui', controller.ui.index)
}
