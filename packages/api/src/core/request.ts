/**
 * API请求核心模块
 * 基于axios封装的HTTP请求工具
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

/**
 * 请求配置接口
 */
export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示全局加载状态
  showLoading?: boolean
  // 是否显示错误提示
  showError?: boolean
  // 自定义错误处理
  errorHandler?: (error: any) => void
  // 请求重试次数
  retryTimes?: number
  // 请求重试间隔(ms)
  retryDelay?: number
}

/**
 * 响应数据接口
 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

/**
 * 请求类
 */
export class Request {
  // axios实例
  private instance: AxiosInstance
  // 默认配置
  private defaultConfig: RequestConfig = {
    baseURL: '',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    showLoading: true,
    showError: true,
    retryTimes: 0,
    retryDelay: 1000,
  }

  /**
   * 构造函数
   * @param config 配置项
   */
  constructor(config: RequestConfig = {}) {
    // 合并配置
    this.defaultConfig = { ...this.defaultConfig, ...config }
    // 创建axios实例
    this.instance = axios.create(this.defaultConfig)
    // 初始化拦截器
    this.setupInterceptors()
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      config => {
        // 显示加载状态
        if (config.showLoading) {
          // TODO: 显示全局加载状态
        }

        // 添加token
        const token = localStorage.getItem('token')
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`
        }

        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      response => {
        // 隐藏加载状态
        if (response.config.showLoading) {
          // TODO: 隐藏全局加载状态
        }

        // 处理响应数据
        const res = response.data as ApiResponse
        if (!res.success && res.code !== 200) {
          // 显示错误提示
          if (response.config.showError) {
            // TODO: 显示错误提示
            console.error(res.message || '请求失败')
          }

          // 处理特定错误码
          switch (res.code) {
            case 401: // 未授权
              // TODO: 跳转到登录页
              break
            case 403: // 禁止访问
              // TODO: 显示无权限提示
              break
            case 404: // 资源不存在
              // TODO: 显示资源不存在提示
              break
            case 500: // 服务器错误
              // TODO: 显示服务器错误提示
              break
          }

          // 自定义错误处理
          const errorHandler = response.config.errorHandler
          if (errorHandler) {
            errorHandler(res)
          }

          return Promise.reject(res)
        }

        return res
      },
      async (error: AxiosError) => {
        // 隐藏加载状态
        const config = error.config as RequestConfig
        if (config?.showLoading) {
          // TODO: 隐藏全局加载状态
        }

        // 请求重试
        if (config && config.retryTimes && config.retryTimes > 0) {
          config.retryTimes--
          const delay = config.retryDelay || 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.instance(config)
        }

        // 显示错误提示
        if (config?.showError) {
          // TODO: 显示错误提示
          console.error(error.message || '网络错误')
        }

        // 自定义错误处理
        if (config?.errorHandler) {
          config.errorHandler(error)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * 发送请求
   * @param config 请求配置
   * @returns Promise
   */
  public request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.request<any, ApiResponse<T>>(config)
  }

  /**
   * GET请求
   * @param url 请求地址
   * @param params 请求参数
   * @param config 请求配置
   * @returns Promise
   */
  public get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config,
    })
  }

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise
   */
  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    })
  }

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise
   */
  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    })
  }

  /**
   * DELETE请求
   * @param url 请求地址
   * @param params 请求参数
   * @param config 请求配置
   * @returns Promise
   */
  public delete<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      params,
      ...config,
    })
  }

  /**
   * 上传文件
   * @param url 请求地址
   * @param file 文件对象
   * @param name 文件参数名
   * @param data 其他参数
   * @param config 请求配置
   * @returns Promise
   */
  public upload<T = any>(
    url: string,
    file: File,
    name: string = 'file',
    data?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append(name, file)

    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key])
      })
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    })
  }

  /**
   * 下载文件
   * @param url 请求地址
   * @param params 请求参数
   * @param filename 文件名
   * @param config 请求配置
   * @returns Promise
   */
  public download(
    url: string,
    params?: any,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    return this.request({
      method: 'GET',
      url,
      params,
      responseType: 'blob',
      ...config,
    }).then(res => {
      // 创建下载链接
      const blob = new Blob([res.data])
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || this.getFilenameFromUrl(url)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    })
  }

  /**
   * 从URL中获取文件名
   * @param url URL地址
   * @returns 文件名
   */
  private getFilenameFromUrl(url: string): string {
    const parts = url.split('/')
    return parts[parts.length - 1] || 'download'
  }
}

// 创建默认请求实例
export const request = new Request()

// 导出默认实例
export default request
