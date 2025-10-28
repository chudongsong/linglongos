/**
 * 应用路由配置
 * 
 * 定义应用的路由结构，包括setup页面和桌面页面的路由
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import SetupPage from '@/pages/SetupPage';
import DesktopPage from '@/pages/DesktopPage';
import RouteGuard from '@/routes/RouteGuard';

/**
 * 应用路由配置
 * 
 * 路由结构：
 * - / : 根路径，通过RouteGuard决定重定向到setup或desktop
 * - /setup : 系统初始化设置页面
 * - /desktop : 桌面主界面
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RouteGuard />,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/desktop',
    element: <DesktopPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;