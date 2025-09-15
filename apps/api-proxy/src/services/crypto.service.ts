import crypto from 'crypto';
import { serverConfig } from '@/config';
import { logger } from '@/utils/logger';

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

export class CryptoService {
  private readonly algorithm = 'aes-256-ctr';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private masterKey: Buffer;

  constructor() {
    this.masterKey = this.deriveMasterKey(serverConfig.encryption.masterKey);
  }

  /**
   * Derive a consistent key from the master password
   */
  private deriveMasterKey(password: string): Buffer {
    // Use PBKDF2 to derive a consistent key from the password
    const salt = Buffer.from('api-proxy-salt', 'utf8'); // In production, use a random salt stored securely
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(plaintext: string): EncryptedData {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher with IV
      const cipher = crypto.createCipher(this.algorithm, this.masterKey);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      
      return {
        data: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: '', // No auth tag for CTR mode
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: EncryptedData): string {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
      
      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.data, 'hex')),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for verification (one-way)
   */
  public hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verify data against hash
   */
  public verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }

  /**
   * Generate HMAC signature
   */
  public generateSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  public verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const cryptoService = new CryptoService();