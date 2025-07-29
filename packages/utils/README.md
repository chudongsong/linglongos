# @linglongos/utils

玲珑OS工具库 - 提供常用的工具方法，包括数据处理、文件操作、URL处理、正则验证、格式化等功能。

## 安装

```bash
pnpm add @linglongos/utils
```

## 功能模块

### 📊 数据处理工具 (DataType)

提供数据类型判断、数组操作、对象处理等功能。

```typescript
import { DataType, deepClone, uniqueArray, groupBy } from '@linglongos/utils'

// 数据类型判断
DataType.isString('hello')     // true
DataType.isNumber(123)         // true
DataType.isArray([1, 2, 3])    // true
DataType.isEmpty('')           // true

// 深拷贝
const original = { name: '张三', hobbies: ['读书'] }
const cloned = deepClone(original)

// 数组去重
const unique = uniqueArray([1, 2, 2, 3, 4, 4])  // [1, 2, 3, 4]

// 数组分组
const grouped = groupBy(
  [{ type: 'fruit', name: '苹果' }, { type: 'fruit', name: '香蕉' }],
  'type'
)
```

### 📁 文件处理工具 (FileUtils)

提供文件类型判断、路径处理、文件大小格式化等功能。

```typescript
import { FileUtils, getMimeType } from '@linglongos/utils'

// 文件信息获取
FileUtils.getExtension('document.pdf')    // '.pdf'
FileUtils.getBasename('document.pdf')     // 'document'
FileUtils.getFileType('image.jpg')        // 'image'

// 文件类型判断
FileUtils.isImage('photo.jpg')            // true
FileUtils.isDocument('report.pdf')        // true
FileUtils.isCode('script.js')             // true

// 文件大小格式化
FileUtils.formatSize(1024 * 1024)         // '1.00 MB'

// 路径处理
FileUtils.joinPath('home', 'user', 'docs')           // 'home/user/docs'
FileUtils.parsePath('/home/user/document.pdf')       // { dir, base, name, ext }
FileUtils.normalizePath('home//user/../docs')        // 'home/docs'

// MIME类型
getMimeType('document.pdf')               // 'application/pdf'
```

### 🌐 URL处理工具

提供URL解析、参数处理、路径操作等功能。

```typescript
import { parseUrlParams, buildUrlParams, addUrlParams, formatUrl } from '@linglongos/utils'

// URL参数解析
const params = parseUrlParams('https://example.com?name=张三&age=25')
// { name: '张三', age: '25' }

// 构建参数字符串
const queryString = buildUrlParams({ name: '李四', age: 30 })
// 'name=李四&age=30'

// 添加参数到URL
const newUrl = addUrlParams('https://example.com', { page: 1, size: 10 })
// 'https://example.com?page=1&size=10'

// URL格式化
const formatted = formatUrl('http://www.example.com/', {
  forceHttps: true,
  removeWww: true,
  removeTrailingSlash: true
})
// 'https://example.com'
```

### ✅ 验证工具 (Validator)

提供常用数据格式验证功能。

```typescript
import { Validator, checkPasswordStrength } from '@linglongos/utils'

// 基础验证
Validator.isEmail('user@example.com')     // true
Validator.isPhone('13812345678')          // true
Validator.isUrl('https://example.com')    // true
Validator.isIdCard('身份证号')             // boolean

// 密码强度检测
const strength = checkPasswordStrength('MyPassword123!')
// { score: 6, level: 'strong', suggestions: [] }
```

### 🎨 格式化工具

提供数字、日期、字符串、颜色等格式化功能。

```typescript
import { NumberFormat, DateFormat, StringFormat, ColorFormat } from '@linglongos/utils'

// 数字格式化
NumberFormat.toThousands(1234567.89)     // '1,234,567.89'
NumberFormat.formatFileSize(1024 * 1024) // '1.00 MB'
NumberFormat.toCurrency(1234.56)         // '¥1,234.56'
NumberFormat.toPercent(0.85)             // '85.00%'

// 日期格式化
DateFormat.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
DateFormat.fromNow(new Date(Date.now() - 3600000))  // '1小时前'
DateFormat.getFriendlyDate(new Date())               // '今天'

// 字符串格式化
StringFormat.truncate('很长的文本...', 10)           // '很长的文本...'
StringFormat.template('你好，{{name}}！', { name: '张三' })  // '你好，张三！'
StringFormat.toCamelCase('hello-world')              // 'helloWorld'

// 颜色格式化
ColorFormat.hexToRgb('#ff0000')          // { r: 255, g: 0, b: 0 }
ColorFormat.rgbToHex(255, 0, 0)          // '#ff0000'
ColorFormat.randomColor('hex')           // '#a1b2c3'
```

### 🔍 正则表达式工具

提供常用正则表达式和字符串处理功能。

```typescript
import { RegexPatterns, StringProcessor } from '@linglongos/utils'

// 使用预定义正则
RegexPatterns.email.test('user@example.com')        // true
RegexPatterns.phone.test('13812345678')             // true
RegexPatterns.chinese.test('中文')                   // true

// 字符串处理
StringProcessor.removeHtmlTags('<p>文本</p>')        // '文本'
StringProcessor.extractEmails('联系邮箱：user@example.com')  // ['user@example.com']
StringProcessor.maskPhone('13812345678')            // '138****5678'
StringProcessor.highlightKeywords('搜索文本', ['搜索'])  // '<span class="highlight">搜索</span>文本'
```

## 完整示例

```typescript
import { 
  DataType, 
  FileUtils, 
  Validator, 
  NumberFormat, 
  DateFormat 
} from '@linglongos/utils'

// 数据验证和处理
function processUserData(data: unknown) {
  if (!DataType.isObject(data)) {
    throw new Error('数据格式错误')
  }
  
  const user = data as Record<string, any>
  
  // 验证邮箱
  if (!Validator.isEmail(user.email)) {
    throw new Error('邮箱格式错误')
  }
  
  // 格式化注册时间
  const registerTime = DateFormat.format(user.registerTime, 'YYYY年MM月DD日')
  
  return {
    ...user,
    registerTime,
    displayName: user.name || '未知用户'
  }
}

// 文件上传处理
function handleFileUpload(file: File) {
  // 验证文件类型
  if (!FileUtils.isImage(file.name)) {
    throw new Error('只支持图片文件')
  }
  
  // 格式化文件大小
  const sizeText = FileUtils.formatSize(file.size)
  
  console.log(`上传文件: ${file.name}, 大小: ${sizeText}`)
}
```

## 类型支持

本工具库完全使用TypeScript编写，提供完整的类型定义和智能提示支持。

## 许可证

MIT License