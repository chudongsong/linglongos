import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * ProxyController - RESTful 代理请求处理
 *
 * 符合 Egg.js RESTful 标准的代理请求控制器：
 * - `create`：处理代理请求
 */
export default class ProxyController extends Controller {
  /**
   * 处理代理请求
   * POST /api/v2/proxy
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回代理请求结果
   */
  async create(ctx: Context) {
    try {
      const data = await ctx.service.proxy.handleRequest(ctx);

      // 根据服务返回的状态码设置响应状态
      if (typeof data?.code === 'number') {
        ctx.status = data.code;
      } else {
        ctx.status = 200;
      }

      ctx.body = data;
    } catch (error: any) {
      ctx.logger.error('代理请求处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('代理请求处理失败', errorMessage);
    }
  }

  /**
   * 获取代理请求列表（暂不实现）
   * GET /api/v2/proxy
   */
  async index(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取代理请求列表功能暂未实现');
  }

  /**
   * 获取单个代理请求（暂不实现）
   * GET /api/v2/proxy/:id
   */
  async show(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取单个代理请求功能暂未实现');
  }

  /**
   * 更新代理请求（暂不实现）
   * PUT /api/v2/proxy/:id
   */
  async update(ctx: Context) {
    ctx.notImplemented('Not Implemented', '更新代理请求功能暂未实现');
  }

  /**
   * 删除代理请求（暂不实现）
   * DELETE /api/v2/proxy/:id
   */
  async destroy(ctx: Context) {
    ctx.notImplemented('Not Implemented', '删除代理请求功能暂未实现');
  }

  /**
   * 获取新建表单（暂不实现）
   * GET /api/v2/proxy/new
   */
  async new(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取新建表单功能暂未实现');
  }

  /**
   * 获取编辑表单（暂不实现）
   * GET /api/v2/proxy/:id/edit
   */
  async edit(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取编辑表单功能暂未实现');
  }

  // 保留原有方法以支持向后兼容
  /**
   * 绑定面板密钥与地址（向后兼容）
   * @deprecated 请使用 panels 资源的 create 方法
   */
  async bindPanelKey(ctx: Context) {
    try {
      const { type, url, key } = ctx.request.body || {};
      await ctx.service.proxy.bindPanelKey(type, url, key);
      ctx.success(null, 'Panel key bound successfully.');
    } catch (error) {
      ctx.logger.error('绑定面板密钥失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('绑定面板密钥失败', errorMessage);
    }
  }

  /**
   * 转发代理请求（向后兼容）
   * @deprecated 请使用 proxy 资源的 create 方法
   */
  async request(ctx: Context) {
    try {
      const data = await ctx.service.proxy.handleRequest(ctx);
      if (typeof data?.code === 'number') ctx.status = data.code;
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('转发代理请求失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('转发代理请求失败', errorMessage);
    }
  }
}