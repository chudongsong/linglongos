import NodeCache from 'node-cache';
import { cryptoService, EncryptedData } from '@/services/crypto.service';
import { UserCredentials } from '@/types';
import { logger } from '@/utils/logger';

export interface StoredCredentials {
  id: string;
  userId: string;
  name: string;
  panelType: 'onePanel' | 'baota';
  endpoint: string;
  apiKeyEncrypted: EncryptedData;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyManagerOptions {
  cacheTtl?: number; // Cache TTL in seconds
  maxCacheKeys?: number; // Maximum number of keys to cache
}

export class KeyManager {
  private cache: NodeCache;
  private credentials: Map<string, StoredCredentials> = new Map();

  constructor(options: KeyManagerOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.cacheTtl || 300, // 5 minutes default
      maxKeys: options.maxCacheKeys || 100,
      useClones: false,
    });

    // 处理缓存事件
    this.cache.on('expired', (key: string) => {
      logger.debug('Cache key expired', { key });
    });

    this.cache.on('del', (key: string) => {
      logger.debug('Cache key deleted', { key });
    });
  }

  /**
   * 存储加密的 API 凭据
   */
  public async storeCredentials(
    userId: string,
    name: string,
    panelType: 'onePanel' | 'baota',
    endpoint: string,
    apiKey: string
  ): Promise<string> {
    try {
      // 为凭据生成唯一 ID
      const id = cryptoService.generateSecureToken(16);
      
      // 加密 API 密钥
      const apiKeyEncrypted = cryptoService.encrypt(apiKey);
      
      // 创建凭据对象
      const credentials: StoredCredentials = {
        id,
        userId,
        name,
        panelType,
        endpoint,
        apiKeyEncrypted,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 存储在内存中（在生产环境中，这将存储在数据库中）
      this.credentials.set(id, credentials);
      
      // 缓存解密的凭据以便快速访问
      const userCredentials: UserCredentials = {
        userId,
        panelType,
        endpoint,
        apiKey,
      };
      this.cache.set(`creds:${id}`, userCredentials);

      logger.info('Credentials stored successfully', {
        id,
        userId,
        name,
        panelType,
        endpoint: this.maskEndpoint(endpoint),
      });

      return id;
    } catch (error) {
      logger.error('Failed to store credentials:', error);
      throw new Error('Failed to store credentials');
    }
  }

  /**
   * 检索和解密 API 凭据
   */
  public async getCredentials(credentialsId: string): Promise<UserCredentials | null> {
    try {
      // 先检查缓存
      const cached = this.cache.get<UserCredentials>(`creds:${credentialsId}`);
      if (cached) {
        logger.debug('Credentials retrieved from cache', { credentialsId });
        return cached;
      }

      // 从存储中获取
      const stored = this.credentials.get(credentialsId);
      if (!stored || !stored.isActive) {
        logger.warn('Credentials not found or inactive', { credentialsId });
        return null;
      }

      // 解密 API 密钥
      const apiKey = cryptoService.decrypt(stored.apiKeyEncrypted);
      
      const userCredentials: UserCredentials = {
        userId: stored.userId,
        panelType: stored.panelType,
        endpoint: stored.endpoint,
        apiKey,
      };

      // 缓存以供将来使用
      this.cache.set(`creds:${credentialsId}`, userCredentials);

      logger.debug('Credentials retrieved and decrypted', {
        credentialsId,
        userId: stored.userId,
        panelType: stored.panelType,
      });

      return userCredentials;
    } catch (error) {
      logger.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * 根据用户 ID 获取凭据
   */
  public async getCredentialsByUserId(userId: string): Promise<StoredCredentials[]> {
    const userCredentials = Array.from(this.credentials.values())
      .filter(cred => cred.userId === userId && cred.isActive);

    return userCredentials;
  }

  /**
   * 更新凭据
   */
  public async updateCredentials(
    credentialsId: string,
    updates: Partial<Pick<StoredCredentials, 'name' | 'endpoint'>>
  ): Promise<boolean> {
    try {
      const stored = this.credentials.get(credentialsId);
      if (!stored) {
        logger.warn('Credentials not found for update', { credentialsId });
        return false;
      }

      // 更新字段
      if (updates.name) stored.name = updates.name;
      if (updates.endpoint) stored.endpoint = updates.endpoint;
      stored.updatedAt = new Date();

      // 更新存储
      this.credentials.set(credentialsId, stored);

      // 使缓存失效
      this.cache.del(`creds:${credentialsId}`);

      logger.info('Credentials updated', {
        credentialsId,
        updates,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update credentials:', error);
      return false;
    }
  }

  /**
   * 删除凭据
   */
  public async deleteCredentials(credentialsId: string): Promise<boolean> {
    try {
      const stored = this.credentials.get(credentialsId);
      if (!stored) {
        logger.warn('Credentials not found for deletion', { credentialsId });
        return false;
      }

      // 软删除 - 标记为非活动
      stored.isActive = false;
      stored.updatedAt = new Date();
      this.credentials.set(credentialsId, stored);

      // 从缓存中移除
      this.cache.del(`creds:${credentialsId}`);

      logger.info('Credentials deleted', { credentialsId });
      return true;
    } catch (error) {
      logger.error('Failed to delete credentials:', error);
      return false;
    }
  }

  /**
   * 通过测试连接来验证凭据
   */
  public async validateCredentials(credentialsId: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(credentialsId);
      if (!credentials) {
        return false;
      }

      // TODO: 通过测试面板连接实现实际验证
      // 目前，我们只检查凭据是否存在且格式正确
      const isValid = !!(
        credentials.apiKey &&
        credentials.endpoint &&
        credentials.panelType &&
        this.isValidUrl(credentials.endpoint)
      );

      logger.debug('Credentials validation result', {
        credentialsId,
        isValid,
        panelType: credentials.panelType,
      });

      return isValid;
    } catch (error) {
      logger.error('Failed to validate credentials:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存的凭据
   */
  public clearCache(): void {
    this.cache.flushAll();
    logger.info('Credentials cache cleared');
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats(),
    };
  }

  /**
   * 为日志记录隐藏端点的辅助方法
   */
  private maskEndpoint(endpoint: string): string {
    try {
      const url = new URL(endpoint);
      return `${url.protocol}//${url.host}/***`;
    } catch {
      return '***';
    }
  }

  /**
   * 验证 URL 格式的辅助方法
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const keyManager = new KeyManager();