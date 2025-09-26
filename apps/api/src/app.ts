import { koaSwagger } from 'koa2-swagger-ui'
import Koa from 'koa'
import type { Middleware } from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import serve from 'koa-static'
import path from 'path'
import { router as apiRouter } from './routes/index.js'
import { formatError } from './middlewares/commonMiddleware.js'

const app = new Koa()
const router = new Router()

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
 *
 * @param ctx - Koa 上下文对象
 * @param next - 下一个中间件函数
 */
const errorHandler: Middleware = async (ctx, next) => {
	try {
		await next()
	} catch (err: any) {
		ctx.status = err?.status || 500
		ctx.body = formatError(ctx.status, err?.message || '内部服务器错误')
	}
}
app.use(errorHandler)

// 注册 API 路由
app.use(apiRouter.routes())
app.use(apiRouter.allowedMethods())

// 启动服务器
const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
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
  })
)
