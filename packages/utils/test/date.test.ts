import { describe, it, expect } from 'vitest'
import { formatDate, getRelativeTime, formatDuration, getFriendlyDate, getWeekday } from '../src/date'

describe('日期工具测试', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2023-05-15T10:30:45')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-05-15')
      expect(formatDate(date, 'YYYY年MM月DD日')).toBe('2023年05月15日')
      expect(formatDate(date, 'HH:mm:ss')).toBe('10:30:45')
      expect(formatDate(date)).toBe('2023-05-15 10:30:45')
    })

    it('应该处理无效日期', () => {
      expect(formatDate('invalid-date')).toBe('')
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
    })
  })

  describe('formatDuration', () => {
    it('应该格式化持续时间', () => {
      expect(formatDuration(30 * 1000)).toBe('30秒')
      expect(formatDuration(65 * 1000)).toBe('1分钟5秒')
      expect(formatDuration(3665 * 1000)).toBe('1小时1分钟5秒')
      expect(formatDuration(86465 * 1000)).toBe('1天0小时1分钟')
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
    })
  })
})
