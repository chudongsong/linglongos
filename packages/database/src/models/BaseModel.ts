import { DatabaseService } from '../services/DatabaseService'
import type { QueryCondition, QueryOptions, DatabaseResult } from '../types'

/**
 * 基础模型类
 * 提供基础的数据模型操作方法
 */
export abstract class BaseModel<T extends Record<string, any>> {
  protected dbService: DatabaseService
  protected storeName: string
  protected primaryKey: string

  /**
   * 构造函数
   * @param dbService 数据库服务
   * @param storeName 存储对象名称
   * @param primaryKey 主键字段名
   */
  constructor(dbService: DatabaseService, storeName: string, primaryKey: string = 'id') {
    this.dbService = dbService
    this.storeName = storeName
    this.primaryKey = primaryKey
  }

  /**
   * 创建数据
   * @param data 数据
   */
  async create(data: T): Promise<DatabaseResult<T>> {
    return this.dbService.add<T>(this.storeName, data)
  }

  /**
   * 批量创建数据
   * @param dataList 数据列表
   */
  async createBatch(dataList: T[]): Promise<DatabaseResult<T[]>> {
    return this.dbService.addBatch<T>(this.storeName, dataList)
  }

  /**
   * 更新数据
   * @param id 主键
   * @param data 数据
   */
  async update(id: string | number, data: Partial<T>): Promise<DatabaseResult<T>> {
    return this.dbService.update<T>(this.storeName, id, data)
  }

  /**
   * 根据条件更新数据
   * @param conditions 条件
   * @param data 数据
   */
  async updateWhere(conditions: QueryCondition[], data: Partial<T>): Promise<DatabaseResult<T[]>> {
    return this.dbService.updateWhere<T>(this.storeName, conditions, data)
  }

  /**
   * 删除数据
   * @param id 主键
   */
  async delete(id: string | number): Promise<DatabaseResult> {
    return this.dbService.delete(this.storeName, id)
  }

  /**
   * 根据条件删除数据
   * @param conditions 条件
   */
  async deleteWhere(conditions: QueryCondition[]): Promise<DatabaseResult> {
    return this.dbService.deleteWhere(this.storeName, conditions)
  }

  /**
   * 根据主键获取数据
   * @param id 主键
   */
  async get(id: string | number): Promise<DatabaseResult<T>> {
    return this.dbService.get<T>(this.storeName, id)
  }

  /**
   * 查询数据
   * @param conditions 条件
   * @param options 选项
   */
  async find(conditions?: QueryCondition[], options?: QueryOptions): Promise<DatabaseResult<T[]>> {
    return this.dbService.query<T>(this.storeName, conditions, options)
  }

  /**
   * 获取所有数据
   */
  async findAll(): Promise<DatabaseResult<T[]>> {
    return this.dbService.getAll<T>(this.storeName)
  }

  /**
   * 统计数据
   * @param conditions 条件
   */
  async count(conditions?: QueryCondition[]): Promise<DatabaseResult<number>> {
    return this.dbService.count(this.storeName, conditions)
  }

  /**
   * 清空表
   */
  async clear(): Promise<DatabaseResult> {
    return this.dbService.clear(this.storeName)
  }

  /**
   * 创建等于条件
   * @param field 字段
   * @param value 值
   */
  eq(field: keyof T, value: any): QueryCondition {
    return {
      field: field as string,
      operator: 'eq',
      value,
    }
  }

  /**
   * 创建大于条件
   * @param field 字段
   * @param value 值
   */
  gt(field: keyof T, value: any): QueryCondition {
    return {
      field: field as string,
      operator: 'gt',
      value,
    }
  }

  /**
   * 创建大于等于条件
   * @param field 字段
   * @param value 值
   */
  gte(field: keyof T, value: any): QueryCondition {
    return {
      field: field as string,
      operator: 'gte',
      value,
    }
  }

  /**
   * 创建小于条件
   * @param field 字段
   * @param value 值
   */
  lt(field: keyof T, value: any): QueryCondition {
    return {
      field: field as string,
      operator: 'lt',
      value,
    }
  }

  /**
   * 创建小于等于条件
   * @param field 字段
   * @param value 值
   */
  lte(field: keyof T, value: any): QueryCondition {
    return {
      field: field as string,
      operator: 'lte',
      value,
    }
  }

  /**
   * 创建范围条件
   * @param field 字段
   * @param min 最小值
   * @param max 最大值
   */
  between(field: keyof T, min: any, max: any): QueryCondition {
    return {
      field: field as string,
      operator: 'between',
      value: [min, max],
    }
  }

  /**
   * 创建包含条件
   * @param field 字段
   * @param values 值列表
   */
  in(field: keyof T, values: any[]): QueryCondition {
    return {
      field: field as string,
      operator: 'in',
      value: values,
    }
  }

  /**
   * 创建模糊匹配条件
   * @param field 字段
   * @param value 值
   */
  like(field: keyof T, value: string): QueryCondition {
    return {
      field: field as string,
      operator: 'like',
      value,
    }
  }
}
