import type { Context } from 'egg'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 静态页面会话验证中间件
 *
 * 功能：
 * - 对受保护的静态HTML页面进行会话验证
 * - 区分公开页面和需要认证的页面
 * - 未认证用户访问受保护页面时重定向到登录页面
 * - 保持其他静态资源（CSS、JS、图片等）的正常访问
 */
export default function staticAuthMiddleware() {
	// 公开访问的页面（不需要会话验证）
	const publicPages = [
		'/public/setup.html', // 初始化设置页面
		'/public/test-static.html', // 测试页面
	]

	// 受保护的页面（需要会话验证）
	const protectedPages = [
		'/public/verify.html', // 验证页面
		'/public/dashboard.html', // 仪表板页面
		'/public/index.html', // 演示页面（可选择是否保护）
		'/public/admin.html', // 管理页面（如果存在）
		'/',
	]

	// 登录重定向页面
	const loginPage = '/public/setup.html'

	return async (ctx: Context, next: () => Promise<any>) => {
		const requestPath = ctx.path

		// 检查是否为受保护页面（包括根路径）
		if (protectedPages.includes(requestPath)) {
			// 验证会话（注意：cookie是签名的）
			const sid = ctx.cookies.get('ll_session', { signed: true })
			const isValidSession = sid ? ctx.service.storage.isValidSession(sid) : false

			if (!isValidSession) {
				// 未认证用户重定向到登录页面
				ctx.redirect(loginPage)
				return
			}
		}

		// 只处理HTML页面请求（排除根路径，因为已经在上面处理了）
		if (!requestPath.endsWith('.html') && requestPath !== '/') {
			await next()
			return
		}

		// 检查是否为公开页面
		if (publicPages.includes(requestPath)) {
			await next()
			return
		}

		// 对于其他HTML页面，检查文件是否存在
		const publicDir = path.join(ctx.app.baseDir, 'app/public')
		const filePath = path.join(publicDir, requestPath)

		try {
			if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
				// 文件存在，默认需要会话验证（安全优先原则）
				const sid = ctx.cookies.get('ll_session', { signed: true })
				const isValidSession = sid ? ctx.service.storage.isValidSession(sid) : false

				if (!isValidSession) {
					ctx.redirect(loginPage)
					return
				}
			}
		} catch (error) {
			// 文件访问错误，继续到下一个中间件处理
		}

		await next()
	}
}