import { ApiResponse } from '../../../app/extend/context';

declare module 'egg' {
  interface Context {
    /**
     * 成功响应
     *
     * @param data 响应数据
     * @param message 响应消息，默认为 'success'
     * @param code HTTP 状态码，默认为 200
     */
    success<T>(data?: T, message?: string, code?: number): void;

    /**
     * 错误响应
     *
     * @param message 错误消息
     * @param code HTTP 状态码，默认为 400
     * @param error 错误详情
     */
    error(message: string, code?: number, error?: string): void;

    /**
     * 未认证响应
     *
     * @param message 错误消息，默认为 'AUTH_REQUIRED'
     */
    unauthorized(message?: string): void;

    /**
     * 禁止访问响应
     *
     * @param message 错误消息，默认为 'FORBIDDEN'
     */
    forbidden(message?: string): void;

    /**
     * 资源未找到响应
     *
     * @param message 错误消息，默认为 'NOT_FOUND'
     */
    notFound(message?: string): void;

    /**
     * 未实现功能响应
     *
     * @param message 错误消息，默认为 'Not Implemented'
     * @param detail 详细说明
     */
    notImplemented(message?: string, detail?: string): void;

    /**
     * 服务器内部错误响应
     *
     * @param message 错误消息，默认为 'INTERNAL_SERVER_ERROR'
     * @param error 错误详情
     */
    internalError(message?: string, error?: string): void;

    /**
     * 参数验证错误响应
     *
     * @param message 错误消息，默认为 'VALIDATION_ERROR'
     * @param error 验证错误详情
     */
    validationError(message?: string, error?: string): void;
  }
}