import { BaseDatabase } from './BaseDatabase'
import { DatabaseMonitor } from './DatabaseMonitor'
import type { DatabaseResult } from '../types'

/**
 * 同步配置接口
 */
interface SyncConfig {
  /** 远程服务器URL */
  serverUrl: string
  /** 同步间隔（毫秒） */
  interval?: number
  /** 自动同步 */
  autoSync?: boolean
  /** 冲突解决策略 */
  conflictResolution?: 'server' | 'client' | 'manual'
  /** 同步表列表 */
  stores?: string[]
  /** 认证令牌 */
  authToken?: string
}

/**
 * 同步状态
 */
interface SyncStatus {
  /** 最后同步时间 */
  lastSyncTime?: number
  /** 是否正在同步 */
  isSyncing: boolean
  /** 同步错误 */
  error?: string
  /** 上传的记录数 */
  uploadedRecords: number
  /** 下载的记录数 */
  downloadedRecords: number
  /** 冲突的记录数 */
  conflictRecords: number
}

/**
 * 同步记录
 */
interface SyncRecord {
  /** 表名 */
  store: string
  /** 记录ID */
  id: string | number
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete'
  /** 数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 数据库同步管理器
 * 用于管理数据库与远程服务器的同步
 */
export class SyncManager {
  private database: BaseDatabase
  private config: SyncConfig
  private status: SyncStatus = {
    isSyncing: false,
    uploadedRecords: 0,
    downloadedRecords: 0,
    conflictRecords: 0,
  }
  private pendingChanges: Map<string, SyncRecord> = new Map()
  private syncInterval?: number
  private monitor = DatabaseMonitor.getInstance()

  /**
   * 构造函数
   * @param database 数据库实例
   * @param config 同步配置
   */
  constructor(database: BaseDatabase, config: SyncConfig) {
    this.database = database
    this.config = {
      interval: 60000, // 默认1分钟
      autoSync: false,
      conflictResolution: 'server',
      ...config,
    }

    // 如果启用自动同步，开始同步定时器
    if (this.config.autoSync) {
      this.startAutoSync()
    }
  }

  /**
   * 开始自动同步
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = window.setInterval(() => {
      this.sync().catch(error => {
        console.error('自动同步失败:', error)
      })
    }, this.config.interval)
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = undefined
    }
  }

  /**
   * 手动同步
   */
  async sync(): Promise<DatabaseResult> {
    if (this.status.isSyncing) {
      return {
        success: false,
        error: '同步已在进行中',
      }
    }

    try {
      this.status.isSyncing = true
      const startTime = this.monitor.startOperation('sync', 'all')

      // 获取需要同步的表
      const stores = this.config.stores || []
      if (stores.length === 0) {
        return {
          success: false,
          error: '没有配置需要同步的表',
        }
      }

      // 获取上次同步时间
      const lastSyncTime = this.status.lastSyncTime || 0

      // 上传本地更改
      const uploadResult = await this.uploadChanges(lastSyncTime)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // 下载远程更改
      const downloadResult = await this.downloadChanges(lastSyncTime)
      if (!downloadResult.success) {
        throw new Error(downloadResult.error)
      }

      // 更新同步状态
      this.status.lastSyncTime = Date.now()
      this.status.uploadedRecords = uploadResult.data?.length || 0
      this.status.downloadedRecords = downloadResult.data?.length || 0

      this.monitor.endOperation(startTime, 'sync', 'all', true)

      return {
        success: true,
        data: {
          uploaded: this.status.uploadedRecords,
          downloaded: this.status.downloadedRecords,
          conflicts: this.status.conflictRecords,
        },
      }
    } catch (error) {
      this.status.error = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: this.status.error,
      }
    } finally {
      this.status.isSyncing = false
    }
  }

  /**
   * 上传本地更改
   * @param lastSyncTime 上次同步时间
   */
  private async uploadChanges(lastSyncTime: number): Promise<DatabaseResult<SyncRecord[]>> {
    try {
      // 收集所有待上传的更改
      const changes: SyncRecord[] = Array.from(this.pendingChanges.values())

      // 如果没有待上传的更改，直接返回
      if (changes.length === 0) {
        return {
          success: true,
          data: [],
        }
      }

      // 发送更改到服务器
      const response = await fetch(`${this.config.serverUrl}/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
        body: JSON.stringify({
          changes,
          lastSyncTime,
        }),
      })

      if (!response.ok) {
        throw new Error(`上传更改失败: ${response.statusText}`)
      }

      const result = await response.json()

      // 清空已上传的更改
      this.pendingChanges.clear()

      return {
        success: true,
        data: changes,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传更改失败',
      }
    }
  }

  /**
   * 下载远程更改
   * @param lastSyncTime 上次同步时间
   */
  private async downloadChanges(lastSyncTime: number): Promise<DatabaseResult<SyncRecord[]>> {
    try {
      // 从服务器获取更改
      const response = await fetch(
        `${this.config.serverUrl}/sync/download?lastSyncTime=${lastSyncTime}`,
        {
          headers: {
            ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
          },
        }
      )

      if (!response.ok) {
        throw new Error(`下载更改失败: ${response.statusText}`)
      }

      const result = await response.json()
      const remoteChanges: SyncRecord[] = result.changes || []

      // 如果没有远程更改，直接返回
      if (remoteChanges.length === 0) {
        return {
          success: true,
          data: [],
        }
      }

      // 应用远程更改到本地数据库
      await this.applyRemoteChanges(remoteChanges)

      return {
        success: true,
        data: remoteChanges,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载更改失败',
      }
    }
  }

  /**
   * 应用远程更改到本地数据库
   * @param changes 远程更改
   */
  private async applyRemoteChanges(changes: SyncRecord[]): Promise<void> {
    // 按表分组更改
    const changesByStore = new Map<string, SyncRecord[]>()
    for (const change of changes) {
      if (!changesByStore.has(change.store)) {
        changesByStore.set(change.store, [])
      }
      changesByStore.get(change.store)!.push(change)
    }

    // 逐个表应用更改
    for (const [store, storeChanges] of changesByStore.entries()) {
      for (const change of storeChanges) {
        try {
          switch (change.operation) {
            case 'create':
            case 'update':
              if (change.data) {
                await this.database.put(store, change.data)
              }
              break
            case 'delete':
              await this.database.delete(store, change.id)
              break
          }
        } catch (error) {
          console.error(`应用更改失败: ${store} ${change.id}`, error)
          this.status.conflictRecords++
        }
      }
    }
  }

  /**
   * 记录本地更改
   * @param store 表名
   * @param id 记录ID
   * @param operation 操作类型
   * @param data 数据
   */
  recordChange(
    store: string,
    id: string | number,
    operation: 'create' | 'update' | 'delete',
    data?: any
  ): void {
    // 只记录需要同步的表的更改
    if (this.config.stores && !this.config.stores.includes(store)) {
      return
    }

    const key = `${store}:${id}`
    const timestamp = Date.now()

    this.pendingChanges.set(key, {
      store,
      id,
      operation,
      data,
      timestamp,
    })
  }

  /**
   * 获取同步状态
   */
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  /**
   * 获取待同步的更改数量
   */
  getPendingChangesCount(): number {
    return this.pendingChanges.size
  }

  /**
   * 重置同步状态
   */
  resetStatus(): void {
    this.status = {
      lastSyncTime: undefined,
      isSyncing: false,
      uploadedRecords: 0,
      downloadedRecords: 0,
      conflictRecords: 0,
    }
  }

  /**
   * 清空待同步的更改
   */
  clearPendingChanges(): void {
    this.pendingChanges.clear()
  }
}
