import { Service } from 'egg';
import axios, { AxiosRequestConfig } from 'axios';
import md5 from 'md5';

/** 面板类型定义 */
type PanelType = 'bt' | '1panel';

/** HTTP方法类型 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 代理响应接口 */
interface ProxyResponse {
  code: number;
  message: string;
  data?: any;
}

/**
 * 代理服务类
 *
 * 负责面板密钥绑定与请求转发：
 * - 支持bt和1panel两种面板类型
 * - 自动处理bt面板的签名认证
 * - 统一错误处理和响应格式
 */
export default class ProxyService extends Service {
  /** 默认HTTP方法 */
  private static readonly DEFAULT_METHOD: HttpMethod = 'POST';

  /** 错误状态码 */
  private static readonly ERROR_CODES = {
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
  } as const;

  /** 错误消息 */
  private static readonly ERROR_MESSAGES = {
    PANEL_NOT_CONFIGURED: 'Panel not configured.',
    PROXY_ERROR: 'proxy error',
    SUCCESS: 'success',
  } as const;

  /**
   * 绑定面板密钥
   *
   * @param {PanelType} type 面板类型
   * @param {string} url 面板基础地址
   * @param {string} key 访问密钥
   * @returns {Promise<void>} 无返回值，写入持久化存储
   */
  async bindPanelKey(type: PanelType, url: string, key: string): Promise<void> {
    this.ctx.service.storage.bindPanelKey(type, url, key);
  }

  /**
   * 处理代理请求并转发到配置的面板
   *
   * @param {any} ctx Egg 请求上下文；允许从 `body`/`query` 读取 `panelType`、`url`、`params`、`method`
   * @returns {Promise<ProxyResponse>} 下游响应包装；错误时 `code` 为下游状态码或 500
   */
  async handleRequest(ctx: any): Promise<ProxyResponse> {
    try {
      const requestParams = this.extractRequestParams(ctx);
      const panel = this.ctx.service.storage.getPanel(requestParams.panelType);

      if (!panel || !panel.url) {
        ctx.status = ProxyService.ERROR_CODES.BAD_REQUEST;
        return {
          code: ProxyService.ERROR_CODES.BAD_REQUEST,
          message: ProxyService.ERROR_MESSAGES.PANEL_NOT_CONFIGURED,
        };
      }

      const axiosConfig = this.buildAxiosConfig(panel, requestParams);
      const response = await axios(axiosConfig);

      return {
        code: 200,
        message: ProxyService.ERROR_MESSAGES.SUCCESS,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleProxyError(error);
    }
  }

  /**
   * 从请求上下文中提取参数
   *
   * @private
   * @param {any} ctx 请求上下文
   * @returns 提取的请求参数
   */
  private extractRequestParams(ctx: any) {
    const panelType = (ctx.request.body?.panelType || ctx.query?.panelType) as PanelType;
    const path = (ctx.request.body?.url || ctx.query?.url) as string;
    const params = (ctx.request.body?.params || {}) as Record<string, any>;
    const overrideMethod = (ctx.request.body?.method || ctx.query?.method) as string | undefined;
    const method = (overrideMethod || ctx.method || ProxyService.DEFAULT_METHOD).toUpperCase() as HttpMethod;

    return { panelType, path, params, method };
  }

  /**
   * 构建axios请求配置
   *
   * @private
   * @param {object} panel 面板配置
   * @param {object} requestParams 请求参数
   * @returns {AxiosRequestConfig} axios配置对象
   */
  private buildAxiosConfig(
    panel: { url: string; key: string },
    requestParams: { panelType: PanelType; path: string; params: Record<string, any>; method: HttpMethod },
  ): AxiosRequestConfig {
    const { panelType, path, params, method } = requestParams;

    // 处理bt面板的签名认证
    let reqParams = { ...params };
    if (panelType === 'bt') {
      reqParams = this.addBtAuthentication(reqParams, panel.key);
    }

    // 构建完整URL
    const url = this.buildUrl(panel.url, path);

    return {
      method,
      url,
      data: reqParams,
      params: method === 'GET' ? reqParams : undefined,
    };
  }

  /**
   * 为bt面板添加认证参数
   *
   * @private
   * @param {Record<string, any>} params 原始参数
   * @param {string} key 面板密钥
   * @returns {Record<string, any>} 添加认证后的参数
   */
  private addBtAuthentication(params: Record<string, any>, key: string): Record<string, any> {
    const request_time = Math.floor(Date.now() / 1000);
    const request_token = md5(key + request_time);
    return { ...params, request_time, request_token };
  }

  /**
   * 构建完整的请求URL
   *
   * @private
   * @param {string} baseUrl 基础URL
   * @param {string} path 路径
   * @returns {string} 完整URL
   */
  private buildUrl(baseUrl: string, path: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanPath = path?.startsWith('/') ? path : `/${path || ''}`;
    return cleanBaseUrl + cleanPath;
  }

  /**
   * 处理代理请求错误
   *
   * @private
   * @param {any} error 错误对象
   * @returns {ProxyResponse} 错误响应
   */
  private handleProxyError(error: any): ProxyResponse {
    const status = error?.response?.status || ProxyService.ERROR_CODES.INTERNAL_SERVER_ERROR;
    const message = error?.message || ProxyService.ERROR_MESSAGES.PROXY_ERROR;
    const data = error?.response?.data;

    return { code: status, message, data };
  }
}