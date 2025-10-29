/**
 * API 响应模型定义
 * 用于 Swagger 文档生成
 */

/**
 * @apiDefine ErrorResponse
 * @apiSuccess {Number} code 错误码
 * @apiSuccess {String} message 错误信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Object} error 错误详情
 * @apiSuccess {String} error.type 错误类型
 * @apiSuccess {Object} error.details 错误详细信息
 */
export interface ErrorResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  error: {
    type: string;
    details: any;
  };
}

/**
 * @apiDefine BindInfoResponse
 * @apiSuccess {Number} code 状态码 (0表示成功)
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Object} data 绑定信息数据
 * @apiSuccess {String} data.qrCodeUrl 二维码URL
 * @apiSuccess {String} data.secret base32密钥
 */
export interface BindInfoResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  data: {
    qrCodeUrl: string;
    secret: string;
  };
}

/**
 * @apiDefine CreateSessionRequest
 * @apiParam {String} token TOTP令牌
 */
export interface CreateSessionRequest {
  token: string;
}

/**
 * @apiDefine SessionResponse
 * @apiSuccess {Number} code 状态码 (0表示成功)
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Object} data 会话数据
 * @apiSuccess {String} data.sessionId 会话ID
 * @apiSuccess {Boolean} data.authenticated 认证状态
 */
export interface SessionResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  data: {
    sessionId: string;
    authenticated: boolean;
  };
}



/**
 * @apiDefine PanelConfigListResponse
 * @apiSuccess {Number} code 状态码 (0表示成功)
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Array} data 面板配置列表
 * @apiSuccess {String} data.id 面板ID
 * @apiSuccess {String} data.url 面板URL
 * @apiSuccess {String} data.key 面板密钥
 */
export interface PanelConfigListResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  data: Array<{
    id: string;
    url: string;
    key: string;
  }>;
}

/**
 * @apiDefine CreatePanelConfigRequest
 * @apiParam {String} url 面板URL
 * @apiParam {String} key 面板密钥
 */
export interface CreatePanelConfigRequest {
  url: string;
  key: string;
}

/**
 * @apiDefine PanelConfigResponse
 * @apiSuccess {Number} code 状态码 (0表示成功)
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Object} data 面板配置数据
 * @apiSuccess {String} data.id 面板ID
 * @apiSuccess {String} data.url 面板URL
 * @apiSuccess {String} data.key 面板密钥
 */
export interface PanelConfigResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  data: {
    id: string;
    url: string;
    key: string;
  };
}

/**
 * @apiDefine ProxyRequestBody
 * @apiParam {String} method HTTP方法
 * @apiParam {String} path 请求路径
 * @apiParam {Object} [headers] 请求头
 * @apiParam {Object} [body] 请求体
 */
export interface ProxyRequestBody {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * @apiDefine ProxyResponse
 * @apiSuccess {Number} code 状态码
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {String} requestId 请求ID
 * @apiSuccess {String} timestamp 时间戳
 * @apiSuccess {Object} data 代理响应数据
 */
export interface ProxyResponse {
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  data: any;
}
