import { DatabaseManager } from '../core/DatabaseManager'
import type { DatabaseConfig, DatabaseType } from '../types'
import type { BaseDatabase } from '../core/BaseDatabase'

/**
 * 创建数据库
 * @param config 数据库配置
 * @param type 数据库类型
 */
export async function createDatabase(
  config: DatabaseConfig,
  type: DatabaseType = 'indexeddb'
): Promise<BaseDatabase> {
  const manager = DatabaseManager.getInstance()
  return await manager.registerDatabase(config, type)
}

/**
 * 使用数据库
 */
export function useDatabase(name: string): BaseDatabase {
  const manager = DatabaseManager.getInstance()
  return manager.getDatabase(name)
}

/**
 * 创建默认的应用数据库配置
 */
export function createAppDatabaseConfig(appName: string): DatabaseConfig {
  return {
    name: `linglongos_${appName}`,
    version: 1,
    stores: [
      {
        name: 'settings',
        keyPath: 'key',
        indexes: [
          {
            name: 'category',
            keyPath: 'category',
          },
        ],
      },
      {
        name: 'cache',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          {
            name: 'timestamp',
            keyPath: 'timestamp',
          },
          {
            name: 'type',
            keyPath: 'type',
          },
        ],
      },
      {
        name: 'user_data',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          {
            name: 'created_at',
            keyPath: 'createdAt',
          },
          {
            name: 'updated_at',
            keyPath: 'updatedAt',
          },
        ],
      },
    ],
  }
}
