import { Database } from 'sqlite'
import { PanelConfig, databaseService } from '@/services/database.service'
import { cryptoService, EncryptedData } from '@/services/crypto.service'
import { logger } from '@/utils/logger'

export interface CreatePanelConfigData {
	userId: string
	name: string
	panelType: 'onePanel' | 'baota'
	endpoint: string
	apiKey: string
}

export interface UpdatePanelConfigData {
	name?: string
	endpoint?: string
	apiKey?: string
	isActive?: boolean
	healthStatus?: 'healthy' | 'unhealthy' | 'unknown'
}

export interface PanelConfigFilter {
	userId?: string
	panelType?: 'onePanel' | 'baota'
	isActive?: boolean
	healthStatus?: 'healthy' | 'unhealthy' | 'unknown'
	search?: string
	limit?: number
	offset?: number
}

export interface DecryptedPanelConfig extends Omit<PanelConfig, 'api_key_encrypted' | 'api_key_iv' | 'api_key_tag'> {
	apiKey: string
}

export class PanelConfigRepository {
	private get db(): Database {
		return databaseService.getDatabase()
	}

	/**
	 * 创建新的面板配置
	 */
	public async create(configData: CreatePanelConfigData): Promise<PanelConfig> {
		try {
			// 加密 API 密钥
			const encryptedApiKey = cryptoService.encrypt(configData.apiKey)

			const result = await this.db.run(
				`INSERT INTO panel_configs (user_id, name, panel_type, endpoint, api_key_encrypted, api_key_iv, api_key_tag)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					configData.userId,
					configData.name,
					configData.panelType,
					configData.endpoint,
					encryptedApiKey.data,
					encryptedApiKey.iv,
					encryptedApiKey.tag,
				],
			)

			if (!result.lastID) {
				throw new Error('Failed to create panel configuration')
			}

			const config = await this.findById(result.lastID)
			if (!config) {
				throw new Error('Failed to retrieve created panel configuration')
			}

			logger.info('Panel configuration created successfully', {
				id: config.id,
				userId: config.user_id,
				name: config.name,
				panelType: config.panel_type,
				endpoint: this.maskEndpoint(config.endpoint),
			})

			return config
		} catch (error) {
			logger.error('Failed to create panel configuration:', error)
			throw error
		}
	}

	/**
	 * 根据 ID 查找面板配置
	 */
	public async findById(id: number): Promise<PanelConfig | null> {
		try {
			const config = await this.db.get<PanelConfig>('SELECT * FROM panel_configs WHERE id = ?', [id])
			return config || null
		} catch (error) {
			logger.error('Failed to find panel configuration by ID:', error)
			throw error
		}
	}

	/**
	 * 根据 ID 查找并解密 API 密钥的面板配置
	 */
	public async findByIdDecrypted(id: number): Promise<DecryptedPanelConfig | null> {
		try {
			const config = await this.findById(id)
			if (!config) {
				return null
			}

			return this.decryptApiKey(config)
		} catch (error) {
			logger.error('Failed to find and decrypt panel configuration:', error)
			throw error
		}
	}

	/**
	 * 更新面板配置
	 */
	public async update(id: number, updateData: UpdatePanelConfigData): Promise<PanelConfig | null> {
		try {
			const setParts: string[] = []
			const values: any[] = []

			if (updateData.name !== undefined) {
				setParts.push('name = ?')
				values.push(updateData.name)
			}

			if (updateData.endpoint !== undefined) {
				setParts.push('endpoint = ?')
				values.push(updateData.endpoint)
			}

			if (updateData.apiKey !== undefined) {
				const encryptedApiKey = cryptoService.encrypt(updateData.apiKey)
				setParts.push('api_key_encrypted = ?, api_key_iv = ?, api_key_tag = ?')
				values.push(encryptedApiKey.data, encryptedApiKey.iv, encryptedApiKey.tag)
			}

			if (updateData.isActive !== undefined) {
				setParts.push('is_active = ?')
				values.push(updateData.isActive ? 1 : 0)
			}

			if (updateData.healthStatus !== undefined) {
				setParts.push('health_status = ?, last_health_check = CURRENT_TIMESTAMP')
				values.push(updateData.healthStatus)
			}

			if (setParts.length === 0) {
				throw new Error('No update data provided')
			}

			values.push(id)

			await this.db.run(`UPDATE panel_configs SET ${setParts.join(', ')} WHERE id = ?`, values)

			const updatedConfig = await this.findById(id)

			logger.info('Panel configuration updated successfully', {
				id,
				updatedFields: Object.keys(updateData),
			})

			return updatedConfig
		} catch (error) {
			logger.error('Failed to update panel configuration:', error)
			throw error
		}
	}

	/**
	 * 删除面板配置（软删除）
	 */
	public async delete(id: number): Promise<boolean> {
		try {
			const result = await this.db.run('UPDATE panel_configs SET is_active = 0 WHERE id = ?', [id])

			const success = (result.changes || 0) > 0

			if (success) {
				logger.info('Panel configuration deleted successfully', { id })
			}

			return success
		} catch (error) {
			logger.error('Failed to delete panel configuration:', error)
			throw error
		}
	}

	/**
	 * 使用过滤条件列出面板配置
	 */
	public async list(filter: PanelConfigFilter = {}): Promise<PanelConfig[]> {
		try {
			let query = 'SELECT * FROM panel_configs WHERE 1=1'
			const values: any[] = []

			if (filter.userId) {
				query += ' AND user_id = ?'
				values.push(filter.userId)
			}

			if (filter.panelType) {
				query += ' AND panel_type = ?'
				values.push(filter.panelType)
			}

			if (filter.isActive !== undefined) {
				query += ' AND is_active = ?'
				values.push(filter.isActive ? 1 : 0)
			}

			if (filter.healthStatus) {
				query += ' AND health_status = ?'
				values.push(filter.healthStatus)
			}

			if (filter.search) {
				query += ' AND (name LIKE ? OR endpoint LIKE ?)'
				const searchPattern = `%${filter.search}%`
				values.push(searchPattern, searchPattern)
			}

			query += ' ORDER BY created_at DESC'

			if (filter.limit) {
				query += ' LIMIT ?'
				values.push(filter.limit)

				if (filter.offset) {
					query += ' OFFSET ?'
					values.push(filter.offset)
				}
			}

			const configs = await this.db.all<PanelConfig[]>(query, values)
			return configs
		} catch (error) {
			logger.error('Failed to list panel configurations:', error)
			throw error
		}
	}

	/**
	 * 列出带有解密 API 密钥的面板配置
	 */
	public async listDecrypted(filter: PanelConfigFilter = {}): Promise<DecryptedPanelConfig[]> {
		try {
			const configs = await this.list(filter)
			return configs.map((config) => this.decryptApiKey(config))
		} catch (error) {
			logger.error('Failed to list and decrypt panel configurations:', error)
			throw error
		}
	}

	/**
	 * 获取面板配置数量
	 */
	public async count(filter: PanelConfigFilter = {}): Promise<number> {
		try {
			let query = 'SELECT COUNT(*) as count FROM panel_configs WHERE 1=1'
			const values: any[] = []

			if (filter.userId) {
				query += ' AND user_id = ?'
				values.push(filter.userId)
			}

			if (filter.panelType) {
				query += ' AND panel_type = ?'
				values.push(filter.panelType)
			}

			if (filter.isActive !== undefined) {
				query += ' AND is_active = ?'
				values.push(filter.isActive ? 1 : 0)
			}

			if (filter.healthStatus) {
				query += ' AND health_status = ?'
				values.push(filter.healthStatus)
			}

			if (filter.search) {
				query += ' AND (name LIKE ? OR endpoint LIKE ?)'
				const searchPattern = `%${filter.search}%`
				values.push(searchPattern, searchPattern)
			}

			const result = await this.db.get<{ count: number }>(query, values)
			return result?.count || 0
		} catch (error) {
			logger.error('Failed to count panel configurations:', error)
			throw error
		}
	}

	/**
	 * 更新面板配置的健康状态
	 */
	public async updateHealthStatus(id: number, status: 'healthy' | 'unhealthy' | 'unknown'): Promise<boolean> {
		try {
			const result = await this.db.run(
				'UPDATE panel_configs SET health_status = ?, last_health_check = CURRENT_TIMESTAMP WHERE id = ?',
				[status, id],
			)

			const success = (result.changes || 0) > 0

			if (success) {
				logger.debug('Panel configuration health status updated', { id, status })
			}

			return success
		} catch (error) {
			logger.error('Failed to update panel configuration health status:', error)
			throw error
		}
	}

	/**
	 * 获取需要健康检查的配置
	 */
	public async getConfigsForHealthCheck(maxAgeMinutes: number = 30): Promise<PanelConfig[]> {
		try {
			const configs = await this.db.all<PanelConfig[]>(
				`SELECT * FROM panel_configs 
         WHERE is_active = 1 
           AND (last_health_check IS NULL 
                OR last_health_check < datetime('now', '-' || ? || ' minutes'))
         ORDER BY last_health_check ASC NULLS FIRST`,
				[maxAgeMinutes],
			)

			return configs
		} catch (error) {
			logger.error('Failed to get configurations for health check:', error)
			throw error
		}
	}

	/**
	 * 检查用户的面板配置是否存在
	 */
	public async existsForUser(userId: string, name: string, excludeId?: number): Promise<boolean> {
		try {
			let query = 'SELECT 1 FROM panel_configs WHERE user_id = ? AND name = ?'
			const values: any[] = [userId, name]

			if (excludeId) {
				query += ' AND id != ?'
				values.push(excludeId)
			}

			const result = await this.db.get(query, values)
			return !!result
		} catch (error) {
			logger.error('Failed to check panel configuration existence:', error)
			throw error
		}
	}

	/**
	 * 从面板配置中解密 API 密钥
	 */
	private decryptApiKey(config: PanelConfig): DecryptedPanelConfig {
		try {
			const encryptedData: EncryptedData = {
				data: config.api_key_encrypted,
				iv: config.api_key_iv,
				tag: config.api_key_tag,
			}

			const apiKey = cryptoService.decrypt(encryptedData)

			return {
				id: config.id,
				user_id: config.user_id,
				name: config.name,
				panel_type: config.panel_type,
				endpoint: config.endpoint,
				apiKey,
				is_active: config.is_active,
				last_health_check: config.last_health_check,
				health_status: config.health_status,
				created_at: config.created_at,
				updated_at: config.updated_at,
			}
		} catch (error) {
			logger.error('Failed to decrypt API key:', error)
			throw new Error('Failed to decrypt API key')
		}
	}

	/**
	 * 为日志记录隐藏端点
	 */
	private maskEndpoint(endpoint: string): string {
		try {
			const url = new URL(endpoint)
			return `${url.protocol}//${url.host}/***`
		} catch {
			return '***'
		}
	}
}

export const panelConfigRepository = new PanelConfigRepository()
