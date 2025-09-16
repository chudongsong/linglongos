import { describe, it, expect } from 'vitest'
import * as UtilsIndex from '../src/index'

describe('入口文件测试', () => {
	describe('工具库信息', () => {
		it('应该导出版本信息', () => {
			expect(UtilsIndex.version).toBeDefined()
			expect(typeof UtilsIndex.version).toBe('string')
			expect(UtilsIndex.version).toBe('1.0.0')
		})

		it('应该导出工具库信息', () => {
			expect(UtilsIndex.info).toBeDefined()
			expect(typeof UtilsIndex.info).toBe('object')
			expect(UtilsIndex.info.name).toBe('@linglongos/utils')
			expect(UtilsIndex.info.version).toBe('1.0.0')
			expect(UtilsIndex.info.description).toBe('玲珑OS工具库 - 提供常用的工具方法')
			expect(UtilsIndex.info.author).toBe('LingLong OS Team')
		})
	})

	describe('数据处理工具导出', () => {
		it('应该导出DataType', () => {
			expect(UtilsIndex.DataType).toBeDefined()
			expect(typeof UtilsIndex.DataType).toBe('object')
			expect(typeof UtilsIndex.DataType.isString).toBe('function')
			expect(typeof UtilsIndex.DataType.isNumber).toBe('function')
			expect(typeof UtilsIndex.DataType.isArray).toBe('function')
			expect(typeof UtilsIndex.DataType.isObject).toBe('function')
			expect(typeof UtilsIndex.DataType.isEmpty).toBe('function')
		})

		it('应该导出数据处理函数', () => {
			expect(typeof UtilsIndex.deepClone).toBe('function')
			expect(typeof UtilsIndex.deepMerge).toBe('function')
			expect(typeof UtilsIndex.uniqueArray).toBe('function')
			expect(typeof UtilsIndex.groupBy).toBe('function')
			expect(typeof UtilsIndex.sortBy).toBe('function')
			expect(typeof UtilsIndex.paginate).toBe('function')
			expect(typeof UtilsIndex.flattenArray).toBe('function')
			expect(typeof UtilsIndex.flattenTree).toBe('function')
			expect(typeof UtilsIndex.arrayToTree).toBe('function')
		})
	})

	describe('字符串工具导出', () => {
		it('应该导出字符串处理函数', () => {
			expect(typeof UtilsIndex.truncate).toBe('function')
			expect(typeof UtilsIndex.pad).toBe('function')
			expect(typeof UtilsIndex.toCamelCase).toBe('function')
			expect(typeof UtilsIndex.toPascalCase).toBe('function')
			expect(typeof UtilsIndex.toKebabCase).toBe('function')
			expect(typeof UtilsIndex.toSnakeCase).toBe('function')
			expect(typeof UtilsIndex.toTitleCase).toBe('function')
			expect(typeof UtilsIndex.removeWhitespace).toBe('function')
			expect(typeof UtilsIndex.template).toBe('function')
			expect(typeof UtilsIndex.formatJson).toBe('function')
		})

		it('应该导出脱敏函数', () => {
			expect(typeof UtilsIndex.maskPhone).toBe('function')
			expect(typeof UtilsIndex.maskEmail).toBe('function')
			expect(typeof UtilsIndex.maskIdCard).toBe('function')
			expect(typeof UtilsIndex.maskBankCard).toBe('function')
		})

		it('应该导出StringUtils工具集', () => {
			expect(UtilsIndex.StringUtils).toBeDefined()
			expect(typeof UtilsIndex.StringUtils).toBe('object')
			expect(typeof UtilsIndex.StringUtils.truncate).toBe('function')
			expect(typeof UtilsIndex.StringUtils.maskPhone).toBe('function')
		})
	})

	describe('数字工具导出', () => {
		it('应该导出数字处理函数', () => {
			expect(typeof UtilsIndex.toThousands).toBe('function')
			expect(typeof UtilsIndex.formatFileSize).toBe('function')
			expect(typeof UtilsIndex.toPercent).toBe('function')
			expect(typeof UtilsIndex.toCurrency).toBe('function')
			expect(typeof UtilsIndex.toChineseNumber).toBe('function')
			expect(typeof UtilsIndex.toRoman).toBe('function')
			expect(typeof UtilsIndex.formatRange).toBe('function')
			expect(typeof UtilsIndex.randomInt).toBe('function')
			expect(typeof UtilsIndex.randomFloat).toBe('function')
			expect(typeof UtilsIndex.clamp).toBe('function')
		})

		it('应该导出NumberUtils工具集', () => {
			expect(UtilsIndex.NumberUtils).toBeDefined()
			expect(typeof UtilsIndex.NumberUtils).toBe('object')
			expect(typeof UtilsIndex.NumberUtils.toThousands).toBe('function')
			expect(typeof UtilsIndex.NumberUtils.clamp).toBe('function')
		})
	})

	describe('日期工具导出', () => {
		it('应该导出日期处理函数', () => {
			expect(typeof UtilsIndex.formatDate).toBe('function')
			expect(typeof UtilsIndex.getRelativeTime).toBe('function')
			expect(typeof UtilsIndex.formatDuration).toBe('function')
			expect(typeof UtilsIndex.getFriendlyDate).toBe('function')
			expect(typeof UtilsIndex.getWeekday).toBe('function')
			expect(typeof UtilsIndex.getDateRange).toBe('function')
			expect(typeof UtilsIndex.isLeapYear).toBe('function')
			expect(typeof UtilsIndex.getDaysInMonth).toBe('function')
		})

		it('应该导出DateUtils工具集', () => {
			expect(UtilsIndex.DateUtils).toBeDefined()
			expect(typeof UtilsIndex.DateUtils).toBe('object')
			expect(typeof UtilsIndex.DateUtils.formatDate).toBe('function')
			expect(typeof UtilsIndex.DateUtils.getWeekday).toBe('function')
		})
	})

	describe('文件工具导出', () => {
		it('应该导出文件处理函数', () => {
			expect(typeof UtilsIndex.getMimeType).toBe('function')
		})

		it('应该导出文件类型映射', () => {
			expect(UtilsIndex.FileTypeMap).toBeDefined()
			expect(typeof UtilsIndex.FileTypeMap).toBe('object')
			expect(Array.isArray(UtilsIndex.FileTypeMap.image)).toBe(true)
			expect(Array.isArray(UtilsIndex.FileTypeMap.video)).toBe(true)
			expect(Array.isArray(UtilsIndex.FileTypeMap.audio)).toBe(true)
		})

		it('应该导出MIME类型映射', () => {
			expect(UtilsIndex.MimeTypeMap).toBeDefined()
			expect(typeof UtilsIndex.MimeTypeMap).toBe('object')
			expect(UtilsIndex.MimeTypeMap['.jpg']).toBe('image/jpeg')
			expect(UtilsIndex.MimeTypeMap['.pdf']).toBe('application/pdf')
		})

		it('应该导出FileUtils工具集', () => {
			expect(UtilsIndex.FileUtils).toBeDefined()
			expect(typeof UtilsIndex.FileUtils).toBe('object')
			expect(typeof UtilsIndex.FileUtils.getExtension).toBe('function')
			expect(typeof UtilsIndex.FileUtils.getFileType).toBe('function')
			expect(typeof UtilsIndex.FileUtils.formatSize).toBe('function')
		})
	})

	describe('URL工具导出', () => {
		it('应该导出URL处理函数', () => {
			expect(typeof UtilsIndex.parseUrlParams).toBe('function')
			expect(typeof UtilsIndex.buildUrlParams).toBe('function')
			expect(typeof UtilsIndex.addUrlParams).toBe('function')
			expect(typeof UtilsIndex.removeUrlParams).toBe('function')
			expect(typeof UtilsIndex.getDomain).toBe('function')
			expect(typeof UtilsIndex.getProtocol).toBe('function')
			expect(typeof UtilsIndex.getPath).toBe('function')
			expect(typeof UtilsIndex.isValidUrl).toBe('function')
			expect(typeof UtilsIndex.isHttpUrl).toBe('function')
			expect(typeof UtilsIndex.isRelativeUrl).toBe('function')
			expect(typeof UtilsIndex.toAbsoluteUrl).toBe('function')
			expect(typeof UtilsIndex.formatUrl).toBe('function')
			expect(typeof UtilsIndex.getFilenameFromUrl).toBe('function')
			expect(typeof UtilsIndex.getExtensionFromUrl).toBe('function')
			expect(typeof UtilsIndex.buildApiUrl).toBe('function')
			expect(typeof UtilsIndex.parsePathParams).toBe('function')
		})
	})

	describe('验证工具导出', () => {
		it('应该导出正则表达式模式', () => {
			expect(UtilsIndex.RegexPatterns).toBeDefined()
			expect(typeof UtilsIndex.RegexPatterns).toBe('object')
			expect(UtilsIndex.RegexPatterns.email).toBeInstanceOf(RegExp)
			expect(UtilsIndex.RegexPatterns.phone).toBeInstanceOf(RegExp)
			expect(UtilsIndex.RegexPatterns.idCard).toBeInstanceOf(RegExp)
			expect(UtilsIndex.RegexPatterns.url).toBeInstanceOf(RegExp)
		})

		it('应该导出验证函数', () => {
			expect(UtilsIndex.Validator).toBeDefined()
			expect(typeof UtilsIndex.Validator).toBe('object')
			expect(typeof UtilsIndex.Validator.isEmail).toBe('function')
			expect(typeof UtilsIndex.Validator.isPhone).toBe('function')
			expect(typeof UtilsIndex.Validator.isIdCard).toBe('function')
			expect(typeof UtilsIndex.Validator.isUrl).toBe('function')
		})

		it('应该导出密码强度检测函数', () => {
			expect(typeof UtilsIndex.checkPasswordStrength).toBe('function')
		})
	})

	describe('格式化工具导出', () => {
		it('应该导出格式化工具集', () => {
			expect(UtilsIndex.NumberFormat).toBeDefined()
			expect(UtilsIndex.DateFormat).toBeDefined()
			expect(UtilsIndex.StringFormat).toBeDefined()
			expect(UtilsIndex.ColorFormat).toBeDefined()
		})

		it('应该导出各种格式化函数', () => {
			// 数字格式化
			expect(typeof UtilsIndex.NumberFormat.toThousands).toBe('function')
			expect(typeof UtilsIndex.NumberFormat.toCurrency).toBe('function')

			// 日期格式化
			expect(typeof UtilsIndex.DateFormat.format).toBe('function')
			expect(typeof UtilsIndex.DateFormat.fromNow).toBe('function')

			// 字符串格式化
			expect(typeof UtilsIndex.StringFormat.template).toBe('function')
			expect(typeof UtilsIndex.StringFormat.truncate).toBe('function')

			// 颜色格式化
			expect(typeof UtilsIndex.ColorFormat.hexToRgb).toBe('function')
			expect(typeof UtilsIndex.ColorFormat.rgbToHex).toBe('function')
		})
	})

	describe('功能测试', () => {
		it('导出的函数应该正常工作', () => {
			// 测试数据类型判断
			expect(UtilsIndex.DataType.isString('hello')).toBe(true)
			expect(UtilsIndex.DataType.isNumber(123)).toBe(true)

			// 测试字符串处理
			expect(UtilsIndex.truncate('hello world', 5)).toBe('he...')
			expect(UtilsIndex.toCamelCase('hello-world')).toBe('helloWorld')

			// 测试数字处理
			expect(UtilsIndex.toThousands(1234)).toBe('1,234.00')
			expect(UtilsIndex.clamp(15, 1, 10)).toBe(10)

			// 测试日期处理
			const date = new Date('2023-01-01')
			expect(UtilsIndex.formatDate(date, 'YYYY-MM-DD')).toBe('2023-01-01')
			expect(UtilsIndex.isLeapYear(2020)).toBe(true)

			// 测试文件处理
			expect(UtilsIndex.FileUtils.getExtension('file.txt')).toBe('.txt')
			expect(UtilsIndex.getMimeType('image.jpg')).toBe('image/jpeg')

			// 测试URL处理
			const params = UtilsIndex.parseUrlParams('https://example.com?name=John&age=30')
			expect(params).toEqual({ name: 'John', age: '30' })

			// 测试验证
			expect(UtilsIndex.Validator.isEmail('test@example.com')).toBe(true)
			expect(UtilsIndex.Validator.isPhone('13812345678')).toBe(true)

			// 测试格式化
			expect(UtilsIndex.NumberFormat.toPercent(0.5)).toBe('50.00%')
			expect(UtilsIndex.ColorFormat.rgbToHex(255, 0, 0)).toBe('#ff0000')
		})
	})

	describe('导出完整性检查', () => {
		it('应该导出所有期望的模块', () => {
			const expectedExports = [
				// 工具库信息
				'version',
				'info',

				// 数据处理
				'DataType',
				'deepClone',
				'deepMerge',
				'uniqueArray',
				'groupBy',
				'sortBy',
				'paginate',
				'flattenArray',
				'flattenTree',
				'arrayToTree',

				// 字符串处理
				'truncate',
				'pad',
				'toCamelCase',
				'toPascalCase',
				'toKebabCase',
				'toSnakeCase',
				'toTitleCase',
				'removeWhitespace',
				'template',
				'formatJson',
				'removeHtmlTags',
				'removeExtraWhitespace',
				'getFileExtension',
				'highlightKeywords',
				'capitalize',
				'titleCase',
				'maskPhone',
				'maskEmail',
				'maskIdCard',
				'maskBankCard',
				'StringUtils',

				// 数字处理
				'toThousands',
				'formatFileSize',
				'toPercent',
				'toCurrency',
				'toChineseNumber',
				'toRoman',
				'formatRange',
				'randomInt',
				'randomFloat',
				'clamp',
				'NumberUtils',

				// 日期处理
				'formatDate',
				'getRelativeTime',
				'formatDuration',
				'getFriendlyDate',
				'getWeekday',
				'getDateRange',
				'isLeapYear',
				'getDaysInMonth',
				'DateUtils',

				// 文件处理
				'FileTypeMap',
				'FileUtils',
				'MimeTypeMap',
				'getMimeType',

				// URL处理
				'parseUrlParams',
				'buildUrlParams',
				'addUrlParams',
				'removeUrlParams',
				'getDomain',
				'getProtocol',
				'getPath',
				'isValidUrl',
				'isHttpUrl',
				'isRelativeUrl',
				'toAbsoluteUrl',
				'formatUrl',
				'getFilenameFromUrl',
				'getExtensionFromUrl',
				'buildApiUrl',
				'parsePathParams',

				// 验证
				'RegexPatterns',
				'Validator',
				'checkPasswordStrength',

				// 格式化
				'NumberFormat',
				'DateFormat',
				'StringFormat',
				'ColorFormat',
			]

			expectedExports.forEach((exportName) => {
				expect(UtilsIndex).toHaveProperty(exportName)
			})
		})

		it('导出的对象应该有正确的属性', () => {
			// 检查主要工具集对象是否包含预期的方法
			const toolCollections = [
				{ obj: UtilsIndex.DataType, methods: ['isString', 'isNumber', 'isArray', 'isEmpty'] },
				{ obj: UtilsIndex.StringUtils, methods: ['truncate', 'pad', 'toCamelCase', 'maskPhone'] },
				{ obj: UtilsIndex.NumberUtils, methods: ['toThousands', 'formatFileSize', 'clamp'] },
				{ obj: UtilsIndex.DateUtils, methods: ['formatDate', 'getWeekday', 'isLeapYear'] },
				{ obj: UtilsIndex.FileUtils, methods: ['getExtension', 'getFileType', 'formatSize'] },
				{ obj: UtilsIndex.Validator, methods: ['isEmail', 'isPhone', 'isUrl'] },
				{ obj: UtilsIndex.NumberFormat, methods: ['toThousands', 'toCurrency'] },
				{ obj: UtilsIndex.DateFormat, methods: ['format', 'fromNow'] },
				{ obj: UtilsIndex.StringFormat, methods: ['template', 'truncate'] },
				{ obj: UtilsIndex.ColorFormat, methods: ['hexToRgb', 'rgbToHex'] },
			]

			toolCollections.forEach(({ obj, methods }) => {
				expect(obj).toBeDefined()
				methods.forEach((method) => {
					expect(typeof obj[method]).toBe('function')
				})
			})
		})
	})
})
