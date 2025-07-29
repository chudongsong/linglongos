import { describe, it, expect } from 'vitest'
import { toThousands, formatFileSize, toPercent, toCurrency, clamp } from '../src/number'

describe('数字工具测试', () => {
  describe('toThousands', () => {
    it('应该正确格式化数字为千分位', () => {
      expect(toThousands(1234567.89)).toBe('1,234,567.89')
      expect(toThousands(1234.5, 0)).toBe('1,235')
      expect(toThousands(1234.56, 1)).toBe('1,234.6')
      expect(toThousands(0)).toBe('0.00')
    })
  })

  describe('formatFileSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB')
      expect(formatFileSize(1500)).toBe('1.46 KB')
    })
  })

  describe('toPercent', () => {
    it('应该正确格式化百分比', () => {
      expect(toPercent(0.1234)).toBe('12.34%')
      expect(toPercent(0.5)).toBe('50.00%')
      expect(toPercent(1)).toBe('100.00%')
      expect(toPercent(0.333, 1)).toBe('33.3%')
    })
  })

  describe('toCurrency', () => {
    it('应该正确格式化货币', () => {
      expect(toCurrency(1234.56)).toBe('¥1,234.56')
      expect(toCurrency(1234.56, '$')).toBe('$1,234.56')
      expect(toCurrency(1234.56, '€', 0)).toBe('€1,235')
    })
  })

  describe('clamp', () => {
    it('应该正确限制数字范围', () => {
      expect(clamp(5, 1, 10)).toBe(5)
      expect(clamp(0, 1, 10)).toBe(1)
      expect(clamp(15, 1, 10)).toBe(10)
    })
  })
})
