/**
 * 加密配置接口
 */
interface EncryptionConfig {
  /** 是否启用加密 */
  enabled: boolean
  /** 加密密钥 */
  key?: string
  /** 加密算法 */
  algorithm?: string
  /** 加密字段列表 */
  fields?: string[]
  /** 是否加密所有字段 */
  encryptAll?: boolean
}

/**
 * 数据库加密管理器
 * 用于管理数据库数据的加密和解密
 */
export class EncryptionManager {
  private config: EncryptionConfig
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()
  private cryptoKey?: CryptoKey

  /**
   * 构造函数
   * @param config 加密配置
   */
  constructor(config: EncryptionConfig) {
    this.config = {
      algorithm: 'AES-GCM',
      encryptAll: false,
      ...config,
    }

    // 如果启用加密，初始化加密密钥
    if (this.config.enabled && this.config.key) {
      this.initCryptoKey()
    }
  }

  /**
   * 初始化加密密钥
   */
  private async initCryptoKey(): Promise<void> {
    if (!this.config.key) {
      throw new Error('加密密钥不能为空')
    }

    try {
      // 从密钥字符串生成密钥
      const keyData = this.encoder.encode(this.config.key)
      const keyHash = await crypto.subtle.digest('SHA-256', keyData)

      // 导入密钥
      this.cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        {
          name: this.config.algorithm || 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      )
    } catch (error) {
      console.error('初始化加密密钥失败:', error)
      throw new Error('初始化加密密钥失败')
    }
  }

  /**
   * 加密数据
   * @param data 原始数据
   */
  async encrypt<T>(data: T): Promise<T> {
    // 如果未启用加密或未设置密钥，直接返回原始数据
    if (!this.config.enabled || !this.cryptoKey) {
      return data
    }

    // 如果是基本类型，直接返回
    if (data === null || data === undefined || typeof data !== 'object') {
      return data
    }

    // 克隆数据，避免修改原始数据
    const clonedData = JSON.parse(JSON.stringify(data))

    // 如果是数组，递归加密每个元素
    if (Array.isArray(clonedData)) {
      const encryptedArray = []
      for (const item of clonedData) {
        encryptedArray.push(await this.encrypt(item))
      }
      return encryptedArray as unknown as T
    }

    // 处理对象
    const encryptedData = { ...clonedData }

    // 确定需要加密的字段
    const fieldsToEncrypt = this.config.encryptAll
      ? Object.keys(encryptedData)
      : this.config.fields || []

    // 加密指定字段
    for (const field of fieldsToEncrypt) {
      if (encryptedData[field] !== undefined && encryptedData[field] !== null) {
        // 将字段值转换为字符串
        const value =
          typeof encryptedData[field] === 'object'
            ? JSON.stringify(encryptedData[field])
            : String(encryptedData[field])

        // 生成随机IV
        const iv = crypto.getRandomValues(new Uint8Array(12))

        // 加密数据
        const dataBuffer = this.encoder.encode(value)
        const encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: this.config.algorithm || 'AES-GCM',
            iv,
          },
          this.cryptoKey!,
          dataBuffer
        )

        // 将加密后的数据和IV合并为一个数组
        const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength)
        encryptedArray.set(iv, 0)
        encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length)

        // 将加密后的数据转换为Base64字符串
        const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))

        // 存储加密后的数据
        encryptedData[field] = `encrypted:${encryptedBase64}`
      }
    }

    return encryptedData as T
  }

  /**
   * 解密数据
   * @param data 加密数据
   */
  async decrypt<T>(data: T): Promise<T> {
    // 如果未启用加密或未设置密钥，直接返回原始数据
    if (!this.config.enabled || !this.cryptoKey) {
      return data
    }

    // 如果是基本类型，直接返回
    if (data === null || data === undefined || typeof data !== 'object') {
      return data
    }

    // 克隆数据，避免修改原始数据
    const clonedData = JSON.parse(JSON.stringify(data))

    // 如果是数组，递归解密每个元素
    if (Array.isArray(clonedData)) {
      const decryptedArray = []
      for (const item of clonedData) {
        decryptedArray.push(await this.decrypt(item))
      }
      return decryptedArray as unknown as T
    }

    // 处理对象
    const decryptedData = { ...clonedData }

    // 确定需要解密的字段
    const fieldsToDecrypt = this.config.encryptAll
      ? Object.keys(decryptedData)
      : this.config.fields || []

    // 解密指定字段
    for (const field of fieldsToDecrypt) {
      if (
        decryptedData[field] !== undefined &&
        decryptedData[field] !== null &&
        typeof decryptedData[field] === 'string' &&
        decryptedData[field].startsWith('encrypted:')
      ) {
        try {
          // 提取Base64编码的加密数据
          const encryptedBase64 = decryptedData[field].substring(10)
          const encryptedArray = new Uint8Array(
            atob(encryptedBase64)
              .split('')
              .map(char => char.charCodeAt(0))
          )

          // 提取IV和加密数据
          const iv = encryptedArray.slice(0, 12)
          const encryptedBuffer = encryptedArray.slice(12)

          // 解密数据
          const decryptedBuffer = await crypto.subtle.decrypt(
            {
              name: this.config.algorithm || 'AES-GCM',
              iv,
            },
            this.cryptoKey!,
            encryptedBuffer
          )

          // 将解密后的数据转换为字符串
          const decryptedValue = this.decoder.decode(decryptedBuffer)

          // 尝试解析JSON
          try {
            decryptedData[field] = JSON.parse(decryptedValue)
          } catch {
            decryptedData[field] = decryptedValue
          }
        } catch (error) {
          console.error(`解密字段 ${field} 失败:`, error)
          // 保留原始加密数据
        }
      }
    }

    return decryptedData as T
  }

  /**
   * 更改加密密钥
   * @param newKey 新密钥
   * @param reEncryptData 是否重新加密数据
   */
  async changeKey(newKey: string, reEncryptData?: boolean): Promise<void> {
    // 保存旧密钥（未使用，但保留以便将来扩展）
    // const oldKey = this.config.key
    // const oldCryptoKey = this.cryptoKey

    // 设置新密钥
    this.config.key = newKey
    await this.initCryptoKey()

    // 如果需要重新加密数据，需要外部调用者提供数据并重新加密
    if (reEncryptData) {
      // 这里只是设置了新密钥，实际的重新加密需要外部调用者处理
      console.warn('更改密钥后，需要手动重新加密现有数据')
    }
  }

  /**
   * 启用加密
   * @param key 加密密钥
   */
  async enable(key: string): Promise<void> {
    this.config.enabled = true
    this.config.key = key
    await this.initCryptoKey()
  }

  /**
   * 禁用加密
   */
  disable(): void {
    this.config.enabled = false
    this.cryptoKey = undefined
  }

  /**
   * 检查是否启用加密
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.cryptoKey
  }

  /**
   * 设置加密字段
   * @param fields 字段列表
   */
  setEncryptFields(fields: string[]): void {
    this.config.fields = fields
    this.config.encryptAll = false
  }

  /**
   * 设置加密所有字段
   * @param encryptAll 是否加密所有字段
   */
  setEncryptAll(encryptAll: boolean): void {
    this.config.encryptAll = encryptAll
  }
}
