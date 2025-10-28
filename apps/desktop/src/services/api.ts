/**
 * api.ts - 统一的 Axios 实例与轻量封装
 *
 * 设计目标：
 * - 单一实例：集中管理 baseURL、超时、拦截器与通用错误处理
 * - 类型安全：通过泛型约束响应数据类型，调用方拿到即是业务数据而非 AxiosResponse
 * - 易扩展：后续可在此实现鉴权、重试、全局错误提示策略
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

/**
 * 创建 Axios 实例
 */
const api: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:7001/api/v1', // API服务器地址
  timeout: 10000,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器
 * - 可在此注入鉴权 Token、TraceId、国际化等头信息
 */
api.interceptors.request.use(
  (config) => {
    // 例如：config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * 响应拦截器
 * - 仅在网络/协议层面处理通用错误；业务错误交由调用方按需处理
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // 可在此根据 error.response?.status 做统一重定向或提示
    return Promise.reject(error)
  },
)

/**
 * http.get - GET JSON 数据，返回已解包的数据体
 *
 * @param url 请求路径（相对当前 baseURL）
 * @param config Axios 其它配置
 * @returns 解析后的 JSON 数据（类型为 <T>）
 */
export async function getJson<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config)
  return res.data as T
}

/**
 * http.post - POST JSON 数据，返回已解包的数据体
 */
export async function postJson<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(url, data, config)
  return res.data as T
}

/**
 * http.put - PUT JSON 数据，返回已解包的数据体
 */
export async function putJson<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put<T>(url, data, config)
  return res.data as T
}

/**
 * http.del - DELETE JSON 数据，返回已解包的数据体
 */
export async function delJson<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, config)
  return res.data as T
}

export default api