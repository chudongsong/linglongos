import { BaseDatabase } from './BaseDatabase'
import type {
  DatabaseConfig,
  QueryCondition,
  QueryOptions,
  DatabaseResult,
  TransactionOperation,
} from '../types'

/**
 * IndexedDB 适配器
 */
export class IndexedDBAdapter extends BaseDatabase {
  private db: IDBDatabase | null = null

  constructor(config: DatabaseConfig) {
    super(config)
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version)

      request.onerror = () => {
        reject(new Error(`打开数据库失败: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        for (const storeConfig of this.config.stores) {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement,
            })

            // 创建索引
            if (storeConfig.indexes) {
              for (const indexConfig of storeConfig.indexes) {
                store.createIndex(indexConfig.name, indexConfig.keyPath, {
                  unique: indexConfig.unique,
                })
              }
            }
          }
        }
      }
    })
  }

  /**
   * 添加数据
   */
  async add<T = any>(store: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.add(data)

      request.onsuccess = () => {
        resolve({
          success: true,
          data,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `添加数据失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 更新数据
   */
  async put<T = any>(store: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.put(data)

      request.onsuccess = () => {
        resolve({
          success: true,
          data,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `更新数据失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 删除数据
   */
  async delete(store: string, key: any): Promise<DatabaseResult> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.delete(key)

      request.onsuccess = () => {
        resolve({
          success: true,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `删除数据失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 根据主键获取数据
   */
  async get<T = any>(store: string, key: any): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.get(key)

      request.onsuccess = () => {
        resolve({
          success: true,
          data: request.result,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `获取数据失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T = any>(store: string): Promise<DatabaseResult<T[]>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        resolve({
          success: true,
          data: request.result,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `获取所有数据失败: ${request.error?.message}`,
        })
      }
    })
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

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const results: T[] = []

      const request = objectStore.openCursor()

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result

        if (cursor) {
          const record = cursor.value

          // 应用查询条件
          if (!conditions || this.matchesConditions(record, conditions)) {
            results.push(record)
          }

          cursor.continue()
        } else {
          // 应用排序和分页
          let finalResults = results

          if (options?.orderBy) {
            finalResults = this.sortResults(finalResults, options.orderBy)
          }

          if (options?.offset || options?.limit) {
            const start = options.offset || 0
            const end = options.limit ? start + options.limit : undefined
            finalResults = finalResults.slice(start, end)
          }

          resolve({
            success: true,
            data: finalResults,
          })
        }
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `查询数据失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 统计数据
   */
  async count(store: string, conditions?: QueryCondition[]): Promise<DatabaseResult<number>> {
    this.ensureInitialized()

    if (!conditions) {
      return new Promise(resolve => {
        const transaction = this.db!.transaction([store], 'readonly')
        const objectStore = transaction.objectStore(store)
        const request = objectStore.count()

        request.onsuccess = () => {
          resolve({
            success: true,
            data: request.result,
          })
        }

        request.onerror = () => {
          resolve({
            success: false,
            error: `统计数据失败: ${request.error?.message}`,
          })
        }
      })
    }

    // 有条件的统计需要遍历
    const queryResult = await this.query(store, conditions)
    if (queryResult.success) {
      return {
        success: true,
        data: queryResult.data?.length || 0,
      }
    }

    return {
      success: false,
      error: queryResult.error,
    }
  }

  /**
   * 清空表
   */
  async clear(store: string): Promise<DatabaseResult> {
    this.ensureInitialized()

    return new Promise(resolve => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.clear()

      request.onsuccess = () => {
        resolve({
          success: true,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          error: `清空表失败: ${request.error?.message}`,
        })
      }
    })
  }

  /**
   * 执行事务
   */
  async transaction(operations: TransactionOperation[]): Promise<DatabaseResult> {
    this.ensureInitialized()

    const storeNames = [...new Set(operations.map(op => op.store))]
    const transaction = this.db!.transaction(storeNames, 'readwrite')

    return new Promise(resolve => {
      transaction.oncomplete = () => {
        resolve({
          success: true,
        })
      }

      transaction.onerror = () => {
        resolve({
          success: false,
          error: `事务执行失败: ${transaction.error?.message}`,
        })
      }

      // 执行操作
      for (const operation of operations) {
        const objectStore = transaction.objectStore(operation.store)

        switch (operation.type) {
          case 'add':
            objectStore.add(operation.data)
            break
          case 'put':
            objectStore.put(operation.data)
            break
          case 'delete':
            objectStore.delete(operation.key)
            break
          case 'update':
            // 更新操作需要先查询再更新
            const getRequest = objectStore.get(operation.key)
            getRequest.onsuccess = () => {
              const existingData = getRequest.result
              if (existingData) {
                const updatedData = { ...existingData, ...operation.data }
                objectStore.put(updatedData)
              }
            }
            break
        }
      }
    })
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
    }
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
          return fieldValue >= condition.value[0] && fieldValue <= condition.value[1]
        case 'in':
          return condition.value.includes(fieldValue)
        case 'like':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
        default:
          return false
      }
    })
  }

  /**
   * 排序结果
   */
  private sortResults<T>(results: T[], orderBy: { field: string; direction: 'asc' | 'desc' }): T[] {
    return results.sort((a, b) => {
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
