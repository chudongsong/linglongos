# @linglongos/utils 工具库文档

> 玲珑OS工具库 - 提供常用的工具方法，包括数据处理、文件操作、URL处理、正则验证、格式化等功能

## 📦 安装

```bash
pnpm add @linglongos/utils
```

## 🚀 快速开始

```typescript
import { DataType, FileUtils, formatDate, Validator } from '@linglongos/utils'

// 数据类型判断
if (DataType.isString(value)) {
  console.log('这是一个字符串')
}

// 文件处理
const fileType = FileUtils.getFileType('document.pdf')
const fileSize = FileUtils.formatSize(1024 * 1024) // '1.00 MB'

// 日期格式化
const formatted = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')

// 数据验证
if (Validator.isEmail('user@example.com')) {
  console.log('有效的邮箱地址')
}
```

## 📚 模块详解

### 🔍 数据处理工具 (Data)

#### DataType - 数据类型判断

提供全面的数据类型判断方法：

```typescript
import { DataType } from '@linglongos/utils'

// 基础类型判断
DataType.isString('hello')           // true
DataType.isNumber(123)               // true
DataType.isBoolean(true)             // true
DataType.isArray([1, 2, 3])          // true
DataType.isObject({ key: 'value' })  // true
DataType.isFunction(() => {})        // true

// 空值判断
DataType.isNull(null)                // true
DataType.isUndefined(undefined)      // true
DataType.isNullOrUndefined(null)     // true
DataType.isEmpty('')                 // true (空字符串)
DataType.isEmpty([])                 // true (空数组)
DataType.isEmpty({})                 // true (空对象)

// 特殊类型判断
DataType.isDate(new Date())          // true
DataType.isRegExp(/pattern/)         // true
DataType.isPromise(Promise.resolve()) // true
DataType.isInteger(42)               // true
DataType.isPositive(10)              // true
DataType.isNegative(-5)              // true
```

#### 数组和对象操作

```typescript
import { deepClone, deepMerge, uniqueArray, groupBy, sortBy, paginate } from '@linglongos/utils'

// 深拷贝
const original = { name: '张三', hobbies: ['读书', '游泳'] }
const cloned = deepClone(original)

// 深度合并
const merged = deepMerge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
) // { a: 1, b: { c: 2, d: 3 }, e: 4 }

// 数组去重
const unique = uniqueArray([1, 2, 2, 3, 4, 4]) // [1, 2, 3, 4]

// 按属性去重
const users = [{ id: 1, name: '张三' }, { id: 1, name: '李四' }]
const uniqueUsers = uniqueArray(users, 'id') // [{ id: 1, name: '张三' }]

// 数组分组
const grouped = groupBy(
  [{ type: 'fruit', name: '苹果' }, { type: 'fruit', name: '香蕉' }],
  'type'
) // { fruit: [{ type: 'fruit', name: '苹果' }, { type: 'fruit', name: '香蕉' }] }

// 数组排序
const sorted = sortBy(
  [{ age: 25 }, { age: 30 }, { age: 20 }],
  'age',
  'desc'
) // [{ age: 30 }, { age: 25 }, { age: 20 }]

// 分页
const { data, total, page, pageSize, totalPages } = paginate(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  2, // 第2页
  3  // 每页3条
) // { data: [4, 5, 6], total: 10, page: 2, pageSize: 3, totalPages: 4 }
```

#### 树形数据处理

```typescript
import { flattenTree, arrayToTree } from '@linglongos/utils'

// 树形数据扁平化
const tree = [
  {
    id: 1,
    name: '根节点',
    children: [
      { id: 2, name: '子节点1' },
      { id: 3, name: '子节点2' }
    ]
  }
]
const flattened = flattenTree(tree)
// [{ id: 1, name: '根节点' }, { id: 2, name: '子节点1' }, { id: 3, name: '子节点2' }]

// 数组转树形结构
const array = [
  { id: 1, name: '根节点', parentId: null },
  { id: 2, name: '子节点1', parentId: 1 },
  { id: 3, name: '子节点2', parentId: 1 }
]
const treeData = arrayToTree(array, {
  idKey: 'id',
  parentIdKey: 'parentId',
  childrenKey: 'children'
})
```

