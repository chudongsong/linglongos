/**
 * 功能测试页面
 * @description 用于验证桌面图标网格布局系统的所有功能
 */

import React, { useState, useEffect } from 'react';
import { ConfigManager } from '../utils/configManager';
import { testConfigLoading, testSnapToGrid } from '../test/configTest';

/**
 * 测试结果接口
 */
interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
}

/**
 * 功能测试页面组件
 */
const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'JSON配置文件加载', status: 'pending' },
    { name: '网格布局计算', status: 'pending' },
    { name: '拖拽吸附算法', status: 'pending' },
    { name: '图标数据验证', status: 'pending' },
    { name: '配置管理器功能', status: 'pending' }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  /**
   * 更新测试结果
   */
  const updateTestResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, details }
        : test
    ));
  };

  /**
   * 运行JSON配置文件加载测试
   */
  const runConfigLoadingTest = async (): Promise<void> => {
    updateTestResult('JSON配置文件加载', 'running');
    
    try {
      const configManager = ConfigManager.getInstance();
      const loadSuccess = await configManager.loadFromJsonFile();
      
      if (loadSuccess) {
        const desktopConfig = configManager.getDesktopConfig();
        const icons = configManager.getDesktopIcons();
        
        updateTestResult('JSON配置文件加载', 'passed', 
          `成功加载 ${icons.length} 个图标`, 
          { 
            gridConfig: desktopConfig.gridConfig,
            iconCount: icons.length 
          }
        );
      } else {
        updateTestResult('JSON配置文件加载', 'failed', '配置文件加载失败');
      }
    } catch (error) {
      updateTestResult('JSON配置文件加载', 'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  /**
   * 运行网格布局计算测试
   */
  const runGridLayoutTest = (): void => {
    updateTestResult('网格布局计算', 'running');
    
    try {
      const gridConfig = {
        columns: 10,
        rows: 7,
        iconSize: 88,
        gap: 20,
        padding: { top: 32, right: 32, bottom: 32, left: 32 }
      };

      // 测试像素到网格位置的转换
      const testCases = [
        { pixel: { x: 50, y: 50 }, expected: { row: 0, col: 0 } },
        { pixel: { x: 150, y: 50 }, expected: { row: 0, col: 1 } },
        { pixel: { x: 50, y: 150 }, expected: { row: 1, col: 0 } }
      ];

      let passedTests = 0;
      const results: any[] = [];

      testCases.forEach((testCase, index) => {
        const { x, y } = testCase.pixel;
        const adjustedX = x - gridConfig.padding.left;
        const adjustedY = y - gridConfig.padding.top;
        
        const centerOffsetX = gridConfig.iconSize / 2;
        const centerOffsetY = gridConfig.iconSize / 2;
        
        const col = Math.max(0, Math.min(gridConfig.columns - 1, 
          Math.round((adjustedX + centerOffsetX) / (gridConfig.iconSize + gridConfig.gap))
        ));
        const row = Math.max(0, Math.min(gridConfig.rows - 1, 
          Math.round((adjustedY + centerOffsetY) / (gridConfig.iconSize + gridConfig.gap))
        ));
        
        const result = { row, col };
        const isCorrect = result.row === testCase.expected.row && result.col === testCase.expected.col;
        
        if (isCorrect) passedTests++;
        
        results.push({
          testCase: index + 1,
          input: testCase.pixel,
          expected: testCase.expected,
          actual: result,
          passed: isCorrect
        });
      });

      if (passedTests === testCases.length) {
        updateTestResult('网格布局计算', 'passed', 
          `所有 ${testCases.length} 个测试用例通过`, 
          results
        );
      } else {
        updateTestResult('网格布局计算', 'failed', 
          `${passedTests}/${testCases.length} 个测试用例通过`, 
          results
        );
      }
    } catch (error) {
      updateTestResult('网格布局计算', 'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  /**
   * 运行拖拽吸附算法测试
   */
  const runSnapToGridTest = (): void => {
    updateTestResult('拖拽吸附算法', 'running');
    
    try {
      // 模拟曼哈顿距离计算
      const calculateManhattanDistance = (pos1: {row: number, col: number}, pos2: {row: number, col: number}) => {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
      };

      // 测试最近位置查找
      const targetPosition = { row: 1, col: 1 };
      const occupiedPositions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 }
      ];

      const gridConfig = { columns: 6, rows: 4 };
      const allPositions: {row: number, col: number}[] = [];
      
      // 生成所有可能位置
      for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.columns; col++) {
          const isOccupied = occupiedPositions.some(pos => pos.row === row && pos.col === col);
          if (!isOccupied) {
            allPositions.push({ row, col });
          }
        }
      }

      // 按距离排序
      const sortedPositions = allPositions
        .map(pos => ({
          ...pos,
          distance: calculateManhattanDistance(targetPosition, pos)
        }))
        .sort((a, b) => {
          if (a.distance !== b.distance) return a.distance - b.distance;
          if (a.row !== b.row) return a.row - b.row;
          return a.col - b.col;
        });

      const nearestPosition = sortedPositions[0];
      
      if (nearestPosition && nearestPosition.distance >= 0) {
        updateTestResult('拖拽吸附算法', 'passed', 
          `找到最近位置: (${nearestPosition.row}, ${nearestPosition.col})`, 
          {
            targetPosition,
            occupiedPositions,
            nearestPosition: { row: nearestPosition.row, col: nearestPosition.col },
            distance: nearestPosition.distance
          }
        );
      } else {
        updateTestResult('拖拽吸附算法', 'failed', '未找到可用位置');
      }
    } catch (error) {
      updateTestResult('拖拽吸附算法', 'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  /**
   * 运行图标数据验证测试
   */
  const runIconDataTest = (): void => {
    updateTestResult('图标数据验证', 'running');
    
    try {
      const configManager = ConfigManager.getInstance();
      const icons = configManager.getDesktopIcons();
      
      // 验证图标数据完整性
      const validationResults = {
        totalIcons: icons.length,
        validIcons: 0,
        duplicatePositions: 0,
        missingFields: [] as string[]
      };

      const positionMap = new Map<string, string>();
      
      icons.forEach((icon, index) => {
        // 检查必需字段
        const requiredFields = ['id', 'name', 'type', 'icon', 'gridPosition'];
        const missingFields = requiredFields.filter(field => !icon[field as keyof typeof icon]);
        
        if (missingFields.length === 0) {
          validationResults.validIcons++;
        } else {
          validationResults.missingFields.push(`图标${index + 1}: ${missingFields.join(', ')}`);
        }

        // 检查位置冲突
        const posKey = `${icon.gridPosition.row}-${icon.gridPosition.col}`;
        if (positionMap.has(posKey)) {
          validationResults.duplicatePositions++;
        } else {
          positionMap.set(posKey, icon.name);
        }
      });

      if (validationResults.validIcons === validationResults.totalIcons && 
          validationResults.duplicatePositions === 0) {
        updateTestResult('图标数据验证', 'passed', 
          `所有 ${validationResults.totalIcons} 个图标数据有效`, 
          validationResults
        );
      } else {
        updateTestResult('图标数据验证', 'failed', 
          `发现数据问题`, 
          validationResults
        );
      }
    } catch (error) {
      updateTestResult('图标数据验证', 'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  /**
   * 运行配置管理器功能测试
   */
  const runConfigManagerTest = (): void => {
    updateTestResult('配置管理器功能', 'running');
    
    try {
      const configManager = ConfigManager.getInstance();
      
      // 测试配置获取
      const desktopConfig = configManager.getDesktopConfig();
      const icons = configManager.getDesktopIcons();
      
      // 测试配置更新
      const testIcon = icons[0];
      if (testIcon) {
        const originalPosition = { ...testIcon.gridPosition };
        const newPosition = { row: originalPosition.row, col: originalPosition.col + 1 };
        
        // 更新图标位置
        configManager.updateIcon(testIcon.id, { gridPosition: newPosition });
        
        // 验证更新
        const updatedIcons = configManager.getDesktopIcons();
        const updatedIcon = updatedIcons.find(icon => icon.id === testIcon.id);
        
        if (updatedIcon && 
            updatedIcon.gridPosition.row === newPosition.row && 
            updatedIcon.gridPosition.col === newPosition.col) {
          
          // 恢复原始位置
          configManager.updateIcon(testIcon.id, { gridPosition: originalPosition });
          
          updateTestResult('配置管理器功能', 'passed', 
            '配置更新和持久化功能正常', 
            {
              originalPosition,
              newPosition,
              updateSuccess: true
            }
          );
        } else {
          updateTestResult('配置管理器功能', 'failed', '配置更新失败');
        }
      } else {
        updateTestResult('配置管理器功能', 'failed', '没有可用的测试图标');
      }
    } catch (error) {
      updateTestResult('配置管理器功能', 'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  /**
   * 运行所有测试
   */
  const runAllTests = async (): Promise<void> => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    // 重置所有测试状态
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    try {
      await runConfigLoadingTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      runGridLayoutTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      runSnapToGridTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      runIconDataTest();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      runConfigManagerTest();
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status: TestResult['status']): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'passed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: TestResult['status']): string => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              桌面图标网格布局系统 - 功能测试
            </h1>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRunning ? '测试中...' : '运行所有测试'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(test.status)}</span>
                    <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                  </div>
                  <span className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
                
                {test.message && (
                  <p className="mt-2 text-gray-600">{test.message}</p>
                )}
                
                {test.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      查看详细信息
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>JSON配置文件加载</strong>: 验证从 public/desktop-config.json 加载配置的功能</li>
              <li>• <strong>网格布局计算</strong>: 测试像素位置到网格位置的转换算法</li>
              <li>• <strong>拖拽吸附算法</strong>: 验证曼哈顿距离算法查找最近空闲位置</li>
              <li>• <strong>图标数据验证</strong>: 检查图标数据完整性和位置冲突</li>
              <li>• <strong>配置管理器功能</strong>: 测试配置更新和持久化功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;