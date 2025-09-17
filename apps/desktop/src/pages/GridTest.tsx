/**
 * 网格系统测试页面
 * @description 用于测试和演示网格桌面系统
 */

import React from 'react';
import GridDesktop from '../components/desktop/GridDesktop';

const GridTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="container mx-auto h-screen p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg h-full">
          <GridDesktop />
        </div>
      </div>
    </div>
  );
};

export default GridTest;