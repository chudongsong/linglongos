import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Google Auth 配置接口
 */
interface GoogleAuthConfig {
	/** 是否已完成Google Auth配置 */
	isConfigured: boolean
	/** 配置完成时间戳 */
	configuredAt?: number
	/** 密钥（加密存储） */
	encryptedSecret?: string
	/** 配置的用户标识 */
	userId?: string
}

/**
 * 配置文件路径
 */
const CONFIG_FILE_PATH = path.join(__dirname, '../../data/google-auth.json')

/**
 * 确保配置目录存在
 */
async function ensureConfigDir(): Promise<void> {
	const configDir = path.dirname(CONFIG_FILE_PATH)
	try {
		await fs.access(configDir)
	} catch {
		await fs.mkdir(configDir, { recursive: true })
	}
}

/**
 * 读取Google Auth配置
 *
 * @returns Google Auth配置对象，如果文件不存在则返回默认配置
 *
 * @example
 * ```typescript
 * const config = await readGoogleAuthConfig();
 * if (config.isConfigured) {
 *   // 已配置，可以跳过绑定步骤
 * }
 * ```
 */
export async function readGoogleAuthConfig(): Promise<GoogleAuthConfig> {
	try {
		await ensureConfigDir()
		const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8')
		return JSON.parse(data) as GoogleAuthConfig
	} catch (error) {
		// 文件不存在或读取失败，返回默认配置
		return {
			isConfigured: false,
		}
	}
}

/**
 * 保存Google Auth配置
 *
 * @param config - 要保存的配置对象
 *
 * @example
 * ```typescript
 * await saveGoogleAuthConfig({
 *   isConfigured: true,
 *   configuredAt: Date.now(),
 *   userId: 'user123'
 * });
 * ```
 */
export async function saveGoogleAuthConfig(config: GoogleAuthConfig): Promise<void> {
	try {
		await ensureConfigDir()
		const data = JSON.stringify(config, null, 2)
		await fs.writeFile(CONFIG_FILE_PATH, data, 'utf-8')
	} catch (error) {
		throw new Error(`Failed to save Google Auth config: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * 标记Google Auth为已配置状态
 *
 * @param userId - 用户标识（可选）
 * @param encryptedSecret - 加密的密钥（可选）
 *
 * @example
 * ```typescript
 * await markGoogleAuthConfigured('user123');
 * ```
 */
export async function markGoogleAuthConfigured(userId?: string, encryptedSecret?: string): Promise<void> {
	const config: GoogleAuthConfig = {
		isConfigured: true,
		configuredAt: Date.now(),
		userId,
		encryptedSecret,
	}
	await saveGoogleAuthConfig(config)
}

/**
 * 重置Google Auth配置
 *
 * 将配置重置为未配置状态，删除所有相关数据。
 *
 * @example
 * ```typescript
 * await resetGoogleAuthConfig();
 * ```
 */
export async function resetGoogleAuthConfig(): Promise<void> {
	const config: GoogleAuthConfig = {
		isConfigured: false,
	}
	await saveGoogleAuthConfig(config)
}

/**
 * 检查Google Auth是否已配置
 *
 * @returns 如果已配置返回true，否则返回false
 *
 * @example
 * ```typescript
 * const isConfigured = await isGoogleAuthConfigured();
 * if (isConfigured) {
 *   // 跳过配置步骤
 * }
 * ```
 */
export async function isGoogleAuthConfigured(): Promise<boolean> {
	const config = await readGoogleAuthConfig()
	return config.isConfigured
}
