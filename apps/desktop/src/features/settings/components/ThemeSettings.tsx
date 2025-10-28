/**
 * 主题配置组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { enablePreview, disablePreview, applyPreview } from '@store/slices/settings.slice'
import { Palette, Eye, Check, X, Sun, Moon, Monitor } from 'lucide-react'
import type { ThemeConfig } from '@/types/settings'

/**
 * 预设主题色彩
 */
const colorPresets = [
  {
    id: 'blue',
    name: '蓝色',
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937'
  },
  {
    id: 'purple',
    name: '紫色',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: '#faf5ff',
    surface: '#ffffff',
    text: '#1f2937'
  },
  {
    id: 'green',
    name: '绿色',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#1f2937'
  },
  {
    id: 'orange',
    name: '橙色',
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    background: '#fffbeb',
    surface: '#ffffff',
    text: '#1f2937'
  },
  {
    id: 'red',
    name: '红色',
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f87171',
    background: '#fef2f2',
    surface: '#ffffff',
    text: '#1f2937'
  },
  {
    id: 'gray',
    name: '灰色',
    primary: '#6b7280',
    secondary: '#4b5563',
    accent: '#9ca3af',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#1f2937'
  }
]

/**
 * 深色主题色彩
 */
const darkColorPresets = colorPresets.map(preset => ({
  ...preset,
  id: `${preset.id}-dark`,
  name: `${preset.name}（深色）`,
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9'
}))

/**
 * 主题模式选项
 */
const themeModes = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'auto', label: '跟随系统', icon: Monitor }
]

/**
 * 主题设置组件
 */
export function ThemeSettings() {
  const dispatch = useAppDispatch()
  const { theme, previewMode, previewTheme } = useAppSelector((state) => state.settings)
  const [customColors, setCustomColors] = useState({
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor
  })

  /**
   * 处理主题模式变更
   */
  const handleModeChange = (mode: 'light' | 'dark' | 'auto') => {
    const newTheme: ThemeConfig = {
      ...theme,
      mode
    }
    dispatch(enablePreview({ theme: newTheme }))
  }

  /**
   * 处理预设主题选择
   */
  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    const newTheme: ThemeConfig = {
      ...theme,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }
    dispatch(enablePreview({ theme: newTheme }))
    setCustomColors({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent
    })
  }

  /**
   * 处理自定义颜色变更
   */
  const handleCustomColorChange = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    const newCustomColors = { ...customColors, [colorType]: color }
    setCustomColors(newCustomColors)
    
    const newTheme: ThemeConfig = {
      ...theme,
      primaryColor: newCustomColors.primary,
      secondaryColor: newCustomColors.secondary,
      accentColor: newCustomColors.accent
    }
    dispatch(enablePreview({ theme: newTheme }))
  }

  /**
   * 应用预览
   */
  const handleApplyPreview = () => {
    dispatch(applyPreview())
  }

  /**
   * 取消预览
   */
  const handleCancelPreview = () => {
    dispatch(disablePreview())
    setCustomColors({
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor
    })
  }

  const currentTheme = previewMode && previewTheme ? previewTheme : theme
  const availablePresets = currentTheme.mode === 'dark' ? darkColorPresets : colorPresets

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">主题配置</h2>
        <p className="text-gray-600">自定义界面颜色和主题模式</p>
      </div>

      {/* 预览操作栏 */}
      {previewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">预览模式</span>
              <span className="text-blue-600 text-sm">更改将在应用后生效</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleApplyPreview}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主题模式选择 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">主题模式</h3>
        <div className="grid grid-cols-3 gap-4">
          {themeModes.map((mode) => {
            const Icon = mode.icon
            const isActive = currentTheme.mode === mode.value
            
            return (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value as any)}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{mode.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 预设主题色彩 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">预设主题</h3>
        <div className="grid grid-cols-2 gap-4">
          {availablePresets.map((preset) => {
            const isSelected = currentTheme.primaryColor === preset.primary
            
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
                
                {/* 主题预览 */}
                <div 
                  className="h-16 rounded border border-gray-200 relative overflow-hidden"
                  style={{ backgroundColor: preset.background }}
                >
                  <div 
                    className="absolute top-2 left-2 right-2 h-3 rounded"
                    style={{ backgroundColor: preset.surface }}
                  />
                  <div 
                    className="absolute bottom-2 left-2 w-8 h-3 rounded"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div 
                    className="absolute bottom-2 left-12 w-6 h-3 rounded"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 自定义颜色 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">自定义颜色</h3>
        <div className="space-y-4">
          {[
            { key: 'primary', label: '主色调', description: '按钮、链接等主要元素的颜色' },
            { key: 'secondary', label: '辅助色', description: '次要按钮和强调元素的颜色' },
            { key: 'accent', label: '强调色', description: '高亮和提示元素的颜色' }
          ].map((colorConfig) => (
            <div key={colorConfig.key} className="flex items-center gap-4">
              <input
                type="color"
                value={customColors[colorConfig.key as keyof typeof customColors]}
                onChange={(e) => handleCustomColorChange(
                  colorConfig.key as 'primary' | 'secondary' | 'accent',
                  e.target.value
                )}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{colorConfig.label}</p>
                <p className="text-sm text-gray-500">{colorConfig.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {customColors[colorConfig.key as keyof typeof customColors]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主题预览区域 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">效果预览</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
              <h4 className="font-medium" style={{ color: currentTheme.primaryColor }}>
                主题预览
              </h4>
            </div>
            
            <div className="space-y-3">
              <button 
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: currentTheme.primaryColor }}
              >
                主要按钮
              </button>
              
              <button 
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: currentTheme.secondaryColor }}
              >
                次要按钮
              </button>
              
              <div 
                className="px-3 py-2 rounded text-sm"
                style={{ 
                  backgroundColor: currentTheme.accentColor + '20',
                  color: currentTheme.accentColor,
                  border: `1px solid ${currentTheme.accentColor}40`
                }}
              >
                强调信息
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}