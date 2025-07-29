import { DatabaseManager } from '../core/DatabaseManager'
import type { BaseDatabase } from '../core/BaseDatabase'
import type {
  DatabaseConfig,
  DatabaseType,
  QueryCondition,
  QueryOptions,
  DatabaseResult,
  TransactionOperation,
} from '../types'

/**
 * 数据库服务类
 * 提供统一的数据库操作接口，封装底层数据库实现细节
 */
export class DatabaseService {
  private dbManager: DatabaseManager
  private database: BaseDatabase | null = null
  private dbName: string = ''

  /**
   * 构造函数
   */
  constructor() {
    this.dbManager = DatabaseManager.getInstance()
  }

  /**
   * 初始化数据库
   * @param config 数据库配置
   * @param type 数据库类型
   */
  async init(config: DatabaseConfig, type: DatabaseType = 'indexeddb'): Promise<boolean> {
    try {
      this.database = await this.dbManager.registerDatabase(config, type)
      this.dbName = config.name
      return true
    } catch (error) {
      console.error('初始化数据库失败:', error)
      return false
    }
  }

  /**
   * 获取数据库实例
   * @param name 数据库名称
   */
  useDatabase(name: string): boolean {
    try {
      this.database = this.dbManager.getDatabase(name)
      this.dbName = name
      return true
    } catch (error) {
      console.error('获取数据库失败:', error)
      return false
    }
  }

  /**
   * 添加数据
   * @param storeName 存储对象名称
   * @param data 数据
   */
  async add<T>(storeName: string, data: T): Promise<DatabaseResult<T>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.add(storeName, data)
  }

  /**
   * 批量添加数据
   * @param storeName 存储对象名称
   * @param dataList 数据列表
   */
  async addBatch<T>(storeName: string, dataList: T[]): Promise<DatabaseResult<T[]>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }

    // 使用事务批量添加
    const operations = dataList.map(data => ({
      type: 'add' as const,
      store: storeName,
      data,
    }))

    const result = await this.database.transaction(operations)
    if (result.success) {
      return {
        success: true,
        data: dataList,
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  }

  /**
   * 更新数据
   * @param storeName 存储对象名称
   * @param id 主键
   * @param data 数据
   */
  async update<T>(
    storeName: string,
    id: string | number,
    data: Partial<T>
  ): Promise<DatabaseResult<T>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }

    // 先获取原始数据
    const getResult = await this.database.get<T>(storeName, id)
    if (!getResult.success) {
      return getResult
    }

    // 合并数据
    const updatedData = { ...getResult.data, ...data } as T

    // 更新数据
    return this.database.put(storeName, updatedData)
  }

  /**
   * 根据条件更新数据
   * @param storeName 存储对象名称
   * @param conditions 条件
   * @param data 数据
   */
  async updateWhere<T>(
    storeName: string,
    conditions: QueryCondition[],
    data: Partial<T>
  ): Promise<DatabaseResult<T[]>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }

    // 先查询符合条件的数据
    const queryResult = await this.database.query<T>(storeName, conditions)
    if (!queryResult.success || !queryResult.data || queryResult.data.length === 0) {
      return {
        success: false,
        error: queryResult.error || '未找到符合条件的数据',
      }
    }

    // 批量更新
    const operations = queryResult.data.map(item => {
      const keyPath = this.getKeyPath(storeName)
      if (!keyPath) {
        throw new Error(`存储对象 ${storeName} 未定义主键`)
      }

      const key = (item as any)[keyPath]
      const updatedData = { ...item, ...data }

      return {
        type: 'put' as const,
        store: storeName,
        data: updatedData,
      }
    })

    const result = await this.database.transaction(operations)
    if (result.success) {
      return {
        success: true,
        data: queryResult.data.map(item => ({ ...item, ...data }) as T),
        count: operations.length,
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  }

  /**
   * 删除数据
   * @param storeName 存储对象名称
   * @param id 主键
   */
  async delete(storeName: string, id: string | number): Promise<DatabaseResult> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.delete(storeName, id)
  }

  /**
   * 根据条件删除数据
   * @param storeName 存储对象名称
   * @param conditions 条件
   */
  async deleteWhere(storeName: string, conditions: QueryCondition[]): Promise<DatabaseResult> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }

    // 先查询符合条件的数据
    const queryResult = await this.database.query(storeName, conditions)
    if (!queryResult.success || !queryResult.data || queryResult.data.length === 0) {
      return {
        success: false,
        error: queryResult.error || '未找到符合条件的数据',
      }
    }

    // 批量删除
    const operations = queryResult.data.map(item => {
      const keyPath = this.getKeyPath(storeName)
      if (!keyPath) {
        throw new Error(`存储对象 ${storeName} 未定义主键`)
      }

      const key = (item as any)[keyPath]

      return {
        type: 'delete' as const,
        store: storeName,
        key,
      }
    })

    const result = await this.database.transaction(operations)
    if (result.success) {
      return {
        success: true,
        count: operations.length,
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  }

  /**
   * 根据主键获取数据
   * @param storeName 存储对象名称
   * @param id 主键
   */
  async get<T>(storeName: string, id: string | number): Promise<DatabaseResult<T>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.get<T>(storeName, id)
  }

  /**
   * 查询数据
   * @param storeName 存储对象名称
   * @param conditions 条件
   * @param options 选项
   */
  async query<T>(
    storeName: string,
    conditions?: QueryCondition[],
    options?: QueryOptions
  ): Promise<DatabaseResult<T[]>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.query<T>(storeName, conditions, options)
  }

  /**
   * 获取所有数据
   * @param storeName 存储对象名称
   */
  async getAll<T>(storeName: string): Promise<DatabaseResult<T[]>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.getAll<T>(storeName)
  }

  /**
   * 统计数据
   * @param storeName 存储对象名称
   * @param conditions 条件
   */
  async count(storeName: string, conditions?: QueryCondition[]): Promise<DatabaseResult<number>> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.count(storeName, conditions)
  }

  /**
   * 清空表
   * @param storeName 存储对象名称
   */
  async clear(storeName: string): Promise<DatabaseResult> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.clear(storeName)
  }

  /**
   * 执行事务
   * @param operations 事务操作列表
   */
  async transaction(operations: TransactionOperation[]): Promise<DatabaseResult> {
    if (!this.database) {
      return {
        success: false,
        error: '数据库未初始化',
      }
    }
    return this.database.transaction(operations)
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    if (this.database && this.dbName) {
      await this.dbManager.removeDatabase(this.dbName)
      this.database = null
      this.dbName = ''
    }
  }

  /**
   * 获取存储对象的主键路径
   * @param storeName 存储对象名称
   */
  private getKeyPath(storeName: string): string | undefined {
    if (!this.database) {
      return undefined
    }

    // 由于config是受保护的，我们需要通过查询来获取主键路径
    // 这里假设存储对象的第一条记录包含主键
    // 如果没有数据，则默认使用'id'作为主键
    try {
      // 尝试获取存储对象的配置信息
      const stores = (this.database as any).config?.stores
      if (stores) {
        const storeConfig = stores.find((s: any) => s.name === storeName)
        return storeConfig?.keyPath || 'id'
      }
      return 'id'
    } catch (error) {
      console.warn(`获取存储对象 ${storeName} 的主键路径失败:`, error)
      return 'id'
    }
  }
}

/**
 * 创建数据库服务实例
 */
export function createDatabaseService(): DatabaseService {
  return new DatabaseService()
}
