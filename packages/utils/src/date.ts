/**
 * 日期工具方法
 */

/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | number | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
	const d = date instanceof Date ? date : new Date(date as string | number)

	if (isNaN(d.getTime())) return ''

	const year = d.getFullYear()
	const month = d.getMonth() + 1
	const day = d.getDate()
	const hour = d.getHours()
	const minute = d.getMinutes()
	const second = d.getSeconds()
	const millisecond = d.getMilliseconds()

	const formatMap: Record<string, string> = {
		YYYY: year.toString(),
		YY: year.toString().slice(-2),
		MM: month < 10 ? '0' + month : month.toString(),
		M: month.toString(),
		DD: day < 10 ? '0' + day : day.toString(),
		D: day.toString(),
		HH: hour < 10 ? '0' + hour : hour.toString(),
		H: hour.toString(),
		mm: minute < 10 ? '0' + minute : minute.toString(),
		m: minute.toString(),
		ss: second < 10 ? '0' + second : second.toString(),
		s: second.toString(),
		SSS: millisecond < 100 ? (millisecond < 10 ? '00' + millisecond : '0' + millisecond) : millisecond.toString(),
	}

	let result = format
	Object.keys(formatMap).forEach((key) => {
		const value = formatMap[key]
		if (value) {
			result = result.replace(new RegExp(key, 'g'), value)
		}
	})

	return result
}

/**
 * 获取相对时间
 * @param date 日期对象或时间戳
 * @returns 相对时间字符串
 */
export function getRelativeTime(date: Date | number | string): string {
	const d = date instanceof Date ? date : new Date(date as string | number)
	const now = new Date()
	const diff = now.getTime() - d.getTime()

	if (diff < 0) return '未来'

	const minute = 60 * 1000
	const hour = minute * 60
	const day = hour * 24
	const month = day * 30
	const year = day * 365

	if (diff < minute) {
		return '刚刚'
	} else if (diff < hour) {
		return `${Math.floor(diff / minute)}分钟前`
	} else if (diff < day) {
		return `${Math.floor(diff / hour)}小时前`
	} else if (diff < month) {
		return `${Math.floor(diff / day)}天前`
	} else if (diff < year) {
		return `${Math.floor(diff / month)}个月前`
	} else {
		return `${Math.floor(diff / year)}年前`
	}
}

/**
 * 格式化持续时间
 * @param milliseconds 毫秒数
 * @returns 持续时间字符串
 */
export function formatDuration(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (days > 0) {
		return `${days}天${hours % 24}小时${minutes % 60}分钟`
	} else if (hours > 0) {
		return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`
	} else if (minutes > 0) {
		return `${minutes}分钟${seconds % 60}秒`
	} else {
		return `${seconds}秒`
	}
}

/**
 * 获取友好的日期描述
 * @param date 日期对象或时间戳
 * @returns 友好的日期描述
 */
export function getFriendlyDate(date: Date | number | string): string {
	const d = date instanceof Date ? date : new Date(date as string | number)
	const today = new Date()
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

	const isSameDay = (date1: Date, date2: Date) => {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		)
	}

	if (isSameDay(d, today)) {
		return '今天'
	} else if (isSameDay(d, yesterday)) {
		return '昨天'
	} else if (isSameDay(d, tomorrow)) {
		return '明天'
	} else {
		return formatDate(d, 'MM-DD')
	}
}

/**
 * 获取星期几
 * @param date 日期对象或时间戳
 * @param format 格式（'zh' | 'en' | 'short'）
 * @returns 星期几
 */
export function getWeekday(date: Date | number | string, format: 'zh' | 'en' | 'short' = 'zh'): string {
	const d = date instanceof Date ? date : new Date(date as string | number)
	const weekday = d.getDay()

	const weekdays = {
		zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
		en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		short: ['日', '一', '二', '三', '四', '五', '六'],
	}

	const dayArray = weekdays[format]
	return dayArray && dayArray[weekday] ? dayArray[weekday] : ''
}

/**
 * 获取日期范围
 * @param start 开始日期
 * @param end 结束日期
 * @returns 日期范围数组
 */
export function getDateRange(start: Date | number | string, end: Date | number | string): Date[] {
	const startDate = start instanceof Date ? start : new Date(start as string | number)
	const endDate = end instanceof Date ? end : new Date(end as string | number)
	const dates: Date[] = []

	if (startDate > endDate) return []

	let currentDate = new Date(startDate.getTime())
	while (currentDate <= endDate) {
		dates.push(new Date(currentDate.getTime()))
		currentDate.setDate(currentDate.getDate() + 1)
	}

	return dates
}

/**
 * 判断是否为闰年
 * @param year 年份
 * @returns 是否为闰年
 */
export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * 获取月份天数
 * @param year 年份
 * @param month 月份（1-12）
 * @returns 天数
 */
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate()
}

/**
 * 日期工具集合
 */
export const DateUtils = {
	formatDate,
	getRelativeTime,
	formatDuration,
	getFriendlyDate,
	getWeekday,
	getDateRange,
	isLeapYear,
	getDaysInMonth,
}
