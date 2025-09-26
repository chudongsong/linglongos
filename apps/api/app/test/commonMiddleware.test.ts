/**
 * 通用中间件测试
 *
 * 测试 formatSuccess、formatError、HttpError 和 withResponse 函数
 */

import { describe, it, expect, vi } from 'vitest'
import { formatSuccess, formatError, HttpError, withResponse } from './commonMiddleware'
import { createMockContext } from '../test/helpers'

describe('commonMiddleware', () => {
	describe('formatSuccess', () => {
		it('应该返回标准的成功响应格式', () => {
			const data = { id: 1, name: 'test' }
			const result = formatSuccess(data, '操作成功')

			expect(result).toEqual({
				code: 200,
				status: 'success',
				message: '操作成功',
				data,
			})
		})

		it('应该使用默认消息', () => {
			const data = { test: true }
			const result = formatSuccess(data)

			expect(result).toEqual({
				code: 200,
				status: 'success',
				message: '成功',
				data,
			})
		})

		it('应该处理 null 数据', () => {
			const result = formatSuccess(null)

			expect(result).toEqual({
				code: 200,
				status: 'success',
				message: '成功',
				data: null,
			})
		})
	})

	describe('formatError', () => {
		it('应该返回标准的错误响应格式', () => {
			const result = formatError(400, '参数错误', { field: 'email' })

			expect(result).toEqual({
				code: 400,
				status: 'error',
				message: '参数错误',
				data: { field: 'email' },
			})
		})

		it('应该处理没有额外数据的错误', () => {
			const result = formatError(500, '服务器错误')

			expect(result).toEqual({
				code: 500,
				status: 'error',
				message: '服务器错误',
				data: undefined,
			})
		})
	})

	describe('HttpError', () => {
		it('应该创建带有状态码的错误', () => {
			const error = new HttpError(404, '资源未找到')

			expect(error).toBeInstanceOf(Error)
			expect(error.message).toBe('资源未找到')
			expect(error.status).toBe(404)
			expect(error.data).toBeUndefined()
		})

		it('应该创建带有额外数据的错误', () => {
			const errorData = { resource: 'user', id: 123 }
			const error = new HttpError(404, '用户未找到', errorData)

			expect(error.message).toBe('用户未找到')
			expect(error.status).toBe(404)
			expect(error.data).toEqual(errorData)
		})
	})

	describe('withResponse', () => {
		it('应该包装成功的处理函数', async () => {
			const mockHandler = vi.fn().mockResolvedValue({ success: true })
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(mockHandler).toHaveBeenCalledWith(ctx)
			expect(ctx.body).toEqual({
				code: 200,
				status: 'success',
				message: '成功',
				data: { success: true },
			})
			expect(next).toHaveBeenCalled()
		})

		it('应该处理返回 null 的处理函数', async () => {
			const mockHandler = vi.fn().mockResolvedValue(null)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.body).toEqual({
				code: 200,
				status: 'success',
				message: '成功',
				data: null,
			})
		})

		it('应该处理返回 undefined 的处理函数', async () => {
			const mockHandler = vi.fn().mockResolvedValue(undefined)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.body).toEqual({
				code: 200,
				status: 'success',
				message: '成功',
				data: null,
			})
		})

		it('应该尊重处理函数设置的 ctx.body', async () => {
			const customResponse = { custom: 'response' }
			const mockHandler = vi.fn().mockImplementation((ctx) => {
				ctx.body = customResponse
				return { ignored: 'data' }
			})
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.body).toEqual(customResponse)
		})

		it('应该捕获并格式化 HttpError', async () => {
			const error = new HttpError(400, '参数无效', { field: 'email' })
			const mockHandler = vi.fn().mockRejectedValue(error)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.status).toBe(400)
			expect(ctx.body).toEqual({
				code: 400,
				status: 'error',
				message: '参数无效',
				data: { field: 'email' },
			})
		})

		it('应该捕获并格式化普通错误', async () => {
			const error = new Error('普通错误')
			const mockHandler = vi.fn().mockRejectedValue(error)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.status).toBe(500)
			expect(ctx.body).toEqual({
				code: 500,
				status: 'error',
				message: '普通错误',
				data: undefined,
			})
		})

		it('应该处理带有 status 属性的错误', async () => {
			const error = Object.assign(new Error('自定义错误'), { status: 403 })
			const mockHandler = vi.fn().mockRejectedValue(error)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.status).toBe(403)
			expect(ctx.body).toEqual({
				code: 403,
				status: 'error',
				message: '自定义错误',
				data: undefined,
			})
		})

		it('应该处理未知类型的错误', async () => {
			const error = 'string error'
			const mockHandler = vi.fn().mockRejectedValue(error)
			const middleware = withResponse(mockHandler)
			const ctx = createMockContext()
			const next = vi.fn()

			await middleware(ctx, next)

			expect(ctx.status).toBe(500)
			expect(ctx.body).toEqual({
				code: 500,
				status: 'error',
				message: '内部服务器错误',
				data: undefined,
			})
		})
	})
})
