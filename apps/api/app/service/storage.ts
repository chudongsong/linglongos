import { Service } from 'egg'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'crypto'
import { DatabaseManager } from '../lib/database'

/** 面板类型定义 */
type PanelType = 'bt' | '1panel'

/** 会话信息接口 */
interface SessionInfo {
	expiresAt: number
	createdAt: number
}

/** 面板配置接口 */
interface PanelConfig {
	url: string
	key: string
}

/** JSON存储数据结构接口（用于桌面设置等） */
interface JsonStorageData {
	desktop: {
		settings: Record<string, any>
		display: Record<string, any>
	}
}

/** SQLite会话记录接口 */
interface SessionRecord {
	id: string
	expires_at: number
	created_at: number
	updated_at?: number
}

/** SQLite认证记录接口 */
interface AuthRecord {
	key: string
	value: string
	created_at?: number
	updated_at?: number
}

/** SQLite面板记录接口 */
interface PanelRecord {
	type: string
	url: string
	key: string
	created_at?: number
	updated_at?: number
}

/**
 * 存储服务类
 *
 * 提供应用的数据持久化能力（SQLite + JSON混合存储）：
 * - SQLite存储：会话、2FA密钥、面板配置
 * - JSON存储：桌面设置、桌面显示配置
 */
export default class StorageService extends Service {
	/** 会话ID长度（字节） */
	private static readonly SESSION_ID_BYTES = 32

	/** 2FA密钥存储键名 */
	private static readonly TWOFA_SECRET_KEY = 'twofa_secret'

	/** SQLite数据库文件路径 */
	private static readonly DB_FILE_PATH = 'data/storage.db'

	/** JSON配置文件路径 */
	private static readonly JSON_FILE_PATH = 'data/config.json'

	/** JSON格式化缩进 */
	private static readonly JSON_INDENT = 2

	private readonly dbManager: DatabaseManager
	private readonly jsonPath: string

	constructor(ctx: any) {
		super(ctx)
		const dbPath = path.join(this.app.baseDir, StorageService.DB_FILE_PATH)
		this.jsonPath = path.join(this.app.baseDir, StorageService.JSON_FILE_PATH)
		
		this.dbManager = new DatabaseManager(dbPath)
		this.ensureJsonFile()
		this.migrateFromOldStorage()
	}

	/**
	 * 确保JSON配置文件存在
	 *
	 * @private
	 */
	private ensureJsonFile(): void {
		const dir = path.dirname(this.jsonPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}

		if (!fs.existsSync(this.jsonPath)) {
			const initialData: JsonStorageData = this.createInitialJsonData()
			this.writeJsonDataSync(initialData)
		}
	}

	/**
	 * 创建初始JSON数据结构
	 *
	 * @private
	 * @returns {JsonStorageData} 初始JSON数据结构
	 */
	private createInitialJsonData(): JsonStorageData {
		return {
			desktop: {
				settings: {},
				display: {},
			},
		}
	}

	/**
	 * 读取JSON配置数据
	 *
	 * @private
	 * @returns {JsonStorageData} JSON配置数据，读取失败时返回初始数据
	 */
	private readJsonData(): JsonStorageData {
		try {
			const content = fs.readFileSync(this.jsonPath, 'utf8')
			return JSON.parse(content)
		} catch (error) {
			// 读取失败时返回初始数据结构
			return this.createInitialJsonData()
		}
	}

	/**
	 * 写入JSON配置数据
	 *
	 * @private
	 * @param {JsonStorageData} data 要写入的数据
	 */
	private writeJsonData(data: JsonStorageData): void {
		this.writeJsonDataSync(data)
	}

	/**
	 * 同步写入JSON配置数据
	 *
	 * @private
	 * @param {JsonStorageData} data 要写入的数据
	 */
	private writeJsonDataSync(data: JsonStorageData): void {
		fs.writeFileSync(this.jsonPath, JSON.stringify(data, null, StorageService.JSON_INDENT))
	}

