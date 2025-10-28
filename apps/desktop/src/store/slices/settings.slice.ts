/**
 * settings.slice
 *
 * 管理系统设置相关的全局状态：背景、主题、版本信息、双重认证（Google Authenticator）、宝塔账号与管理 API 等。
 * 包含同步 reducers 与一组异步 `createAsyncThunk` 操作，用于加载/保存/校验/连接等流程。
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type {
  SettingsState,
  BackgroundConfig,
  ThemeConfig,
  GoogleAuthConfig,
  BaotaAccountConfig,
  AdminApiConfig
} from '@/types/settings'
import {
  loadSettings,
  saveSettings,
  checkVersion,
  setupGoogleAuth,
  verifyGoogleAuth,
  connectBaotaAccount,
  disconnectBaotaAccount,
  syncBaotaConfig
} from '../../services/settings.service'

/**
 * 初始化状态
 */
const initialState: SettingsState = {
  loading: {
    settings: false,
    version: false,
    googleAuth: false,
    baotaAccount: false
  },
  error: null,
  activeSection: 'appearance',
  
  background: {
    type: 'image',
    value: '/images/desktop-bg.jpg',
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat',
    opacity: 1
  },
  
  theme: {
    mode: 'light',
    primaryColor: '#0066cc',
    secondaryColor: '#4d94ff',
    accentColor: '#ff6b35',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#e0e0e0',
    shadowColor: 'rgba(0, 0, 0, 0.1)'
  },
  
  version: null,
  
  googleAuth: {
    enabled: false,
    verified: false,
    backupCodes: []
  },
  
  baotaAccount: {
    connected: false,
    syncEnabled: false
  },
  
  adminApi: {
    enabled: false,
    port: 8080,
    ssl: false,
    allowedIps: ['127.0.0.1'],
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  
  previewMode: false
}

/** 异步：加载设置配置 */
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const settings = await loadSettings()
    return settings
  }
)

/** 异步：保存设置配置 */
export const saveSettingsConfig = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>) => {
    await saveSettings(settings)
    return settings
  }
)

/** 异步：检查版本信息/更新 */
export const fetchVersionInfo = createAsyncThunk(
  'settings/fetchVersionInfo',
  async () => {
    const versionInfo = await checkVersion()
    return versionInfo
  }
)

/** 异步：初始化 Google Authenticator */
export const setupGoogleAuthenticator = createAsyncThunk(
  'settings/setupGoogleAuth',
  async () => {
    const authConfig = await setupGoogleAuth()
    return authConfig
  }
)

/** 异步：验证 Google Authenticator */
export const verifyGoogleAuthenticator = createAsyncThunk(
  'settings/verifyGoogleAuth',
  async (code: string) => {
    const result = await verifyGoogleAuth(code)
    return result
  }
)

/** 异步：连接宝塔账号 */
export const connectBaota = createAsyncThunk(
  'settings/connectBaota',
  async (credentials: { username: string; password: string }) => {
    const accountInfo = await connectBaotaAccount(credentials)
    return accountInfo
  }
)

/** 异步：断开宝塔账号 */
export const disconnectBaota = createAsyncThunk(
  'settings/disconnectBaota',
  async () => {
    await disconnectBaotaAccount()
    return true
  }
)

