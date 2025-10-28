/**
 * 设置应用的Service层：处理API调用和数据持久化
 */
import api from './api'
import type {
  SettingsState,
  VersionInfo,
  GoogleAuthConfig,
  BaotaAccountConfig
} from '@/types/settings'

/**
 * 加载设置配置
 * @returns Promise<Partial<SettingsState>> 设置配置对象
 */
export const loadSettings = async (): Promise<Partial<SettingsState>> => {
  try {
    const response = await api.get('/api/settings')
    return response.data
  } catch (error) {
    console.error('加载设置失败:', error)
    // 返回默认配置或从本地存储加载
    const localSettings = localStorage.getItem('desktop-settings')
    return localSettings ? JSON.parse(localSettings) : {}
  }
}

/**
 * 保存设置配置
 * @param settings 要保存的设置配置
 * @returns Promise<void>
 */
export const saveSettings = async (settings: Partial<SettingsState>): Promise<void> => {
  try {
    await api.post('/api/settings', settings)
    // 同时保存到本地存储作为备份
    localStorage.setItem('desktop-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存设置失败:', error)
    // 如果API失败，至少保存到本地存储
    localStorage.setItem('desktop-settings', JSON.stringify(settings))
    throw new Error('保存设置失败，请检查网络连接')
  }
}

/**
 * 检查版本更新
 * @returns Promise<VersionInfo> 版本信息
 */
export const checkVersion = async (): Promise<VersionInfo> => {
  try {
    const response = await api.get('/api/version')
    return response.data
  } catch (error) {
    console.error('检查版本失败:', error)
    // 返回当前版本信息
    return {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      updateAvailable: false,
      updateStatus: 'error',
      buildNumber: '1000',
      releaseDate: new Date().toISOString()
    }
  }
}

/**
 * 设置Google Authenticator
 * @returns Promise<GoogleAuthConfig> Google认证配置
 */
export const setupGoogleAuth = async (): Promise<GoogleAuthConfig> => {
  try {
    const response = await api.post('/api/auth/google/setup')
    return response.data
  } catch (error) {
    console.error('设置Google Authenticator失败:', error)
    throw new Error('设置Google Authenticator失败')
  }
}

/**
 * 验证Google Authenticator代码
 * @param code 验证码
 * @returns Promise<{success: boolean; message?: string}> 验证结果
 */
export const verifyGoogleAuth = async (code: string): Promise<{success: boolean; message?: string}> => {
  try {
    const response = await api.post('/api/auth/google/verify', { code })
    return response.data
  } catch (error) {
    console.error('验证Google Authenticator失败:', error)
    return { success: false, message: '验证失败，请检查验证码' }
  }
}

/**
 * 连接宝塔账号
 * @param credentials 登录凭据
 * @returns Promise<BaotaAccountConfig> 宝塔账号配置
 */
export const connectBaotaAccount = async (credentials: {
  username: string
  password: string
}): Promise<BaotaAccountConfig> => {
  try {
    const response = await api.post('/api/baota/connect', credentials)
    return response.data
  } catch (error) {
    console.error('连接宝塔账号失败:', error)
    throw new Error('连接宝塔账号失败，请检查用户名和密码')
  }
}

/**
 * 断开宝塔账号连接
 * @returns Promise<void>
 */
export const disconnectBaotaAccount = async (): Promise<void> => {
  try {
    await api.post('/api/baota/disconnect')
  } catch (error) {
    console.error('断开宝塔账号失败:', error)
    throw new Error('断开宝塔账号失败')
  }
}

/**
 * 同步宝塔配置
 * @returns Promise<{success: boolean; message?: string}> 同步结果
 */
export const syncBaotaConfig = async (): Promise<{success: boolean; message?: string}> => {
  try {
    const response = await api.post('/api/baota/sync')
    return response.data
  } catch (error) {
    console.error('同步宝塔配置失败:', error)
    return { success: false, message: '同步失败，请稍后重试' }
  }
}

/**
 * 获取可用壁纸列表
 * @returns Promise<Array> 壁纸列表
 */
export const getWallpapers = async (): Promise<Array<{
  id: string
  name: string
  thumbnail: string
  fullImage: string
  category: string
}>> => {
  try {
    const response = await api.get('/api/wallpapers')
    return response.data
  } catch (error) {
    console.error('获取壁纸列表失败:', error)
    // 返回默认壁纸列表
    return [
      {
        id: 'default-1',
        name: '默认壁纸',
        thumbnail: '/images/desktop-bg.jpg',
        fullImage: '/images/desktop-bg.jpg',
        category: 'default'
      }
    ]
  }
}

/**
 * 上传自定义壁纸
 * @param file 壁纸文件
 * @returns Promise<{url: string}> 上传结果
 */
export const uploadWallpaper = async (file: File): Promise<{url: string}> => {
  try {
    const formData = new FormData()
    formData.append('wallpaper', file)
    
    const response = await api.post('/api/wallpapers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('上传壁纸失败:', error)
    throw new Error('上传壁纸失败，请检查文件格式和大小')
  }
}

/**
 * 获取系统信息
 * @returns Promise<object> 系统信息
 */
export const getSystemInfo = async (): Promise<{
  os: string
  arch: string
  memory: { total: number; used: number }
  cpu: { model: string; cores: number; usage: number }
  disk: { total: number; used: number }
}> => {
  try {
    const response = await api.get('/api/system/info')
    return response.data
  } catch (error) {
    console.error('获取系统信息失败:', error)
    // 返回模拟数据
    return {
      os: 'Linux',
      arch: 'x64',
      memory: { total: 8192, used: 4096 },
      cpu: { model: 'Unknown', cores: 4, usage: 0 },
      disk: { total: 500000, used: 250000 }
    }
  }
}