### 📁 文件处理工具 (File)

#### FileUtils - 文件工具类

```typescript
import { FileUtils, getMimeType } from '@linglongos/utils'

// 文件信息获取
FileUtils.getExtension('document.pdf')    // '.pdf'
FileUtils.getBasename('document.pdf')     // 'document'
FileUtils.getDirname('/path/to/file.txt') // '/path/to'
FileUtils.getFileType('image.jpg')        // 'image'

// 文件类型判断
FileUtils.isImage('photo.jpg')            // true
FileUtils.isVideo('movie.mp4')            // true
FileUtils.isAudio('music.mp3')            // true
FileUtils.isDocument('report.pdf')        // true
FileUtils.isArchive('data.zip')           // true
FileUtils.isCode('script.js')             // true

// 文件大小格式化
FileUtils.formatSize(1024)                // '1.00 KB'
FileUtils.formatSize(1024 * 1024)         // '1.00 MB'
FileUtils.formatSize(1024 * 1024 * 1024)  // '1.00 GB'

// 文件名处理
FileUtils.sanitizeFilename('file<>name.txt')  // 'filename.txt'
FileUtils.generateUniqueFilename('file.txt', ['file.txt', 'file(1).txt'])
// 'file(2).txt'

// 路径处理
FileUtils.joinPath('home', 'user', 'docs')           // 'home/user/docs'
FileUtils.normalizePath('home//user/../docs')        // 'home/docs'
FileUtils.isAbsolutePath('/home/user')               // true
FileUtils.getRelativePath('/home/user', '/home/user/docs') // 'docs'

// 路径解析
const pathInfo = FileUtils.parsePath('/home/user/document.pdf')
// {
//   dir: '/home/user',
//   base: 'document.pdf',
//   name: 'document',
//   ext: '.pdf'
// }

// MIME类型
getMimeType('document.pdf')               // 'application/pdf'
getMimeType('image.jpg')                  // 'image/jpeg'
```

#### FileUploadUtils - 文件上传工具

```typescript
import { FileUploadUtils } from '@linglongos/utils'

// 文件类型验证
const isValidType = FileUploadUtils.validateFileType(
  file,
  ['image/jpeg', 'image/png']
)

// 文件大小验证
const isValidSize = FileUploadUtils.validateFileSize(
  file,
  5 * 1024 * 1024 // 5MB
)

// 读取文件为Base64
const base64 = await FileUploadUtils.readAsBase64(file)

// 读取文件为文本
const text = await FileUploadUtils.readAsText(file)

// 图片压缩
const compressedBlob = await FileUploadUtils.compressImage(
  imageFile,
  0.8,    // 质量
  1920,   // 最大宽度
  1080    // 最大高度
)
```

### 🌐 URL处理工具 (URL)

```typescript
import {
  parseUrlParams,
  buildUrlParams,
  addUrlParams,
  removeUrlParams,
  getDomain,
  formatUrl
} from '@linglongos/utils'

// URL参数解析
const params = parseUrlParams('https://example.com?name=张三&age=25')
// { name: '张三', age: '25' }

// 构建参数字符串
const queryString = buildUrlParams({ name: '李四', age: 30 })
// 'name=李四&age=30'

// 添加参数到URL
const newUrl = addUrlParams('https://example.com', { page: 1, size: 10 })
// 'https://example.com?page=1&size=10'

// 移除URL参数
const cleanUrl = removeUrlParams(
  'https://example.com?name=test&age=25&city=beijing',
  ['age', 'city']
) // 'https://example.com?name=test'

// 获取域名
getDomain('https://www.example.com/path') // 'www.example.com'

// URL格式化
const formatted = formatUrl('http://www.example.com/', {
  forceHttps: true,
  removeWww: true,
  removeTrailingSlash: true
}) // 'https://example.com'

// API URL构建
const apiUrl = buildApiUrl(
  'https://api.example.com',
  '/users/:id/posts',
  { id: 123, page: 1 }
) // 'https://api.example.com/users/123/posts?page=1'
```

