import md5 from 'md5'

/**
 * 计算字符串的 MD5 哈希值并返回十六进制字符串
 *
 * @param input - 要计算哈希的输入字符串
 * @returns MD5 哈希值的十六进制表示
 *
 * @example
 * ```typescript
 * const hash = md5Hex('hello world');
 * console.log(hash); // "5d41402abc4b2a76b9719d911017c592"
 * ```
 */
export function md5Hex(input: string): string {
	return md5(input)
}

/**
 * 获取当前时间的 Unix 时间戳（秒）
 *
 * @returns 当前时间的 Unix 时间戳，单位为秒
 *
 * @example
 * ```typescript
 * const timestamp = nowUnix();
 * console.log(timestamp); // 1640995200
 * ```
 */
export function nowUnix(): number {
	return Math.floor(Date.now() / 1000)
}
