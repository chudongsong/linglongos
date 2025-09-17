import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { Button } from '../ui/button';
import type { RootState, Dispatch } from '../../store';
import { LogOut, Settings, User } from 'lucide-react';

const Layout: React.FC = () => {
  const dispatch = useDispatch<Dispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch.auth.logout();
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 左侧：系统标题 */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">玲珑OS</h1>
          </div>

          {/* 中间：时间显示 */}
          <div className="text-sm text-gray-600 font-mono">
            {currentTime}
          </div>

          {/* 右侧：用户信息和操作 */}
          <div className="flex items-center space-x-4">
            {/* 用户信息 */}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {user?.username || '用户'}
              </span>
            </div>

            {/* 设置按钮 */}
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>

            {/* 登出按钮 */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              title="登出"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 底部任务栏 */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-2">
          {/* 左侧：开始菜单 */}
          <Button variant="ghost" className="text-sm">
            开始
          </Button>

          {/* 中间：任务栏（预留） */}
          <div className="flex-1 flex items-center justify-center space-x-2">
            {/* 这里可以显示打开的应用程序 */}
          </div>

          {/* 右侧：系统托盘 */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-600">
              {new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;