import { cryptoService } from '@/services/crypto.service'

describe('CryptoService', () => {
	describe('Encryption and Decryption', () => {
		const plaintext = 'This is a secret message that needs to be encrypted'

		test('should encrypt plaintext successfully', () => {
			const encrypted = cryptoService.encrypt(plaintext)

			expect(encrypted).toBeDefined()
			expect(encrypted.data).toBeDefined()
			expect(encrypted.iv).toBeDefined()
			expect(encrypted.tag).toBeDefined()

			expect(encrypted.data).not.toBe(plaintext)
			expect(encrypted.iv.length).toBe(32) // 16 bytes = 32 hex characters
			expect(encrypted.tag.length).toBe(32) // 16 bytes = 32 hex characters
		})

		test('should decrypt encrypted data successfully', () => {
			const encrypted = cryptoService.encrypt(plaintext)
			const decrypted = cryptoService.decrypt(encrypted)

			expect(decrypted).toBe(plaintext)
		})

		test('should generate different IV for each encryption', () => {
			const encrypted1 = cryptoService.encrypt(plaintext)
			const encrypted2 = cryptoService.encrypt(plaintext)

			expect(encrypted1.iv).not.toBe(encrypted2.iv)
			expect(encrypted1.data).not.toBe(encrypted2.data)
			expect(encrypted1.tag).not.toBe(encrypted2.tag)
		})

		test('should handle empty string', () => {
			const encrypted = cryptoService.encrypt('')
			const decrypted = cryptoService.decrypt(encrypted)

			expect(decrypted).toBe('')
		})

		test('should handle special characters', () => {
			const specialText = '!@#$%^&*()_+-=[]{}|;:\",./<>?`~'
			const encrypted = cryptoService.encrypt(specialText)
			const decrypted = cryptoService.decrypt(encrypted)

			expect(decrypted).toBe(specialText)
		})

		test('should handle unicode characters', () => {
			const unicodeText = 'Hello 世界 🌍 🚀 API密钥'
			const encrypted = cryptoService.encrypt(unicodeText)
			const decrypted = cryptoService.decrypt(encrypted)

			expect(decrypted).toBe(unicodeText)
		})

		test('should throw error for tampered data', () => {
			const encrypted = cryptoService.encrypt(plaintext)

			// Tamper with the encrypted data
			encrypted.data = encrypted.data.slice(0, -2) + '00'

			expect(() => {
				cryptoService.decrypt(encrypted)
			}).toThrow('Failed to decrypt data')
		})

		test('should throw error for tampered IV', () => {
			const encrypted = cryptoService.encrypt(plaintext)

			// Tamper with the IV
			encrypted.iv = encrypted.iv.slice(0, -2) + '00'

			expect(() => {
				cryptoService.decrypt(encrypted)
			}).toThrow('Failed to decrypt data')
		})

		test('should throw error for tampered tag', () => {
			const encrypted = cryptoService.encrypt(plaintext)

			// Tamper with the authentication tag
			encrypted.tag = encrypted.tag.slice(0, -2) + '00'

			expect(() => {
				cryptoService.decrypt(encrypted)
			}).toThrow('Failed to decrypt data')
		})
	})

	describe('Hashing', () => {
		const data = 'data to hash'

		test('should generate consistent hash', () => {
			const hash1 = cryptoService.hash(data)
			const hash2 = cryptoService.hash(data)

			expect(hash1).toBe(hash2)
			expect(hash1.length).toBe(64) // SHA-256 = 64 hex characters
		})

		test('should generate different hashes for different data', () => {
			const hash1 = cryptoService.hash('data1')
			const hash2 = cryptoService.hash('data2')

			expect(hash1).not.toBe(hash2)
		})

		test('should verify hash correctly', () => {
			const hash = cryptoService.hash(data)
			const isValid = cryptoService.verifyHash(data, hash)

			expect(isValid).toBe(true)
		})

		test('should reject invalid hash', () => {
			const hash = cryptoService.hash(data)
			const isValid = cryptoService.verifyHash('different data', hash)

			expect(isValid).toBe(false)
		})
	})

	describe('HMAC Signatures', () => {
		const data = 'data to sign'
		const secret = 'secret-key'

		test('should generate HMAC signature', () => {
			const signature = cryptoService.generateSignature(data, secret)

			expect(signature).toBeDefined()
			expect(typeof signature).toBe('string')
			expect(signature.length).toBe(64) // HMAC-SHA256 = 64 hex characters
		})

		test('should generate consistent signatures', () => {
			const signature1 = cryptoService.generateSignature(data, secret)
			const signature2 = cryptoService.generateSignature(data, secret)

			expect(signature1).toBe(signature2)
		})

		test('should generate different signatures for different data', () => {
			const signature1 = cryptoService.generateSignature('data1', secret)
			const signature2 = cryptoService.generateSignature('data2', secret)

			expect(signature1).not.toBe(signature2)
		})

		test('should generate different signatures for different secrets', () => {
			const signature1 = cryptoService.generateSignature(data, 'secret1')
			const signature2 = cryptoService.generateSignature(data, 'secret2')

			expect(signature1).not.toBe(signature2)
		})

		test('should verify valid signature', () => {
			const signature = cryptoService.generateSignature(data, secret)
			const isValid = cryptoService.verifySignature(data, signature, secret)

			expect(isValid).toBe(true)
		})

		test('should reject invalid signature', () => {
			const signature = cryptoService.generateSignature(data, secret)
			const isValid = cryptoService.verifySignature('different data', signature, secret)

			expect(isValid).toBe(false)
		})

		test('should reject signature with wrong secret', () => {
			const signature = cryptoService.generateSignature(data, secret)
			const isValid = cryptoService.verifySignature(data, signature, 'wrong-secret')

			expect(isValid).toBe(false)
		})
	})

	describe('Secure Token Generation', () => {
		test('should generate secure token with default length', () => {
			const token = cryptoService.generateSecureToken()

			expect(token).toBeDefined()
			expect(typeof token).toBe('string')
			expect(token.length).toBe(64) // 32 bytes = 64 hex characters
			expect(/^[0-9a-f]+$/.test(token)).toBe(true) // Only hex characters
		})

		test('should generate secure token with custom length', () => {
			const token = cryptoService.generateSecureToken(16)

			expect(token.length).toBe(32) // 16 bytes = 32 hex characters
		})

		test('should generate different tokens each time', () => {
			const token1 = cryptoService.generateSecureToken()
			const token2 = cryptoService.generateSecureToken()

			expect(token1).not.toBe(token2)
		})
	})
})
