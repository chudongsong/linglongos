import { BaseDatabase } from './BaseDatabase'
import { IndexedDBAdapter } from './IndexedDBAdapter'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import { WebSQLAdapter } from './WebSQLAdapter'
import { CacheManager } from './CacheManager'
import { DatabaseMonitor } from './DatabaseMonitor'
import { MigrationManager } from './MigrationManager'
import { TransactionManager } from './TransactionManager'
import { EncryptionManager } from './EncryptionManager'
import { SyncManager } from './SyncManager'
import type { DatabaseConfig, DatabaseType } from '../types'

/**
 * 数据库管理器
 * 用于统一管理不同类型的数据库实例
 */
export class DatabaseManager {
  private static instance: DatabaseManager
  private databases: Map<string, BaseDatabase> = new Map()
  private cacheManager: CacheManager
  private monitor: DatabaseMonitor

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.cacheManager = CacheManager.getInstance()
    this.monitor = DatabaseMonitor.getInstance()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  /**
   * 注册数据库
   * @param config 数据库配置
   * @param type 数据库类型
   * @returns 数据库实例
   */
  public async registerDatabase(
    config: DatabaseConfig,
    type: DatabaseType = 'indexeddb'
  ): Promise<BaseDatabase> {
    // 检查是否已存在同名数据库
    if (this.databases.has(config.name)) {
      return this.databases.get(config.name)!
    }

    let database: BaseDatabase

    // 根据类型创建不同的数据库适配器
    switch (type) {
      case 'indexeddb':
        database = new IndexedDBAdapter(config)
        break
      case 'localstorage':
        database = new LocalStorageAdapter(config)
        break
      case 'websql':
        database = new WebSQLAdapter(config)
        break
      default:
        throw new Error(`不支持的数据库类型: ${type}`)
    }

    // 初始化数据库
    await database.initialize()

    // 存储数据库实例
    this.databases.set(config.name, database)

    return database
  }

  /**
   * 创建数据库实例
   * @param name 数据库名称
   * @param type 数据库类型
   * @param config 数据库配置
   * @returns 数据库实例
   * @deprecated 使用 registerDatabase 代替
   */
  public createDatabase(name: string, type: DatabaseType, config?: DatabaseConfig): BaseDatabase {
    // 检查是否已存在同名数据库
    if (this.databases.has(name)) {
      throw new Error(`数据库 ${name} 已存在`)
    }

    let database: BaseDatabase

    // 根据类型创建不同的数据库适配器
    switch (type) {
      case 'indexeddb':
        database = new IndexedDBAdapter({
          name,
          version: config?.version || 1,
          stores: [],
          ...config,
        })
        break
      case 'localstorage':
        database = new LocalStorageAdapter({
          name,
          version: config?.version || 1,
          stores: [],
          ...config,
        })
        break
      case 'websql':
        database = new WebSQLAdapter({
          name,
          version: config?.version || 1,
          stores: [],
          ...config,
        })
        break
      default:
        throw new Error(`不支持的数据库类型: ${type}`)
    }

    // 存储数据库实例
    this.databases.set(name, database)

    return database
  }

  /**
   * 获取数据库实例
   * @param name 数据库名称
   * @returns 数据库实例
   */
  public getDatabase(name: string): BaseDatabase {
    const database = this.databases.get(name)
    if (!database) {
      throw new Error(`数据库 ${name} 不存在`)
    }
    return database
  }

  /**
   * 移除数据库实例
   * @param name 数据库名称
   * @returns 是否成功移除
   */
  public async removeDatabase(name: string): Promise<boolean> {
    const database = this.databases.get(name)
    if (database) {
      await database.close()
      return this.databases.delete(name)
    }
    return false
  }

  /**
   * 获取所有数据库实例
   * @returns 数据库实例列表
   */
  public getAllDatabases(): BaseDatabase[] {
    return Array.from(this.databases.values())
  }

  /**
   * 获取所有数据库名称
   * @returns 数据库名称列表
   */
  public getAllDatabaseNames(): string[] {
    return Array.from(this.databases.keys())
  }

  /**
   * 检查数据库是否存在
   * @param name 数据库名称
   * @returns 是否存在
   */
  public hasDatabase(name: string): boolean {
    return this.databases.has(name)
  }

  /**
   * 清空所有数据库实例
   */
  public async clearDatabases(): Promise<void> {
    // 关闭所有数据库连接
    for (const database of this.databases.values()) {
      await database.close()
    }

    // 清空数据库列表
    this.databases.clear()
  }

  /**
   * 获取缓存管理器
   */
  public getCacheManager(): CacheManager {
    return this.cacheManager
  }

  /**
   * 获取数据库监控器
   */
  public getMonitor(): DatabaseMonitor {
    return this.monitor
  }

  /**
   * 创建迁移管理器
   * @param database 数据库实例
   */
  public createMigrationManager(): MigrationManager {
    return new MigrationManager()
  }

  /**
   * 创建事务管理器
   * @param database 数据库实例
   */
  public createTransactionManager(database: BaseDatabase): TransactionManager {
    return new TransactionManager(database)
  }

  /**
   * 创建加密管理器
   * @param config 加密配置
   */
  public createEncryptionManager(config: { enabled: boolean; key?: string }): EncryptionManager {
    return new EncryptionManager(config)
  }

  /**
   * 创建同步管理器
   * @param database 数据库实例
   * @param config 同步配置
   */
  public createSyncManager(database: BaseDatabase, config: { serverUrl: string }): SyncManager {
    return new SyncManager(database, config)
  }
}
