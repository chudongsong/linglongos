import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Eye, EyeOff, User, Lock, Zap } from 'lucide-react';
import type { RootState } from '../../store';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 如果已经登录，重定向到桌面
  if (isAuthenticated) {
    return <Navigate to="/desktop" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      return;
    }
    
    await dispatch.auth.login({
      email: formData.username,
      password: formData.password
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* 科技感动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 动态网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* 浮动的科技元素 */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* 科技装饰线条 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent" />
          <div className="absolute bottom-20 right-20 w-32 h-0.5 bg-gradient-to-l from-purple-400/50 to-transparent" />
          <div className="absolute top-1/2 left-10 w-0.5 h-32 bg-gradient-to-b from-cyan-400/50 to-transparent" />
          <div className="absolute top-1/2 right-10 w-0.5 h-32 bg-gradient-to-t from-pink-400/50 to-transparent" />
        </div>
      </div>

      {/* 登录卡片 */}
         <Card className="w-full max-w-md relative z-10 glass-morphism tech-border">
           <CardHeader className="space-y-6 text-center">
             {/* 品牌Logo区域 */}
             <div className="flex flex-col items-center justify-center space-y-4">
               <div className="relative">
                 <img 
                   src="/logo.svg" 
                   alt="玲珑OS Logo" 
                   className="w-16 h-16 drop-shadow-lg"
                 />
               </div>
               <div className="text-center">
                 <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                   玲珑OS
                 </CardTitle>
                 <div className="text-xs text-blue-300 font-medium tracking-wider mt-1">LINGLONG SYSTEM</div>
               </div>
             </div>
          
          <CardDescription className="text-gray-300 text-base">
            欢迎进入未来操作系统
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* 用户名输入框 */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <User className={`w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'username' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="用户名"
                  value={formData.username}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-blue-400/20 backdrop-blur-sm smooth-transition ${
                     focusedField === 'username' ? 'border-blue-400/70' : ''
                   }`}
                />
                {formData.username && (
                  <label className="absolute left-12 -top-2 text-xs text-blue-300 bg-slate-900/80 px-2 rounded transition-all duration-200">
                    用户名
                  </label>
                )}
              </div>
            </div>
            
            {/* 密码输入框 */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Lock className={`w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`pl-12 pr-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-blue-400/20 backdrop-blur-sm smooth-transition ${
                     focusedField === 'password' ? 'border-blue-400/70' : ''
                   }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 smooth-transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {formData.password && (
                  <label className="absolute left-12 -top-2 text-xs text-blue-300 bg-slate-900/80 px-2 rounded transition-all duration-200">
                    密码
                  </label>
                )}
              </div>
            </div>
            
            {/* 登录按钮 */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl smooth-transition disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                   <span>登录</span>
                   <Zap className="w-4 h-4" />
                 </div>
              )}
            </Button>
          </form>
          
          {/* 演示信息 */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">演示账号：admin / password</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;