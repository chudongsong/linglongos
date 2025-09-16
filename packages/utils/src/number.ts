/**
 * 数字工具方法
 */

/**
 * 格式化数字为千分位
 * @param num 数字
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function toThousands(num: number, decimals: number = 2): string {
	const fixed = num.toFixed(decimals)
	return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
	if (bytes === 0) return '0 B'

	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	const size = bytes / Math.pow(k, i)
	return `${size.toFixed(decimals)} ${sizes[i]}`
}

/**
 * 格式化百分比
 * @param value 数值（0-1之间）
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export function toPercent(value: number, decimals: number = 2): string {
	return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化货币
 * @param amount 金额
 * @param currency 货币符号
 * @param decimals 小数位数
 * @returns 格式化后的货币字符串
 */
export function toCurrency(amount: number, currency: string = '¥', decimals: number = 2): string {
	return `${currency}${toThousands(amount, decimals)}`
}

/**
 * 数字转中文大写
 * @param num 数字
 * @returns 中文大写数字
 */
export function toChineseNumber(num: number): string {
	const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
	const units = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿']

	if (num === 0) return '零'

	const str = num.toString()
	let result = ''

	for (let i = 0; i < str.length; i++) {
		const char = str[i]
		if (char) {
			const digit = parseInt(char, 10)
			const unit = units[str.length - 1 - i]

			if (digit !== 0 && unit) {
				result += digits[digit] + unit
			} else if (result && result.charAt(result.length - 1) !== '零') {
				result += '零'
			}
		}
	}

	return result.replace(/零+$/, '').replace(/零+/g, '零')
}

/**
 * 数字转罗马数字
 * @param num 数字（1-3999）
 * @returns 罗马数字
 */
export function toRoman(num: number): string {
	if (num < 1 || num > 3999) return ''

	const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
	const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']

	let result = ''

	for (let i = 0; i < values.length; i++) {
		const value = values[i]
		const symbol = symbols[i]
		if (value && symbol) {
			while (num >= value) {
				result += symbol
				num -= value
			}
		}
	}

	return result
}

/**
 * 格式化数字范围
 * @param min 最小值
 * @param max 最大值
 * @param separator 分隔符
 * @returns 格式化后的范围字符串
 */
export function formatRange(min: number, max: number, separator: string = ' - '): string {
	return `${toThousands(min)}${separator}${toThousands(max)}`
}

/**
 * 随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 随机浮点数
 * @param min 最小值
 * @param max 最大值
 * @param decimals 小数位数
 * @returns 随机浮点数
 */
export function randomFloat(min: number, max: number, decimals: number = 2): number {
	const value = Math.random() * (max - min) + min
	return parseFloat(value.toFixed(decimals))
}

/**
 * 限制数字范围
 * @param num 数字
 * @param min 最小值
 * @param max 最大值
 * @returns 限制范围后的数字
 */
export function clamp(num: number, min: number, max: number): number {
	return Math.min(Math.max(num, min), max)
}

/**
 * 数字工具集合
 */
export const NumberUtils = {
	toThousands,
	formatFileSize,
	toPercent,
	toCurrency,
	toChineseNumber,
	toRoman,
	formatRange,
	randomInt,
	randomFloat,
	clamp,
}
