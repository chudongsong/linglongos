/**
 * 格式化工具方法
 */

import { toThousands, formatFileSize, toPercent, toCurrency, toChineseNumber, toRoman } from './number'
import { formatDate, getRelativeTime, formatDuration, getFriendlyDate, getWeekday } from './date'
import { template, truncate, pad, formatJson, removeWhitespace } from './string'

/**
 * 数字格式化
 */
export const NumberFormat = {
	/**
	 * 格式化数字为千分位
	 */
	toThousands,

	/**
	 * 格式化文件大小
	 */
	formatFileSize,

	/**
	 * 格式化百分比
	 */
	toPercent,

	/**
	 * 格式化货币
	 */
	toCurrency,

	/**
	 * 格式化数字为中文大写
	 */
	toChineseNumber,

	/**
	 * 数字转罗马数字
	 */
	toRoman,

	/**
	 * 格式化数字范围
	 * @param min 最小值
	 * @param max 最大值
	 * @param separator 分隔符
	 * @returns 格式化后的范围字符串
	 */
	formatRange: (min: number, max: number, separator: string = ' - '): string => {
		return `${toThousands(min)}${separator}${toThousands(max)}`
	},
} as const

/**
 * 日期时间格式化
 */
export const DateFormat = {
	/**
	 * 格式化日期
	 */
	format: formatDate,

	/**
	 * 格式化相对时间
	 */
	fromNow: getRelativeTime,

	/**
	 * 格式化持续时间
	 */
	formatDuration,

	/**
	 * 获取友好的日期描述
	 */
	getFriendlyDate,

	/**
	 * 获取星期几
	 */
	getWeekday,
} as const

/**
 * 字符串格式化
 */
export const StringFormat = {
	/**
	 * 模板字符串替换
	 */
	template,

	/**
	 * 截断字符串
	 */
	truncate,

	/**
	 * 填充字符串
	 */
	pad,

	/**
	 * 格式化JSON
	 */
	formatJson,

	/**
	 * 转换为标题格式
	 * @param str 字符串
	 * @returns 标题格式字符串
	 */
	toTitle: (str: string): string => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
	},

	/**
	 * 移除字符串中的空白字符
	 */
	removeWhitespace,
} as const

/**
 * 颜色格式化
 */
export const ColorFormat = {
	/**
	 * HEX转RGB
	 * @param hex HEX颜色值
	 * @returns RGB对象
	 */
	hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
		return result && result[1] && result[2] && result[3]
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
				}
			: null
	},

	/**
	 * RGB转HEX
	 * @param r 红色值
	 * @param g 绿色值
	 * @param b 蓝色值
	 * @returns HEX颜色值
	 */
	rgbToHex: (r: number, g: number, b: number): string => {
		return (
			'#' +
			[r, g, b]
				.map((x) => {
					const hex = x.toString(16)
					return hex.length === 1 ? '0' + hex : hex
				})
				.join('')
		)
	},

	/**
	 * HSL转RGB
	 * @param h 色相
	 * @param s 饱和度
	 * @param l 亮度
	 * @returns RGB对象
	 */
	hslToRgb: (h: number, s: number, l: number): { r: number; g: number; b: number } => {
		h /= 360
		s /= 100
		l /= 100

		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1
			if (t > 1) t -= 1
			if (t < 1 / 6) return p + (q - p) * 6 * t
			if (t < 1 / 2) return q
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
			return p
		}

		let r, g, b

		if (s === 0) {
			r = g = b = l
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s
			const p = 2 * l - q
			r = hue2rgb(p, q, h + 1 / 3)
			g = hue2rgb(p, q, h)
			b = hue2rgb(p, q, h - 1 / 3)
		}

		return {
			r: Math.round(r * 255),
			g: Math.round(g * 255),
			b: Math.round(b * 255),
		}
	},

	/**
	 * 获取随机颜色
	 * @param format 颜色格式
	 * @returns 随机颜色
	 */
	randomColor: (format: 'hex' | 'rgb' | 'hsl' = 'hex'): string => {
		const r = Math.floor(Math.random() * 256)
		const g = Math.floor(Math.random() * 256)
		const b = Math.floor(Math.random() * 256)

		switch (format) {
			case 'hex':
				return ColorFormat.rgbToHex(r, g, b)
			case 'rgb':
				return `rgb(${r}, ${g}, ${b})`
			case 'hsl':
				// 简化的RGB到HSL转换
				const max = Math.max(r, g, b) / 255
				const min = Math.min(r, g, b) / 255
				const l = (max + min) / 2
				const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
				let h = 0
				if (max !== min) {
					switch (max) {
						case r / 255:
							h = (g - b) / 255 / (max - min) + (g < b ? 6 : 0)
							break
						case g / 255:
							h = (b - r) / 255 / (max - min) + 2
							break
						case b / 255:
							h = (r - g) / 255 / (max - min) + 4
							break
					}
					h /= 6
				}
				return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
			default:
				return ColorFormat.rgbToHex(r, g, b)
		}
	},
} as const