### 🔤 字符串工具 (String)

```typescript
import {
  truncate,
  pad,
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  toTitleCase,
  removeWhitespace,
  template
} from '@linglongos/utils'

// 字符串截断
truncate('这是一个很长的字符串', 5)        // '这是...'
truncate('这是一个很长的字符串', 5, '***') // '这是***'

// 字符串填充
pad('abc', 5)                    // '  abc'
pad('abc', 5, '0', 'end')        // 'abc00'
pad('abc', 5, '0', 'both')       // '0abc0'

// 命名转换
toCamelCase('hello-world')       // 'helloWorld'
toPascalCase('hello-world')      // 'HelloWorld'
toKebabCase('helloWorld')        // 'hello-world'
toSnakeCase('helloWorld')        // 'hello_world'
toTitleCase('hello world')       // 'Hello World'

// 空白字符处理
removeWhitespace('  hello world  ', 'both')  // 'hello world'
removeWhitespace('  hello world  ', 'all')   // 'helloworld'

// 模板字符串
template('Hello {{name}}, you are {{age}} years old', {
  name: '张三',
  age: 25
}) // 'Hello 张三, you are 25 years old'
```

### 🔢 数字工具 (Number)

```typescript
import {
  toThousands,
  formatFileSize,
  toPercent,
  toCurrency,
  toChineseNumber,
  toRoman,
  randomInt,
  clamp
} from '@linglongos/utils'

// 千分位格式化
toThousands(1234567.89)          // '1,234,567.89'
toThousands(1234567.89, 0)       // '1,234,568'

// 文件大小格式化
formatFileSize(1024)             // '1.00 KB'
formatFileSize(1024 * 1024)      // '1.00 MB'

// 百分比格式化
toPercent(0.1234)                // '12.34%'
toPercent(0.1234, 1)             // '12.3%'

// 货币格式化
toCurrency(1234.56)              // '¥1,234.56'
toCurrency(1234.56, '$')         // '$1,234.56'

// 数字转中文
toChineseNumber(123)             // '一百二十三'
toChineseNumber(1000)            // '一千'

// 数字转罗马数字
toRoman(123)                     // 'CXXIII'
toRoman(1994)                    // 'MCMXCIV'

// 随机数生成
randomInt(1, 10)                 // 1-10之间的随机整数
randomFloat(1, 10, 2)            // 1-10之间的随机浮点数，保留2位小数

// 数值限制
clamp(15, 1, 10)                 // 10 (限制在1-10之间)
clamp(-5, 1, 10)                 // 1
```

### 📅 日期工具 (Date)

```typescript
import {
  formatDate,
  getRelativeTime,
  formatDuration,
  getFriendlyDate,
  getWeekday,
  getDateRange,
  isLeapYear,
  getDaysInMonth
} from '@linglongos/utils'

// 日期格式化
formatDate(new Date(), 'YYYY-MM-DD')           // '2024-01-15'
formatDate(new Date(), 'YYYY年MM月DD日')        // '2024年01月15日'
formatDate(new Date(), 'HH:mm:ss')             // '14:30:25'

// 相对时间
getRelativeTime(new Date(Date.now() - 60000))  // '1分钟前'
getRelativeTime(new Date(Date.now() - 3600000)) // '1小时前'

// 持续时间格式化
formatDuration(90000)                          // '1分钟30秒'
formatDuration(3661000)                        // '1小时1分钟1秒'

// 友好日期
getFriendlyDate(new Date())                    // '今天'
getFriendlyDate(new Date(Date.now() - 86400000)) // '昨天'

// 星期几
getWeekday(new Date(), 'zh')                   // '星期一'
getWeekday(new Date(), 'en')                   // 'Monday'
getWeekday(new Date(), 'short')                // '周一'

// 日期范围
const range = getDateRange('2024-01-01', '2024-01-03')
// [Date(2024-01-01), Date(2024-01-02), Date(2024-01-03)]

// 闰年判断
isLeapYear(2024)                               // true
isLeapYear(2023)                               // false

// 获取月份天数
getDaysInMonth(2024, 2)                        // 29 (2024年2月)
getDaysInMonth(2023, 2)                        // 28 (2023年2月)
```

