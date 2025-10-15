import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * ProxyController
 *
 * 负责面板密钥绑定与请求转发：
 * - `bindPanelKey`：保存面板类型（`bt` 或 `1panel`）、面板地址与密钥；
 * - `request`：根据面板配置转发请求，返回下游响应或错误信息。
 */
export default class ProxyController extends Controller {
  /**
   * 绑定面板密钥与地址。
   *
   * @param {Context} ctx - Egg 请求上下文；`ctx.request.body` 需包含 `type`、`url`、`key`
   * @returns {Promise<void>} - 设置 `ctx.body={ code:200 }` 表示绑定成功
   */
  async bindPanelKey(ctx: Context) {
    const { type, url, key } = ctx.request.body || {};
    await ctx.service.proxy.bindPanelKey(type, url, key);
    ctx.body = { code: 200, message: 'Panel key bound successfully.' };
  }

  /**
   * 转发代理请求至配置的面板。
   *
   * @param {Context} ctx - Egg 请求上下文；支持从 `body`/`query` 读取 `panelType`、`url`、`params`、`method`
   * @returns {Promise<void>} - 写入 `ctx.body` 为 `{ code, message, data }` 并根据下游状态码设置 `ctx.status`
   */
  async request(ctx: Context) {
    const data = await ctx.service.proxy.handleRequest(ctx);
    if (typeof data?.code === 'number') ctx.status = data.code;
    ctx.body = data;
  }
}