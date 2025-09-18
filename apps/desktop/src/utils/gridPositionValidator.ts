/**
 * 网格位置验证工具
 * @description 验证JSON配置中图标的网格位置是否有冲突，确保严格网格对齐
 */

import type { IDesktopIcon, IGridPosition } from '../types/grid';

/**
 * 位置冲突检测结果
 */
interface IPositionConflict {
  /** 冲突的网格位置 */
  position: IGridPosition;
  /** 冲突的图标列表 */
  conflictingIcons: IDesktopIcon[];
}

/**
 * 验证结果
 */
interface IValidationResult {
  /** 是否通过验证 */
  isValid: boolean;
  /** 位置冲突列表 */
  conflicts: IPositionConflict[];
  /** 超出网格范围的图标 */
  outOfBounds: IDesktopIcon[];
  /** 验证摘要 */
  summary: {
    totalIcons: number;
    conflictCount: number;
    outOfBoundsCount: number;
    uniquePositions: number;
  };
}

/**
 * 网格位置验证器类
 */
export class GridPositionValidator {
  /**
   * 验证图标位置配置
   * @param icons 图标列表
   * @param gridColumns 网格列数
   * @param gridRows 网格行数
   * @returns 验证结果
   */
  static validatePositions(
    icons: IDesktopIcon[],
    gridColumns: number,
    gridRows: number
  ): IValidationResult {
    const conflicts: IPositionConflict[] = [];
    const outOfBounds: IDesktopIcon[] = [];
    const positionMap = new Map<string, IDesktopIcon[]>();

    // 构建位置映射
    icons.forEach(icon => {
      const { row, col } = icon.gridPosition;
      const positionKey = `${row}-${col}`;

      // 检查是否超出网格范围
      if (row < 0 || row >= gridRows || col < 0 || col >= gridColumns) {
        outOfBounds.push(icon);
        return;
      }

      // 添加到位置映射
      if (!positionMap.has(positionKey)) {
        positionMap.set(positionKey, []);
      }
      positionMap.get(positionKey)!.push(icon);
    });

    // 检查位置冲突
    positionMap.forEach((iconsAtPosition, positionKey) => {
      if (iconsAtPosition.length > 1) {
        const [row, col] = positionKey.split('-').map(Number);
        conflicts.push({
          position: { row, col },
          conflictingIcons: iconsAtPosition
        });
      }
    });

    const uniquePositions = positionMap.size;
    const isValid = conflicts.length === 0 && outOfBounds.length === 0;

    return {
      isValid,
      conflicts,
      outOfBounds,
      summary: {
        totalIcons: icons.length,
        conflictCount: conflicts.length,
        outOfBoundsCount: outOfBounds.length,
        uniquePositions
      }
    };
  }

  /**
   * 生成位置冲突报告
   * @param validationResult 验证结果
   * @returns 格式化的报告字符串
   */
  static generateReport(validationResult: IValidationResult): string {
    const { isValid, conflicts, outOfBounds, summary } = validationResult;
    
    let report = '=== 网格位置验证报告 ===\n\n';
    
    report += `总图标数量: ${summary.totalIcons}\n`;
    report += `唯一位置数量: ${summary.uniquePositions}\n`;
    report += `位置冲突数量: ${summary.conflictCount}\n`;
    report += `超出范围数量: ${summary.outOfBoundsCount}\n`;
    report += `验证状态: ${isValid ? '✅ 通过' : '❌ 失败'}\n\n`;

    if (conflicts.length > 0) {
      report += '=== 位置冲突详情 ===\n';
      conflicts.forEach((conflict, index) => {
        const { row, col } = conflict.position;
        report += `${index + 1}. 位置 (${row}, ${col}) 被以下图标占用:\n`;
        conflict.conflictingIcons.forEach(icon => {
          report += `   - ${icon.name} (ID: ${icon.id})\n`;
        });
        report += '\n';
      });
    }

    if (outOfBounds.length > 0) {
      report += '=== 超出网格范围的图标 ===\n';
      outOfBounds.forEach((icon, index) => {
        const { row, col } = icon.gridPosition;
        report += `${index + 1}. ${icon.name} (ID: ${icon.id}) - 位置: (${row}, ${col})\n`;
      });
      report += '\n';
    }

    if (isValid) {
      report += '✅ 所有图标位置配置正确，严格按照网格对齐，无位置冲突！\n';
    } else {
      report += '❌ 发现位置配置问题，请修复后重新验证。\n';
    }

    return report;
  }

