/**
 * 标准化错误码定义
 *
 * 错误码分类：
 * - 1xxx: 系统错误
 * - 2xxx: 认证错误
 * - 3xxx: 权限错误
 * - 4xxx: 参数错误
 * - 5xxx: 业务错误
 */

export const ERROR_CODES = {
  // 系统错误 (1xxx)
  SYSTEM_ERROR: 1000,
  DATABASE_ERROR: 1001,
  CONFIG_ERROR: 1002,

  // 认证错误 (2xxx)
  UNAUTHORIZED: 2001,
  INVALID_TOKEN: 2002,
  TOKEN_EXPIRED: 2003,
  INVALID_CREDENTIALS: 2004,
  TOTP_REQUIRED: 2005,
  TOTP_INVALID: 2006,

  // 权限错误 (3xxx)
  FORBIDDEN: 3001,
  ROLE_REQUIRED: 3002,

  // 参数错误 (4xxx)
  VALIDATION_ERROR: 4001,
  MISSING_PARAMETER: 4002,
  INVALID_FORMAT: 4003,

  // 业务错误 (5xxx)
  PANEL_NOT_FOUND: 5001,
  PANEL_EXISTS: 5002,
  PROXY_ERROR: 5003,
  CONFIG_NOT_FOUND: 5004,
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.SYSTEM_ERROR]: '服务器内部错误',
  [ERROR_CODES.DATABASE_ERROR]: '数据库错误',
  [ERROR_CODES.CONFIG_ERROR]: '配置错误',

  [ERROR_CODES.UNAUTHORIZED]: '未授权访问',
  [ERROR_CODES.INVALID_TOKEN]: '无效的令牌',
  [ERROR_CODES.TOKEN_EXPIRED]: '令牌已过期',
  [ERROR_CODES.INVALID_CREDENTIALS]: '无效的凭据',
  [ERROR_CODES.TOTP_REQUIRED]: '需要双因素认证',
  [ERROR_CODES.TOTP_INVALID]: '双因素认证码无效',

  [ERROR_CODES.FORBIDDEN]: '权限不足',
  [ERROR_CODES.ROLE_REQUIRED]: '需要特定角色权限',

  [ERROR_CODES.VALIDATION_ERROR]: '参数验证错误',
  [ERROR_CODES.MISSING_PARAMETER]: '缺少必需参数',
  [ERROR_CODES.INVALID_FORMAT]: '参数格式错误',

  [ERROR_CODES.PANEL_NOT_FOUND]: '面板不存在',
  [ERROR_CODES.PANEL_EXISTS]: '面板已存在',
  [ERROR_CODES.PROXY_ERROR]: '代理请求错误',
  [ERROR_CODES.CONFIG_NOT_FOUND]: '配置不存在',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
