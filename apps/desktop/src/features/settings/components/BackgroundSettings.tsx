/**
 * 桌面背景配置组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { enablePreview, disablePreview, applyPreview } from '@store/slices/settings.slice'
import { Monitor, Upload, Eye, Check, X } from 'lucide-react'
import type { BackgroundConfig } from '@/types/settings'

/**
 * 预设壁纸列表
 */
const presetWallpapers = [
  {
    id: 'default-1',
    name: '默认壁纸',
    thumbnail: '/images/desktop-bg.jpg',
    fullImage: '/images/desktop-bg.jpg',
    category: 'default'
  },
  {
    id: 'nature-1',
    name: '山景',
    thumbnail: '/images/wallpapers/nature-1-thumb.jpg',
    fullImage: '/images/wallpapers/nature-1.jpg',
    category: 'nature'
  },
  {
    id: 'abstract-1',
    name: '抽象几何',
    thumbnail: '/images/wallpapers/abstract-1-thumb.jpg',
    fullImage: '/images/wallpapers/abstract-1.jpg',
    category: 'abstract'
  }
]

/**
 * 背景类型选项
 */
const backgroundTypes = [
  { value: 'image', label: '图片', icon: Monitor },
  { value: 'color', label: '纯色', icon: Monitor },
  { value: 'gradient', label: '渐变', icon: Monitor }
]

/**
 * 桌面背景设置组件
 */
export function BackgroundSettings() {
  const dispatch = useAppDispatch()
  const { background, previewMode, previewBackground } = useAppSelector((state) => state.settings)
  const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null)
  const [customColor, setCustomColor] = useState('#1a1a1a')

  /**
   * 处理背景类型变更
   */
  const handleTypeChange = (type: 'image' | 'color' | 'gradient') => {
    const newBackground: Partial<BackgroundConfig> = { type }
    
    if (type === 'color') {
      newBackground.value = customColor
    } else if (type === 'gradient') {
      newBackground.value = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
    
    dispatch(enablePreview({ background: { ...background, ...newBackground } }))
  }

  /**
   * 处理壁纸选择
   */
  const handleWallpaperSelect = (wallpaper: typeof presetWallpapers[0]) => {
    setSelectedWallpaper(wallpaper.id)
    const newBackground: BackgroundConfig = {
      ...background,
      type: 'image',
      value: wallpaper.fullImage
    }
    dispatch(enablePreview({ background: newBackground }))
  }

  /**
   * 处理颜色变更
   */
  const handleColorChange = (color: string) => {
    setCustomColor(color)
    if (background.type === 'color') {
      dispatch(enablePreview({ 
        background: { ...background, value: color } 
      }))
    }
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
    setSelectedWallpaper(null)
  }

  /**
   * 处理文件上传
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        dispatch(enablePreview({ 
          background: { ...background, type: 'image', value: imageUrl } 
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const currentBackground = previewMode && previewBackground ? previewBackground : background

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">桌面背景</h2>
        <p className="text-gray-600">自定义您的桌面壁纸和背景效果</p>
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

      {/* 背景类型选择 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">背景类型</h3>
        <div className="grid grid-cols-3 gap-4">
          {backgroundTypes.map((type) => {
            const Icon = type.icon
            const isActive = currentBackground.type === type.value
            
            return (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value as any)}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 图片背景设置 */}
      {currentBackground.type === 'image' && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">选择壁纸</h3>
          
          {/* 自定义上传 */}
          <div className="mb-6">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">点击上传自定义壁纸</p>
                <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式</p>
              </div>
            </label>
          </div>
          
          {/* 预设壁纸 */}
          <div className="grid grid-cols-3 gap-4">
            {presetWallpapers.map((wallpaper) => {
              const isSelected = selectedWallpaper === wallpaper.id || 
                                currentBackground.value === wallpaper.fullImage
              
              return (
                <button
                  key={wallpaper.id}
                  onClick={() => handleWallpaperSelect(wallpaper)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={wallpaper.thumbnail}
                    alt={wallpaper.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    {wallpaper.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 纯色背景设置 */}
      {currentBackground.type === 'color' && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">选择颜色</h3>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-16 h-16 border border-gray-300 rounded-lg cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">自定义颜色</p>
              <p className="text-sm text-gray-500">{customColor}</p>
            </div>
          </div>
        </div>
      )}

      {/* 渐变背景设置 */}
      {currentBackground.type === 'gradient' && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">渐变效果</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            ].map((gradient, index) => (
              <button
                key={index}
                onClick={() => dispatch(enablePreview({ 
                  background: { ...background, type: 'gradient', value: gradient } 
                }))}
                className={`h-20 rounded-lg border-2 transition-all ${
                  currentBackground.value === gradient
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ background: gradient }}
              >
                {currentBackground.value === gradient && (
                  <Check className="w-6 h-6 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}