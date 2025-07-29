/**
 * 数据库操作类型
 */
type OperationType =
  | 'add'
  | 'put'
  | 'get'
  | 'delete'
  | 'query'
  | 'count'
  | 'clear'
  | 'transaction'
  | 'sync'

/**
 * 操作记录
 */
interface OperationRecord {
  type: OperationType
  store: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  error?: string
}

/**
 * 数据库监控器
 * 用于监控数据库性能和状态
 */
export class DatabaseMonitor {
  private static instance: DatabaseMonitor
  private operations: OperationRecord[] = []
  private maxRecords: number = 100
  private enabled: boolean = false

  /**
   * 获取单例实例
   */
  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor()
    }
    return DatabaseMonitor.instance
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * 设置最大记录数
   * @param max 最大记录数
   */
  setMaxRecords(max: number): void {
    this.maxRecords = max
  }

  /**
   * 记录操作开始
   * @param type 操作类型
   * @param store 存储名称
   */
  startOperation(type: OperationType, store: string): number {
    if (!this.enabled) return 0
    return Date.now()
  }

  /**
   * 记录操作结束
   * @param startTime 开始时间
   * @param type 操作类型
   * @param store 存储名称
   * @param success 是否成功
   * @param error 错误信息
   */
  endOperation(
    startTime: number,
    type: OperationType,
    store: string,
    success: boolean,
    error?: string
  ): void {
    if (!this.enabled || !startTime) return

    const endTime = Date.now()
    const duration = endTime - startTime

    const record: OperationRecord = {
      type,
      store,
      startTime,
      endTime,
      duration,
      success,
      error,
    }

    this.operations.push(record)

    // 限制记录数量
    if (this.operations.length > this.maxRecords) {
      this.operations.shift()
    }

    // 记录慢查询
    if (duration > 100) {
      console.warn(`慢查询: ${type} ${store} ${duration}ms`, error || '')
    }
  }

  /**
   * 获取所有操作记录
   */
  getOperations(): OperationRecord[] {
    return [...this.operations]
  }

  /**
   * 获取操作统计信息
   */
  getStats(): {
    totalOperations: number
    successOperations: number
    failedOperations: number
    averageDuration: number
    slowOperations: number
  } {
    const totalOperations = this.operations.length
    const successOperations = this.operations.filter(op => op.success).length
    const failedOperations = totalOperations - successOperations
    const totalDuration = this.operations.reduce((sum, op) => sum + op.duration, 0)
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0
    const slowOperations = this.operations.filter(op => op.duration > 100).length

    return {
      totalOperations,
      successOperations,
      failedOperations,
      averageDuration,
      slowOperations,
    }
  }

  /**
   * 清空操作记录
   */
  clearOperations(): void {
    this.operations = []
  }
}