### ✅ 正则验证工具 (Regex)

#### Validator - 数据验证

```typescript
import { Validator } from '@linglongos/utils'

// 基础验证
Validator.isEmail('user@example.com')          // true
Validator.isPhone('13812345678')               // true
Validator.isIdCard('110101199001011234')       // true
Validator.isUrl('https://www.example.com')     // true

// 网络相关验证
Validator.isIPv4('192.168.1.1')               // true
Validator.isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334') // true
Validator.isMac('00:1B:44:11:3A:B7')           // true

// 密码强度验证
Validator.isStrongPassword('Abc123!@#')        // true
Validator.isMediumPassword('abc123')           // true

// 文本类型验证
Validator.hasChinese('Hello 世界')             // true
Validator.isPureChinese('你好世界')            // true
Validator.isEnglish('Hello')                   // true

// 数字验证
Validator.isNumber('123')                      // true
Validator.isPositiveInteger('123')             // true
Validator.isFloat('123.45')                    // true

// 其他验证
Validator.isBankCard('6222021234567890123')    // true
Validator.isPostalCode('100000')               // true
Validator.isQQ('12345678')                     // true
Validator.isWechat('wx_user123')               // true
Validator.isLicensePlate('京A12345')           // true
Validator.isHexColor('#FF0000')                // true
Validator.isBase64('SGVsbG8gV29ybGQ=')          // true
Validator.isUUID('550e8400-e29b-41d4-a716-446655440000') // true
Validator.isDate('2024-01-15')                 // true
Validator.isTime('14:30:25')                   // true
Validator.isDateTime('2024-01-15 14:30:25')    // true
Validator.isSemver('1.2.3')                    // true
```

#### StringProcessor - 字符串处理

```typescript
import { StringProcessor } from '@linglongos/utils'

// HTML标签移除
StringProcessor.removeHtmlTags('<p>Hello <b>World</b></p>') // 'Hello World'

// 多余空白字符处理
StringProcessor.removeExtraWhitespace('  hello   world  ')  // 'hello world'

// 文件扩展名提取
StringProcessor.getFileExtension('document.pdf')            // '.pdf'

// 信息提取
StringProcessor.extractEmails('联系邮箱：user@example.com') // ['user@example.com']
StringProcessor.extractUrls('访问 https://example.com')     // ['https://example.com']
StringProcessor.extractPhones('电话：13812345678')          // ['13812345678']

// 信息脱敏
StringProcessor.maskPhone('13812345678')                   // '138****5678'
StringProcessor.maskEmail('user@example.com')             // 'u***@example.com'
StringProcessor.maskIdCard('110101199001011234')          // '110101****1234'
StringProcessor.maskBankCard('6222021234567890123')       // '622202****0123'

// 关键词高亮
StringProcessor.highlightKeywords(
  '这是一段包含关键词的文本',
  ['关键词'],
  'highlight'
) // '这是一段包含<span class="highlight">关键词</span>的文本'

// 命名转换
StringProcessor.toCamelCase('hello-world')                 // 'helloWorld'
StringProcessor.toKebabCase('helloWorld')                  // 'hello-world'
StringProcessor.toSnakeCase('helloWorld')                  // 'hello_world'
StringProcessor.capitalize('hello')                        // 'Hello'
StringProcessor.titleCase('hello world')                   // 'Hello World'
```

#### 密码强度检查

