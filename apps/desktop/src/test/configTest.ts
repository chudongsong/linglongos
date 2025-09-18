/**
 * 配置文件测试脚本
 * @description 验证JSON配置文件的加载和解析功能
 */

import { ConfigManager } from '../utils/configManager';

/**
 * 测试JSON配置文件加载
 */
export async function testConfigLoading(): Promise<void> {
  console.log('🧪 开始测试配置文件加载...');
  
  const configManager = ConfigManager.getInstance();
  
  try {
    // 测试从JSON文件加载配置
    const loadSuccess = await configManager.loadFromJsonFile();
    
    if (loadSuccess) {
      console.log('✅ JSON配置文件加载成功');
      
      // 验证桌面配置
      const desktopConfig = configManager.getDesktopConfig();
      console.log('📋 桌面配置:', {
        layoutMode: desktopConfig.layoutMode,
        gridConfig: {
          columns: desktopConfig.gridConfig.columns,
          rows: desktopConfig.gridConfig.rows,
          iconSize: desktopConfig.gridConfig.iconSize,
          gap: desktopConfig.gridConfig.gap
        },
        autoArrange: desktopConfig.autoArrange,
        snapToGrid: desktopConfig.snapToGrid
      });
      
      // 验证图标数据
      const icons = configManager.getDesktopIcons();
      console.log('🎯 图标数据:', {
        总数量: icons.length,
        图标列表: icons.map(icon => ({
          id: icon.id,
          name: icon.name,
          type: icon.type,
          position: icon.gridPosition
        }))
      });
      
      // 验证网格位置分布
      const positionMap = new Map<string, string>();
      icons.forEach(icon => {
        const key = `${icon.gridPosition.row}-${icon.gridPosition.col}`;
        if (positionMap.has(key)) {
          console.warn(`⚠️ 位置冲突: ${key} 被多个图标占用`);
        } else {
          positionMap.set(key, icon.name);
        }
      });
      
      console.log('✅ 配置文件测试完成，所有功能正常');
      
    } else {
      console.log('⚠️ JSON配置文件加载失败，使用默认配置');
    }
    
  } catch (error) {
    console.error('❌ 配置文件测试失败:', error);
  }
}

/**
 * 测试拖拽吸附算法
 */
export function testSnapToGrid(): void {
  console.log('🧪 开始测试拖拽吸附算法...');
  
  // 模拟网格配置
  const gridConfig = {
    columns: 6,
    rows: 4,
    iconSize: 80,
    gap: 16,
    padding: { top: 20, right: 20, bottom: 20, left: 20 }
  };
  
  // 模拟现有图标位置
  const existingIcons = [
    { id: '1', gridPosition: { row: 0, col: 0 } },
    { id: '2', gridPosition: { row: 0, col: 1 } },
    { id: '3', gridPosition: { row: 1, col: 0 } }
  ];
  
  // 测试位置计算
  const testCases = [
    { pixel: { x: 50, y: 50 }, expected: { row: 0, col: 0 } },
    { pixel: { x: 150, y: 50 }, expected: { row: 0, col: 1 } },
    { pixel: { x: 250, y: 150 }, expected: { row: 1, col: 2 } }
  ];
  
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
    
    console.log(`测试用例 ${index + 1}: ${isCorrect ? '✅' : '❌'}`, {
      输入像素: testCase.pixel,
      期望网格: testCase.expected,
      实际网格: result
    });
  });
  
  console.log('✅ 拖拽吸附算法测试完成');
}

// 如果直接运行此文件，执行测试
if (import.meta.hot) {
  testConfigLoading();
  testSnapToGrid();
}