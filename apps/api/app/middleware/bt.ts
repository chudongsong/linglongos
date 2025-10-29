import type { Context } from 'egg'

/**
 * BT 中间件：为响应设置标识头 `X-BT-Middleware`。
 *
 * 用途：用于调试或链路标识，表明该中间件已执行。
 *
 * @returns {(ctx: Context, next: () => Promise<any>) => Promise<void>} - 返回 Egg 中间件函数
 */
export default function btMiddleware() {
	return async (ctx: Context, next: () => Promise<any>) => {
		ctx.set('X-BT-Middleware', 'enabled')
		await next()
	}
}
