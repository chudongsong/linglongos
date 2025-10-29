import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * ProxyController - 代理请求处理
 *
 * 专门用于处理代理请求的控制器：
 * - `request`：处理代理请求
 * @controller Proxy
 */
export default class ProxyController extends Controller {
  /**
   * 处理代理请求
   * @summary 处理代理请求
   * @description 将请求代理到配置的面板服务器
   * @router all /api/v1/proxy/request
   */
  async request(ctx: Context) {
    try {
      const data = await ctx.service.proxy.handleRequest(ctx);
      if (typeof data?.code === 'number') ctx.status = data.code;
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('代理请求处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('代理请求处理失败', errorMessage);
    }
  }
}