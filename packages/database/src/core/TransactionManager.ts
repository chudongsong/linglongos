import { BaseDatabase } from './BaseDatabase'
import type { DatabaseResult, TransactionOperation } from '../types'

/**
 * 事务管理器
 * 用于管理数据库事务，支持跨存储的事务操作
 */
export class TransactionManager {
  private database: BaseDatabase

  /**
   * 构造函数
   * @param database 数据库实例
   */
  constructor(database: BaseDatabase) {
    this.database = database
  }

  /**
   * 执行事务
   * @param operations 事务操作列表
   */
  async execute(operations: TransactionOperation[]): Promise<DatabaseResult> {
    if (!operations || operations.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    try {
      // 执行事务
      return await this.database.transaction(operations)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '事务执行失败',
      }
    }
  }

  /**
   * 创建事务操作
   * @param type 操作类型
   * @param store 存储名称
   * @param data 数据
   * @param key 键
   */
  createOperation(
    type: 'add' | 'put' | 'delete' | 'update',
    store: string,
    data?: any,
    key?: string | number
  ): TransactionOperation {
    return {
      type,
      store,
      data,
      key,
    }
  }

  /**
   * 批量添加操作
   * @param store 存储名称
   * @param items 数据项列表
   */
  batchAdd(store: string, items: any[]): TransactionOperation[] {
    return items.map(item => ({
      type: 'add',
      store,
      data: item,
    }))
  }

  /**
   * 批量更新操作
   * @param store 存储名称
   * @param items 数据项列表
   */
  batchPut(store: string, items: any[]): TransactionOperation[] {
    return items.map(item => ({
      type: 'put',
      store,
      data: item,
    }))
  }

  /**
   * 批量删除操作
   * @param store 存储名称
   * @param keys 键列表
   */
  batchDelete(store: string, keys: (string | number)[]): TransactionOperation[] {
    return keys.map(key => ({
      type: 'delete',
      store,
      key,
    }))
  }
}
