import { Context } from 'egg';
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from '../constants/errorCodes';

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
  error?: {
    type: string;
    details?: any;
  };
  /** 时间戳 */
  timestamp: number;
}

/**
 * 分页响应数据接口
 */
export interface PaginationResponse<T = any> {
  items: T[];
  total: number;
}

/**
 * 扩展 Context 以支持统一响应格式
 */
export default {
  /**
   * 成功响应
   *
   * @param data 响应数据
   * @param message 响应消息，默认为 '操作成功'
   * @param code HTTP 状态码，默认为 200
   */
  success<T>(this: Context, data?: T, message: string = '操作成功', code: number = 200): void {
    this.status = code;
    (this as any).body = {
      code,
      message,
      data,
      timestamp: Date.now(),
    } as ApiResponse<T>;
  },

  /**
   * 分页响应
   *
   * @param items 数据项
   * @param total 总数
   * @param message 响应消息，默认为 '查询成功'
   */
  successWithPagination<T>(
    this: Context,
    items: T[],
    total: number,
    message: string = '查询成功',
  ): void {
    (this as any).success({
      items,
      total,
    } as PaginationResponse<T>, message);
  },

  /**
   * 错误响应
   *
   * @param message 错误消息
   * @param code HTTP 状态码，默认为 400
   * @param errorType 错误类型
   * @param details 错误详情
   */
  error(this: Context, message: string, code: number = 400, errorType?: string, details?: any): void {
    this.status = code;
    (this as any).body = {
      code,
      message,
      error: errorType ? { type: errorType, details } : undefined,
      timestamp: Date.now(),
    } as ApiResponse;
  },

  /**
   * 标准化错误响应
   *
   * @param errorCode 错误码
   * @param httpCode HTTP 状态码
   * @param details 错误详情
   */
  standardError(this: Context, errorCode: ErrorCode, httpCode: number = 400, details?: any): void {
    const message = ERROR_MESSAGES[errorCode] || '未知错误';
    (this as any).error(message, httpCode, errorCode.toString(), details);
  },

  /**
   * 未认证响应
   *
   * @param details 错误详情
   */
  unauthorized(this: Context, details?: any): void {
    (this as any).standardError(ERROR_CODES.UNAUTHORIZED, 401, details);
  },

  /**
   * 禁止访问响应
   *
   * @param details 错误详情
   */
  forbidden(this: Context, details?: any): void {
    (this as any).standardError(ERROR_CODES.FORBIDDEN, 403, details);
  },

  /**
   * 资源未找到响应
   *
   * @param message 自定义错误消息
   * @param details 错误详情
   */
  notFound(this: Context, message?: string, details?: any): void {
    if (message) {
      (this as any).error(message, 404, 'NOT_FOUND', details);
    } else {
      (this as any).error('资源不存在', 404, 'NOT_FOUND', details);
    }
  },

  /**
   * 未实现功能响应
   *
   * @param message 错误消息，默认为 '功能未实现'
   * @param details 详细说明
   */
  notImplemented(this: Context, message: string = '功能未实现', details?: any): void {
    (this as any).error(message, 501, 'NOT_IMPLEMENTED', details);
  },

  /**
   * 服务器内部错误响应
   *
   * @param message 自定义错误消息
   * @param details 错误详情
   */
  internalError(this: Context, message?: string, details?: any): void {
    if (message) {
      (this as any).error(message, 500, 'SYSTEM_ERROR', details);
    } else {
      (this as any).standardError(ERROR_CODES.SYSTEM_ERROR, 500, details);
    }
  },

  /**
   * 参数验证错误响应
   *
   * @param details 验证错误详情
   */
  validationError(this: Context, details?: any): void {
    (this as any).standardError(ERROR_CODES.VALIDATION_ERROR, 422, details);
  },

  /**
   * TOTP验证错误响应
   *
   * @param details 错误详情
   */
  totpError(this: Context, details?: any): void {
    (this as any).standardError(ERROR_CODES.TOTP_INVALID, 400, details);
  },

  /**
   * 面板相关错误响应
   *
   * @param errorCode 面板错误码
   * @param details 错误详情
   */
  panelError(this: Context, errorCode: ErrorCode, details?: any): void {
    (this as any).standardError(errorCode, 400, details);
  },
};