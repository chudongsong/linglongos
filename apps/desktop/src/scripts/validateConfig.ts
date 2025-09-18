/**
 * 配置验证脚本
 * @description 验证桌面配置文件中图标位置的正确性
 */

import fs from 'fs';
import path from 'path';
import { GridPositionValidator } from '../utils/gridPositionValidator';
import type { IDesktopConfigFile, IDesktopIcon } from '../types/grid';

/**
 * 主验证函数
 */
async function validateDesktopConfig(): Promise<void> {
  try {
    console.log('🔍 开始验证桌面配置文件...');
    
    // 读取配置文件
    const configPath = path.join(process.cwd(), 'public', 'desktop-config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ 配置文件不存在:', configPath);
      process.exit(1);
    }
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: IDesktopConfigFile = JSON.parse(configContent);
    
    console.log('📄 配置文件读取成功');
    console.log(`📊 网格配置: ${config.desktop.grid.rows} 行 × ${config.desktop.grid.columns} 列`);
    console.log(`🎯 图标数量: ${config.desktop.icons.length}`);
    console.log('');
    
    // 执行验证
    const validationResult = GridPositionValidator.validatePositions(
      config.desktop.icons,
      config.desktop.grid.columns,
      config.desktop.grid.rows
    );
    
    // 生成报告
    const report = GridPositionValidator.generateReport(validationResult);
    console.log(report);
    
    // 生成可视化
    const visualization = GridPositionValidator.visualizeGrid(
      config.desktop.icons,
      config.desktop.grid.columns,
      config.desktop.grid.rows
    );
    console.log(visualization);
    
    // 如果有冲突，提供修复选项
    if (!validationResult.isValid) {
      console.log('🔧 检测到位置冲突，正在生成修复建议...');
      
      const fixedIcons = GridPositionValidator.autoFixConflicts(
        config.desktop.icons,
        config.desktop.grid.columns,
        config.desktop.grid.rows
      );
      
      // 创建修复后的配置
      const fixedConfig: IDesktopConfigFile = {
        ...config,
        desktop: {
          ...config.desktop,
          icons: fixedIcons
        }
      };
      
      // 保存修复建议到文件
      const fixedConfigPath = path.join(process.cwd(), 'public', 'desktop-config-fixed.json');
      fs.writeFileSync(fixedConfigPath, JSON.stringify(fixedConfig, null, 2), 'utf-8');
      
      console.log(`💾 修复建议已保存到: ${fixedConfigPath}`);
      console.log('📝 请检查修复建议，确认无误后可替换原配置文件');
      
      // 验证修复后的配置
      const fixedValidationResult = GridPositionValidator.validatePositions(
        fixedIcons,
        config.desktop.grid.columns,
        config.desktop.grid.rows
      );
      
      console.log('\n=== 修复后验证结果 ===');
      const fixedReport = GridPositionValidator.generateReport(fixedValidationResult);
      console.log(fixedReport);
      
      process.exit(1);
    } else {
      console.log('🎉 配置验证通过！所有图标位置配置正确。');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  }
}

/**
 * 详细分析函数
 */
function analyzeIconDistribution(config: IDesktopConfigFile): void {
  const { icons, grid } = config.desktop;
  const totalCells = grid.rows * grid.columns;
  const usedCells = icons.length;
  const utilization = (usedCells / totalCells * 100).toFixed(1);
  
  console.log('📈 图标分布分析:');
  console.log(`   总网格数: ${totalCells}`);
  console.log(`   已使用: ${usedCells}`);
  console.log(`   利用率: ${utilization}%`);
  console.log(`   空闲位置: ${totalCells - usedCells}`);
  
  // 按行分析
  const rowDistribution = new Array(grid.rows).fill(0);
  const colDistribution = new Array(grid.columns).fill(0);
  
  icons.forEach((icon: IDesktopIcon) => {
    const { row, col } = icon.gridPosition;
    if (row >= 0 && row < grid.rows) rowDistribution[row]++;
    if (col >= 0 && col < grid.columns) colDistribution[col]++;
  });
  
  console.log('\n📊 行分布:');
  rowDistribution.forEach((count, index) => {
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, grid.columns - count));
    console.log(`   行 ${index}: ${bar} (${count}/${grid.columns})`);
  });
  
  console.log('\n📊 列分布:');
  colDistribution.forEach((count, index) => {
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, grid.rows - count));
    console.log(`   列 ${index}: ${bar} (${count}/${grid.rows})`);
  });
  
  console.log('');
}

// 如果直接运行此脚本
if (require.main === module) {
  validateDesktopConfig();
}

export { validateDesktopConfig, analyzeIconDistribution };