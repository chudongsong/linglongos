# 静态资源目录结构

本目录包含所有静态资源文件，按照以下结构组织：

## 目录结构

```
public/
├── css/                # CSS样式文件
│   └── styles.css
├── js/                 # JavaScript文件
│   └── test-script.js
├── images/             # 图片资源
├── fonts/              # 字体文件
├── docs/               # 文档文件
├── index.html          # 默认首页
└── test-static.html    # 静态资源测试页面
```

## 访问路径

所有静态资源通过 `/api/` 前缀访问：

- **HTML文件**: `/api/test-static.html`
- **CSS文件**: `/api/css/styles.css`
- **JavaScript文件**: `/api/js/test-script.js`
- **图片文件**: `/api/images/[filename]`
- **字体文件**: `/api/fonts/[filename]`
- **文档文件**: `/api/docs/[filename]`

## 配置说明

静态资源服务由 `staticFiles` 中间件提供，配置位于：
- 中间件文件: `app/middleware/staticFiles.ts`
- 配置文件: `config/config.default.ts`

### 主要特性

1. **MIME类型自动识别**
2. **缓存控制** (Cache-Control, ETag, Last-Modified)
3. **gzip压缩支持**
4. **安全防护** (目录遍历、文件扩展名限制)
5. **错误处理** (404, 403, 500)

### 支持的文件类型

- HTML: `.html`, `.htm`
- 样式: `.css`
- 脚本: `.js`, `.mjs`
- 数据: `.json`, `.xml`, `.txt`, `.md`
- 图片: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`
- 字体: `.woff`, `.woff2`, `.ttf`, `.eot`
- 文档: `.pdf`, `.zip`, `.tar`, `.gz`

## 部署说明

1. 将编译/打包后的静态资源放置到对应子目录
2. HTML文件直接放在 `public/` 根目录
3. 确保所有文件路径引用使用相对路径
4. 重启服务器以应用配置更改