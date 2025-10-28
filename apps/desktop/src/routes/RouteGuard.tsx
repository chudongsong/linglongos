/**
 * 路由守卫组件
 * 
 * 根据系统初始化状态决定用户应该看到哪个页面
 */

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadSystemStatus } from '@/features/Setup/setupSlice';

/**
 * 路由守卫组件
 * 
 * 功能：
 * - 检查系统初始化状态
 * - 如果系统未初始化，重定向到setup页面
 * - 如果系统已初始化，重定向到desktop页面
 * - 在加载状态时显示加载界面
 */
const RouteGuard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { systemStatus, isLoading } = useAppSelector(state => state.setup);

  // 组件挂载时检查系统状态
  useEffect(() => {
    if (!systemStatus) {
      dispatch(loadSystemStatus());
    }
  }, [dispatch, systemStatus]);

  // 显示加载状态
  if (isLoading || !systemStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在检查系统状态...</p>
        </div>
      </div>
    );
  }

  // 根据系统状态决定重定向
  // 如果不需要初始化，说明系统已经设置完成，跳转到桌面
  if (!systemStatus.initializationRequired) {
    return <Navigate to="/desktop" replace />;
  } else {
    return <Navigate to="/setup" replace />;
  }
};

export default RouteGuard;