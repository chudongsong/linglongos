import { Context } from 'egg';

/**
 * 全局错误处理中间件
 *
 * 捕获所有未处理的错误，并返回统一的错误响应格式
 */
export default () => {
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next();
    } catch (err: any) {
      // 记录错误日志
      ctx.logger.error('Unhandled error:', err);

      // 根据错误类型返回相应的错误响应
      if (err.status === 401) {
        ctx.unauthorized(err.message || 'Unauthorized');
      } else if (err.status === 403) {
        ctx.forbidden(err.message || 'Forbidden');
      } else if (err.status === 404) {
        ctx.notFound(err.message || 'Not Found');
      } else if (err.status === 422 || err.code === 'invalid_param') {
        const detail = err.errors ? JSON.stringify(err.errors) : err.message;
        ctx.validationError('Validation Failed', detail);
      } else if (err.status >= 400 && err.status < 500) {
        // 客户端错误
        ctx.error(err.message || 'Bad Request', err.status || 400);
      } else {
        // 服务器内部错误
        const errorMessage = err instanceof Error ? err.message : String(err);
        ctx.internalError('Internal Server Error', errorMessage);
      }
    }
  };
};