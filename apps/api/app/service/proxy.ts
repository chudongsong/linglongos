import { Service } from 'egg';
import axios from 'axios';
import md5 from 'md5';

export default class ProxyService extends Service {
  /**
   * 绑定面板密钥。
   *
   * @param {('bt'|'1panel')} type - 面板类型
   * @param {string} url - 面板基础地址
   * @param {string} key - 访问密钥
   * @returns {Promise<void>} - 无返回值，写入持久化存储
   */
  async bindPanelKey(type: 'bt' | '1panel', url: string, key: string): Promise<void> {
    this.ctx.service.fileStorage.bindPanelKey(type, url, key);
  }

  /**
   * 处理代理请求并转发到配置的面板。
   *
   * @param {any} ctx - Egg 请求上下文；允许从 `body`/`query` 读取 `panelType`、`url`、`params`、`method`
   * @returns {Promise<{ code: number; message: string; data?: any }>} - 下游响应包装；错误时 `code` 为下游状态码或 500
   */
  async handleRequest(ctx: any): Promise<any> {
    const panelType = (ctx.request.body?.panelType || ctx.query?.panelType) as 'bt' | '1panel';
    const path = (ctx.request.body?.url || ctx.query?.url) as string;
    const params = (ctx.request.body?.params || {}) as Record<string, any>;
    const overrideMethod = (ctx.request.body?.method || ctx.query?.method) as string | undefined;

    const panel = this.ctx.service.fileStorage.getPanel(panelType);
    if (!panel || !panel.url) {
      ctx.status = 400;
      return { code: 400, message: 'Panel not configured.' };
    }

    let reqParams = { ...params };
    if (panelType === 'bt') {
      const request_time = Math.floor(Date.now() / 1000);
      const request_token = md5(panel.key + request_time);
      reqParams = { ...reqParams, request_time, request_token };
    }

    const url = panel.url.replace(/\/$/, '') + (path?.startsWith('/') ? path : `/${path || ''}`);
    const method = (overrideMethod || ctx.method || 'POST').toUpperCase();
    try {
      const resp = await axios({ method, url, data: reqParams, params: method === 'GET' ? reqParams : undefined });
      return { code: 200, message: 'success', data: resp.data };
    } catch (e: any) {
      const status = e?.response?.status || 500;
      const errData = e?.response?.data;
      return { code: status, message: e?.message || 'proxy error', data: errData };
    }
  }
}
