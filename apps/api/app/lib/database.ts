import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

/**
 * SQLite数据库操作封装类
 *
 * 提供常用的数据库操作方法，简化SQLite的使用：
 * - 数据库连接管理
 * - 表结构初始化
 * - 通用CRUD操作
 * - 事务支持
 * - 错误处理
 */
export class DatabaseManager {
	/** 数据库实例 */
	private db: Database.Database

	/** 数据库文件路径 */
	private readonly dbPath: string

	/**
	 * 构造函数
	 *
	 * @param {string} dbPath 数据库文件路径
	 * @param {boolean} readonly 是否只读模式（默认：false）
	 */
	constructor(dbPath: string, readonly: boolean = false) {
		this.dbPath = dbPath
		this.ensureDbDirectory()
		this.db = new Database(dbPath, { readonly })
		this.initializeDatabase()
	}

	/**
	 * 确保数据库目录存在
	 *
	 * @private
	 */
	private ensureDbDirectory(): void {
		const dir = path.dirname(this.dbPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
	}

	/**
	 * 初始化数据库
	 *
	 * @private
	 */
	private initializeDatabase(): void {
		// 启用外键约束
		this.db.pragma('foreign_keys = ON')
		// 设置WAL模式以提高并发性能
		this.db.pragma('journal_mode = WAL')
		// 创建表结构
		this.createTables()
	}

	/**
	 * 创建数据库表结构
	 *
	 * @private
	 */
	private createTables(): void {
		// 会话表
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				expires_at INTEGER NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
			)
		`)

		// 认证表
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS auth (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL,
				created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
				updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
			)
		`)

