import type { DatabaseMigration, StoreDefinition } from '../types'

/**
 * 迁移管理器
 * 用于管理数据库版本升级和迁移
 */
export class MigrationManager {
  private migrations: Map<number, DatabaseMigration> = new Map()

  /**
   * 添加迁移
   * @param version 版本号
   * @param upgrade 升级函数
   */
  addMigration(version: number, upgrade: (db: IDBDatabase) => void): void {
    this.migrations.set(version, { version, upgrade })
  }

  /**
   * 获取迁移
   * @param version 版本号
   */
  getMigration(version: number): DatabaseMigration | undefined {
    return this.migrations.get(version)
  }

  /**
   * 获取所有迁移
   */
  getAllMigrations(): DatabaseMigration[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.version - b.version)
  }

  /**
   * 创建存储对象
   * @param db 数据库实例
   * @param storeDefinition 存储定义
   */
  createStore(db: IDBDatabase, storeDefinition: StoreDefinition): void {
    if (db.objectStoreNames.contains(storeDefinition.name)) {
      return
    }

    const objectStore = db.createObjectStore(storeDefinition.name, {
      keyPath: storeDefinition.keyPath,
      autoIncrement: storeDefinition.autoIncrement,
    })

    // 创建索引
    if (storeDefinition.indexes) {
      for (const index of storeDefinition.indexes) {
        objectStore.createIndex(index.name, index.keyPath, {
          unique: index.unique,
          multiEntry: index.multiEntry,
        })
      }
    }
  }

  /**
   * 删除存储对象
   * @param db 数据库实例
   * @param storeName 存储名称
   */
  deleteStore(db: IDBDatabase, storeName: string): void {
    if (db.objectStoreNames.contains(storeName)) {
      db.deleteObjectStore(storeName)
    }
  }

  /**
   * 创建默认的版本升级处理函数
   * @param stores 存储定义列表
   */
  createDefaultUpgradeHandler(stores: StoreDefinition[]): (db: IDBDatabase) => void {
    return (db: IDBDatabase) => {
      for (const store of stores) {
        this.createStore(db, store)
      }
    }
  }
}