/** 异步：同步宝塔配置 */
export const syncBaotaConfiguration = createAsyncThunk(
  'settings/syncBaotaConfig',
  async () => {
    const syncResult = await syncBaotaConfig()
    return syncResult
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /** 设置当前活动的设置页面 */
    setActiveSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload
    },
    
    /** 更新背景配置（支持预览模式临时应用） */
    updateBackground(state, action: PayloadAction<Partial<BackgroundConfig>>) {
      state.background = { ...state.background, ...action.payload }
    },
    
    /** 更新主题配置（支持预览模式临时应用） */
    updateTheme(state, action: PayloadAction<Partial<ThemeConfig>>) {
      state.theme = { ...state.theme, ...action.payload }
    },
    
    /** 更新 Google Authenticator 配置 */
    updateGoogleAuth(state, action: PayloadAction<Partial<GoogleAuthConfig>>) {
      state.googleAuth = { ...state.googleAuth, ...action.payload }
    },
    
    /** 更新宝塔账号配置 */
    updateBaotaAccount(state, action: PayloadAction<Partial<BaotaAccountConfig>>) {
      state.baotaAccount = { ...state.baotaAccount, ...action.payload }
    },
    
    /** 更新管理 API 配置 */
    updateAdminApi(state, action: PayloadAction<Partial<AdminApiConfig>>) {
      state.adminApi = { ...state.adminApi, ...action.payload }
    },
    
    /** 开启预览模式：临时应用背景/主题以便用户预览效果 */
    enablePreview(state, action: PayloadAction<{ background?: BackgroundConfig; theme?: ThemeConfig }>) {
      state.previewMode = true
      if (action.payload.background) {
        state.previewBackground = action.payload.background
      }
      if (action.payload.theme) {
        state.previewTheme = action.payload.theme
      }
    },
    
    /** 关闭预览模式：清理临时配置 */
    disablePreview(state) {
      state.previewMode = false
      delete state.previewBackground
      delete state.previewTheme
    },
    
    /** 应用预览配置：将临时配置写入正式状态并关闭预览 */
    applyPreview(state) {
      if (state.previewBackground) {
        state.background = state.previewBackground
        delete state.previewBackground
      }
      if (state.previewTheme) {
        state.theme = state.previewTheme
        delete state.previewTheme
      }
      state.previewMode = false
    },
    
    /** 清除错误状态 */
    clearError(state) {
      state.error = null
    }
  },
  
  extraReducers: (builder) => {
    builder
      // 加载设置
      .addCase(fetchSettings.pending, (state) => {
        state.loading.settings = true
        state.error = null
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading.settings = false
        // 合并加载的设置到当前状态
        Object.assign(state, action.payload)
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading.settings = false
        state.error = action.error?.message || '加载设置失败'
      })
      
      // 保存设置
      .addCase(saveSettingsConfig.pending, (state) => {
        state.loading.settings = true
        state.error = null
      })
      .addCase(saveSettingsConfig.fulfilled, (state) => {
        state.loading.settings = false
      })
      .addCase(saveSettingsConfig.rejected, (state, action) => {
        state.loading.settings = false
        state.error = action.error?.message || '保存设置失败'
      })
      
      // 版本信息
      .addCase(fetchVersionInfo.pending, (state) => {
        state.loading.version = true
      })
      .addCase(fetchVersionInfo.fulfilled, (state, action) => {
        state.loading.version = false
        state.version = action.payload
      })
      .addCase(fetchVersionInfo.rejected, (state, action) => {
        state.loading.version = false
        state.error = action.error?.message || '获取版本信息失败'
      })
      
      // Google Authenticator设置
      .addCase(setupGoogleAuthenticator.pending, (state) => {
        state.loading.googleAuth = true
      })
      .addCase(setupGoogleAuthenticator.fulfilled, (state, action) => {
        state.loading.googleAuth = false
        state.googleAuth = { ...state.googleAuth, ...action.payload }
      })
      .addCase(setupGoogleAuthenticator.rejected, (state, action) => {
        state.loading.googleAuth = false
        state.error = action.error?.message || '设置Google Authenticator失败'
      })
      
      // Google Authenticator验证
      .addCase(verifyGoogleAuthenticator.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.googleAuth.enabled = true
          state.googleAuth.lastVerified = new Date().toISOString()
        }
      })
      .addCase(verifyGoogleAuthenticator.rejected, (state, action) => {
        state.error = action.error?.message || '验证失败'
      })
      
      // 宝塔账号连接
      .addCase(connectBaota.pending, (state) => {
        state.loading.baotaAccount = true
      })
      .addCase(connectBaota.fulfilled, (state, action) => {
        state.loading.baotaAccount = false
        state.baotaAccount = { ...state.baotaAccount, ...action.payload, connected: true }
      })
      .addCase(connectBaota.rejected, (state, action) => {
        state.loading.baotaAccount = false
        state.error = action.error?.message || '连接宝塔账号失败'
      })
      
      // 宝塔账号断开
      .addCase(disconnectBaota.pending, (state) => {
        state.loading.baotaAccount = true
      })
      .addCase(disconnectBaota.fulfilled, (state) => {
        state.loading.baotaAccount = false
        state.baotaAccount = {
          connected: false,
          syncEnabled: false
        }
      })
      .addCase(disconnectBaota.rejected, (state, action) => {
        state.loading.baotaAccount = false
        state.error = action.error?.message || '断开宝塔账号失败'
      })
      
      // 宝塔配置同步
      .addCase(syncBaotaConfiguration.fulfilled, (state, _action) => {
        state.baotaAccount.lastSync = new Date().toISOString()
      })
      .addCase(syncBaotaConfiguration.rejected, (state, action) => {
        state.error = action.error?.message || '同步宝塔配置失败'
      })
  }
})

export const {
  setActiveSection,
  updateBackground,
  updateTheme,
  updateGoogleAuth,
  updateBaotaAccount,
  updateAdminApi,
  enablePreview,
  disablePreview,
  applyPreview,
  clearError
} = settingsSlice.actions

export { 
  fetchVersionInfo as checkVersion,
  fetchSettings as loadSettings, 
  saveSettingsConfig as saveSettings, 
  setupGoogleAuthenticator as setupGoogleAuth, 
  verifyGoogleAuthenticator as verifyGoogleAuth, 
  connectBaota as connectBaotaAccount, 
  disconnectBaota as disconnectBaotaAccount, 
  syncBaotaConfiguration as syncBaotaConfig 
}

export default settingsSlice.reducer