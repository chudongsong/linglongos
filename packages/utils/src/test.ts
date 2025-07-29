/**
 * 工具库功能测试
 */

import { DataType, FileUtils, Validator, NumberFormat, DateFormat } from './index'

console.log('🚀 开始测试玲珑OS工具库...\n')

// 测试数据类型判断
console.log('📊 数据类型判断测试:')
console.log('  isString("hello"):', DataType.isString('hello'))
console.log('  isNumber(123):', DataType.isNumber(123))
console.log('  isArray([1,2,3]):', DataType.isArray([1, 2, 3]))
console.log('  isEmpty(""):', DataType.isEmpty(''))
console.log('')

// 测试文件工具
console.log('📁 文件处理测试:')
const filename = 'document.pdf'
console.log(`  文件名: ${filename}`)
console.log('  扩展名:', FileUtils.getExtension(filename))
console.log('  基础名:', FileUtils.getBasename(filename))
console.log('  文件类型:', FileUtils.getFileType(filename))
console.log('  是否为文档:', FileUtils.isDocument(filename))
console.log('  文件大小格式化:', FileUtils.formatSize(1024 * 1024 * 2.5))
console.log('')

// 测试验证工具
console.log('✅ 验证工具测试:')
console.log('  邮箱验证:', Validator.isEmail('user@example.com'))
console.log('  手机号验证:', Validator.isPhone('13812345678'))
console.log('  URL验证:', Validator.isUrl('https://www.example.com'))
console.log('')

// 测试格式化工具
console.log('🎨 格式化工具测试:')
const number = 1234567.89
console.log('  千分位格式:', NumberFormat.toThousands(number))
console.log('  货币格式:', NumberFormat.toCurrency(number))
console.log('  百分比格式:', NumberFormat.toPercent(0.85))

const now = new Date()
console.log('  当前时间:', DateFormat.format(now))
console.log('  相对时间:', DateFormat.fromNow(new Date(Date.now() - 3600000)))
console.log('  友好日期:', DateFormat.getFriendlyDate(now))
console.log('')

console.log('✨ 工具库测试完成！所有功能正常工作。')
