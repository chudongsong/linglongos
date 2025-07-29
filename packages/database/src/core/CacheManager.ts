/**
 * 缓存项
 */
interface CacheItem<T> {
  key: string
  value: T
  timestamp: number
  expireAt?: number
}

/**
 * 缓存管理器
 * 用于管理数据库查询结果的缓存
 */
export class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, CacheItem<any>> = new Map()
  private maxSize: number = 100
  private enabled: boolean = true

  /**
   * 获取单例实例
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * 启用缓存
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用缓存
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * 设置最大缓存大小
   * @param size 最大缓存大小
   */
  setMaxSize(size: number): void {
    this.maxSize = size
    this.cleanup()
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒）
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.enabled) return

    const timestamp = Date.now()
    const expireAt = ttl ? timestamp + ttl : undefined

    this.cache.set(key, {
      key,
      value,
      timestamp,
      expireAt,
    })

    // 清理过期缓存
    this.cleanup()
  }

  /**
   * 获取缓存
   * @param key 缓存键
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined

    const item = this.cache.get(key)
    if (!item) return undefined

    // 检查是否过期
    if (item.expireAt && item.expireAt < Date.now()) {
      this.cache.delete(key)
      return undefined
    }

    return item.value as T
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理过期和超出大小的缓存
   */
  private cleanup(): void {
    const now = Date.now()

    // 清理过期缓存
    for (const [key, item] of this.cache.entries()) {
      if (item.expireAt && item.expireAt < now) {
        this.cache.delete(key)
      }
    }

    // 如果缓存大小超过最大值，删除最旧的缓存
    if (this.cache.size > this.maxSize) {
      const sortedItems = Array.from(this.cache.values()).sort((a, b) => a.timestamp - b.timestamp)
      const itemsToDelete = sortedItems.slice(0, this.cache.size - this.maxSize)
      for (const item of itemsToDelete) {
        this.cache.delete(item.key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    maxSize: number
    enabled: boolean
    oldestTimestamp: number
    newestTimestamp: number
  } {
    const items = Array.from(this.cache.values())
    const timestamps = items.map(item => item.timestamp)
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0
    const newestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
      oldestTimestamp,
      newestTimestamp,
    }
  }
}
