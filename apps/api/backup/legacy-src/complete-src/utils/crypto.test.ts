/**
 * 加密工具函数测试
 *
 * 测试 md5Hex 和 nowUnix 函数
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { md5Hex, nowUnix } from './crypto'

describe('crypto utils', () => {
	describe('md5Hex', () => {
		it('应该返回正确的MD5哈希值', () => {
			const input = 'hello world'
			const expected = '5d41402abc4b2a76b9719d911017c592'
			
			const result = md5Hex(input)
			
			expect(result).toBe(expected)
		})

		it('应该处理空字符串', () => {
			const input = ''
			const expected = 'd41d8cd98f00b204e9800998ecf8427e'
			
			const result = md5Hex(input)
			
			expect(result).toBe(expected)
		})

		it('应该处理中文字符', () => {
			const input = '你好世界'
			
			const result = md5Hex(input)
			
			expect(result).toHaveLength(32)
			expect(result).toMatch(/^[a-f0-9]{32}$/)
		})

		it('应该对相同输入返回相同结果', () => {
			const input = 'test string'
			
			const result1 = md5Hex(input)
			const result2 = md5Hex(input)
			
			expect(result1).toBe(result2)
		})

		it('应该对不同输入返回不同结果', () => {
			const input1 = 'test1'
			const input2 = 'test2'
			
			const result1 = md5Hex(input1)
			const result2 = md5Hex(input2)
			
			expect(result1).not.toBe(result2)
		})
	})

	describe('nowUnix', () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('应该返回当前时间的Unix时间戳', () => {
			const mockTime = new Date('2024-01-01T00:00:00.000Z')
			vi.setSystemTime(mockTime)
			
			const result = nowUnix()
			const expected = Math.floor(mockTime.getTime() / 1000)
			
			expect(result).toBe(expected)
		})

		it('应该返回整数时间戳', () => {
			const mockTime = new Date('2024-01-01T12:30:45.123Z')
			vi.setSystemTime(mockTime)
			
			const result = nowUnix()
			
			expect(Number.isInteger(result)).toBe(true)
		})

		it('应该随时间变化返回不同值', () => {
			const time1 = new Date('2024-01-01T00:00:00.000Z')
			const time2 = new Date('2024-01-01T00:00:01.000Z')
			
			vi.setSystemTime(time1)
			const result1 = nowUnix()
			
			vi.setSystemTime(time2)
			const result2 = nowUnix()
			
			expect(result2).toBe(result1 + 1)
		})

		it('应该处理毫秒精度的时间', () => {
			const mockTime = new Date('2024-01-01T00:00:00.999Z')
			vi.setSystemTime(mockTime)
			
			const result = nowUnix()
			const expected = Math.floor(mockTime.getTime() / 1000)
			
			expect(result).toBe(expected)
		})
	})
})