  /**
   * 自动修复位置冲突
   * @param icons 图标列表
   * @param gridColumns 网格列数
   * @param gridRows 网格行数
   * @returns 修复后的图标列表
   */
  static autoFixConflicts(
    icons: IDesktopIcon[],
    gridColumns: number,
    gridRows: number
  ): IDesktopIcon[] {
    const fixedIcons = [...icons];
    const occupiedPositions = new Set<string>();
    
    // 第一遍：标记所有有效且无冲突的位置
    const validIcons: IDesktopIcon[] = [];
    const conflictedIcons: IDesktopIcon[] = [];
    
    fixedIcons.forEach(icon => {
      const { row, col } = icon.gridPosition;
      const positionKey = `${row}-${col}`;
      
      // 检查位置是否有效且未被占用
      if (row >= 0 && row < gridRows && col >= 0 && col < gridColumns && !occupiedPositions.has(positionKey)) {
        occupiedPositions.add(positionKey);
        validIcons.push(icon);
      } else {
        conflictedIcons.push(icon);
      }
    });
    
    // 第二遍：为冲突的图标分配新位置
    conflictedIcons.forEach(icon => {
      const newPosition = this.findNextAvailablePosition(occupiedPositions, gridColumns, gridRows);
      if (newPosition) {
        const positionKey = `${newPosition.row}-${newPosition.col}`;
        occupiedPositions.add(positionKey);
        icon.gridPosition = newPosition;
        icon.updatedAt = new Date();
        validIcons.push(icon);
      }
    });
    
    return validIcons;
  }

  /**
   * 查找下一个可用位置
   * @param occupiedPositions 已占用位置集合
   * @param gridColumns 网格列数
   * @param gridRows 网格行数
   * @returns 可用位置或null
   */
  private static findNextAvailablePosition(
    occupiedPositions: Set<string>,
    gridColumns: number,
    gridRows: number
  ): IGridPosition | null {
    // 按行优先顺序查找空闲位置
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridColumns; col++) {
        const positionKey = `${row}-${col}`;
        if (!occupiedPositions.has(positionKey)) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * 验证单个图标位置
   * @param icon 图标
   * @param gridColumns 网格列数
   * @param gridRows 网格行数
   * @returns 是否有效
   */
  static isValidPosition(
    icon: IDesktopIcon,
    gridColumns: number,
    gridRows: number
  ): boolean {
    const { row, col } = icon.gridPosition;
    return row >= 0 && row < gridRows && col >= 0 && col < gridColumns;
  }

  /**
   * 生成网格位置可视化
   * @param icons 图标列表
   * @param gridColumns 网格列数
   * @param gridRows 网格行数
   * @returns 可视化字符串
   */
  static visualizeGrid(
    icons: IDesktopIcon[],
    gridColumns: number,
    gridRows: number
  ): string {
    const grid: string[][] = Array(gridRows).fill(null).map(() => Array(gridColumns).fill('⬜'));
    
    // 标记图标位置
    icons.forEach(icon => {
      const { row, col } = icon.gridPosition;
      if (row >= 0 && row < gridRows && col >= 0 && col < gridColumns) {
        grid[row][col] = '🔷';
      }
    });
    
    let visualization = '=== 网格布局可视化 ===\n\n';
    visualization += '   ';
    
    // 列号标题
    for (let col = 0; col < gridColumns; col++) {
      visualization += `${col.toString().padStart(2)} `;
    }
    visualization += '\n';
    
    // 网格内容
    grid.forEach((row, rowIndex) => {
      visualization += `${rowIndex.toString().padStart(2)} `;
      row.forEach(cell => {
        visualization += `${cell}  `;
      });
      visualization += '\n';
    });
    
    visualization += '\n🔷 = 已占用位置, ⬜ = 空闲位置\n';
    
    return visualization;
  }
}

/**
 * 导出验证函数的便捷接口
 */
export const validateGridPositions = GridPositionValidator.validatePositions;
export const generatePositionReport = GridPositionValidator.generateReport;
export const autoFixPositionConflicts = GridPositionValidator.autoFixConflicts;
export const visualizeGridLayout = GridPositionValidator.visualizeGrid;