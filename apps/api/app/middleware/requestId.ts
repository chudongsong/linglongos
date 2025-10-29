import { Context, Next } from 'egg';
import { randomUUID } from 'crypto';

/**
 * Request ID 中间件
 *
 * 为每个请求生成或获取唯一的请求ID，用于日志追踪和响应标识
 */
export default function requestIdMiddleware() {
  return async (ctx: Context, next: Next) => {
    // 从请求头获取或生成新的请求ID
    const requestId = ctx.get('X-Request-ID') || randomUUID();

    // 设置到状态中供后续使用
    ctx.state.requestId = requestId;

    // 设置响应头
    ctx.set('X-Request-ID', requestId);

    // 记录请求开始日志
    ctx.logger.info(`[${requestId}] ${ctx.method} ${ctx.url} - Request started`);

    const startTime = Date.now();

    try {
      await next();

      // 记录请求完成日志
      const duration = Date.now() - startTime;
      ctx.logger.info(`[${requestId}] ${ctx.method} ${ctx.url} - Request completed in ${duration}ms`);
    } catch (error) {
      // 记录请求错误日志
      const duration = Date.now() - startTime;
      ctx.logger.error(`[${requestId}] ${ctx.method} ${ctx.url} - Request failed in ${duration}ms:`, error);
      throw error;
    }
  };
}
