import { Context } from 'egg';

/**
 * 统一 API 响应格式接口
 */
export interface ApiResponse<T = any> {
  /** 状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
  /** 错误详情（仅在错误时存在） */
  error?: string;
  /** 时间戳 */
  timestamp?: string;
}

/**
 * 扩展 Context 以支持统一响应格式
 */
export default {
  /**
   * 成功响应
   *
   * @param data 响应数据
   * @param message 响应消息，默认为 'success'
   * @param code HTTP 状态码，默认为 200
   */
  success<T>(this: Context, data?: T, message: string = 'success', code: number = 200): void {
    this.status = code;
    (this as any).body = {
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>;
  },

  /**
   * 错误响应
   *
   * @param message 错误消息
   * @param code HTTP 状态码，默认为 400
   * @param error 错误详情
   */
  error(this: Context, message: string, code: number = 400, error?: string): void {
    this.status = code;
    (this as any).body = {
      code,
      message,
      error,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  },

  /**
   * 未认证响应
   *
   * @param message 错误消息，默认为 'AUTH_REQUIRED'
   */
  unauthorized(this: Context, message: string = 'AUTH_REQUIRED'): void {
    (this as any).error(message, 401);
  },

  /**
   * 禁止访问响应
   *
   * @param message 错误消息，默认为 'FORBIDDEN'
   */
  forbidden(this: Context, message: string = 'FORBIDDEN'): void {
    (this as any).error(message, 403);
  },

  /**
   * 资源未找到响应
   *
   * @param message 错误消息，默认为 'NOT_FOUND'
   */
  notFound(this: Context, message: string = 'NOT_FOUND'): void {
    (this as any).error(message, 404);
  },

  /**
   * 未实现功能响应
   *
   * @param message 错误消息，默认为 'Not Implemented'
   * @param detail 详细说明
   */
  notImplemented(this: Context, message: string = 'Not Implemented', detail?: string): void {
    this.status = 501;
    (this as any).body = {
      code: 501,
      message,
      error: detail,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  },

  /**
   * 服务器内部错误响应
   *
   * @param message 错误消息，默认为 'INTERNAL_SERVER_ERROR'
   * @param error 错误详情
   */
  internalError(this: Context, message: string = 'INTERNAL_SERVER_ERROR', error?: string): void {
    (this as any).error(message, 500, error);
  },

  /**
   * 参数验证错误响应
   *
   * @param message 错误消息，默认为 'VALIDATION_ERROR'
   * @param error 验证错误详情
   */
  validationError(this: Context, message: string = 'VALIDATION_ERROR', error?: string): void {
    (this as any).error(message, 422, error);
  },
};