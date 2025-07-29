import { BaseDatabase } from './BaseDatabase'
import type {
  DatabaseConfig,
  QueryCondition,
  QueryOptions,
  DatabaseResult,
  TransactionOperation,
} from '../types'

/**
 * LocalStorage 适配器
 * 使用 localStorage 作为存储后端的数据库适配器
 */
export class LocalStorageAdapter extends BaseDatabase {
  private prefix: string
  private stores: Map<string, Map<string, any>> = new Map()

  constructor(config: DatabaseConfig) {
    super(config)
    this.prefix = `${config.name}_`
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // 初始化存储对象
    for (const storeConfig of this.config.stores) {
      const storeName = storeConfig.name
      const storeKey = `${this.prefix}${storeName}`

      // 从 localStorage 加载数据
      let storeData: Map<string, any>
      const storedData = localStorage.getItem(storeKey)

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          storeData = new Map(Object.entries(parsedData))
        } catch (error) {
          storeData = new Map()
        }
      } else {
        storeData = new Map()
      }

      this.stores.set(storeName, storeData)
    }

    this.isInitialized = true
  }

  /**
   * 保存存储对象到 localStorage
   */
  private saveStore(storeName: string): void {
    const storeData = this.stores.get(storeName)
    if (storeData) {
      const storeKey = `${this.prefix}${storeName}`
      // 将 Map 转换为普通对象
      const dataObject: Record<string, any> = {}
      storeData.forEach((value, key) => {
        dataObject[key] = value
      })
      localStorage.setItem(storeKey, JSON.stringify(dataObject))
    }
  }

  /**
   * 添加数据
   */
  async add<T = any>(store: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 获取主键
      const storeConfig = this.config.stores.find(s => s.name === store)
      if (!storeConfig) {
        return {
          success: false,
          error: `存储对象配置 ${store} 不存在`,
        }
      }

      const keyPath = storeConfig.keyPath
      if (!keyPath) {
        return {
          success: false,
          error: `存储对象 ${store} 未定义主键`,
        }
      }

      // 检查主键是否已存在
      const key = (data as any)[keyPath]
      if (key === undefined) {
        return {
          success: false,
          error: `数据缺少主键 ${keyPath}`,
        }
      }

      if (storeData.has(String(key))) {
        return {
          success: false,
          error: `主键 ${key} 已存在`,
        }
      }

      // 添加数据
      storeData.set(String(key), data)
      this.saveStore(store)

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: `添加数据失败: ${error}`,
      }
    }
  }

  /**
   * 更新数据
   */
  async put<T = any>(store: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 获取主键
      const storeConfig = this.config.stores.find(s => s.name === store)
      if (!storeConfig) {
        return {
          success: false,
          error: `存储对象配置 ${store} 不存在`,
        }
      }

      const keyPath = storeConfig.keyPath
      if (!keyPath) {
        return {
          success: false,
          error: `存储对象 ${store} 未定义主键`,
        }
      }

      // 获取主键值
      const key = (data as any)[keyPath]
      if (key === undefined) {
        return {
          success: false,
          error: `数据缺少主键 ${keyPath}`,
        }
      }

      // 更新数据
      storeData.set(String(key), data)
      this.saveStore(store)

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: `更新数据失败: ${error}`,
      }
    }
  }

  /**
   * 删除数据
   */
  async delete(store: string, key: any): Promise<DatabaseResult> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 删除数据
      const result = storeData.delete(String(key))
      this.saveStore(store)

      return {
        success: result,
        error: result ? undefined : `主键 ${key} 不存在`,
      }
    } catch (error) {
      return {
        success: false,
        error: `删除数据失败: ${error}`,
      }
    }
  }

  /**
   * 根据主键获取数据
   */
  async get<T = any>(store: string, key: any): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 获取数据
      const data = storeData.get(String(key))

      if (data === undefined) {
        return {
          success: false,
          error: `主键 ${key} 不存在`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: `获取数据失败: ${error}`,
      }
    }
  }

  /**
   * 获取所有数据
   */
  async getAll<T = any>(store: string): Promise<DatabaseResult<T[]>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 获取所有数据
      const data = Array.from(storeData.values()) as T[]

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: `获取所有数据失败: ${error}`,
      }
    }
  }

  /**
   * 查询数据
   */
  async query<T = any>(
    store: string,
    conditions?: QueryCondition[],
    options?: QueryOptions
  ): Promise<DatabaseResult<T[]>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 获取所有数据
      let results = Array.from(storeData.values()) as T[]

      // 应用查询条件
      if (conditions && conditions.length > 0) {
        results = results.filter(item => this.matchesConditions(item, conditions))
      }

      // 应用排序
      if (options?.orderBy) {
        results = this.sortResults(results, options.orderBy)
      }

      // 应用分页
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const start = options.offset || 0
        const end = options.limit ? start + options.limit : undefined
        results = results.slice(start, end)
      }

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      return {
        success: false,
        error: `查询数据失败: ${error}`,
      }
    }
  }

  /**
   * 统计数据
   */
  async count(store: string, conditions?: QueryCondition[]): Promise<DatabaseResult<number>> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      if (!conditions || conditions.length === 0) {
        // 无条件统计
        return {
          success: true,
          data: storeData.size,
        }
      } else {
        // 有条件统计
        const queryResult = await this.query(store, conditions)
        if (queryResult.success && queryResult.data) {
          return {
            success: true,
            data: queryResult.data.length,
          }
        } else {
          return {
            success: false,
            error: queryResult.error || '统计失败',
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `统计数据失败: ${error}`,
      }
    }
  }

  /**
   * 清空表
   */
  async clear(store: string): Promise<DatabaseResult> {
    this.ensureInitialized()

    try {
      const storeData = this.stores.get(store)
      if (!storeData) {
        return {
          success: false,
          error: `存储对象 ${store} 不存在`,
        }
      }

      // 清空数据
      storeData.clear()
      this.saveStore(store)

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: `清空表失败: ${error}`,
      }
    }
  }

  /**
   * 执行事务
   */
  async transaction(operations: TransactionOperation[]): Promise<DatabaseResult> {
    this.ensureInitialized()

    try {
      // 本地存储不支持真正的事务，但可以模拟
      // 先备份数据
      const backups = new Map<string, Map<string, any>>()

      for (const operation of operations) {
        const storeName = operation.store
        const storeData = this.stores.get(storeName)

        if (!storeData) {
          // 回滚
          for (const [backupStore, backupData] of backups.entries()) {
            this.stores.set(backupStore, backupData)
            this.saveStore(backupStore)
          }

          return {
            success: false,
            error: `存储对象 ${storeName} 不存在`,
          }
        }

        // 备份数据
        if (!backups.has(storeName)) {
          backups.set(storeName, new Map(storeData))
        }
      }

      // 执行操作
      for (const operation of operations) {
        const storeName = operation.store
        const storeData = this.stores.get(storeName)!

        switch (operation.type) {
          case 'add': {
            const result = await this.add(storeName, operation.data)
            if (!result.success) {
              // 回滚
              for (const [backupStore, backupData] of backups.entries()) {
                this.stores.set(backupStore, backupData)
                this.saveStore(backupStore)
              }

              return result
            }
            break
          }
          case 'put': {
            const result = await this.put(storeName, operation.data)
            if (!result.success) {
              // 回滚
              for (const [backupStore, backupData] of backups.entries()) {
                this.stores.set(backupStore, backupData)
                this.saveStore(backupStore)
              }

              return result
            }
            break
          }
          case 'delete': {
            const result = await this.delete(storeName, operation.key)
            if (!result.success) {
              // 回滚
              for (const [backupStore, backupData] of backups.entries()) {
                this.stores.set(backupStore, backupData)
                this.saveStore(backupStore)
              }

              return result
            }
            break
          }
          case 'update': {
            // 获取数据
            const getResult = await this.get(storeName, operation.key)
            if (!getResult.success) {
              // 回滚
              for (const [backupStore, backupData] of backups.entries()) {
                this.stores.set(backupStore, backupData)
                this.saveStore(backupStore)
              }

              return getResult
            }

            // 更新数据
            const updatedData = { ...getResult.data, ...operation.data }
            const putResult = await this.put(storeName, updatedData)
            if (!putResult.success) {
              // 回滚
              for (const [backupStore, backupData] of backups.entries()) {
                this.stores.set(backupStore, backupData)
                this.saveStore(backupStore)
              }

              return putResult
            }
            break
          }
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: `事务执行失败: ${error}`,
      }
    }
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    // LocalStorage 不需要关闭连接
    this.isInitialized = false
  }

  /**
   * 检查记录是否匹配条件
   */
  private matchesConditions(record: any, conditions: QueryCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = record[condition.field]

      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value
        case 'gt':
          return fieldValue > condition.value
        case 'gte':
          return fieldValue >= condition.value
        case 'lt':
          return fieldValue < condition.value
        case 'lte':
          return fieldValue <= condition.value
        case 'between':
          return (
            Array.isArray(condition.value) &&
            fieldValue >= condition.value[0] &&
            fieldValue <= condition.value[1]
          )
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue)
        case 'like':
          return (
            typeof fieldValue === 'string' &&
            typeof condition.value === 'string' &&
            fieldValue.toLowerCase().includes(condition.value.toLowerCase())
          )
        default:
          return false
      }
    })
  }

  /**
   * 排序结果
   */
  private sortResults<T>(results: T[], orderBy: { field: string; direction: 'asc' | 'desc' }): T[] {
    return [...results].sort((a, b) => {
      const aValue = (a as any)[orderBy.field]
      const bValue = (b as any)[orderBy.field]

      if (aValue < bValue) {
        return orderBy.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return orderBy.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }
}
