/**
 * 网格系统功能测试组件
 * @description 用于测试网格系统的各项功能，包括图标对齐和中文标签显示
 */

import React, { useState, useMemo } from 'react';
import { useContainerSize } from '../hooks/useContainerSize';
import { useResponsiveGrid } from '../hooks/useResponsiveGrid';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { GRID_PRESETS, type IDesktopIcon, type GridSize } from '../types/grid';
import GridLayout from '../components/desktop/GridLayout';

const GridSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentGridSize, setCurrentGridSize] = useState<GridSize>('medium');

  // 测试容器尺寸监听
  const { size, ref: containerRef } = useContainerSize({
    debounceDelay: 100,
    enabled: true
  });

  // 测试响应式网格
  const { gridConfig, screenSize } = useResponsiveGrid({
    initialConfig: GRID_PRESETS[currentGridSize],
    autoResize: true
  });

  // 测试性能监控
  const { startInteractionTiming, endInteractionTiming, metrics } = usePerformanceMonitor({
    componentName: 'GridSystemTest',
    enabled: true,
    onMetrics: (metrics) => {
      addTestResult(`性能指标 - 渲染时间: ${metrics.renderTime.toFixed(2)}ms, 交互时间: ${metrics.interactionTime.toFixed(2)}ms`);
    }
  });

  // 创建测试图标数据
  const testIcons: IDesktopIcon[] = useMemo(() => {
    const iconTypes = [
      { type: 'folder' as const, name: '我的文档' },
      { type: 'image' as const, name: '图片库' },
      { type: 'music' as const, name: '音乐播放器' },
      { type: 'video' as const, name: '视频播放器' },
      { type: 'settings' as const, name: '系统设置' },
      { type: 'calculator' as const, name: '计算器' },
      { type: 'browser' as const, name: '浏览器' },
      { type: 'mail' as const, name: '邮件客户端' },
      { type: 'calendar' as const, name: '日历应用' },
      { type: 'terminal' as const, name: '终端' },
      { type: 'editor' as const, name: '文本编辑器' },
      { type: 'game' as const, name: '游戏中心' },
      { type: 'app' as const, name: '应用商店' },
      { type: 'file' as const, name: '文件管理器' },
      { type: 'folder' as const, name: '下载文件夹' },
      { type: 'image' as const, name: '照片编辑器' },
      { type: 'music' as const, name: '音频编辑器' },
      { type: 'video' as const, name: '视频编辑器' },
      { type: 'settings' as const, name: '网络设置' },
      { type: 'calculator' as const, name: '科学计算器' },
    ];

    return iconTypes.map((iconData, index) => ({
      id: `test-icon-${index}`,
      name: iconData.name,
      type: iconData.type,
      gridPosition: {
        row: Math.floor(index / gridConfig.columns),
        col: index % gridConfig.columns
      },
      isActive: false,
      isDraggable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }, [gridConfig.columns]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = () => {
    startInteractionTiming();
    
    // 测试1: 容器尺寸
    addTestResult(`容器尺寸: ${size.width}x${size.height}`);
    
    // 测试2: 响应式网格
    addTestResult(`屏幕尺寸: ${screenSize}, 网格配置: ${gridConfig.columns}x${gridConfig.rows}`);
    
    // 测试3: 网格预设
    Object.entries(GRID_PRESETS).forEach(([key, preset]) => {
      addTestResult(`网格预设 ${key}: ${preset.columns}x${preset.rows}, 图标大小: ${preset.iconSize}px, 间距: ${preset.gap}px`);
    });

    // 测试4: 图标对齐
    addTestResult(`图标对齐测试: 当前显示 ${testIcons.length} 个图标`);
    addTestResult(`图标尺寸: ${gridConfig.iconSize}px, 间距: ${gridConfig.gap}px`);
    
    endInteractionTiming();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleGridSizeChange = (size: GridSize) => {
    setCurrentGridSize(size);
    addTestResult(`切换到网格尺寸: ${size}`);
  };

  const handleIconClick = (iconId: string) => {
    const icon = testIcons.find(i => i.id === iconId);
    if (icon) {
      addTestResult(`点击图标: ${icon.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部控制面板 */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">网格系统对齐测试</h1>
          
          {/* 网格尺寸控制 */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-gray-700">网格尺寸:</span>
            {(['small', 'medium', 'large'] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => handleGridSizeChange(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentGridSize === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {size === 'small' ? '小 (14x10)' : size === 'medium' ? '中 (10x7)' : '大 (8x5)'}
              </button>
            ))}
          </div>

          {/* 测试控制按钮 */}
          <div className="flex gap-4">
            <button
              onClick={runTests}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              运行对齐测试
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              清除结果
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 网格展示区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">图标网格对齐展示</h2>
                <p className="text-sm text-gray-600 mt-1">
                  当前网格: {gridConfig.columns}×{gridConfig.rows}, 
                  图标尺寸: {gridConfig.iconSize}px, 
                  间距: {gridConfig.gap}px
                </p>
              </div>
              
              <div 
                ref={containerRef}
                className="relative bg-gradient-to-br from-blue-50 to-indigo-100"
                style={{ height: '600px' }}
              >
                <GridLayout
                  icons={testIcons}
                  gridConfig={gridConfig}
                  enableDrag={true}
                  snapToGrid={true}
                  onIconClick={handleIconClick}
                  onGridSizeChange={handleGridSizeChange}
                />
              </div>
            </div>
          </div>

          {/* 信息面板 */}
          <div className="space-y-6">
            {/* 网格信息 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">网格信息</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">容器尺寸:</span>
                  <span className="font-mono">{size.width} × {size.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">屏幕尺寸:</span>
                  <span className="font-mono">{screenSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">网格列数:</span>
                  <span className="font-mono">{gridConfig.columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">网格行数:</span>
                  <span className="font-mono">{gridConfig.rows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">图标大小:</span>
                  <span className="font-mono">{gridConfig.iconSize}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">图标间距:</span>
                  <span className="font-mono">{gridConfig.gap}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">内边距:</span>
                  <span className="font-mono">{gridConfig.padding.top}px</span>
                </div>
              </div>
            </div>

            {/* 测试结果 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">测试结果</h2>
              <div className="bg-gray-50 rounded p-4 max-h-80 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无测试结果，点击"运行对齐测试"开始测试</p>
                ) : (
                  <ul className="space-y-1">
                    {testResults.map((result, index) => (
                      <li key={index} className="text-xs font-mono text-gray-700">
                        {result}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 性能指标 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">性能指标</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">渲染时间:</span>
                  <span className="font-mono">{metrics.renderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">交互时间:</span>
                  <span className="font-mono">{metrics.interactionTime.toFixed(2)}ms</span>
                </div>
                {metrics.memoryUsage && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">已用内存:</span>
                      <span className="font-mono">{(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">总内存:</span>
                      <span className="font-mono">{(metrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridSystemTest;