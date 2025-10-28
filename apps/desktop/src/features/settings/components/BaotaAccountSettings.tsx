/**
 * 宝塔云端账号集成设置组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { connectBaotaAccount, disconnectBaotaAccount, syncBaotaConfig } from '@store/slices/settings.slice'
import { Cloud, Link, Unlink, RefreshCw, CheckCircle, User, Calendar } from 'lucide-react'

/**
 * 宝塔账号设置组件
 */
export function BaotaAccountSettings() {
  const dispatch = useAppDispatch()
  const { baotaAccount, loading } = useAppSelector((state) => state.settings)
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })
  const [showLoginForm, setShowLoginForm] = useState(false)

  /**
   * 处理表单输入变更
   */
  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  /**
   * 连接宝塔账号
   */
  const handleConnect = () => {
    if (loginForm.username && loginForm.password) {
      dispatch(connectBaotaAccount({
        username: loginForm.username,
        password: loginForm.password
      }))
    }
  }

  /**
   * 断开宝塔账号
   */
  const handleDisconnect = () => {
    if (confirm('确定要断开宝塔云端账号吗？这将清除所有同步的配置数据。')) {
      dispatch(disconnectBaotaAccount())
      setShowLoginForm(false)
      setLoginForm({ username: '', password: '' })
    }
  }

  /**
   * 同步配置
   */
  const handleSync = () => {
    dispatch(syncBaotaConfig())
  }

  /**
   * 显示登录表单
   */
  const handleShowLogin = () => {
    setShowLoginForm(true)
  }

  /**
   * 取消登录
   */
  const handleCancelLogin = () => {
    setShowLoginForm(false)
    setLoginForm({ username: '', password: '' })
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">宝塔云端账号</h2>
        <p className="text-gray-600">连接宝塔云端账号，同步配置和管理服务器</p>
      </div>

      {/* 连接状态 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Cloud className={`w-6 h-6 ${
              baotaAccount.connected ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">账号状态</h3>
              <p className="text-sm text-gray-600">
                {baotaAccount.connected 
                  ? `已连接到宝塔云端账号: ${baotaAccount.username}` 
                  : '未连接宝塔云端账号'
                }
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            baotaAccount.connected
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {baotaAccount.connected ? '已连接' : '未连接'}
          </div>
        </div>

        {/* 账号信息 */}
        {baotaAccount.connected && (
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">用户名</p>
                <p className="text-sm text-gray-600">{baotaAccount.username}</p>
              </div>
            </div>
            
            {baotaAccount.lastSync && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">最后同步</p>
                  <p className="text-sm text-gray-600">
                    {new Date(baotaAccount.lastSync).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {!baotaAccount.connected ? (
            <button
              onClick={handleShowLogin}
              disabled={loading.baotaAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading.baotaAccount ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              连接账号
            </button>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={loading.baotaAccount}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading.baotaAccount ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                同步配置
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                断开连接
              </button>
            </>
          )}
        </div>
      </div>

      {/* 登录表单 */}
      {showLoginForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">连接宝塔云端账号</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名或邮箱
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="请输入宝塔云端账号用户名或邮箱"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="请输入密码"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConnect}
              disabled={!loginForm.username || !loginForm.password || loading.baotaAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading.baotaAccount ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              连接
            </button>
            <button
              onClick={handleCancelLogin}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">宝塔云端账号功能</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>同步服务器配置和站点信息</li>
              <li>远程管理多台服务器</li>
              <li>自动备份重要配置文件</li>
              <li>实时监控服务器状态</li>
              <li>统一管理SSL证书</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 同步配置详情 */}
      {baotaAccount.connected && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">同步配置</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">已同步项目</h4>
              <ul className="space-y-2">
                {[
                  { name: '服务器列表', status: 'synced', count: 3 },
                  { name: '网站配置', status: 'synced', count: 12 },
                  { name: 'SSL证书', status: 'synced', count: 8 },
                  { name: '数据库配置', status: 'synced', count: 5 }
                ].map((item, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.count} 项</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">同步设置</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">自动同步配置</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">同步服务器状态</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">同步日志文件</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">同步备份文件</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}