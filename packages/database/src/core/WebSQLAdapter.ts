import { BaseDatabase } from './BaseDatabase'
import type {
  DatabaseConfig,
  QueryCondition,
  QueryOptions,
  DatabaseResult,
  TransactionOperation,
} from '../types'

/**
 * WebSQL 数据库接口
 */
interface Database {
  transaction(
    callback: (tx: SQLTransaction) => void,
    errorCallback?: (error: any) => void,
    successCallback?: () => void
  ): void
  readTransaction(
    callback: (tx: SQLTransaction) => void,
    errorCallback?: (error: any) => void,
    successCallback?: () => void
  ): void
  version: string
}

/**
 * SQLTransaction 接口
 */
interface SQLTransaction {
  executeSql(
    sqlStatement: string,
    args?: any[],
    callback?: (tx: SQLTransaction, resultSet: SQLResultSet) => void,
    errorCallback?: (tx: SQLTransaction, error: any) => boolean
  ): void
}

/**
 * SQLResultSet 接口
 */
interface SQLResultSet {
  insertId: number
  rowsAffected: number
  rows: {
    length: number
    item(index: number): any
  }
}

/**
 * WebSQL 适配器
 * 使用 WebSQL 作为存储后端的数据库适配器
 */
export class WebSQLAdapter extends BaseDatabase {
  private db: Database | null = null

