/**
 * 测试辅助工具函数
 *
 * 提供测试中常用的工具函数和模拟数据
 */

import type { Session, PanelBinding, GoogleAuthBindResponse } from '../types/index.js'

/**
 * 创建模拟会话数据
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
	const now = Date.now()
	return {
		id: 'test-session-id',
		createdAt: now,
		expiresAt: now + 4 * 60 * 60 * 1000, // 4小时后过期
		panelBindings: new Map(),
		...overrides,
	}
}

/**
 * 创建模拟面板绑定数据
 */
export function createMockPanelBinding(overrides: Partial<PanelBinding> = {}): PanelBinding {
	return {
		url: 'http://localhost:8888',
		key: 'test-panel-key',
		...overrides,
	}
}

/**
 * 创建模拟 Google Auth 绑定响应
 */
export function createMockGoogleAuthResponse(overrides: Partial<GoogleAuthBindResponse> = {}): GoogleAuthBindResponse {
	return {
		qrCodeUrl: 'otpauth://totp/LingLongOS:test?secret=TESTKEY&issuer=LingLongOS',
		secret: 'TESTKEY',
		...overrides,
	}
}

/**
 * 生成随机字符串
 */
export function randomString(length: number = 10): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return result
}

/**
 * 生成模拟 TOTP 令牌（6位数字）
 */
export function generateMockToken(): string {
	return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 延迟函数（用于测试异步操作）
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 创建模拟的 Koa Context 对象
 */
export function createMockContext(overrides: any = {}) {
	const ctx = {
		request: {
			method: 'GET',
			url: '/',
			body: {},
			ip: '127.0.0.1',
			...overrides.request,
		},
		response: {
			status: 200,
			body: undefined,
			...overrides.response,
		},
		status: 200,
		body: undefined, // 初始化为 undefined，这样 withResponse 可以正确设置
		method: 'GET',
		url: '/',
		ip: '127.0.0.1',
		get: (key: string) => {
			const headers: Record<string, string> = {
				'User-Agent': 'Test Agent',
				'Content-Type': 'application/json',
				...overrides.headers,
			}
			return headers[key]
		},
		set: () => {},
		cookies: {
			get: () => undefined,
			set: () => {},
		},
		...overrides,
	}

	// 确保 body 属性是可写的
	Object.defineProperty(ctx, 'body', {
		writable: true,
		enumerable: true,
		configurable: true,
		value: undefined,
	})

	return ctx
}

/**
 * 验证响应格式的工具函数
 */
export const responseValidators = {
	/**
	 * 验证成功响应格式
	 */
	isValidSuccessResponse(response: any): boolean {
		return (
			response &&
			typeof response === 'object' &&
			response.code === 200 &&
			response.status === 'success' &&
			typeof response.message === 'string' &&
			Object.prototype.hasOwnProperty.call(response, 'data')
		)
	},

	/**
	 * 验证错误响应格式
	 */
	isValidErrorResponse(response: any): boolean {
		return (
			response &&
			typeof response === 'object' &&
			typeof response.code === 'number' &&
			response.code >= 400 &&
			response.status === 'error' &&
			typeof response.message === 'string'
		)
	},
}

/**
 * 环境变量备份和恢复工具
 */
export class EnvBackup {
	private backup: Record<string, string | undefined> = {}

	/**
	 * 备份指定的环境变量
	 */
	backupKeys(keys: string[]): void {
		keys.forEach((key) => {
			this.backup[key] = process.env[key]
		})
	}

	/**
	 * 设置环境变量
	 */
	set(key: string, value: string): void {
		if (!Object.prototype.hasOwnProperty.call(this.backup, key)) {
			this.backup[key] = process.env[key]
		}
		process.env[key] = value
	}

	/**
	 * 恢复所有备份的环境变量
	 */
	restore(): void {
		Object.keys(this.backup).forEach((key) => {
			if (this.backup[key] === undefined) {
				delete process.env[key]
			} else {
				process.env[key] = this.backup[key]
			}
		})
		this.backup = {}
	}
}
