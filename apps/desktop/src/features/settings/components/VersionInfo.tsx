/**
 * 版本信息显示组件
 */
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { checkVersion } from '@store/slices/settings.slice'
import { Info, Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * 版本信息组件
 */
export function VersionInfo() {
  const dispatch = useAppDispatch()
  const { version, loading } = useAppSelector((state) => state.settings)

  /**
   * 组件挂载时检查版本信息
   */
  useEffect(() => {
    dispatch(checkVersion())
  }, [dispatch])

  /**
   * 手动检查更新
   */
  const handleCheckUpdate = () => {
    dispatch(checkVersion())
  }

  /**
   * 获取更新状态图标
   */
  const getUpdateStatusIcon = () => {
    if (loading.version) {
      return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    }
    
    if (!version) {
      return <Info className="w-5 h-5 text-gray-600" />
    }
    
    switch (version.updateStatus) {
      case 'available':
        return <Download className="w-5 h-5 text-orange-600" />
      case 'latest':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  /**
   * 获取更新状态文本
   */
  const getUpdateStatusText = () => {
    if (!version) {
      return '未知状态'
    }
    
    switch (version.updateStatus) {
      case 'available':
        return '有可用更新'
      case 'latest':
        return '已是最新版本'
      case 'error':
        return '检查更新失败'
      default:
        return '未知状态'
    }
  }

  /**
   * 获取更新状态颜色类
   */
  const getUpdateStatusColor = () => {
    if (!version) {
      return 'text-gray-600 bg-gray-50 border-gray-200'
    }
    
    switch (version.updateStatus) {
      case 'available':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'latest':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // 如果版本信息未加载，显示加载状态
  if (!version) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">版本信息</h2>
          <p className="text-gray-600">查看当前系统版本和更新状态</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-2" />
            <span className="text-gray-600">正在加载版本信息...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">版本信息</h2>
        <p className="text-gray-600">查看当前系统版本和更新状态</p>
      </div>

      {/* 当前版本信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">LingLong OS Desktop</h3>
            <p className="text-gray-600">现代化的Web桌面操作系统</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{version.version}</p>
            <p className="text-sm text-gray-500">当前版本</p>
          </div>
        </div>

        {/* 版本详细信息 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">系统信息</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">构建版本:</dt>
                <dd className="text-sm font-medium text-gray-900">{version.buildNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">发布日期:</dt>
                <dd className="text-sm font-medium text-gray-900">{version.releaseDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">架构:</dt>
                <dd className="text-sm font-medium text-gray-900">Web/x64</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">技术栈</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">React:</dt>
                <dd className="text-sm font-medium text-gray-900">18.2.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">TypeScript:</dt>
                <dd className="text-sm font-medium text-gray-900">5.2.2</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Vite:</dt>
                <dd className="text-sm font-medium text-gray-900">5.0.0</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* 更新状态 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">更新状态</h3>
          <button
            onClick={handleCheckUpdate}
            disabled={loading.version}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading.version ? 'animate-spin' : ''}`} />
            检查更新
          </button>
        </div>

        <div className={`flex items-center gap-3 p-4 border rounded-lg ${getUpdateStatusColor()}`}>
          {getUpdateStatusIcon()}
          <div className="flex-1">
            <p className="font-medium">{getUpdateStatusText()}</p>
            {version.updateStatus === 'available' && version.latestVersion && (
              <p className="text-sm mt-1">
                最新版本: {version.latestVersion}
              </p>
            )}
            {version.updateStatus === 'error' && (
              <p className="text-sm mt-1">
                请检查网络连接后重试
              </p>
            )}
          </div>
          {version.updateStatus === 'available' && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700">
              立即更新
            </button>
          )}
        </div>
      </div>

      {/* 更新日志 */}
      {version.changelog && version.changelog.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">更新日志</h3>
          <div className="space-y-4">
            {version.changelog.map((log, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{log.version}</span>
                  <span className="text-sm text-gray-500">{log.date}</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {log.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 系统许可证信息 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">许可证信息</h4>
        <p className="text-sm text-gray-600 mb-2">
          LingLong OS Desktop 基于 MIT 许可证开源发布
        </p>
        <div className="flex gap-4 text-sm">
          <a href="#" className="text-blue-600 hover:text-blue-800">查看许可证</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">开源代码</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">问题反馈</a>
        </div>
      </div>
    </div>
  )
}