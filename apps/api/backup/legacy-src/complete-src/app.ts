import { koaSwagger } from 'koa2-swagger-ui'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import serve from 'koa-static'
import path from 'path'
import { router as apiRouter } from './routes/index'
import {
	formatError,
	httpLoggerMiddleware,
	errorLoggerMiddleware,
	performanceLoggerMiddleware,
} from './middlewares/index.js'
import { logger } from './config/index.js'

import type { Middleware } from 'koa'

const app = new Koa()
const router = new Router()

// 日志中间件 - 最先执行，记录所有请求
app.use(httpLoggerMiddleware)
app.use(performanceLoggerMiddleware)

// CORS 配置 - 允许跨域访问
app.use(
	cors({
		origin: '*',
		credentials: false,
	}),
)

// 静态文件服务 - 用于测试页面
app.use(serve(path.join(process.cwd(), 'public')))

// 请求体解析中间件
app.use(bodyParser())

/**
 * 全局错误处理中间件
 *
 * 捕获所有未处理的错误并返回标准化的错误响应。
 * 集成了错误日志记录功能。
 *
 * @param ctx - Koa 上下文对象
 * @param next - 下一个中间件函数
 */
const errorHandler: Middleware = async (ctx, next) => {
	try {
		await next()
	} catch (err: any) {
		// 记录错误日志
		logger.error('Unhandled Error', {
			message: err?.message || '内部服务器错误',
			stack: err?.stack,
			status: err?.status || 500,
			method: ctx.method,
			url: ctx.url,
			ip: ctx.ip,
			userAgent: ctx.get('User-Agent'),
		})

		ctx.status = err?.status || 500
		ctx.body = formatError(ctx.status, err?.message || '内部服务器错误')
	}
}

// 错误日志中间件 - 在错误处理器之前
app.use(errorLoggerMiddleware)
app.use(errorHandler)

// 注册 API 路由
app.use(apiRouter.routes())
app.use(apiRouter.allowedMethods())

// 启动服务器
const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
	logger.info('Server Started', {
		port: PORT,
		environment: process.env.NODE_ENV || 'development',
		urls: {
			api: `http://localhost:${PORT}`,
			docs: `http://localhost:${PORT}/docs`,
			test: `http://localhost:${PORT}/test-auth.html`,
		},
	})

	// 保留控制台输出以便开发时查看
	console.log(`API server running at http://localhost:${PORT}`)
	console.log(`Test page available at http://localhost:${PORT}/test-auth.html`)
})

// Swagger UI 文档页面（/docs）
app.use(
	koaSwagger({
		routePrefix: '/docs',
		swaggerOptions: {
			url: '/api/v1/docs/openapi.json',
		},
	}),
)
