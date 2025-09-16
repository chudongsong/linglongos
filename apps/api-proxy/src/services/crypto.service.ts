import crypto from 'crypto'
import { serverConfig } from '@/config'
import { logger } from '@/utils/logger'

export interface EncryptedData {
	data: string
	iv: string
	tag: string
}

export class CryptoService {
	private readonly algorithm = 'aes-256-ctr'
	private readonly keyLength = 32
	private readonly ivLength = 16
	private readonly tagLength = 16
	private masterKey: Buffer

	constructor() {
		this.masterKey = this.deriveMasterKey(serverConfig.encryption.masterKey)
	}

	/**
	 * 从主密码中派生一个一致的密钥
	 */
	private deriveMasterKey(password: string): Buffer {
		// 使用 PBKDF2 从密码中派生一个一致的密钥
		const salt = Buffer.from('api-proxy-salt', 'utf8') // 在生产环境中，使用安全存储的随机盐
		return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256')
	}

	/**
	 * 加密敏感数据
	 */
	public encrypt(plaintext: string): EncryptedData {
		try {
			// 为每次加密生成随机 IV
			const iv = crypto.randomBytes(this.ivLength)

			// 使用 IV 创建密码器
			const cipher = crypto.createCipher(this.algorithm, this.masterKey)

			// 加密数据
			const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

			return {
				data: encrypted.toString('hex'),
				iv: iv.toString('hex'),
				tag: '', // CTR 模式没有认证标签
			}
		} catch (error) {
			logger.error('Encryption failed:', error)
			throw new Error('Failed to encrypt data')
		}
	}

	/**
	 * 解密敏感数据
	 */
	public decrypt(encryptedData: EncryptedData): string {
		try {
			// 将十六进制字符串转换回缓冲区
			const iv = Buffer.from(encryptedData.iv, 'hex')
			const tag = Buffer.from(encryptedData.tag, 'hex')

			// 创建解密器
			const decipher = crypto.createDecipher(this.algorithm, this.masterKey)

			// 解密数据
			const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData.data, 'hex')), decipher.final()])

			return decrypted.toString('utf8')
		} catch (error) {
			logger.error('Decryption failed:', error)
			throw new Error('Failed to decrypt data')
		}
	}

	/**
	 * 对数据进行哈希用于验证（单向）
	 */
	public hash(data: string): string {
		return crypto.createHash('sha256').update(data).digest('hex')
	}

	/**
	 * 生成安全随机令牌
	 */
	public generateSecureToken(length: number = 32): string {
		return crypto.randomBytes(length).toString('hex')
	}

	/**
	 * 验证数据与哈希值是否匹配
	 */
	public verifyHash(data: string, hash: string): boolean {
		return this.hash(data) === hash
	}

	/**
	 * 生成 HMAC 签名
	 */
	public generateSignature(data: string, secret: string): string {
		return crypto.createHmac('sha256', secret).update(data).digest('hex')
	}

	/**
	 * 验证 HMAC 签名
	 */
	public verifySignature(data: string, signature: string, secret: string): boolean {
		const expectedSignature = this.generateSignature(data, secret)
		return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
	}
}

export const cryptoService = new CryptoService()
