import { describe, it, expect } from 'vitest'
import { truncate, pad, toCamelCase, toPascalCase, toKebabCase, toSnakeCase } from '../src/string'

describe('字符串工具测试', () => {
  describe('truncate', () => {
    it('应该正确截断字符串', () => {
      expect(truncate('这是一个很长的字符串', 5)).toBe('这是...')
      expect(truncate('这是一个很长的字符串', 5, '...')).toBe('这是...')
      expect(truncate('这是一个很长的字符串', 5, '***')).toBe('这是***')
      expect(truncate('短字符', 10)).toBe('短字符')
    })
  })

  describe('pad', () => {
    it('应该正确填充字符串', () => {
      expect(pad('abc', 5)).toBe('  abc')
      expect(pad('abc', 5, '0')).toBe('00abc')
      expect(pad('abc', 5, '0', 'end')).toBe('abc00')
      expect(pad('abc', 5, '0', 'both')).toBe('0abc0')
      expect(pad('abcdef', 5)).toBe('abcdef')
    })
  })

  describe('toCamelCase', () => {
    it('应该正确转换为驼峰命名', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld')
      expect(toCamelCase('hello_world')).toBe('helloWorld')
      expect(toCamelCase('hello world')).toBe('helloWorld')
      expect(toCamelCase('HelloWorld')).toBe('helloWorld')
    })
  })

  describe('toPascalCase', () => {
    it('应该正确转换为帕斯卡命名', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld')
      expect(toPascalCase('hello_world')).toBe('HelloWorld')
      expect(toPascalCase('hello world')).toBe('HelloWorld')
      expect(toPascalCase('helloWorld')).toBe('HelloWorld')
    })
  })

  describe('toKebabCase', () => {
    it('应该正确转换为短横线命名', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world')
      expect(toKebabCase('HelloWorld')).toBe('hello-world')
      expect(toKebabCase('hello_world')).toBe('hello-world')
      expect(toKebabCase('hello world')).toBe('hello-world')
    })
  })

  describe('toSnakeCase', () => {
    it('应该正确转换为下划线命名', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world')
      expect(toSnakeCase('HelloWorld')).toBe('hello_world')
      expect(toSnakeCase('hello-world')).toBe('hello_world')
      expect(toSnakeCase('hello world')).toBe('hello_world')
    })
  })
})
