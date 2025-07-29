/**
 * 数据库类型
 */
export type DatabaseType = 'indexeddb' | 'localstorage' | 'websql'

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  /** 数据库名称 */
  name: string
  /** 数据库版本 */
  version: number
  /** 表配置 */
  stores: StoreConfig[]
}

/**
 * 表配置接口
 */
export interface StoreConfig {
  /** 表名 */
  name: string
  /** 主键字段 */
  keyPath?: string
  /** 自动递增 */
  autoIncrement?: boolean
  /** 索引配置 */
  indexes?: IndexConfig[]
}

/**
 * 索引配置接口
 */
export interface IndexConfig {
  /** 索引名称 */
  name: string
  /** 索引字段 */
  keyPath: string | string[]
  /** 是否唯一 */
  unique?: boolean
  /** 是否多条目 */
  multiEntry?: boolean
}

/**
 * 查询条件接口
 */
export interface QueryCondition {
  /** 字段名 */
  field: string
  /** 操作符 */
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'like'
  /** 值 */
  value: any
}

/**
 * 查询选项接口
 */
export interface QueryOptions {
  /** 排序 */
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  /** 限制数量 */
  limit?: number
  /** 偏移量 */
  offset?: number
}

/**
 * 数据库操作结果接口
 */
export interface DatabaseResult<T = any> {
  /** 是否成功 */
  success: boolean
  /** 数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** 影响的行数 */
  count?: number
}

/**
 * 事务操作接口
 */
export interface TransactionOperation {
  /** 操作类型 */
  type: 'add' | 'put' | 'delete' | 'update'
  /** 表名 */
  store: string
  /** 数据 */
  data?: any
  /** 主键 */
  key?: any
  /** 更新条件 */
  condition?: QueryCondition[]
}

/**
 * 存储定义接口
 */
export interface StoreDefinition {
  /** 存储名称 */
  name: string
  /** 键路径 */
  keyPath?: string
  /** 是否自动递增 */
  autoIncrement?: boolean
  /** 索引列表 */
  indexes?: {
    /** 索引名称 */
    name: string
    /** 键路径 */
    keyPath: string | string[]
    /** 是否唯一 */
    unique?: boolean
    /** 是否多条目 */
    multiEntry?: boolean
  }[]
}

/**
 * 数据库迁移接口
 */
export interface DatabaseMigration {
  /** 版本号 */
  version: number
  /** 升级函数 */
  upgrade: (db: IDBDatabase) => void
}