```typescript
import { checkPasswordStrength } from '@linglongos/utils'

const result = checkPasswordStrength('MyPassword123!')
// {
//   score: 85,
//   level: 'strong',
//   suggestions: []
// }

const weakResult = checkPasswordStrength('123456')
// {
//   score: 20,
//   level: 'weak',
//   suggestions: [
//     '密码长度至少8位',
//     '包含大写字母',
//     '包含小写字母',
//     '包含特殊字符'
//   ]
// }
```

### 🎨 格式化工具 (Format)

#### NumberFormat - 数字格式化

```typescript
import { NumberFormat } from '@linglongos/utils'

// 千分位格式化
NumberFormat.toThousands(1234567.89)          // '1,234,567.89'

// 文件大小格式化
NumberFormat.formatFileSize(1024 * 1024)      // '1.00 MB'

// 百分比格式化
NumberFormat.toPercent(0.1234)                // '12.34%'

// 货币格式化
NumberFormat.toCurrency(1234.56)              // '¥1,234.56'

// 中文数字
NumberFormat.toChineseNumber(123)             // '一百二十三'

// 罗马数字
NumberFormat.toRoman(123)                     // 'CXXIII'

// 范围格式化
NumberFormat.formatRange(10, 20)              // '10 - 20'
```

#### DateFormat - 日期格式化

```typescript
import { DateFormat } from '@linglongos/utils'

// 日期格式化
DateFormat.format(new Date(), 'YYYY-MM-DD')   // '2024-01-15'

// 相对时间
DateFormat.fromNow(new Date(Date.now() - 60000)) // '1分钟前'

// 持续时间
DateFormat.formatDuration(90000)              // '1分钟30秒'

// 友好日期
DateFormat.getFriendlyDate(new Date())        // '今天'

// 星期几
DateFormat.getWeekday(new Date(), 'zh')       // '星期一'
```

#### StringFormat - 字符串格式化

```typescript
import { StringFormat } from '@linglongos/utils'

// 模板字符串
StringFormat.template('Hello {{name}}', { name: '张三' }) // 'Hello 张三'

// 字符串截断
StringFormat.truncate('长字符串', 5)           // '长字符...'

// 字符串填充
StringFormat.pad('abc', 5, '0')               // '00abc'

// JSON格式化
StringFormat.formatJson({ name: '张三' })     // '{\n  "name": "张三"\n}'

// 标题格式化
StringFormat.toTitle('hello world')           // 'Hello World'

// 空白字符处理
StringFormat.removeWhitespace('  hello  ')    // 'hello'
```

#### ColorFormat - 颜色格式化

```typescript
import { ColorFormat } from '@linglongos/utils'

// 十六进制转RGB
ColorFormat.hexToRgb('#FF0000')               // { r: 255, g: 0, b: 0 }

// RGB转十六进制
ColorFormat.rgbToHex(255, 0, 0)               // '#FF0000'

// HSL转RGB
ColorFormat.hslToRgb(0, 100, 50)              // { r: 255, g: 0, b: 0 }

// 随机颜色
ColorFormat.randomColor('hex')                // '#A1B2C3'
ColorFormat.randomColor('rgb')                // 'rgb(161, 178, 195)'
ColorFormat.randomColor('hsl')                // 'hsl(210, 25%, 70%)'
```

## 🧪 测试

工具库包含完整的单元测试，确保代码质量和功能正确性：

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

测试文件位于 `test/` 目录下，包含：
- `string.test.ts` - 字符串工具测试
- `date.test.ts` - 日期工具测试
- `file.test.ts` - 文件工具测试
- `number.test.ts` - 数字工具测试

## 📦 构建

```bash
# 开发模式（监听文件变化）
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

构建配置：
- 使用 `tsup` 构建工具
- 支持 CommonJS 和 ES Module 双格式输出
- 自动生成 TypeScript 类型定义文件
- 支持 Tree Shaking

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具库！

### 开发指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 配置
- 为新功能编写单元测试
- 添加详细的 JSDoc 注释
- 保持向后兼容性

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看文档和示例代码
2. 搜索已有的 Issue
3. 创建新的 Issue 并提供详细信息

---

**玲珑OS团队** ❤️ 用心打造