		// 面板配置表
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS panels (
				type TEXT PRIMARY KEY,
				url TEXT NOT NULL,
				key TEXT NOT NULL,
				created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
				updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
			)
		`)

		// 创建索引以提高查询性能
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
			CREATE INDEX IF NOT EXISTS idx_auth_key ON auth(key);
			CREATE INDEX IF NOT EXISTS idx_panels_type ON panels(type);
		`)
	}

	/**
	 * 执行查询并返回单行结果
	 *
	 * @param {string} sql SQL查询语句
	 * @param {any[]} params 查询参数
	 * @returns {T | undefined} 查询结果，不存在时返回undefined
	 */
	get<T = any>(sql: string, ...params: any[]): T | undefined {
		try {
			const stmt = this.db.prepare(sql)
			return stmt.get(...params) as T | undefined
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Database query failed: ${message}`)
		}
	}

	/**
	 * 执行查询并返回多行结果
	 *
	 * @param {string} sql SQL查询语句
	 * @param {any[]} params 查询参数
	 * @returns {T[]} 查询结果数组
	 */
	all<T = any>(sql: string, ...params: any[]): T[] {
		try {
			const stmt = this.db.prepare(sql)
			return stmt.all(...params) as T[]
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Database query failed: ${message}`)
		}
	}

	/**
	 * 执行插入、更新或删除操作
	 *
	 * @param {string} sql SQL语句
	 * @param {any[]} params 参数
	 * @returns {Database.RunResult} 执行结果
	 */
	run(sql: string, ...params: any[]): Database.RunResult {
		try {
			const stmt = this.db.prepare(sql)
			return stmt.run(...params)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Database operation failed: ${message}`)
		}
	}

	/**
	 * 插入数据
	 *
	 * @param {string} table 表名
	 * @param {Record<string, any>} data 要插入的数据
	 * @returns {Database.RunResult} 执行结果
	 */
	insert(table: string, data: Record<string, any>): Database.RunResult {
		const keys = Object.keys(data)
		const values = Object.values(data)
		const placeholders = keys.map(() => '?').join(', ')
		const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
		return this.run(sql, ...values)
	}

	/**
	 * 更新数据
	 *
	 * @param {string} table 表名
	 * @param {Record<string, any>} data 要更新的数据
	 * @param {string} whereClause WHERE条件
	 * @param {any[]} whereParams WHERE参数
	 * @returns {Database.RunResult} 执行结果
	 */
	update(
		table: string,
		data: Record<string, any>,
		whereClause: string,
		...whereParams: any[]
	): Database.RunResult {
		const keys = Object.keys(data)
		const values = Object.values(data)
		const setClause = keys.map(key => `${key} = ?`).join(', ')
		const sql = `UPDATE ${table} SET ${setClause}, updated_at = strftime('%s', 'now') * 1000 WHERE ${whereClause}`
		return this.run(sql, ...values, ...whereParams)
	}

	/**
	 * 删除数据
	 *
	 * @param {string} table 表名
	 * @param {string} whereClause WHERE条件
	 * @param {any[]} whereParams WHERE参数
	 * @returns {Database.RunResult} 执行结果
	 */
	delete(table: string, whereClause: string, ...whereParams: any[]): Database.RunResult {
		const sql = `DELETE FROM ${table} WHERE ${whereClause}`
		return this.run(sql, ...whereParams)
	}

	/**
	 * 插入或更新数据（UPSERT）
	 *
	 * @param {string} table 表名
	 * @param {Record<string, any>} data 数据
	 * @param {string[]} conflictColumns 冲突列
	 * @returns {Database.RunResult} 执行结果
	 */
	upsert(
		table: string,
		data: Record<string, any>,
		conflictColumns: string[]
	): Database.RunResult {
		const keys = Object.keys(data)
		const values = Object.values(data)
		const placeholders = keys.map(() => '?').join(', ')
		const updateClause = keys
			.filter(key => !conflictColumns.includes(key))
			.map(key => `${key} = excluded.${key}`)
			.join(', ')

		const sql = `
			INSERT INTO ${table} (${keys.join(', ')}) 
			VALUES (${placeholders})
			ON CONFLICT(${conflictColumns.join(', ')}) 
			DO UPDATE SET ${updateClause}, updated_at = strftime('%s', 'now') * 1000
		`
		return this.run(sql, ...values)
	}

	/**
	 * 执行事务
	 *
	 * @param {() => T} fn 事务函数
	 * @returns {T} 事务函数的返回值
	 */
	transaction<T>(fn: () => T): T {
		const transaction = this.db.transaction(fn)
		return transaction()
	}

	/**
	 * 检查表是否存在
	 *
	 * @param {string} tableName 表名
	 * @returns {boolean} 表是否存在
	 */
	tableExists(tableName: string): boolean {
		const result = this.get<{ count: number }>(
			"SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
			tableName
		)
		return (result?.count ?? 0) > 0
	}

	/**
	 * 获取表的行数
	 *
	 * @param {string} tableName 表名
	 * @returns {number} 行数
	 */
	getRowCount(tableName: string): number {
		const result = this.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`)
		return result?.count ?? 0
	}

	/**
	 * 清空表数据
	 *
	 * @param {string} tableName 表名
	 * @returns {Database.RunResult} 执行结果
	 */
	truncateTable(tableName: string): Database.RunResult {
		return this.run(`DELETE FROM ${tableName}`)
	}

	/**
	 * 执行原始SQL
	 *
	 * @param {string} sql SQL语句
	 */
	exec(sql: string): void {
		try {
			this.db.exec(sql)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Database exec failed: ${message}`)
		}
	}

	/**
	 * 关闭数据库连接
	 */
	close(): void {
		if (this.db) {
			this.db.close()
		}
	}

	/**
	 * 获取数据库信息
	 *
	 * @returns {object} 数据库信息
	 */
	getInfo(): {
		path: string
		readonly: boolean
		open: boolean
		inTransaction: boolean
	} {
		return {
			path: this.dbPath,
			readonly: this.db.readonly,
			open: this.db.open,
			inTransaction: this.db.inTransaction,
		}
	}

	/**
	 * 备份数据库
	 *
	 * @param {string} backupPath 备份文件路径
	 */
	backup(backupPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const backupDb = new Database(backupPath)
				this.db.backup(backupPath)
				backupDb.close()
				resolve()
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)))
			}
		})
	}

	/**
	 * 优化数据库（VACUUM）
	 */
	optimize(): void {
		this.db.exec('VACUUM')
	}

	/**
	 * 获取数据库统计信息
	 *
	 * @returns {object} 统计信息
	 */
	getStats(): {
		sessions: number
		auth: number
		panels: number
	} {
		return {
			sessions: this.getRowCount('sessions'),
			auth: this.getRowCount('auth'),
			panels: this.getRowCount('panels'),
		}
	}
}

/**
 * 数据库管理器单例
 */
export class DatabaseSingleton {
	private static instance: DatabaseManager | null = null
	private static dbPath: string

	/**
	 * 初始化数据库路径
	 *
	 * @param {string} path 数据库文件路径
	 */
	static initialize(path: string): void {
		DatabaseSingleton.dbPath = path
	}

	/**
	 * 获取数据库实例
	 *
	 * @returns {DatabaseManager} 数据库管理器实例
	 */
	static getInstance(): DatabaseManager {
		if (!DatabaseSingleton.instance) {
			if (!DatabaseSingleton.dbPath) {
				throw new Error('Database path not initialized. Call DatabaseSingleton.initialize() first.')
			}
			DatabaseSingleton.instance = new DatabaseManager(DatabaseSingleton.dbPath)
		}
		return DatabaseSingleton.instance
	}

	/**
	 * 关闭数据库连接
	 */
	static close(): void {
		if (DatabaseSingleton.instance) {
			DatabaseSingleton.instance.close()
			DatabaseSingleton.instance = null
		}
	}
}