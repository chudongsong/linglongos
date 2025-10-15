import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * UiController
 *
 * 提供简单的 UI 入口重定向到静态页面。
 */
export default class UiController extends Controller {
  /**
   * 重定向到内置静态页面 `/public/index.html`。
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 执行 302 重定向到静态页面
   */
  async index(ctx: Context) {
    ctx.redirect('/public/index.html');
  }
}