/**
 * 管理面板API设置组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { updateAdminApi } from '@store/slices/settings.slice'
import { 
  Server, 
  Key, 
  Shield, 
  Globe, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Book,
  Lock
} from 'lucide-react'

/**
 * API接口列表
 */
const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/v1/system/info',
    description: '获取系统信息',
    auth: 'required',
    category: 'system'
  },
  {
    method: 'POST',
    path: '/api/v1/settings/background',
    description: '更新桌面背景',
    auth: 'required',
    category: 'settings'
  },
  {
    method: 'GET',
    path: '/api/v1/settings/theme',
    description: '获取主题配置',
    auth: 'required',
    category: 'settings'
  },
  {
    method: 'POST',
    path: '/api/v1/auth/verify',
    description: '验证双重认证',
    auth: 'required',
    category: 'auth'
  },
  {
    method: 'GET',
    path: '/api/v1/baota/status',
    description: '获取宝塔账号状态',
    auth: 'required',
    category: 'baota'
  }
]



/**
 * 管理面板API设置组件
 */
export function AdminApiSettings() {
  const dispatch = useAppDispatch()
  const { adminApi } = useAppSelector((state) => state.settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copied, setCopied] = useState(false)

  /**
   * 切换API启用状态
   */
  const handleToggleApi = () => {
    dispatch(updateAdminApi({ enabled: !adminApi.enabled }))
  }

  /**
   * 更新API端口
   */
  const handlePortChange = (port: number) => {
    if (port >= 1024 && port <= 65535) {
      dispatch(updateAdminApi({ port }))
    }
  }

  /**
   * 添加允许的IP地址
   */
  const handleAddIp = () => {
    if (newIp && !adminApi.allowedIps.includes(newIp)) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (ipRegex.test(newIp) || newIp === 'localhost') {
        dispatch(updateAdminApi({ 
          allowedIps: [...adminApi.allowedIps, newIp] 
        }))
        setNewIp('')
      }
    }
  }

  /**
   * 移除IP地址
   */
  const handleRemoveIp = (ip: string) => {
    dispatch(updateAdminApi({ 
      allowedIps: adminApi.allowedIps.filter(allowedIp => allowedIp !== ip) 
    }))
  }

  /**
   * 生成新的API密钥
   */
  const handleGenerateApiKey = () => {
    const newApiKey = 'llk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    dispatch(updateAdminApi({ apiKey: newApiKey }))
  }

  /**
   * 复制API密钥
   */
  const handleCopyApiKey = async () => {
    if (adminApi.apiKey) {
      try {
        await navigator.clipboard.writeText(adminApi.apiKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }

  /**
   * 过滤API接口
   */
  const filteredEndpoints = selectedCategory === 'all' 
    ? apiEndpoints 
    : apiEndpoints.filter(endpoint => endpoint.category === selectedCategory)

  /**
   * 获取方法颜色
   */
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">管理面板API</h2>
        <p className="text-gray-600">配置API接口和权限管理</p>
      </div>

      {/* API状态和基本配置 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Server className={`w-6 h-6 ${
              adminApi.enabled ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">API服务状态</h3>
              <p className="text-sm text-gray-600">
                {adminApi.enabled 
                  ? `API服务已启用，运行在端口 ${adminApi.port}` 
                  : 'API服务已禁用'
                }
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adminApi.enabled}
              onChange={handleToggleApi}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {adminApi.enabled && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API端口
              </label>
              <input
                type="number"
                value={adminApi.port}
                onChange={(e) => handlePortChange(parseInt(e.target.value))}
                min={1024}
                max={65535}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">端口范围: 1024-65535</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API基础URL
              </label>
              <input
                type="text"
                value={`http://localhost:${adminApi.port}/api/v1`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">API访问地址</p>
            </div>
          </div>
        )}
      </div>

      {/* API密钥管理 */}
      {adminApi.enabled && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API密钥管理</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前API密钥
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={adminApi.apiKey || '未生成'}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  disabled={!adminApi.apiKey}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleGenerateApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {adminApi.apiKey ? '重新生成密钥' : '生成API密钥'}
            </button>
          </div>
        </div>
      )}

      {/* IP访问控制 */}
      {adminApi.enabled && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">IP访问控制</h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="输入IP地址 (例如: 192.168.1.100)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddIp}
                disabled={!newIp}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">允许访问的IP地址</h4>
              {adminApi.allowedIps.length > 0 ? (
                <div className="space-y-2">
                  {adminApi.allowedIps.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-sm">{ip}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveIp(ip)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无允许的IP地址</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API接口文档 */}
      {adminApi.enabled && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">API接口文档</h3>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部接口</option>
                <option value="system">系统接口</option>
                <option value="settings">设置接口</option>
                <option value="auth">认证接口</option>
                <option value="baota">宝塔接口</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredEndpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    {endpoint.auth === 'required' && (
                      <div className="flex items-center gap-1" title="需要认证">
                        <Lock className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-600">需要认证</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{endpoint.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Book className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">API使用说明</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>所有API请求需要在Header中包含 <code className="bg-blue-100 px-1 rounded">Authorization: Bearer {'{API_KEY}'}</code></li>
                  <li>请求和响应格式均为JSON</li>
                  <li>API限制每分钟最多100次请求</li>
                  <li>错误响应包含错误码和详细信息</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 安全提示 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900 mb-2">安全提示</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>请妥善保管API密钥，不要在客户端代码中暴露</li>
              <li>建议定期更换API密钥以提高安全性</li>
              <li>仅允许可信的IP地址访问API接口</li>
              <li>监控API访问日志，及时发现异常访问</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}