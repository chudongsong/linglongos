/**
 * Settings 应用：系统设置界面
 * - 采用Ubuntu风格的设置界面布局
 * - 左侧导航栏，右侧内容区域
 * - 支持桌面背景、主题、版本信息、双重验证等功能
 */
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import {
  fetchSettings,
  fetchVersionInfo,
  setActiveSection,
  clearError
} from '@store/slices/settings.slice'
import { Settings as SettingsIcon, Monitor, Palette, Info, Shield, Cloud, Server } from 'lucide-react'
import { BackgroundSettings } from './components/BackgroundSettings'
import { ThemeSettings } from './components/ThemeSettings'
import { VersionInfo } from './components/VersionInfo'
import { GoogleAuthSettings } from './components/GoogleAuthSettings'
import { BaotaAccountSettings } from './components/BaotaAccountSettings'
import { AdminApiSettings } from './components/AdminApiSettings'
import type { SettingCategory } from '@/types/settings'

/**
 * 设置分类配置
 */
const settingCategories: SettingCategory[] = [
  {
    id: 'appearance',
    title: '外观',
    icon: 'Monitor',
    items: [
      {
        id: 'background',
        title: '桌面背景',
        description: '自定义桌面壁纸和背景效果',
        icon: 'Monitor',
        category: 'appearance',
        component: 'BackgroundSettings'
      },
      {
        id: 'theme',
        title: '主题颜色',
        description: '配置系统主色调和界面主题',
        icon: 'Palette',
        category: 'appearance',
        component: 'ThemeSettings'
      }
    ]
  },
  {
    id: 'security',
    title: '安全',
    icon: 'Shield',
    items: [
      {
        id: 'google-auth',
        title: 'Google Authenticator',
        description: '双重验证保护您的账户安全',
        icon: 'Shield',
        category: 'security',
        component: 'GoogleAuthSettings'
      }
    ]
  },
  {
    id: 'integration',
    title: '集成',
    icon: 'Cloud',
    items: [
      {
        id: 'baota-account',
        title: '宝塔云端账号',
        description: '连接宝塔云端账号，同步配置',
        icon: 'Cloud',
        category: 'integration',
        component: 'BaotaAccountSettings'
      },
      {
        id: 'admin-api',
        title: '管理面板API',
        description: '配置API接口和权限管理',
        icon: 'Server',
        category: 'integration',
        component: 'AdminApiSettings'
      }
    ]
  },
  {
    id: 'system',
    title: '系统',
    icon: 'Info',
    items: [
      {
        id: 'version',
        title: '版本信息',
        description: '查看系统版本和更新状态',
        icon: 'Info',
        category: 'system',
        component: 'VersionInfo'
      }
    ]
  }
]

/**
 * 图标组件映射
 */
const IconMap = {
  Monitor,
  Palette,
  Info,
  Shield,
  Cloud,
  Server,
  Settings: SettingsIcon
}

/**
 * 设置应用主控制器
 */
export default function Settings() {
  const dispatch = useAppDispatch()
  const { activeSection, loading, error } = useAppSelector((state) => state.settings)
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * 初始化设置数据
   */
  useEffect(() => {
    void dispatch(fetchSettings())
    void dispatch(fetchVersionInfo())
  }, [dispatch])

  /**
   * 清除错误状态
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error, dispatch])

  /**
   * 处理导航项点击
   */
  const handleSectionChange = (sectionId: string) => {
    dispatch(setActiveSection(sectionId))
  }

  /**
   * 获取当前活动的设置项
   */
  const getActiveSettingItem = () => {
    for (const category of settingCategories) {
      const item = category.items.find(item => item.id === activeSection)
      if (item) return item
    }
    return settingCategories[0]?.items[0] || null
  }

  /**
   * 渲染设置内容
   */
  const renderSettingContent = () => {
    const activeItem = getActiveSettingItem()
    
    if (!activeItem) {
      return <div className="p-6"><h2 className="text-2xl font-semibold text-gray-900 mb-2">未找到设置项</h2></div>
    }
    
    switch (activeItem.component) {
      case 'BackgroundSettings':
        return <BackgroundSettings />
      case 'ThemeSettings':
        return <ThemeSettings />
      case 'VersionInfo':
        return <VersionInfo />
      case 'GoogleAuthSettings':
        return <GoogleAuthSettings />
      case 'BaotaAccountSettings':
        return <BaotaAccountSettings />
      case 'AdminApiSettings':
        return <AdminApiSettings />
      default:
        return <BackgroundSettings />
    }
  }

  /**
   * 过滤设置项
   */
  const filteredCategories = settingCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0)

  return (
    <SettingsView
      categories={filteredCategories}
      activeSection={activeSection}
      searchQuery={searchQuery}
      loading={loading}
      error={error}
      onSectionChange={handleSectionChange}
      onSearchChange={setSearchQuery}
      renderContent={renderSettingContent}
    />
  )
}

/**
 * 设置界面视图组件
 */
interface SettingsViewProps {
  categories: SettingCategory[]
  activeSection: string
  searchQuery: string
  loading: {
    settings: boolean
    version: boolean
    googleAuth: boolean
    baotaAccount: boolean
  }
  error: string | null
  onSectionChange: (sectionId: string) => void
  onSearchChange: (query: string) => void
  renderContent: () => React.ReactNode
}

function SettingsView({
  categories,
  activeSection,
  searchQuery,
  loading,
  error,
  onSectionChange,
  onSearchChange,
  renderContent
}: SettingsViewProps) {
  return (
    <div className="flex h-full bg-white">
      {/* 左侧导航栏 */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* 标题栏 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">设置</h1>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索设置..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* 导航列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {categories.map((category) => (
            <div key={category.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-2">
                {IconMap[category.icon as keyof typeof IconMap] && (
                  React.createElement(IconMap[category.icon as keyof typeof IconMap], {
                    className: "w-4 h-4 text-gray-500"
                  })
                )}
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  {category.title}
                </h3>
              </div>
              
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = IconMap[item.icon as keyof typeof IconMap]
                  const isActive = activeSection === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        )}
        
        {/* 设置内容 */}
        {!loading && (
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  )
}