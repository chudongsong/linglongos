import { authenticator } from 'otplib'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../config/logger.config'
import type { Session, PanelBinding, PanelType } from '../types/index'

/** 绑定 Cookie 的名称 */
export const BIND_COOKIE_NAME = 'll_auth_bind_id'

/** 会话 Cookie 的名称 */
export const SESSION_COOKIE_NAME = 'll_session'

/** 存储绑定密钥的内存映射表 */
const bindSecrets = new Map<string, string>()

/** 存储会话信息的内存映射表 */
const sessions = new Map<string, Session>()

/**
 * 生成 Google 身份验证器绑定密钥
 *
 * 创建一个新的 TOTP 密钥，用于 Google Authenticator 应用绑定。
 *
 * @param appName - 应用名称，将显示在 Google Authenticator 中，默认为 'LingLongOS'
 * @returns 包含绑定 ID、密钥和二维码 URL 的对象
 *
 * @example
 * ```typescript
 * const { bindId, secret, otpauthUrl } = generateBindSecret('MyApp');
 * // 用户扫描 otpauthUrl 二维码即可在 Google Authenticator 中添加账户
 * ```
 */
export function generateBindSecret(appName = 'LingLongOS'): { bindId: string; secret: string; otpauthUrl: string } {
	const secret = authenticator.generateSecret()
	const bindId = uuidv4()
	bindSecrets.set(bindId, secret)
	const otpauthUrl = authenticator.keyuri('user', appName, secret)

	logger.debug('Bind Secret Generated', {
		bindId: bindId.substring(0, 8) + '...',
		appName,
		secretLength: secret.length,
		bindSecretsCount: bindSecrets.size,
	})

	return { bindId, secret, otpauthUrl }
}

/**
 * 验证 TOTP 令牌
 *
 * 使用绑定 ID 对应的密钥验证用户提供的 6 位数令牌。
 *
 * @param bindId - 绑定 ID，来自绑定阶段生成的标识符
 * @param token - 用户从 Google Authenticator 获取的 6 位数令牌
 * @returns 验证结果，true 表示令牌有效
 *
 * @example
 * ```typescript
 * const isValid = verifyTokenWithBindId('bind-id-123', '123456');
 * if (isValid) {
 *   // 令牌验证成功，可以创建会话
 * }
 * ```
 */
export function verifyTokenWithBindId(bindId: string, token: string): boolean {
	const secret = bindSecrets.get(bindId)
	if (!secret) {
		logger.warn('Token Verification Failed - Secret Not Found', {
			bindId: bindId.substring(0, 8) + '...',
			bindSecretsCount: bindSecrets.size,
		})
		return false
	}

	const isValid = authenticator.check(token, secret)

	logger.debug('Token Verification Attempt', {
		bindId: bindId.substring(0, 8) + '...',
		tokenLength: token.length,
		isValid,
	})

	return isValid
}

/**
 * 创建新的用户会话
 *
 * 生成一个新的会话，包含唯一 ID 和过期时间。
 *
 * @param hours - 会话有效期（小时），默认为 4 小时
 * @returns 新创建的会话对象
 *
 * @example
 * ```typescript
 * const session = createSession(8); // 创建 8 小时有效期的会话
 * // 将 session.id 设置到 Cookie 中
 * ```
 */
export function createSession(hours = 4): Session {
	const id = uuidv4()
	const createdAt = Date.now()
	const expiresAt = createdAt + hours * 60 * 60 * 1000
	const session: Session = { id, createdAt, expiresAt, panelBindings: new Map() }
	sessions.set(id, session)

	logger.info('Session Created', {
		sessionId: id.substring(0, 8) + '...',
		duration: `${hours} hours`,
		expiresAt: new Date(expiresAt).toISOString(),
		totalSessions: sessions.size,
	})

	return session
}

/**
 * 获取会话信息
 *
 * 根据会话 ID 获取会话数据，自动清理过期会话。
 *
 * @param id - 会话 ID
 * @returns 会话对象，如果会话不存在或已过期则返回 undefined
 *
 * @example
 * ```typescript
 * const session = getSession('session-id-123');
 * if (session) {
 *   // 会话有效，可以继续处理
 * } else {
 *   // 会话无效或已过期
 * }
 * ```
 */
export function getSession(id: string): Session | undefined {
	const s = sessions.get(id)
	if (!s) return undefined
	if (s.expiresAt < Date.now()) {
		sessions.delete(id)
		return undefined
	}
	return s
}

/**
 * 设置面板绑定信息
 *
 * 为指定会话绑定面板的访问信息。
 *
 * @param sessionId - 会话 ID
 * @param type - 面板类型（'bt' 或 '1panel'）
 * @param url - 面板访问地址
 * @param key - 面板 API 密钥
 * @throws 如果会话不存在则抛出错误
 *
 * @example
 * ```typescript
 * setPanelBinding('session-123', 'bt', 'http://panel.example.com:8888', 'api-key');
 * ```
 */
export function setPanelBinding(sessionId: string, type: PanelType, url: string, key: string): void {
	const s = getSession(sessionId)
	if (!s) {
		logger.error('Session Not Found', { sessionId: sessionId.substring(0, 8) + '...' })
		throw new Error('Session not found')
	}

	s.panelBindings.set(type, { url, key })

	logger.info('Panel Binding Set', {
		sessionId: sessionId.substring(0, 8) + '...',
		panelType: type,
		url: url.replace(/\/\/.*@/, '//***@'), // 隐藏认证信息
	})
}

/**
 * 获取面板绑定信息
 *
 * 获取指定会话和面板类型的绑定信息。
 *
 * @param sessionId - 会话 ID
 * @param type - 面板类型（'bt' 或 '1panel'）
 * @returns 面板绑定信息，如果不存在则返回 undefined
 *
 * @example
 * ```typescript
 * const binding = getPanelBinding('session-123', 'bt');
 * if (binding) {
 *   // 使用 binding.url 和 binding.key 访问面板
 * }
 * ```
 */
export function getPanelBinding(sessionId: string, type: PanelType): PanelBinding | undefined {
	const s = getSession(sessionId)
	const binding = s?.panelBindings.get(type)

	if (binding) {
		logger.debug('Panel Binding Retrieved', {
			sessionId: sessionId.substring(0, 8) + '...',
			panelType: type,
			hasBinding: true,
		})
	}

	return binding
}
