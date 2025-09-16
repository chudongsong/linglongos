import { describe, it, expect } from 'vitest'
import {
	truncate,
	pad,
	toCamelCase,
	toPascalCase,
	toKebabCase,
	toSnakeCase,
	toTitleCase,
	removeWhitespace,
	template,
	formatJson,
	removeHtmlTags,
	removeExtraWhitespace,
	getFileExtension,
	highlightKeywords,
	capitalize,
	titleCase,
	maskPhone,
	maskEmail,
	maskIdCard,
	maskBankCard,
	StringUtils,
} from '../src/string'

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

	describe('toTitleCase', () => {
		it('应该正确转换为标题命名', () => {
			expect(toTitleCase('hello world')).toBe('Hello World')
			expect(toTitleCase('HELLO WORLD')).toBe('Hello World')
			expect(toTitleCase('hello-world')).toBe('Hello-world')
		})
	})

	describe('removeWhitespace', () => {
		it('应该正确移除空白字符', () => {
			expect(removeWhitespace('  hello world  ')).toBe('hello world')
			expect(removeWhitespace('  hello world  ', 'start')).toBe('hello world  ')
			expect(removeWhitespace('  hello world  ', 'end')).toBe('  hello world')
			expect(removeWhitespace('  hello world  ', 'all')).toBe('helloworld')
		})
	})

	describe('template', () => {
		it('应该正确替换模板字符串', () => {
			const data = { name: 'John', age: 30 }
			expect(template('Hello {{name}}, you are {{age}} years old', data)).toBe('Hello John, you are 30 years old')
			expect(template('{{missing}} value', {})).toBe('{{missing}} value')
		})
	})

	describe('formatJson', () => {
		it('应该正确格式化JSON', () => {
			const obj = { name: 'John', age: 30 }
			const result = formatJson(obj)
			expect(result).toContain('"name": "John"')
			expect(result).toContain('"age": 30')

			// 测试自定义缩进
			expect(formatJson(obj, 4)).toContain('    "name"')
		})

		it('应该处理不可序列化的对象', () => {
			const circular: any = { a: 1 }
			circular.self = circular
			expect(formatJson(circular)).toBe('[object Object]')
		})
	})

	describe('removeHtmlTags', () => {
		it('应该正确移除HTML标签', () => {
			expect(removeHtmlTags('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
			expect(removeHtmlTags('<div class="test">Content</div>')).toBe('Content')
			expect(removeHtmlTags('No tags here')).toBe('No tags here')
		})
	})

	describe('removeExtraWhitespace', () => {
		it('应该正确移除多余空白字符', () => {
			expect(removeExtraWhitespace('  hello    world  ')).toBe('hello world')
			expect(removeExtraWhitespace('\n\thello\t\n  world\n')).toBe('hello world')
		})
	})

	describe('getFileExtension', () => {
		it('应该正确提取文件扩展名', () => {
			expect(getFileExtension('file.txt')).toBe('.txt')
			expect(getFileExtension('image.jpg')).toBe('.jpg')
			expect(getFileExtension('archive.tar.gz')).toBe('.gz')
			expect(getFileExtension('noextension')).toBe('')
		})
	})

	describe('highlightKeywords', () => {
		it('应该正确高亮关键词', () => {
			const text = 'The quick brown fox jumps'
			const keywords = ['quick', 'fox']
			const result = highlightKeywords(text, keywords)
			expect(result).toBe('The <span class="highlight">quick</span> brown <span class="highlight">fox</span> jumps')

			// 测试自定义类名
			const customResult = highlightKeywords(text, keywords, 'custom')
			expect(customResult).toContain('class="custom"')

			// 测试空关键词数组
			expect(highlightKeywords(text, [])).toBe(text)
		})
	})

	describe('capitalize', () => {
		it('应该正确首字母大写', () => {
			expect(capitalize('hello')).toBe('Hello')
			expect(capitalize('HELLO')).toBe('Hello')
			expect(capitalize('h')).toBe('H')
			expect(capitalize('')).toBe('')
		})
	})

	describe('titleCase', () => {
		it('应该正确每个单词首字母大写', () => {
			expect(titleCase('hello world')).toBe('Hello World')
			expect(titleCase('HELLO WORLD')).toBe('Hello World')
			expect(titleCase('the quick brown fox')).toBe('The Quick Brown Fox')
		})
	})

	describe('maskPhone', () => {
		it('应该正确脱敏手机号', () => {
			expect(maskPhone('13812345678')).toBe('138****5678')
			expect(maskPhone('15988776655')).toBe('159****6655')
			expect(maskPhone('1381234567')).toBe('1381234567') // 不符合格式
			expect(maskPhone('invalid')).toBe('invalid')
		})
	})

	describe('maskEmail', () => {
		it('应该正确脱敏邮箱', () => {
			expect(maskEmail('test@example.com')).toBe('tes***@example.com')
			expect(maskEmail('a@example.com')).toBe('a***@example.com')
			expect(maskEmail('invalid-email')).toBe('invalid-email')
		})
	})

	describe('maskIdCard', () => {
		it('应该正确脱敏身份证号', () => {
			expect(maskIdCard('110101199001011234')).toBe('110101********1234')
			expect(maskIdCard('invalid')).toBe('invalid')
		})
	})

	describe('maskBankCard', () => {
		it('应该正确脱敏银行卡号', () => {
			expect(maskBankCard('1234567890123456')).toBe('1234****3456')
			expect(maskBankCard('123456789012345678')).toBe('1234****5678')
			expect(maskBankCard('invalid')).toBe('invalid')
		})
	})

	describe('StringUtils', () => {
		it('应该包含所有字符串工具方法', () => {
			expect(typeof StringUtils.truncate).toBe('function')
			expect(typeof StringUtils.pad).toBe('function')
			expect(typeof StringUtils.toCamelCase).toBe('function')
			expect(typeof StringUtils.maskPhone).toBe('function')
			expect(typeof StringUtils.maskEmail).toBe('function')
		})
	})
})
