import { describe, it, expect } from 'vitest'
import { RegexPatterns, Validator, checkPasswordStrength } from '../src/validator'

describe('验证工具测试', () => {
	describe('RegexPatterns - 正则表达式模式', () => {
		describe('email', () => {
			it('应该正确验证邮箱格式', () => {
				const validEmails = [
					'test@example.com',
					'user.name@domain.co.uk',
					'user+tag@example.org',
					'user123@test-domain.com',
				]

				const invalidEmails = [
					'invalid-email',
					'@example.com',
					'user@',
					'user.domain.com',
					'user@domain',
					'user name@example.com',
				]

				validEmails.forEach((email) => {
					expect(RegexPatterns.email.test(email)).toBe(true)
				})

				invalidEmails.forEach((email) => {
					expect(RegexPatterns.email.test(email)).toBe(false)
				})
			})
		})

		describe('phone', () => {
			it('应该正确验证中国大陆手机号', () => {
				const validPhones = ['13812345678', '15988776655', '18899887766', '17712345678', '19912345678']

				const invalidPhones = [
					'12812345678', // 不是1开头的有效号段
					'1381234567', // 位数不够
					'138123456789', // 位数太多
					'10812345678', // 第二位是0
					'abc12345678', // 包含字母
				]

				validPhones.forEach((phone) => {
					expect(RegexPatterns.phone.test(phone)).toBe(true)
				})

				invalidPhones.forEach((phone) => {
					expect(RegexPatterns.phone.test(phone)).toBe(false)
				})
			})
		})

		describe('idCard', () => {
			it('应该正确验证身份证号', () => {
				const validIdCards = ['110101199001011234', '320101198001011234', '44010119800101123X', '11010120000101123x']

				const invalidIdCards = [
					'01010119900101123', // 位数不够
					'110101199013011234', // 月份无效
					'110101199001321234', // 日期无效
					'110101199001011abc', // 包含字母（除了最后一位）
					'110101170001011234', // 年份无效
				]

				validIdCards.forEach((idCard) => {
					expect(RegexPatterns.idCard.test(idCard)).toBe(true)
				})

				invalidIdCards.forEach((idCard) => {
					expect(RegexPatterns.idCard.test(idCard)).toBe(false)
				})
			})
		})

		describe('url', () => {
			it('应该正确验证URL格式', () => {
				const validUrls = [
					'https://example.com',
					'http://www.example.com',
					'https://subdomain.example.co.uk/path?param=value',
				]

				const invalidUrls = [
					'example.com',
					'ftp://example.com',
					'www.example.com',
					'http:/example.com',
					'https//example.com',
				]

				validUrls.forEach((url) => {
					expect(RegexPatterns.url.test(url)).toBe(true)
				})

				invalidUrls.forEach((url) => {
					expect(RegexPatterns.url.test(url)).toBe(false)
				})
			})
		})

		describe('ipv4', () => {
			it('应该正确验证IPv4地址', () => {
				const validIPs = ['192.168.1.1', '255.255.255.255', '0.0.0.0', '127.0.0.1', '10.0.0.1']

				const invalidIPs = [
					'256.1.1.1', // 超出范围
					'192.168.1', // 位数不够
					'192.168.1.1.1', // 位数太多
					'a.b.c.d', // 包含字母
					'192.168.-1.1', // 负数
				]

				validIPs.forEach((ip) => {
					expect(RegexPatterns.ipv4.test(ip)).toBe(true)
				})

				invalidIPs.forEach((ip) => {
					expect(RegexPatterns.ipv4.test(ip)).toBe(false)
				})
			})
		})

		describe('strongPassword', () => {
			it('应该正确验证强密码', () => {
				const strongPasswords = ['Aa1@2345', 'MyP@ssw0rd123', 'C0mpl3x!P@ss']

				const weakPasswords = [
					'password', // 没有大写、数字、特殊字符
					'Password', // 没有数字、特殊字符
					'Password123', // 没有特殊字符
					'Pass@1', // 长度不够
					'PASSWORD123!', // 没有小写字母
				]

				strongPasswords.forEach((password) => {
					expect(RegexPatterns.strongPassword.test(password)).toBe(true)
				})

				weakPasswords.forEach((password) => {
					expect(RegexPatterns.strongPassword.test(password)).toBe(false)
				})
			})
		})

		describe('chinese', () => {
			it('应该正确检测中文字符', () => {
				expect(RegexPatterns.chinese.test('你好')).toBe(true)
				expect(RegexPatterns.chinese.test('Hello 世界')).toBe(true)
				expect(RegexPatterns.chinese.test('Hello World')).toBe(false)
				expect(RegexPatterns.chinese.test('123')).toBe(false)
			})
		})

		describe('hexColor', () => {
			it('应该正确验证十六进制颜色值', () => {
				const validColors = ['#FF0000', '#00ff00', '#0000FF', '#fff', '#000', '#ABC123']

				const invalidColors = [
					'FF0000', // 没有#
					'#GGGGGG', // 无效字符
					'#12345', // 长度错误
					'#1234567', // 长度错误
				]

				validColors.forEach((color) => {
					expect(RegexPatterns.hexColor.test(color)).toBe(true)
				})

				invalidColors.forEach((color) => {
					expect(RegexPatterns.hexColor.test(color)).toBe(false)
				})
			})
		})

		describe('date', () => {
			it('应该正确验证日期格式 YYYY-MM-DD', () => {
				const validDates = [
					'2023-01-01',
					'2023-12-31',
					'2000-02-29', // 闰年
				]

				const invalidDates = [
					'23-01-01', // 年份格式错误
					'2023-1-1', // 月日格式错误
					'2023/01/01', // 分隔符错误
				]

				validDates.forEach((date) => {
					expect(RegexPatterns.date.test(date)).toBe(true)
				})

				invalidDates.forEach((date) => {
					expect(RegexPatterns.date.test(date)).toBe(false)
				})
			})
		})

		describe('time', () => {
			it('应该正确验证时间格式 HH:MM:SS', () => {
				const validTimes = ['00:00:00', '12:30:45', '23:59:59']

				const invalidTimes = [
					'24:00:00', // 小时无效
					'12:60:00', // 分钟无效
					'12:30:60', // 秒无效
					'1:30:45', // 小时格式错误
				]

				validTimes.forEach((time) => {
					expect(RegexPatterns.time.test(time)).toBe(true)
				})

				invalidTimes.forEach((time) => {
					expect(RegexPatterns.time.test(time)).toBe(false)
				})
			})
		})
	})

	describe('Validator - 验证函数', () => {
		describe('isEmail', () => {
			it('应该正确验证邮箱', () => {
				expect(Validator.isEmail('test@example.com')).toBe(true)
				expect(Validator.isEmail('invalid-email')).toBe(false)
			})
		})

		describe('isPhone', () => {
			it('应该正确验证手机号', () => {
				expect(Validator.isPhone('13812345678')).toBe(true)
				expect(Validator.isPhone('12812345678')).toBe(false)
			})
		})

		describe('isIdCard', () => {
			it('应该正确验证身份证号', () => {
				expect(Validator.isIdCard('110101199001011234')).toBe(true)
				expect(Validator.isIdCard('invalid-id')).toBe(false)
			})
		})

		describe('isUrl', () => {
			it('应该正确验证URL', () => {
				expect(Validator.isUrl('https://example.com')).toBe(true)
				expect(Validator.isUrl('example.com')).toBe(false)
			})
		})

		describe('isIPv4', () => {
			it('应该正确验证IPv4地址', () => {
				expect(Validator.isIPv4('192.168.1.1')).toBe(true)
				expect(Validator.isIPv4('256.1.1.1')).toBe(false)
			})
		})

		describe('isMac', () => {
			it('应该正确验证MAC地址', () => {
				expect(Validator.isMac('00:11:22:33:44:55')).toBe(true)
				expect(Validator.isMac('00-11-22-33-44-55')).toBe(true)
				expect(Validator.isMac('invalid-mac')).toBe(false)
			})
		})

		describe('isStrongPassword', () => {
			it('应该正确验证强密码', () => {
				expect(Validator.isStrongPassword('MyP@ssw0rd123')).toBe(true)
				expect(Validator.isStrongPassword('weakpassword')).toBe(false)
			})
		})

		describe('isMediumPassword', () => {
			it('应该正确验证中等密码', () => {
				expect(Validator.isMediumPassword('Password123')).toBe(true)
				expect(Validator.isMediumPassword('weak')).toBe(false)
			})
		})

		describe('hasChinese', () => {
			it('应该正确检测是否包含中文', () => {
				expect(Validator.hasChinese('Hello 世界')).toBe(true)
				expect(Validator.hasChinese('Hello World')).toBe(false)
			})
		})

		describe('isPureChinese', () => {
			it('应该正确检测是否为纯中文', () => {
				expect(Validator.isPureChinese('你好世界')).toBe(true)
				expect(Validator.isPureChinese('Hello 世界')).toBe(false)
			})
		})

		describe('isEnglish', () => {
			it('应该正确检测是否为纯英文', () => {
				expect(Validator.isEnglish('Hello')).toBe(true)
				expect(Validator.isEnglish('Hello123')).toBe(false)
			})
		})

		describe('isNumber', () => {
			it('应该正确检测是否为数字字符串', () => {
				expect(Validator.isNumber('123')).toBe(true)
				expect(Validator.isNumber('123abc')).toBe(false)
			})
		})

		describe('isPositiveInteger', () => {
			it('应该正确检测是否为正整数字符串', () => {
				expect(Validator.isPositiveInteger('123')).toBe(true)
				expect(Validator.isPositiveInteger('0')).toBe(false)
				expect(Validator.isPositiveInteger('-123')).toBe(false)
			})
		})

		describe('isFloat', () => {
			it('应该正确检测是否为浮点数字符串', () => {
				expect(Validator.isFloat('123.45')).toBe(true)
				expect(Validator.isFloat('-123.45')).toBe(true)
				expect(Validator.isFloat('123')).toBe(true)
				expect(Validator.isFloat('abc')).toBe(false)
			})
		})

		describe('isBankCard', () => {
			it('应该正确验证银行卡号', () => {
				expect(Validator.isBankCard('1234567890123456')).toBe(true)
				expect(Validator.isBankCard('123456789012345678')).toBe(true)
				expect(Validator.isBankCard('123456789012')).toBe(false) // 太短
				expect(Validator.isBankCard('123456789012345678901')).toBe(false) // 太长
			})
		})

		describe('isPostalCode', () => {
			it('应该正确验证邮政编码', () => {
				expect(Validator.isPostalCode('100000')).toBe(true)
				expect(Validator.isPostalCode('000000')).toBe(false) // 不能以0开头
				expect(Validator.isPostalCode('12345')).toBe(false) // 位数不够
			})
		})

		describe('isQQ', () => {
			it('应该正确验证QQ号', () => {
				expect(Validator.isQQ('12345')).toBe(true)
				expect(Validator.isQQ('1234567890')).toBe(true)
				expect(Validator.isQQ('0123')).toBe(false) // 不能以0开头
				expect(Validator.isQQ('123')).toBe(false) // 太短
			})
		})

		describe('isWechat', () => {
			it('应该正确验证微信号', () => {
				expect(Validator.isWechat('wechat123')).toBe(true)
				expect(Validator.isWechat('WeChat_2023')).toBe(true)
				expect(Validator.isWechat('123456')).toBe(false) // 不能以数字开头
				expect(Validator.isWechat('wx')).toBe(false) // 太短
			})
		})

		describe('isHexColor', () => {
			it('应该正确验证十六进制颜色值', () => {
				expect(Validator.isHexColor('#FF0000')).toBe(true)
				expect(Validator.isHexColor('#fff')).toBe(true)
				expect(Validator.isHexColor('FF0000')).toBe(false)
			})
		})

		describe('isUUID', () => {
			it('应该正确验证UUID', () => {
				expect(Validator.isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
				expect(Validator.isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
				expect(Validator.isUUID('invalid-uuid')).toBe(false)
			})
		})

		describe('isDate', () => {
			it('应该正确验证日期格式', () => {
				expect(Validator.isDate('2023-01-01')).toBe(true)
				expect(Validator.isDate('2023/01/01')).toBe(false)
			})
		})

		describe('isTime', () => {
			it('应该正确验证时间格式', () => {
				expect(Validator.isTime('12:30:45')).toBe(true)
				expect(Validator.isTime('24:00:00')).toBe(false)
			})
		})

		describe('isDateTime', () => {
			it('应该正确验证日期时间格式', () => {
				expect(Validator.isDateTime('2023-01-01 12:30:45')).toBe(true)
				expect(Validator.isDateTime('2023-01-01T12:30:45')).toBe(false)
			})
		})

		describe('isSemver', () => {
			it('应该正确验证语义化版本号', () => {
				expect(Validator.isSemver('1.0.0')).toBe(true)
				expect(Validator.isSemver('1.0.0-alpha')).toBe(true)
				expect(Validator.isSemver('1.0.0+build.1')).toBe(true)
				expect(Validator.isSemver('v1.0.0')).toBe(false)
				expect(Validator.isSemver('1.0')).toBe(false)
			})
		})
	})

	describe('checkPasswordStrength - 密码强度检测', () => {
		it('应该正确检测弱密码', () => {
			const result = checkPasswordStrength('123456')
			expect(result.level).toBe('weak')
			expect(result.score).toBeLessThan(50)
			expect(result.suggestions.length).toBeGreaterThan(0)
		})

		it('应该正确检测中等密码', () => {
			const result = checkPasswordStrength('Password123')
			expect(result.level).toBe('medium')
			expect(result.score).toBeGreaterThanOrEqual(25)
			expect(result.score).toBeLessThan(75)
		})

		it('应该正确检测强密码', () => {
			const result = checkPasswordStrength('MyP@ssw0rd123')
			expect(result.level).toBe('very-strong')
			expect(result.score).toBeGreaterThanOrEqual(50)
		})

		it('应该正确检测非常强的密码', () => {
			const result = checkPasswordStrength('VeryStr0ng!P@ssw0rd2023')
			expect(result.level).toBe('very-strong')
			expect(result.score).toBeGreaterThan(80)
			expect(result.suggestions.length).toBe(0)
		})

		it('应该提供改进建议', () => {
			const result = checkPasswordStrength('weak')
			expect(result.suggestions).toContain('密码长度至少8位')
			expect(result.suggestions).toContain('包含大写字母')
			expect(result.suggestions).toContain('包含数字')
			expect(result.suggestions).toContain('包含特殊字符(@$!%*?&)')
		})

		it('应该检测常见弱密码模式', () => {
			const weakPatterns = ['123456', 'password', 'qwerty', 'aaaaaa']

			weakPatterns.forEach((pattern) => {
				const result = checkPasswordStrength(pattern + 'A1@')
				expect(result.suggestions).toContain('避免使用常见的弱密码模式')
			})
		})
	})
})
