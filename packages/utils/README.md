# @linglongos/utils 工具库

> 玲珑OS工具库 - 提供常用的工具方法，已优化目录结构，简化嵌套。

## 📁 目录结构优化

**之前的嵌套结构：**
```
src/
├── data/
│   └── index.ts
├── string/
│   └── index.ts  
├── number/
│   └── index.ts
└── ... (8个嵌套目录)
```

**优化后的扁平结构：**
```
src/
├── data.ts        # 数据处理工具
├── string.ts      # 字符串工具
├── number.ts      # 数字工具
├── date.ts        # 日期工具
├── file.ts        # 文件处理工具
├── url.ts         # URL处理工具
├── validator.ts   # 正则验证工具
├── format.ts      # 格式化工具
└── index.ts       # 主入口文件
```

## ✨ 优化优势

1. **简化导入路径** - 所有工具函数直接从根模块导入
2. **减少嵌套层级** - 从三层嵌套减少到二层
3. **更好的可维护性** - 每个功能模块独立文件，易于维护
4. **保持功能完整** - 所有原有功能保持不变
5. **向后兼容** - 导入方式保持一致

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

## 📚 主要模块

### 🔍 数据处理 (data.ts)
- `DataType` - 数据类型判断
- `deepClone` - 深拷贝
- `deepMerge` - 深度合并
- `uniqueArray` - 数组去重
- `groupBy` - 数组分组
- `sortBy` - 数组排序
- `paginate` - 分页处理
- `flattenTree` - 树形数据扁平化
- `arrayToTree` - 数组转树形结构

### 🔤 字符串处理 (string.ts)
- `truncate` - 字符串截断
- `pad` - 字符串填充
- `toCamelCase` - 驼峰命名转换
- `toPascalCase` - 帕斯卡命名转换
- `toKebabCase` - 短横线命名转换
- `toSnakeCase` - 下划线命名转换
- `removeWhitespace` - 空白字符处理
- `template` - 模板字符串替换
- `maskPhone` - 手机号脱敏
- `maskEmail` - 邮箱脱敏

### 🔢 数字处理 (number.ts)
- `toThousands` - 千分位格式化
- `formatFileSize` - 文件大小格式化
- `toPercent` - 百分比格式化
- `toCurrency` - 货币格式化
- `toChineseNumber` - 数字转中文
- `toRoman` - 数字转罗马数字
- `randomInt` - 随机整数
- `randomFloat` - 随机浮点数
- `clamp` - 数值范围限制

### 📅 日期处理 (date.ts)
- `formatDate` - 日期格式化
- `getRelativeTime` - 相对时间
- `formatDuration` - 持续时间格式化
- `getFriendlyDate` - 友好日期描述
- `getWeekday` - 获取星期几
- `getDateRange` - 日期范围生成
- `isLeapYear` - 闰年判断
- `getDaysInMonth` - 获取月份天数

### 📁 文件处理 (file.ts)
- `FileUtils.getExtension` - 获取文件扩展名
- `FileUtils.getBasename` - 获取文件名
- `FileUtils.getDirname` - 获取目录路径
- `FileUtils.getFileType` - 判断文件类型
- `FileUtils.formatSize` - 格式化文件大小
- `FileUtils.sanitizeFilename` - 生成安全文件名
- `FileUtils.joinPath` - 路径连接
- `getMimeType` - 获取MIME类型

### 🌐 URL处理 (url.ts)
- `parseUrlParams` - URL参数解析
- `buildUrlParams` - 构建参数字符串
- `addUrlParams` - 添加URL参数
- `removeUrlParams` - 移除URL参数
- `getDomain` - 获取域名
- `getProtocol` - 获取协议
- `formatUrl` - URL格式化
- `buildApiUrl` - 构建API URL

### ✅ 验证工具 (validator.ts)
- `Validator.isEmail` - 邮箱验证
- `Validator.isPhone` - 手机号验证
- `Validator.isIdCard` - 身份证验证
- `Validator.isUrl` - URL验证
- `Validator.isIPv4` - IPv4验证
- `RegexPatterns` - 常用正则表达式
- `checkPasswordStrength` - 密码强度检测

### 🎨 格式化工具 (format.ts)
- `NumberFormat` - 数字格式化工具集
- `DateFormat` - 日期格式化工具集
- `StringFormat` - 字符串格式化工具集
- `ColorFormat` - 颜色格式化工具集

## 🧪 测试

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

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

## 🔄 迁移指南

从旧版本迁移非常简单，因为所有的 API 保持不变，只是内部目录结构得到了优化：

```typescript
// 导入方式保持不变
import { DataType, FileUtils, formatDate } from '@linglongos/utils'

// 所有功能继续正常工作
const isString = DataType.isString('hello')
const fileSize = FileUtils.formatSize(1024)
const date = formatDate(new Date())
```

## 📄 许可证

MIT License

---

**玲珑OS团队** ❤️ 用心打造101****1234'
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