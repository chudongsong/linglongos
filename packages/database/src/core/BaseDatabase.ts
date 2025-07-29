import type {
  DatabaseConfig,
  QueryCondition,
  QueryOptions,
  DatabaseResult,
  TransactionOperation,
} from '../types'

/**
 * 数据库基类
 */
export abstract class BaseDatabase {
  protected config: DatabaseConfig
  protected isInitialized = false

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  /**
   * 初始化数据库
   */
  abstract initialize(): Promise<void>

  /**
   * 添加数据
   */
  abstract add<T = any>(store: string, data: T): Promise<DatabaseResult<T>>

  /**
   * 更新数据
   */
  abstract put<T = any>(store: string, data: T): Promise<DatabaseResult<T>>

  /**
   * 删除数据
   */
  abstract delete(store: string, key: any): Promise<DatabaseResult>

  /**
   * 根据主键获取数据
   */
  abstract get<T = any>(store: string, key: any): Promise<DatabaseResult<T>>

  /**
   * 获取所有数据
   */
  abstract getAll<T = any>(store: string): Promise<DatabaseResult<T[]>>

  /**
   * 查询数据
   */
  abstract query<T = any>(
    store: string,
    conditions?: QueryCondition[],
    options?: QueryOptions
  ): Promise<DatabaseResult<T[]>>

  /**
   * 统计数据
   */
  abstract count(store: string, conditions?: QueryCondition[]): Promise<DatabaseResult<number>>

  /**
   * 清空表
   */
  abstract clear(store: string): Promise<DatabaseResult>

  /**
   * 执行事务
   */
  abstract transaction(operations: TransactionOperation[]): Promise<DatabaseResult>

  /**
   * 关闭数据库
   */
  abstract close(): Promise<void>

  /**
   * 检查是否已初始化
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('数据库未初始化，请先调用 initialize() 方法')
    }
  }
}