	/**
	 * 从旧的JSON存储迁移数据到SQLite
	 *
	 * @private
	 */
	private migrateFromOldStorage(): void {
		const oldDataPath = path.join(this.app.baseDir, 'data/storage.json')
		if (!fs.existsSync(oldDataPath)) {
			return
		}

		try {
			const content = fs.readFileSync(oldDataPath, 'utf8')
			const oldData = JSON.parse(content)

			// 迁移认证数据
			if (oldData.auth) {
				for (const [key, value] of Object.entries(oldData.auth)) {
					this.dbManager.upsert('auth', { key, value }, ['key'])
				}
			}

			// 迁移会话数据
			if (oldData.sessions) {
				for (const [sessionId, sessionInfo] of Object.entries(oldData.sessions)) {
					const session = sessionInfo as SessionInfo
					this.dbManager.upsert(
						'sessions',
						{
							id: sessionId,
							expires_at: session.expiresAt,
							created_at: session.createdAt,
						},
						['id']
					)
				}
			}

			// 迁移面板数据
			if (oldData.panels) {
				for (const [type, config] of Object.entries(oldData.panels)) {
					const panel = config as PanelConfig
					this.dbManager.upsert(
						'panels',
						{
							type,
							url: panel.url,
							key: panel.key,
						},
						['type']
					)
				}
			}

			// 备份旧文件并删除
			const backupPath = `${oldDataPath}.backup.${Date.now()}`
			fs.renameSync(oldDataPath, backupPath)
			this.app.logger.info(`Migrated storage data from ${oldDataPath} to SQLite, backup saved to ${backupPath}`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			this.app.logger.error(`Failed to migrate old storage data: ${message}`)
		}
	}

	/**
	 * 设置 2FA 密钥
	 *
	 * @param {string} secret 2FA密钥
	 */
	setTwoFASecret(secret: string): void {
		this.dbManager.upsert(
			'auth',
			{
				key: StorageService.TWOFA_SECRET_KEY,
				value: secret,
			},
			['key']
		)
	}

	/**
	 * 获取 2FA 密钥
	 *
	 * @returns {string | null} 2FA密钥，不存在时返回null
	 */
	getTwoFASecret(): string | null {
		const record = this.dbManager.get<AuthRecord>(
			'SELECT value FROM auth WHERE key = ?',
			StorageService.TWOFA_SECRET_KEY
		)
		return record?.value || null
	}

	/**
	 * 创建用户会话
	 *
	 * @param {number} ttlMs 会话生存时间（毫秒）
	 * @returns {string} 会话ID
	 */
	createSession(ttlMs: number): string {
		const sessionId = this.generateSessionId()
		const now = Date.now()

		this.dbManager.insert('sessions', {
			id: sessionId,
			expires_at: now + ttlMs,
			created_at: now,
		})

		return sessionId
	}

	/**
	 * 生成会话ID
	 *
	 * @private
	 * @returns {string} 随机生成的会话ID
	 */
	private generateSessionId(): string {
		return crypto.randomBytes(StorageService.SESSION_ID_BYTES).toString('hex')
	}

	/**
	 * 验证会话是否有效
	 *
	 * @param {string} sessionId 会话ID
	 * @returns {boolean} 会话是否有效
	 */
	isValidSession(sessionId: string): boolean {
		if (!sessionId) {
			return false
		}

		const session = this.dbManager.get<SessionRecord>(
			'SELECT * FROM sessions WHERE id = ?',
			sessionId
		)

		if (!session) {
			return false
		}

		if (this.isSessionExpired(session)) {
			// 清理过期会话
			this.removeExpiredSession(sessionId)
			return false
		}

		return true
	}

	/**
	 * 检查会话是否过期
	 *
	 * @private
	 * @param {SessionRecord} session 会话记录
	 * @returns {boolean} 是否过期
	 */
	private isSessionExpired(session: SessionRecord): boolean {
		return session.expires_at <= Date.now()
	}

	/**
	 * 移除过期会话
	 *
	 * @private
	 * @param {string} sessionId 会话ID
	 */
	private removeExpiredSession(sessionId: string): void {
		this.dbManager.delete('sessions', 'id = ?', sessionId)
	}

	/**
	 * 绑定面板密钥
	 *
	 * @param {PanelType} type 面板类型
	 * @param {string} url 面板地址
	 * @param {string} key 面板密钥
	 */
	bindPanelKey(type: PanelType, url: string, key: string): void {
		this.dbManager.upsert(
			'panels',
			{
				type,
				url,
				key,
			},
			['type']
		)
	}

	/**
	 * 获取面板配置
	 *
	 * @param {PanelType} type 面板类型
	 * @returns {PanelConfig | null} 面板配置，不存在时返回null
	 */
	getPanel(type: PanelType): PanelConfig | null {
		const record = this.dbManager.get<PanelRecord>(
			'SELECT url, key FROM panels WHERE type = ?',
			type
		)
		return record ? { url: record.url, key: record.key } : null
	}

	/**
	 * 清理所有过期会话
	 *
	 * @returns {number} 清理的会话数量
	 */
	cleanupExpiredSessions(): number {
		const now = Date.now()
		const result = this.dbManager.run(
			'DELETE FROM sessions WHERE expires_at <= ?',
			now
		)
		return result.changes
	}

	/**
	 * 获取桌面设置
	 *
	 * @param {string} key 设置键名
	 * @returns {any} 设置值，不存在时返回null
	 */
	getDesktopSetting(key: string): any {
		const data = this.readJsonData()
		return data.desktop.settings[key] || null
	}

	/**
	 * 设置桌面设置
	 *
	 * @param {string} key 设置键名
	 * @param {any} value 设置值
	 */
	setDesktopSetting(key: string, value: any): void {
		const data = this.readJsonData()
		data.desktop.settings[key] = value
		this.writeJsonData(data)
	}

	/**
	 * 获取桌面显示配置
	 *
	 * @param {string} key 配置键名
	 * @returns {any} 配置值，不存在时返回null
	 */
	getDesktopDisplay(key: string): any {
		const data = this.readJsonData()
		return data.desktop.display[key] || null
	}

	/**
	 * 设置桌面显示配置
	 *
	 * @param {string} key 配置键名
	 * @param {any} value 配置值
	 */
	setDesktopDisplay(key: string, value: any): void {
		const data = this.readJsonData()
		data.desktop.display[key] = value
		this.writeJsonData(data)
	}

	/**
	 * 获取存储统计信息
	 *
	 * @returns {object} 统计信息
	 */
	getStorageStats(): {
		sqlite: {
			sessions: number
			auth: number
			panels: number
		}
		json: {
			desktopSettings: number
			desktopDisplay: number
		}
	} {
		const jsonData = this.readJsonData()
		return {
			sqlite: this.dbManager.getStats(),
			json: {
				desktopSettings: Object.keys(jsonData.desktop.settings).length,
				desktopDisplay: Object.keys(jsonData.desktop.display).length,
			},
		}
	}

	/**
	 * 关闭存储服务
	 */
	close(): void {
		this.dbManager.close()
	}
}
