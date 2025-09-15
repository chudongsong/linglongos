/**
 * 认证相关类型定义
 * @description 定义用户认证、登录等相关的 TypeScript 接口
 */

/**
 * 用户信息接口
 * @description 定义用户基本信息结构
 */
export interface IUser {
  /** 用户唯一标识 */
  readonly id: string
  /** 用户名 */
  username: string
  /** 邮箱地址 */
  email: string
  /** 用户头像 */
  avatar?: string
  /** 用户角色 */
  role: 'admin' | 'user'
  /** 创建时间 */
  readonly createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 登录请求参数
 * @description 用户登录时提交的数据结构
 */
export interface ILoginRequest {
  /** 邮箱或用户名 */
  email: string
  /** 密码 */
  password: string
  /** 是否记住登录状态 */
  rememberMe?: boolean
}

/**
 * 登录响应数据
 * @description 登录成功后服务器返回的数据结构
 */
export interface ILoginResponse {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 用户信息 */
  user: IUser
  /** 令牌过期时间 */
  expiresIn: number
}

/**
 * 认证状态
 * @description 应用的认证状态枚举
 */
export enum AuthStatus {
  /** 未认证 */
  UNAUTHENTICATED = 'unauthenticated',
  /** 认证中 */
  AUTHENTICATING = 'authenticating',
  /** 已认证 */
  AUTHENTICATED = 'authenticated',
  /** 认证失败 */
  FAILED = 'failed'
}

/**
 * API 响应基础结构
 * @description 统一的 API 响应格式
 */
export interface IApiResponse<T = any> {
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
  /** 是否成功 */
  success: boolean
  /** 时间戳 */
  timestamp: number
}