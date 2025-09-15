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

    // Handle cache events
    this.cache.on('expired', (key: string) => {
      logger.debug('Cache key expired', { key });
    });

    this.cache.on('del', (key: string) => {
      logger.debug('Cache key deleted', { key });
    });
  }

  /**
   * Store encrypted API credentials
   */
  public async storeCredentials(
    userId: string,
    name: string,
    panelType: 'onePanel' | 'baota',
    endpoint: string,
    apiKey: string
  ): Promise<string> {
    try {
      // Generate unique ID for credentials
      const id = cryptoService.generateSecureToken(16);
      
      // Encrypt the API key
      const apiKeyEncrypted = cryptoService.encrypt(apiKey);
      
      // Create credentials object
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

      // Store in memory (in production, this would be stored in database)
      this.credentials.set(id, credentials);
      
      // Cache the decrypted credentials for quick access
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
   * Retrieve and decrypt API credentials
   */
  public async getCredentials(credentialsId: string): Promise<UserCredentials | null> {
    try {
      // Check cache first
      const cached = this.cache.get<UserCredentials>(`creds:${credentialsId}`);
      if (cached) {
        logger.debug('Credentials retrieved from cache', { credentialsId });
        return cached;
      }

      // Get from storage
      const stored = this.credentials.get(credentialsId);
      if (!stored || !stored.isActive) {
        logger.warn('Credentials not found or inactive', { credentialsId });
        return null;
      }

      // Decrypt API key
      const apiKey = cryptoService.decrypt(stored.apiKeyEncrypted);
      
      const userCredentials: UserCredentials = {
        userId: stored.userId,
        panelType: stored.panelType,
        endpoint: stored.endpoint,
        apiKey,
      };

      // Cache for future use
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
   * Get credentials by user ID
   */
  public async getCredentialsByUserId(userId: string): Promise<StoredCredentials[]> {
    const userCredentials = Array.from(this.credentials.values())
      .filter(cred => cred.userId === userId && cred.isActive);

    return userCredentials;
  }

  /**
   * Update credentials
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

      // Update fields
      if (updates.name) stored.name = updates.name;
      if (updates.endpoint) stored.endpoint = updates.endpoint;
      stored.updatedAt = new Date();

      // Update storage
      this.credentials.set(credentialsId, stored);

      // Invalidate cache
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
   * Delete credentials
   */
  public async deleteCredentials(credentialsId: string): Promise<boolean> {
    try {
      const stored = this.credentials.get(credentialsId);
      if (!stored) {
        logger.warn('Credentials not found for deletion', { credentialsId });
        return false;
      }

      // Soft delete - mark as inactive
      stored.isActive = false;
      stored.updatedAt = new Date();
      this.credentials.set(credentialsId, stored);

      // Remove from cache
      this.cache.del(`creds:${credentialsId}`);

      logger.info('Credentials deleted', { credentialsId });
      return true;
    } catch (error) {
      logger.error('Failed to delete credentials:', error);
      return false;
    }
  }

  /**
   * Validate credentials by testing connection
   */
  public async validateCredentials(credentialsId: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(credentialsId);
      if (!credentials) {
        return false;
      }

      // TODO: Implement actual validation by testing panel connection
      // For now, we'll just check if credentials exist and are properly formatted
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
   * Clear all cached credentials
   */
  public clearCache(): void {
    this.cache.flushAll();
    logger.info('Credentials cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats(),
    };
  }

  /**
   * Helper method to mask endpoint for logging
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
   * Helper method to validate URL format
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