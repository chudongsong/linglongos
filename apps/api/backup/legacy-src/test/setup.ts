/**
 * 测试环境设置文件
 *
 * 在所有测试运行前执行的初始化代码
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error' // 测试时只显示错误日志

// 模拟环境变量
process.env.GOOGLE_AUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.PORT = '0' // 使用随机端口避免冲突

// 全局测试工具函数
declare global {
	namespace Vi {
		interface JestAssertion<T = any> {
			toBeValidResponse(): T
			toBeErrorResponse(): T
		}
	}
}

// 扩展 expect 断言
import { expect, afterEach, vi } from 'vitest'

// 验证成功响应格式
expect.extend({
	toBeValidResponse(received: any) {
		const pass =
			received &&
			typeof received === 'object' &&
			typeof received.code === 'number' &&
			received.code === 200 &&
			received.status === 'success' &&
			typeof received.message === 'string' &&
			received.hasOwnProperty('data')

		return {
			pass,
			message: () =>
				pass
					? `Expected ${JSON.stringify(received)} not to be a valid success response`
					: `Expected ${JSON.stringify(received)} to be a valid success response with code: 200, status: 'success', message: string, data: any`,
		}
	},

	toBeErrorResponse(received: any) {
		const pass =
			received &&
			typeof received === 'object' &&
			typeof received.code === 'number' &&
			received.code >= 400 &&
			received.status === 'error' &&
			typeof received.message === 'string'

		return {
			pass,
			message: () =>
				pass
					? `Expected ${JSON.stringify(received)} not to be a valid error response`
					: `Expected ${JSON.stringify(received)} to be a valid error response with code >= 400, status: 'error', message: string`,
		}
	},
})

// 清理函数
afterEach(() => {
	// 清理所有模拟
	vi.clearAllMocks()
	vi.restoreAllMocks()
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error)
})
