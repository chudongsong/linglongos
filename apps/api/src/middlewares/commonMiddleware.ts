/**
 * 格式化成功响应数据
 * 
 * @template T - 响应数据的类型
 * @param data - 要返回的数据
 * @param message - 成功消息，默认为 'success'
 * @returns 标准化的成功响应对象
 * 
 * @example
 * ```typescript
 * const response = formatSuccess({ id: 1, name: 'John' }, '用户创建成功');
 * // 返回: { code: 200, message: '用户创建成功', data: { id: 1, name: 'John' } }
 * ```
 */
export function formatSuccess<T>(data: T, message = 'success') {
  return { code: 200, message, data };
}

/**
 * 格式化错误响应数据
 * 
 * @param code - HTTP 状态码
 * @param message - 错误消息
 * @param data - 可选的错误详细信息
 * @returns 标准化的错误响应对象
 * 
 * @example
 * ```typescript
 * const errorResponse = formatError(400, '参数验证失败', { field: 'email' });
 * // 返回: { code: 400, message: '参数验证失败', data: { field: 'email' } }
 * ```
 */
export function formatError(code: number, message: string, data?: unknown) {
  return { code, message, data };
}