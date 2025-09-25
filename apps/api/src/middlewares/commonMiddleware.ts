import type { Middleware } from 'koa'
/**
 * 格式化成功响应数据
 * 
 * @template T - 响应数据的类型
 * @param data - 要返回的数据
 * @param message - 成功消息，默认为 'success'
 * @returns 标准化的成功响应对象（包含 code 与 status 字段）
 * 
 * @example
 * ```typescript
 * const response = formatSuccess({ id: 1, name: 'John' }, '用户创建成功');
 * // 返回: { code: 200, message: '用户创建成功', data: { id: 1, name: 'John' } }
 * ```
 */
export function formatSuccess<T>(data: T, message = '成功') {
  return { code: 200, status: 'success' as ApiStatus, message, data }
}

/**
 * 格式化错误响应数据
 * 
 * @param code - HTTP 状态码
 * @param message - 错误消息
 * @param data - 可选的错误详细信息
 * @returns 标准化的错误响应对象（包含 code 与 status 字段）
 * 
 * @example
 * ```typescript
 * const errorResponse = formatError(400, '参数验证失败', { field: 'email' });
 * // 返回: { code: 400, message: '参数验证失败', data: { field: 'email' } }
 * ```
 */
export function formatError(code: number, message: string, data?: unknown) {
  return { code, status: 'error' as ApiStatus, message, data }
}

/**
 * HttpError - 用于在业务代码中抛出带有状态码的错误
 *
 * @param status 状态码（HTTP Code）
 * @param message 错误消息
 * @param data 可选的错误详情
 */
export class HttpError extends Error {
  status: number
  data?: unknown
  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

/**
 * withResponse - 装饰器（高阶包装器），统一处理接口的返回与错误
 *
 * 用法：
 * const handler = withResponse(async (ctx) => {
 *   // 业务逻辑：可以返回数据，或抛出 HttpError
 *   return { ok: true }
 * })
 *
 * @param handler 真实业务处理函数，返回值将作为 data 返回
 * @returns Koa Middleware，中间件会捕获异常并使用统一格式返回
 */
export function withResponse(handler: (ctx: any) => Promise<unknown>): Middleware {
  return async (ctx, next) => {
    try {
      const result = await handler(ctx)
      // 如果处理函数显式设置了 ctx.body，则尊重它；否则统一封装
      if (ctx.body === undefined) {
        ctx.body = formatSuccess(result ?? null)
      }
      await next()
    } catch (err: any) {
      const status = err instanceof HttpError ? err.status : (err?.status ?? 500)
      const message = err instanceof HttpError ? err.message : (err?.message ?? '内部服务器错误')
      const data = err instanceof HttpError ? err.data : undefined
      ctx.status = status
      ctx.body = formatError(status, message, data)
    }
  }
}

/** 定义接口返回的提示消息类型 */
export type ApiStatus = 'success' | 'error' | 'info' | 'warning'