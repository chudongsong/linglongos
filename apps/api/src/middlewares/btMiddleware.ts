import { md5Hex, nowUnix } from '../utils/crypto.js';

/**
 * 为宝塔面板 API 请求附加认证参数
 * 
 * 宝塔面板要求在每个 API 请求中包含 request_time 和 request_token 参数：
 * - request_time: 当前 Unix 时间戳
 * - request_token: MD5(API密钥 + 时间戳)
 * 
 * @param params - 原始请求参数对象
 * @param key - 宝塔面板的 API 密钥（32位字符串）
 * @returns 包含认证参数的新参数对象
 * 
 * @example
 * ```typescript
 * const originalParams = { action: 'get_sys_info' };
 * const apiKey = 'your-32-character-api-key';
 * const authenticatedParams = attachBtAuth(originalParams, apiKey);
 * // 返回: { 
 * //   action: 'get_sys_info',
 * //   request_time: 1640995200,
 * //   request_token: 'abc123...'
 * // }
 * ```
 */
export function attachBtAuth(params: Record<string, unknown>, key: string): Record<string, unknown> {
  const request_time = nowUnix();
  const request_token = md5Hex(key + String(request_time));
  return { ...params, request_time, request_token };
}