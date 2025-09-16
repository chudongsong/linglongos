import { describe, it, expect } from 'vitest'
import {
	formatDate,
	getRelativeTime,
	formatDuration,
	getFriendlyDate,
	getWeekday,
	getDateRange,
	isLeapYear,
	getDaysInMonth,
	DateUtils,
} from '../src/date'

describe('日期工具测试', () => {
	describe('formatDate', () => {
		it('应该正确格式化日期', () => {
			const date = new Date('2023-05-15T10:30:45')
			expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-05-15')
			expect(formatDate(date, 'YYYY年MM月DD日')).toBe('2023年05月15日')
			expect(formatDate(date, 'HH:mm:ss')).toBe('10:30:45')
			expect(formatDate(date)).toBe('2023-05-15 10:30:45')

			// 测试时间戳输入
			expect(formatDate(1684135845000, 'YYYY-MM-DD')).toBe('2023-05-15')

			// 测试字符串输入
			expect(formatDate('2023-05-15T10:30:45', 'YYYY-MM-DD')).toBe('2023-05-15')

			// 测试更多格式
			expect(formatDate(date, 'YY/M/D')).toBe('23/5/15')
			expect(formatDate(date, 'H:m:s')).toBe('10:30:45')
			expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss.SSS')).toBe('2023-05-15 10:30:45.000')
		})

		it('应该处理无效日期', () => {
			expect(formatDate('invalid-date')).toBe('')
			expect(formatDate(NaN)).toBe('')
			expect(formatDate(new Date('invalid'))).toBe('')
		})
	})

	describe('getRelativeTime', () => {
		it('应该返回相对时间', () => {
			const now = new Date()

			// 刚刚
			const justNow = new Date(now.getTime() - 30 * 1000) // 30秒前
			expect(getRelativeTime(justNow)).toBe('刚刚')

			// 分钟前
			const minutesAgo = new Date(now.getTime() - 10 * 60 * 1000) // 10分钟前
			expect(getRelativeTime(minutesAgo)).toBe('10分钟前')

			// 小时前
			const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3小时前
			expect(getRelativeTime(hoursAgo)).toBe('3小时前')

			// 天前
			const daysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5天前
			expect(getRelativeTime(daysAgo)).toBe('5天前')

			// 月前
			const monthsAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) // 35天前
			expect(getRelativeTime(monthsAgo)).toBe('1个月前')

			// 年前
			const yearsAgo = new Date(now.getTime() - 370 * 24 * 60 * 60 * 1000) // 370天前
			expect(getRelativeTime(yearsAgo)).toBe('1年前')

			// 未来时间
			const future = new Date(now.getTime() + 60 * 1000)
			expect(getRelativeTime(future)).toBe('未来')
		})

		it('应该处理字符串和时间戳输入', () => {
			const timeStr = '2023-05-15T10:30:45'
			const timestamp = new Date(timeStr).getTime()

			expect(getRelativeTime(timeStr)).toMatch(/前$/)
			expect(getRelativeTime(timestamp)).toMatch(/前$/)
		})
	})

	describe('formatDuration', () => {
		it('应该格式化持续时间', () => {
			expect(formatDuration(30 * 1000)).toBe('30秒')
			expect(formatDuration(65 * 1000)).toBe('1分钟5秒')
			expect(formatDuration(3665 * 1000)).toBe('1小时1分钟5秒')
			expect(formatDuration(86465 * 1000)).toBe('1天0小时1分钟')
			expect(formatDuration(90061 * 1000)).toBe('1天1小时1分钟')

			// 测试边界值
			expect(formatDuration(0)).toBe('0秒')
			expect(formatDuration(999)).toBe('0秒')
		})
	})

	describe('getFriendlyDate', () => {
		it('应该返回友好的日期描述', () => {
			const now = new Date()

			// 今天
			expect(getFriendlyDate(now)).toBe('今天')

			// 昨天
			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			expect(getFriendlyDate(yesterday)).toBe('昨天')

			// 明天
			const tomorrow = new Date(now)
			tomorrow.setDate(tomorrow.getDate() + 1)
			expect(getFriendlyDate(tomorrow)).toBe('明天')

			// 其他日期
			const otherDate = new Date('2023-01-01')
			expect(getFriendlyDate(otherDate)).toBe('01-01')
		})

		it('应该处理字符串和时间戳输入', () => {
			const dateStr = '2023-05-15'
			const timestamp = new Date(dateStr).getTime()

			expect(getFriendlyDate(dateStr)).toBe('05-15')
			expect(getFriendlyDate(timestamp)).toBe('05-15')
		})
	})

	describe('getWeekday', () => {
		it('应该返回正确的星期几', () => {
			const sunday = new Date('2023-05-14') // 星期日
			expect(getWeekday(sunday, 'zh')).toBe('星期日')
			expect(getWeekday(sunday, 'en')).toBe('Sunday')
			expect(getWeekday(sunday, 'short')).toBe('日')

			const wednesday = new Date('2023-05-17') // 星期三
			expect(getWeekday(wednesday, 'zh')).toBe('星期三')
			expect(getWeekday(wednesday, 'en')).toBe('Wednesday')
			expect(getWeekday(wednesday, 'short')).toBe('三')

			// 测试默认格式
			expect(getWeekday(sunday)).toBe('星期日')
		})

		it('应该处理字符串和时间戳输入', () => {
			const dateStr = '2023-05-14'
			const timestamp = new Date(dateStr).getTime()

			expect(getWeekday(dateStr)).toBe('星期日')
			expect(getWeekday(timestamp)).toBe('星期日')
		})
	})

	describe('getDateRange', () => {
		it('应该返回日期范围数组', () => {
			const start = new Date('2023-01-01')
			const end = new Date('2023-01-03')
			const range = getDateRange(start, end)

			expect(range).toHaveLength(3)
			expect(range[0].toDateString()).toBe(start.toDateString())
			expect(range[2].toDateString()).toBe(end.toDateString())
		})

		it('应该处理字符串和时间戳输入', () => {
			const range = getDateRange('2023-01-01', '2023-01-02')
			expect(range).toHaveLength(2)
		})

		it('应该处理无效范围', () => {
			const start = new Date('2023-01-03')
			const end = new Date('2023-01-01')
			const range = getDateRange(start, end)

			expect(range).toHaveLength(0)
		})
	})

	describe('isLeapYear', () => {
		it('应该正确判断闰年', () => {
			expect(isLeapYear(2020)).toBe(true) // 能被4整除且不能被100整除
			expect(isLeapYear(2000)).toBe(true) // 能被400整除
			expect(isLeapYear(1900)).toBe(false) // 能被100整除但不能被400整除
			expect(isLeapYear(2021)).toBe(false) // 不能被4整除
			expect(isLeapYear(2024)).toBe(true) // 闰年
			expect(isLeapYear(1600)).toBe(true) // 能被400整除
		})
	})

	describe('getDaysInMonth', () => {
		it('应该返回正确的月份天数', () => {
			expect(getDaysInMonth(2023, 1)).toBe(31) // 1月
			expect(getDaysInMonth(2023, 2)).toBe(28) // 2月（非闰年）
			expect(getDaysInMonth(2020, 2)).toBe(29) // 2月（闰年）
			expect(getDaysInMonth(2023, 4)).toBe(30) // 4月
			expect(getDaysInMonth(2023, 12)).toBe(31) // 12月
		})
	})

	describe('DateUtils', () => {
		it('应该包含所有日期工具方法', () => {
			expect(typeof DateUtils.formatDate).toBe('function')
			expect(typeof DateUtils.getRelativeTime).toBe('function')
			expect(typeof DateUtils.formatDuration).toBe('function')
			expect(typeof DateUtils.getFriendlyDate).toBe('function')
			expect(typeof DateUtils.getWeekday).toBe('function')
			expect(typeof DateUtils.getDateRange).toBe('function')
			expect(typeof DateUtils.isLeapYear).toBe('function')
			expect(typeof DateUtils.getDaysInMonth).toBe('function')
		})

		it('应该与Export函数一致', () => {
			const date = new Date('2023-05-15')
			expect(DateUtils.formatDate(date, 'YYYY-MM-DD')).toBe(formatDate(date, 'YYYY-MM-DD'))
			expect(DateUtils.isLeapYear(2020)).toBe(isLeapYear(2020))
		})
	})
})
