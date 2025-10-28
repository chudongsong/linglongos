/**
 * Google Authenticator双重验证设置组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { setupGoogleAuth, verifyGoogleAuth } from '@store/slices/settings.slice'
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react'

/**
 * Google Authenticator设置组件
 */
export function GoogleAuthSettings() {
  const dispatch = useAppDispatch()
  const { googleAuth, loading } = useAppSelector((state) => state.settings)
  const [verificationCode, setVerificationCode] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [copied, setCopied] = useState(false)

  /**
   * 开始设置Google Authenticator
   */
  const handleStartSetup = () => {
    dispatch(setupGoogleAuth())
    setShowSetup(true)
  }

  /**
   * 验证Google Authenticator代码
   */
  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      dispatch(verifyGoogleAuth(verificationCode))
    }
  }

  /**
   * 复制密钥到剪贴板
   */
  const handleCopySecret = async () => {
    if (googleAuth.secret) {
      try {
        await navigator.clipboard.writeText(googleAuth.secret)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }

  /**
   * 禁用双重验证
   */
  const handleDisable = () => {
    // 这里应该有确认对话框
    if (confirm('确定要禁用双重验证吗？这将降低账户安全性。')) {
      dispatch(setupGoogleAuth())
      setShowSetup(false)
      setVerificationCode('')
    }
  }

  /**
   * 重新生成密钥
   */
  const handleRegenerate = () => {
    if (confirm('重新生成密钥将使当前的验证器失效，确定继续吗？')) {
      dispatch(setupGoogleAuth())
    }
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">双重验证</h2>
        <p className="text-gray-600">使用Google Authenticator增强账户安全性</p>
      </div>

      {/* 当前状态 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 ${
              googleAuth.enabled && googleAuth.verified 
                ? 'text-green-600' 
                : 'text-gray-400'
            }`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">双重验证状态</h3>
              <p className="text-sm text-gray-600">
                {googleAuth.enabled && googleAuth.verified 
                  ? '已启用 - 您的账户受到双重验证保护' 
                  : '未启用 - 建议启用以提高安全性'
                }
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            googleAuth.enabled && googleAuth.verified
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {googleAuth.enabled && googleAuth.verified ? '已启用' : '未启用'}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {!googleAuth.enabled || !googleAuth.verified ? (
            <button
              onClick={handleStartSetup}
              disabled={loading.googleAuth}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading.googleAuth ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              启用双重验证
            </button>
          ) : (
            <>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成密钥
              </button>
              <button
                onClick={handleDisable}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                禁用验证
              </button>
            </>
          )}
        </div>
      </div>

      {/* 设置流程 */}
      {(showSetup || (googleAuth.enabled && !googleAuth.verified)) && googleAuth.qrCode && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">设置Google Authenticator</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* 二维码 */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900 mb-3">扫描二维码</h4>
              <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                <img 
                  src={googleAuth.qrCode} 
                  alt="Google Authenticator QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                使用Google Authenticator应用扫描此二维码
              </p>
            </div>

            {/* 手动输入 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">或手动输入密钥</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密钥
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googleAuth.secret || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={handleCopySecret}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    在Google Authenticator中手动添加账户时使用此密钥
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    账户名称
                  </label>
                  <input
                    type="text"
                    value="LingLong OS Desktop"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 验证步骤 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">验证设置</h4>
            <p className="text-sm text-gray-600 mb-4">
              请输入Google Authenticator应用中显示的6位验证码来完成设置
            </p>
            
            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="输入6位验证码"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg"
                maxLength={6}
              />
              <button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || loading.googleAuth}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading.googleAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                验证
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">如何使用Google Authenticator</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>在手机上下载并安装Google Authenticator应用</li>
              <li>点击应用中的"+"按钮添加新账户</li>
              <li>选择"扫描二维码"或"手动输入密钥"</li>
              <li>按照上述步骤完成设置</li>
              <li>输入应用中显示的6位验证码完成验证</li>
            </ol>
            <p className="text-sm text-blue-700 mt-3">
              <strong>注意：</strong>请妥善保管您的密钥，建议将其保存在安全的地方作为备份。
            </p>
          </div>
        </div>
      </div>

      {/* 备用验证码 */}
      {googleAuth.enabled && googleAuth.verified && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 mb-2">备用验证码</h3>
              <p className="text-sm text-yellow-800 mb-3">
                当您无法使用Google Authenticator时，可以使用备用验证码登录。每个备用验证码只能使用一次。
              </p>
              <button className="text-sm text-yellow-700 hover:text-yellow-900 underline">
                生成备用验证码
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}