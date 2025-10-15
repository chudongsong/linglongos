import { Controller } from 'egg';
import type { Context } from 'egg';

export default class ProxyController extends Controller {
  async bindPanelKey(ctx: Context) {
    const { type, url, key } = ctx.request.body || {};
    await ctx.service.proxy.bindPanelKey(type, url, key);
    ctx.body = { code: 200, message: 'Panel key bound successfully.' };
  }

  async request(ctx: Context) {
    const data = await ctx.service.proxy.handleRequest(ctx);
    ctx.body = data;
  }
}