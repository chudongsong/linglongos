import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse, PanelInstance } from '@linglongos/shared-types'

/**
 * API网关服务
 * 负责统一管理所有API请求，提供统一的错误处理和响应格式
 */
export class ApiGateway {
  private axiosInstance: AxiosInstance
  private currentPanel: PanelInstance | null = null

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      config => {
        // 添加认证信息
        if (this.currentPanel?.apiKey) {
          config.headers.Authorization = `Bearer ${this.currentPanel.apiKey}`
        }

        console.log(`[API] 请求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      error => {
        console.error('[API] 请求错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log(`[API] 响应: ${response.status} ${response.config.url}`)
        return response
      },
      error => {
        console.error('[API] 响应错误:', error)

        // 统一错误处理
        if (error.response) {
          // 服务器返回错误状态码
          const { status, data } = error.response
          switch (status) {
            case 401:
              console.error('认证失败，请检查API密钥')
              break
            case 403:
              console.error('权限不足')
              break
            case 404:
              console.error('请求的资源不存在')
              break
            case 500:
              console.error('服务器内部错误')
              break
            default:
              console.error(`请求失败: ${status} ${data?.message || '未知错误'}`)
          }
        } else if (error.request) {
          // 网络错误
          console.error('网络连接失败，请检查网络设置')
        } else {
          // 其他错误
          console.error('请求配置错误:', error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置当前面板实例
   */
  setCurrentPanel(panel: PanelInstance): void {
    this.currentPanel = panel
    this.axiosInstance.defaults.baseURL = `https://${panel.host}:${panel.port}/api`
  }

  /**
   * 通用GET请求
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config)
      return {
        success: true,
        data: response.data,
        code: response.status,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 通用POST请求
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config)
      return {
        success: true,
        data: response.data,
        code: response.status,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 通用PUT请求
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config)
      return {
        success: true,
        data: response.data,
        code: response.status,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 通用DELETE请求
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config)
      return {
        success: true,
        data: response.data,
        code: response.status,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown): ApiResponse {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '请求失败',
        code: error.response?.status || 0,
      }
    }

    return {
      success: false,
      message: '未知错误',
      code: 0,
    }
  }

  /**
   * 测试连接
   */
  async testConnection(panel: PanelInstance): Promise<boolean> {
    const originalPanel = this.currentPanel
    this.setCurrentPanel(panel)

    try {
      const response = await this.get('/status')
      return response.success
    } catch {
      return false
    } finally {
      if (originalPanel) {
        this.setCurrentPanel(originalPanel)
      }
    }
  }
}

// 导出单例实例
export const apiGateway = new ApiGateway()
