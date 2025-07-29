/**
 * 工具库使用示例
 */

import {
  DataType,
  FileUtils,
  Validator,
  NumberFormat,
  DateFormat,
  StringFormat,
} from '@linglongos/utils'

/**
 * 数据处理示例
 */
export function dataProcessingDemo() {
  console.log('=== 数据处理工具示例 ===')

  // 数据类型判断
  console.log('数据类型判断:')
  console.log('是否为字符串:', DataType.isString('hello'))
  console.log('是否为数字:', DataType.isNumber(123))
  console.log('是否为数组:', DataType.isArray([1, 2, 3]))
  console.log('是否为空值:', DataType.isEmpty(''))

  // 数组操作
  const testArray = [1, 2, 2, 3, 4, 4, 5]
  console.log('原数组:', testArray)
  console.log(
    '去重后:',
    testArray.filter((item, index) => testArray.indexOf(item) === index)
  )

  // 对象深拷贝
  const originalObj = { name: '张三', age: 25, hobbies: ['读书', '游戏'] }
  console.log('原对象:', originalObj)
}

/**
 * 文件处理示例
 */
export function fileProcessingDemo() {
  console.log('=== 文件处理工具示例 ===')

  const filename = 'document.pdf'
  console.log('文件名:', filename)
  console.log('扩展名:', FileUtils.getExtension(filename))
  console.log('基础名:', FileUtils.getBasename(filename))
  console.log('文件类型:', FileUtils.getFileType(filename))
  console.log('是否为文档:', FileUtils.isDocument(filename))

  // 文件大小格式化
  const fileSize = 1024 * 1024 * 2.5 // 2.5MB
  console.log('文件大小:', FileUtils.formatSize(fileSize))

  // 路径处理
  const filepath = '/home/user/documents/report.xlsx'
  console.log('路径解析:', FileUtils.parsePath(filepath))
}

/**
 * 验证工具示例
 */
export function validationDemo() {
  console.log('=== 验证工具示例 ===')

  const email = 'user@example.com'
  const phone = '13812345678'
  const url = 'https://www.example.com'

  console.log('邮箱验证:', email, '→', Validator.isEmail(email))
  console.log('手机号验证:', phone, '→', Validator.isPhone(phone))
  console.log('URL验证:', url, '→', Validator.isUrl(url))

  // 密码强度检测
  const password = 'MyPassword123!'
  console.log('密码强度:', password)
  // 这里需要导入密码强度检测函数
}

/**
 * 格式化工具示例
 */
export function formatDemo() {
  console.log('=== 格式化工具示例 ===')

  // 数字格式化
  const number = 1234567.89
  console.log('千分位格式:', NumberFormat.toThousands(number))
  console.log('货币格式:', NumberFormat.toCurrency(number))
  console.log('百分比格式:', NumberFormat.toPercent(0.85))

  // 日期格式化
  const now = new Date()
  console.log('当前时间:', DateFormat.format(now))
  console.log('相对时间:', DateFormat.fromNow(new Date(Date.now() - 3600000))) // 1小时前
  console.log('友好日期:', DateFormat.getFriendlyDate(now))

  // 字符串格式化
  const longText = '这是一个很长的文本内容，需要被截断处理'
  console.log('截断文本:', StringFormat.truncate(longText, 10))
  console.log('模板替换:', StringFormat.template('你好，{{name}}！', { name: '张三' }))
}

/**
 * 运行所有示例
 */
export function runAllDemos() {
  dataProcessingDemo()
  console.log('\n')

  fileProcessingDemo()
  console.log('\n')

  validationDemo()
  console.log('\n')

  formatDemo()
}
