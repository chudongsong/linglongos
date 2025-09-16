/**
 * 字符串工具方法
 */

/**
 * 重复字符串
 * @param str 字符串
 * @param count 重复次数
 * @returns 重复后的字符串
 */
function repeatString(str: string, count: number): string {
	let result = ''
	for (let i = 0; i < count; i++) {
		result += str
	}
	return result
}

/**
 * 截断字符串
 * @param str 字符串
 * @param length 最大长度
 * @param suffix 后缀
 * @returns 截断后的字符串
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
	if (str.length <= length) return str
	return str.slice(0, length - suffix.length) + suffix
}

/**
 * 填充字符串
 * @param str 字符串
 * @param length 目标长度
 * @param char 填充字符
 * @param position 填充位置
 * @returns 填充后的字符串
 */
export function pad(
	str: string,
	length: number,
	char: string = ' ',
	position: 'start' | 'end' | 'both' = 'start',
): string {
	if (str.length >= length) return str

	const padLength = length - str.length

	switch (position) {
		case 'start':
			return repeatString(char, padLength) + str
		case 'end':
			return str + repeatString(char, padLength)
		case 'both':
			const leftPad = Math.floor(padLength / 2)
			const rightPad = padLength - leftPad
			return repeatString(char, leftPad) + str + repeatString(char, rightPad)
		default:
			return str
	}
}

/**
 * 转换为驼峰命名
 * @param str 字符串
 * @returns 驼峰命名字符串
 */
export function toCamelCase(str: string): string {
	return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (c) => c.toLowerCase())
}

/**
 * 转换为帕斯卡命名
 * @param str 字符串
 * @returns 帕斯卡命名字符串
 */
export function toPascalCase(str: string): string {
	const camelCase = toCamelCase(str)
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

/**
 * 转换为短横线命名
 * @param str 字符串
 * @returns 短横线命名字符串
 */
export function toKebabCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase()
}

/**
 * 转换为下划线命名
 * @param str 字符串
 * @returns 下划线命名字符串
 */
export function toSnakeCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.replace(/[\s-]+/g, '_')
		.toLowerCase()
}

/**
 * 转换为标题命名
 * @param str 字符串
 * @returns 标题命名字符串
 */
export function toTitleCase(str: string): string {
	return str
		.toLowerCase()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

/**
 * 移除字符串中的空白字符
 * @param str 字符串
 * @param type 移除类型
 * @returns 处理后的字符串
 */
export function removeWhitespace(str: string, type: 'all' | 'start' | 'end' | 'both' = 'both'): string {
	switch (type) {
		case 'all':
			return str.replace(/\s/g, '')
		case 'start':
			return str.replace(/^\s+/, '')
		case 'end':
			return str.replace(/\s+$/, '')
		case 'both':
			return str.trim()
		default:
			return str
	}
}

/**
 * 模板字符串替换
 * @param template 模板字符串
 * @param data 数据对象
 * @returns 替换后的字符串
 */
export function template(template: string, data: Record<string, any>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return data[key] !== undefined ? String(data[key]) : match
	})
}

/**
 * 格式化JSON
 * @param obj 对象
 * @param indent 缩进空格数
 * @returns 格式化后的JSON字符串
 */
export function formatJson(obj: any, indent: number = 2): string {
	try {
		return JSON.stringify(obj, null, indent)
	} catch (error) {
		return String(obj)
	}
}

/**
 * 移除HTML标签
 * @param str 字符串
 * @returns 移除HTML标签后的字符串
 */
export function removeHtmlTags(str: string): string {
	return str.replace(/<[^>]+>/g, '')
}

/**
 * 移除多余空白字符
 * @param str 字符串
 * @returns 处理后的字符串
 */
export function removeExtraWhitespace(str: string): string {
	return str.replace(/\s+/g, ' ').trim()
}

/**
 * 提取文件扩展名
 * @param filename 文件名
 * @returns 扩展名
 */
export function getFileExtension(filename: string): string {
	const match = filename.match(/\.[^.]+$/)
	return match ? match[0] : ''
}

/**
 * 高亮关键词
 * @param text 文本
 * @param keywords 关键词数组
 * @param className CSS类名
 * @returns 高亮后的HTML字符串
 */
export function highlightKeywords(text: string, keywords: string[], className: string = 'highlight'): string {
	if (!keywords.length) return text

	const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
	return text.replace(pattern, `<span class="${className}">$1</span>`)
}

/**
 * 首字母大写
 * @param str 字符串
 * @returns 首字母大写的字符串
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 每个单词首字母大写
 * @param str 字符串
 * @returns 每个单词首字母大写的字符串
 */
export function titleCase(str: string): string {
	return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

/**
 * 脱敏手机号
 * @param phone 手机号
 * @returns 脱敏后的手机号
 */
export function maskPhone(phone: string): string {
	if (!/^1[3-9]\d{9}$/.test(phone)) return phone
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 脱敏邮箱
 * @param email 邮箱
 * @returns 脱敏后的邮箱
 */
export function maskEmail(email: string): string {
	if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return email
	return email.replace(/(.{1,3}).*@/, '$1***@')
}

/**
 * 脱敏身份证号
 * @param idCard 身份证号
 * @returns 脱敏后的身份证号
 */
export function maskIdCard(idCard: string): string {
	if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) return idCard
	return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

/**
 * 脱敏银行卡号
 * @param bankCard 银行卡号
 * @returns 脱敏后的银行卡号
 */
export function maskBankCard(bankCard: string): string {
	if (!/^[1-9]\d{12,19}$/.test(bankCard)) return bankCard
	return bankCard.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
}

/**
 * 字符串工具集合
 */
export const StringUtils = {
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
}
