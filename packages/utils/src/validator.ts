/**
 * 常用正则表达式和验证工具
 */

/**
 * 常用正则表达式集合
 */
export const RegexPatterns = {
	// 邮箱
	email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

	// 手机号（中国大陆）
	phone: /^1[3-9]\d{9}$/,

	// 身份证号（中国大陆）
	idCard: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,

	// URL
	url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,

	// IP地址（IPv4）
	ipv4: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,

	// IP地址（IPv6）
	ipv6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,

	// MAC地址
	mac: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,

	// 密码强度（至少8位，包含大小写字母、数字和特殊字符）
	strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

	// 中等密码强度（至少6位，包含字母和数字）
	mediumPassword: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,

	// 中文字符
	chinese: /[\u4e00-\u9fa5]/,

	// 纯中文
	pureChineseText: /^[\u4e00-\u9fa5]+$/,

	// 英文字母
	english: /^[A-Za-z]+$/,

	// 数字
	number: /^\d+$/,

	// 正整数
	positiveInteger: /^[1-9]\d*$/,

	// 浮点数
	float: /^-?\d+(\.\d+)?$/,

	// 银行卡号
	bankCard: /^[1-9]\d{12,19}$/,

	// 邮政编码（中国）
	postalCode: /^[1-9]\d{5}$/,

	// QQ号
	qq: /^[1-9][0-9]{4,10}$/,

	// 微信号
	wechat: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,

	// 车牌号（中国）
	licensePlate:
		/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/,

	// HTML标签
	htmlTag: /<[^>]+>/g,

	// 十六进制颜色值
	hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,

	// Base64
	base64: /^[A-Za-z0-9+/]*={0,2}$/,

	// UUID
	uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

	// 日期格式（YYYY-MM-DD）
	date: /^\d{4}-\d{2}-\d{2}$/,

	// 时间格式（HH:MM:SS）
	time: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,

	// 日期时间格式（YYYY-MM-DD HH:MM:SS）
	datetime: /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,

	// 语义化版本号
	semver:
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
} as const

/**
 * 验证工具函数
 */
export const Validator = {
	/**
	 * 验证邮箱
	 */
	isEmail: (value: string): boolean => RegexPatterns.email.test(value),

	/**
	 * 验证手机号
	 */
	isPhone: (value: string): boolean => RegexPatterns.phone.test(value),

	/**
	 * 验证身份证号
	 */
	isIdCard: (value: string): boolean => RegexPatterns.idCard.test(value),

	/**
	 * 验证URL
	 */
	isUrl: (value: string): boolean => RegexPatterns.url.test(value),

	/**
	 * 验证IPv4地址
	 */
	isIPv4: (value: string): boolean => RegexPatterns.ipv4.test(value),

	/**
	 * 验证IPv6地址
	 */
	isIPv6: (value: string): boolean => RegexPatterns.ipv6.test(value),

	/**
	 * 验证MAC地址
	 */
	isMac: (value: string): boolean => RegexPatterns.mac.test(value),

	/**
	 * 验证密码强度
	 */
	isStrongPassword: (value: string): boolean => RegexPatterns.strongPassword.test(value),

	/**
	 * 验证中等密码强度
	 */
	isMediumPassword: (value: string): boolean => RegexPatterns.mediumPassword.test(value),

	/**
	 * 验证是否包含中文
	 */
	hasChinese: (value: string): boolean => RegexPatterns.chinese.test(value),

	/**
	 * 验证是否为纯中文
	 */
	isPureChinese: (value: string): boolean => RegexPatterns.pureChineseText.test(value),

	/**
	 * 验证是否为纯英文
	 */
	isEnglish: (value: string): boolean => RegexPatterns.english.test(value),

	/**
	 * 验证是否为数字
	 */
	isNumber: (value: string): boolean => RegexPatterns.number.test(value),

	/**
	 * 验证是否为正整数
	 */
	isPositiveInteger: (value: string): boolean => RegexPatterns.positiveInteger.test(value),

	/**
	 * 验证是否为浮点数
	 */
	isFloat: (value: string): boolean => RegexPatterns.float.test(value),

	/**
	 * 验证银行卡号
	 */
	isBankCard: (value: string): boolean => RegexPatterns.bankCard.test(value),

	/**
	 * 验证邮政编码
	 */
	isPostalCode: (value: string): boolean => RegexPatterns.postalCode.test(value),

	/**
	 * 验证QQ号
	 */
	isQQ: (value: string): boolean => RegexPatterns.qq.test(value),

	/**
	 * 验证微信号
	 */
	isWechat: (value: string): boolean => RegexPatterns.wechat.test(value),

	/**
	 * 验证车牌号
	 */
	isLicensePlate: (value: string): boolean => RegexPatterns.licensePlate.test(value),

	/**
	 * 验证十六进制颜色值
	 */
	isHexColor: (value: string): boolean => RegexPatterns.hexColor.test(value),

	/**
	 * 验证Base64
	 */
	isBase64: (value: string): boolean => RegexPatterns.base64.test(value),

	/**
	 * 验证UUID
	 */
	isUUID: (value: string): boolean => RegexPatterns.uuid.test(value),

	/**
	 * 验证日期格式
	 */
	isDate: (value: string): boolean => RegexPatterns.date.test(value),

	/**
	 * 验证时间格式
	 */
	isTime: (value: string): boolean => RegexPatterns.time.test(value),

	/**
	 * 验证日期时间格式
	 */
	isDateTime: (value: string): boolean => RegexPatterns.datetime.test(value),

	/**
	 * 验证语义化版本号
	 */
	isSemver: (value: string): boolean => RegexPatterns.semver.test(value),
} as const

/**
 * 密码强度检测
 */
export function checkPasswordStrength(password: string): {
	score: number
	level: 'weak' | 'medium' | 'strong' | 'very-strong'
	suggestions: string[]
} {
	let score = 0
	const suggestions: string[] = []

	// 长度检查
	if (password.length >= 8) {
		score += 1
	} else {
		suggestions.push('密码长度至少8位')
	}

	if (password.length >= 12) {
		score += 1
	}

	// 包含小写字母
	if (/[a-z]/.test(password)) {
		score += 1
	} else {
		suggestions.push('包含小写字母')
	}

	// 包含大写字母
	if (/[A-Z]/.test(password)) {
		score += 1
	} else {
		suggestions.push('包含大写字母')
	}

	// 包含数字
	if (/\d/.test(password)) {
		score += 1
	} else {
		suggestions.push('包含数字')
	}

	// 包含特殊字符
	if (/[@$!%*?&]/.test(password)) {
		score += 1
	} else {
		suggestions.push('包含特殊字符(@$!%*?&)')
	}

	// 不包含常见弱密码模式
	const weakPatterns = [
		/123456/,
		/password/i,
		/qwerty/i,
		/abc123/i,
		/(\w)\1{2,}/, // 连续相同字符
	]

	const hasWeakPattern = weakPatterns.some((pattern) => pattern.test(password))
	if (!hasWeakPattern) {
		score += 1
	} else {
		suggestions.push('避免使用常见的弱密码模式')
	}

	// 确定强度等级
	let level: 'weak' | 'medium' | 'strong' | 'very-strong'
	if (score <= 2) {
		level = 'weak'
	} else if (score <= 4) {
		level = 'medium'
	} else if (score <= 6) {
		level = 'strong'
	} else {
		level = 'very-strong'
	}

	return {
		score: Math.round((score / 7) * 100),
		level,
		suggestions,
	}
}
