/**
 * Desktop页面组件
 * 
 * 桌面主界面页面，组合桌面相关功能模块
 */

import React from 'react';
import Desktop from '@features/desktop/Desktop';
import WindowManager from '@components/WindowManager';
import Dock from '@components/Dock';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

/**
 * Desktop页面组件
 * 
 * 提供完整的桌面体验，包括：
 * - 桌面背景和图标
 * - 窗口管理器
 * - 底部Dock栏
 * - 拖拽功能支持
 */
const DesktopPage: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="desktop-page">
        <Desktop />
        <WindowManager />
        <Dock />
      </div>
    </DndProvider>
  );
};

export default DesktopPage;