  constructor(config: DatabaseConfig) {
    super(config)
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 检查浏览器是否支持 WebSQL
        if (!(window as any).openDatabase) {
          reject(new Error('当前浏览器不支持 WebSQL'))
          return
        }

        // 打开数据库
        this.db = (window as any).openDatabase(
          this.config.name,
          String(this.config.version),
          `${this.config.name} Database`,
          5 * 1024 * 1024 // 5MB
        )

        // 创建表
        const promises: Promise<void>[] = []
        for (const storeConfig of this.config.stores) {
          promises.push(this.createTable(storeConfig))
        }

        Promise.all(promises)
          .then(() => {
            this.isInitialized = true
            resolve()
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 创建表
   */
  private createTable(storeConfig: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const tableName = storeConfig.name
      const keyPath = storeConfig.keyPath || 'id'
      const autoIncrement = storeConfig.autoIncrement

      // 构建创建表的 SQL
      let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (`

      // 添加主键
      if (autoIncrement) {
        sql += `${keyPath} INTEGER PRIMARY KEY AUTOINCREMENT`
      } else {
        sql += `${keyPath} TEXT PRIMARY KEY`
      }

      // 添加其他字段（由于 WebSQL 是基于模式的，我们需要预定义字段）
      // 这里简化处理，添加一个 data 字段存储 JSON 数据
      sql += `, data TEXT`

      // 添加索引字段
      if (storeConfig.indexes) {
        for (const indexConfig of storeConfig.indexes) {
          const indexName = indexConfig.name
          sql += `, ${indexName} TEXT`
        }
      }

      sql += `)`

      // 执行 SQL
      this.db.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(sql, [], () => {
            // 创建索引
            if (storeConfig.indexes) {
              const indexPromises = storeConfig.indexes.map((indexConfig: any) =>
                this.createIndex(tx, tableName, indexConfig)
              )
              Promise.all(indexPromises)
                .then(() => resolve())
                .catch(reject)
            } else {
              resolve()
            }
          })
        },
        (error: any) => {
          reject(new Error(`创建表失败: ${error.message}`))
        }
      )
    })
  }

  /**
   * 创建索引
   */
  private createIndex(tx: SQLTransaction, tableName: string, indexConfig: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const indexName = indexConfig.name
      const unique = indexConfig.unique ? 'UNIQUE' : ''
      const sql = `CREATE ${unique} INDEX IF NOT EXISTS idx_${tableName}_${indexName} ON ${tableName} (${indexName})`

      tx.executeSql(
        sql,
        [],
        () => {
          resolve()
        },
        (_: SQLTransaction, error: any) => {
          reject(new Error(`创建索引失败: ${error.message}`))
          return false
        }
      )
    })
  }

  /**
   * 添加数据
   */
  async add<T = any>(storeName: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 获取主键
        const storeConfig = this.config.stores.find(s => s.name === storeName)
        if (!storeConfig) {
          resolve({
            success: false,
            error: `存储对象配置 ${storeName} 不存在`,
          })
          return
        }

        const keyPath = storeConfig.keyPath || 'id'
        const key = (data as any)[keyPath]

        // 提取索引值
        const indexValues: any = {}
        if (storeConfig.indexes) {
          for (const indexConfig of storeConfig.indexes) {
            const indexName = indexConfig.name
            indexValues[indexName] = (data as any)[indexName]
          }
        }

        // 构建 SQL
        let sql = `INSERT INTO ${storeName} (${keyPath}, data`
        let placeholders = '(?, ?'
        const params: any[] = [key, JSON.stringify(data)]

        // 添加索引字段
        for (const indexName in indexValues) {
          sql += `, ${indexName}`
          placeholders += ', ?'
          params.push(indexValues[indexName])
        }

        sql += `) VALUES ${placeholders})`

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              params,
              (_: SQLTransaction, result: SQLResultSet) => {
                resolve({
                  success: true,
                  data,
                  count: result.rowsAffected,
                })
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `添加数据失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `添加数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 更新数据
   */
  async put<T = any>(storeName: string, data: T): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 获取主键
        const storeConfig = this.config.stores.find(s => s.name === storeName)
        if (!storeConfig) {
          resolve({
            success: false,
            error: `存储对象配置 ${storeName} 不存在`,
          })
          return
        }

        const keyPath = storeConfig.keyPath || 'id'
        const key = (data as any)[keyPath]

        // 提取索引值
        const indexValues: any = {}
        if (storeConfig.indexes) {
          for (const indexConfig of storeConfig.indexes) {
            const indexName = indexConfig.name
            indexValues[indexName] = (data as any)[indexName]
          }
        }

        // 构建 SQL
        let sql = `UPDATE ${storeName} SET data = ?`
        const params: any[] = [JSON.stringify(data)]

        // 添加索引字段
        for (const indexName in indexValues) {
          sql += `, ${indexName} = ?`
          params.push(indexValues[indexName])
        }

        sql += ` WHERE ${keyPath} = ?`
        params.push(key)

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              params,
              (_: SQLTransaction, result: SQLResultSet) => {
                if (result.rowsAffected > 0) {
                  resolve({
                    success: true,
                    data,
                    count: result.rowsAffected,
                  })
                } else {
                  // 如果没有更新任何行，可能是因为记录不存在，尝试插入
                  this.add(storeName, data).then(resolve)
                }
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `更新数据失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `更新数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, key: any): Promise<DatabaseResult> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 获取主键
        const storeConfig = this.config.stores.find(s => s.name === storeName)
        if (!storeConfig) {
          resolve({
            success: false,
            error: `存储对象配置 ${storeName} 不存在`,
          })
          return
        }

        const keyPath = storeConfig.keyPath || 'id'

        // 构建 SQL
        const sql = `DELETE FROM ${storeName} WHERE ${keyPath} = ?`

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              [key],
              (_: SQLTransaction, result: SQLResultSet) => {
                resolve({
                  success: true,
                  count: result.rowsAffected,
                })
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `删除数据失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `删除数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 根据主键获取数据
   */
  async get<T = any>(storeName: string, key: any): Promise<DatabaseResult<T>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 获取主键
        const storeConfig = this.config.stores.find(s => s.name === storeName)
        if (!storeConfig) {
          resolve({
            success: false,
            error: `存储对象配置 ${storeName} 不存在`,
          })
          return
        }

        const keyPath = storeConfig.keyPath || 'id'

        // 构建 SQL
        const sql = `SELECT data FROM ${storeName} WHERE ${keyPath} = ?`

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              [key],
              (_: SQLTransaction, result: SQLResultSet) => {
                if (result.rows.length > 0) {
                  try {
                    const data = JSON.parse(result.rows.item(0).data)
                    resolve({
                      success: true,
                      data,
                    })
                  } catch (error: any) {
                    resolve({
                      success: false,
                      error: `解析数据失败: ${error.message}`,
                    })
                  }
                } else {
                  resolve({
                    success: false,
                    error: `主键 ${key} 不存在`,
                  })
                }
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `获取数据失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `获取数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T = any>(storeName: string): Promise<DatabaseResult<T[]>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 构建 SQL
        const sql = `SELECT data FROM ${storeName}`

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              [],
              (_: SQLTransaction, result: SQLResultSet) => {
                try {
                  const data: T[] = []
                  for (let i = 0; i < result.rows.length; i++) {
                    data.push(JSON.parse(result.rows.item(i).data))
                  }
                  resolve({
                    success: true,
                    data,
                  })
                } catch (error: any) {
                  resolve({
                    success: false,
                    error: `解析数据失败: ${error.message}`,
                  })
                }
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `获取所有数据失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `获取所有数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 查询数据
   */
  async query<T = any>(
    storeName: string,
    conditions?: QueryCondition[],
    options?: QueryOptions
  ): Promise<DatabaseResult<T[]>> {
    this.ensureInitialized()

    // 如果没有条件，直接返回所有数据
    if (!conditions || conditions.length === 0) {
      return this.getAll<T>(storeName)
    }

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 获取所有数据，然后在内存中过滤
        this.getAll<T>(storeName).then(result => {
          if (!result.success) {
            resolve(result)
            return
          }

          let data = result.data || []

          // 应用查询条件
          if (conditions && conditions.length > 0) {
            data = data.filter(item => this.matchConditions(item, conditions))
          }

          // 应用排序
          if (options?.orderBy) {
            data = this.sortData(data, options.orderBy)
          }

          // 应用分页
          if (options?.offset !== undefined || options?.limit !== undefined) {
            const start = options.offset || 0
            const end = options.limit ? start + options.limit : undefined
            data = data.slice(start, end)
          }

          resolve({
            success: true,
            data,
          })
        })
      } catch (error: any) {
        resolve({
          success: false,
          error: `查询数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 统计数据
   */
  async count(storeName: string, conditions?: QueryCondition[]): Promise<DatabaseResult<number>> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        if (!conditions || conditions.length === 0) {
          // 无条件统计
          const sql = `SELECT COUNT(*) as count FROM ${storeName}`

          this.db.transaction(
            (tx: SQLTransaction) => {
              tx.executeSql(
                sql,
                [],
                (_: SQLTransaction, result: SQLResultSet) => {
                  resolve({
                    success: true,
                    data: result.rows.item(0).count,
                  })
                },
                (_: SQLTransaction, error: any) => {
                  resolve({
                    success: false,
                    error: `统计数据失败: ${error.message}`,
                  })
                  return false
                }
              )
            },
            (error: any) => {
              resolve({
                success: false,
                error: `事务执行失败: ${error.message}`,
              })
            }
          )
        } else {
          // 有条件统计，先查询再统计
          this.query(storeName, conditions).then(result => {
            if (result.success && result.data) {
              resolve({
                success: true,
                data: result.data.length,
              })
            } else {
              resolve({
                success: false,
                error: result.error || '统计失败',
              })
            }
          })
        }
      } catch (error: any) {
        resolve({
          success: false,
          error: `统计数据失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 清空表
   */
  async clear(storeName: string): Promise<DatabaseResult> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        // 构建 SQL
        const sql = `DELETE FROM ${storeName}`

        // 执行 SQL
        this.db.transaction(
          (tx: SQLTransaction) => {
            tx.executeSql(
              sql,
              [],
              (_: SQLTransaction, result: SQLResultSet) => {
                resolve({
                  success: true,
                  count: result.rowsAffected,
                })
              },
              (_: SQLTransaction, error: any) => {
                resolve({
                  success: false,
                  error: `清空表失败: ${error.message}`,
                })
                return false
              }
            )
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `清空表失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 执行事务
   */
  async transaction(operations: TransactionOperation[]): Promise<DatabaseResult> {
    this.ensureInitialized()

    return new Promise(resolve => {
      if (!this.db) {
        resolve({
          success: false,
          error: '数据库未初始化',
        })
        return
      }

      try {
        this.db.transaction(
          (tx: SQLTransaction) => {
            const executeOperation = async (index: number): Promise<void> => {
              if (index >= operations.length) {
                resolve({
                  success: true,
                })
                return
              }

              const operation = operations[index]
              const { type, store, data, key } = operation

              try {
                switch (type) {
                  case 'add': {
                    // 获取主键
                    const storeConfig = this.config.stores.find(s => s.name === store)
                    if (!storeConfig) {
                      throw new Error(`存储对象配置 ${store} 不存在`)
                    }

                    const keyPath = storeConfig.keyPath || 'id'
                    const keyValue = (data as any)[keyPath]

                    // 提取索引值
                    const indexValues: any = {}
                    if (storeConfig.indexes) {
                      for (const indexConfig of storeConfig.indexes) {
                        const indexName = indexConfig.name
                        indexValues[indexName] = (data as any)[indexName]
                      }
                    }

                    // 构建 SQL
                    let sql = `INSERT INTO ${store} (${keyPath}, data`
                    let placeholders = '(?, ?'
                    const params: any[] = [keyValue, JSON.stringify(data)]

                    // 添加索引字段
                    for (const indexName in indexValues) {
                      sql += `, ${indexName}`
                      placeholders += ', ?'
                      params.push(indexValues[indexName])
                    }

                    sql += `) VALUES ${placeholders})`

                    // 执行 SQL
                    tx.executeSql(
                      sql,
                      params,
                      () => {
                        executeOperation(index + 1)
                      },
                      (_: SQLTransaction, error: any) => {
                        resolve({
                          success: false,
                          error: `添加数据失败: ${error.message}`,
                        })
                        return true // 回滚事务
                      }
                    )
                    break
                  }
                  case 'put': {
                    // 获取主键
                    const storeConfig = this.config.stores.find(s => s.name === store)
                    if (!storeConfig) {
                      throw new Error(`存储对象配置 ${store} 不存在`)
                    }

                    const keyPath = storeConfig.keyPath || 'id'
                    const keyValue = (data as any)[keyPath]

                    // 提取索引值
                    const indexValues: any = {}
                    if (storeConfig.indexes) {
                      for (const indexConfig of storeConfig.indexes) {
                        const indexName = indexConfig.name
                        indexValues[indexName] = (data as any)[indexName]
                      }
                    }

                    // 构建 SQL
                    let sql = `UPDATE ${store} SET data = ?`
                    const params: any[] = [JSON.stringify(data)]

                    // 添加索引字段
                    for (const indexName in indexValues) {
                      sql += `, ${indexName} = ?`
                      params.push(indexValues[indexName])
                    }

                    sql += ` WHERE ${keyPath} = ?`
                    params.push(keyValue)

                    // 执行 SQL
                    tx.executeSql(
                      sql,
                      params,
                      (_: SQLTransaction, result: SQLResultSet) => {
                        if (result.rowsAffected > 0) {
                          executeOperation(index + 1)
                        } else {
                          // 如果没有更新任何行，可能是因为记录不存在，尝试插入
                          let insertSql = `INSERT INTO ${store} (${keyPath}, data`
                          let placeholders = '(?, ?'
                          const insertParams: any[] = [keyValue, JSON.stringify(data)]

                          // 添加索引字段
                          for (const indexName in indexValues) {
                            insertSql += `, ${indexName}`
                            placeholders += ', ?'
                            insertParams.push(indexValues[indexName])
                          }

                          insertSql += `) VALUES ${placeholders})`

                          tx.executeSql(
                            insertSql,
                            insertParams,
                            () => {
                              executeOperation(index + 1)
                            },
                            (_: SQLTransaction, error: any) => {
                              resolve({
                                success: false,
                                error: `更新数据失败: ${error.message}`,
                              })
                              return true // 回滚事务
                            }
                          )
                        }
                      },
                      (_: SQLTransaction, error: any) => {
                        resolve({
                          success: false,
                          error: `更新数据失败: ${error.message}`,
                        })
                        return true // 回滚事务
                      }
                    )
                    break
                  }
                  case 'delete': {
                    // 获取主键
                    const storeConfig = this.config.stores.find(s => s.name === store)
                    if (!storeConfig) {
                      throw new Error(`存储对象配置 ${store} 不存在`)
                    }

                    const keyPath = storeConfig.keyPath || 'id'

                    // 构建 SQL
                    const sql = `DELETE FROM ${store} WHERE ${keyPath} = ?`

                    // 执行 SQL
                    tx.executeSql(
                      sql,
                      [key],
                      () => {
                        executeOperation(index + 1)
                      },
                      (_: SQLTransaction, error: any) => {
                        resolve({
                          success: false,
                          error: `删除数据失败: ${error.message}`,
                        })
                        return true // 回滚事务
                      }
                    )
                    break
                  }
                  case 'update': {
                    // 获取主键
                    const storeConfig = this.config.stores.find(s => s.name === store)
                    if (!storeConfig) {
                      throw new Error(`存储对象配置 ${store} 不存在`)
                    }

                    const keyPath = storeConfig.keyPath || 'id'

                    // 先获取数据
                    const sql = `SELECT data FROM ${store} WHERE ${keyPath} = ?`

                    tx.executeSql(
                      sql,
                      [key],
                      (_: SQLTransaction, result: SQLResultSet) => {
                        if (result.rows.length > 0) {
                          try {
                            const existingData = JSON.parse(result.rows.item(0).data)
                            const updatedData = { ...existingData, ...data }

                            // 提取索引值
                            const indexValues: any = {}
                            if (storeConfig.indexes) {
                              for (const indexConfig of storeConfig.indexes) {
                                const indexName = indexConfig.name
                                indexValues[indexName] = updatedData[indexName]
                              }
                            }

                            // 构建更新 SQL
                            let updateSql = `UPDATE ${store} SET data = ?`
                            const params: any[] = [JSON.stringify(updatedData)]

                            // 添加索引字段
                            for (const indexName in indexValues) {
                              updateSql += `, ${indexName} = ?`
                              params.push(indexValues[indexName])
                            }

                            updateSql += ` WHERE ${keyPath} = ?`
                            params.push(key)

                            // 执行更新
                            tx.executeSql(
                              updateSql,
                              params,
                              () => {
                                executeOperation(index + 1)
                              },
                              (_: SQLTransaction, error: any) => {
                                resolve({
                                  success: false,
                                  error: `更新数据失败: ${error.message}`,
                                })
                                return true // 回滚事务
                              }
                            )
                          } catch (error: any) {
                            resolve({
                              success: false,
                              error: `解析数据失败: ${error.message}`,
                            })
                          }
                        } else {
                          resolve({
                            success: false,
                            error: `主键 ${key} 不存在`,
                          })
                        }
                      },
                      (_: SQLTransaction, error: any) => {
                        resolve({
                          success: false,
                          error: `获取数据失败: ${error.message}`,
                        })
                        return true // 回滚事务
                      }
                    )
                    break
                  }
                  default:
                    executeOperation(index + 1)
                    break
                }
              } catch (error: any) {
                resolve({
                  success: false,
                  error: `执行操作失败: ${error.message}`,
                })
              }
            }

            // 开始执行第一个操作
            executeOperation(0)
          },
          (error: any) => {
            resolve({
              success: false,
              error: `事务执行失败: ${error.message}`,
            })
          }
        )
      } catch (error: any) {
        resolve({
          success: false,
          error: `执行事务失败: ${error.message}`,
        })
      }
    })
  }

  /**
   * 检查记录是否匹配条件
   */
  private matchConditions(record: any, conditions: QueryCondition[]): boolean {
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
   * 排序数据
   */
  private sortData<T>(data: T[], orderBy: { field: string; direction: 'asc' | 'desc' }): T[] {
    return [...data].sort((a, b) => {
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

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    // WebSQL 没有提供关闭数据库的方法
    // 只需要清除引用
    this.db = null
    this.isInitialized = false
  }
}
