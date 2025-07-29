# 玲珑OS 配置包

这个包包含了玲珑OS项目的配置文件和路径别名定义。

## 安装

```bash
pnpm add @linglongos/config
```

## 使用方法

### 导入路径别名

```typescript
import { paths } from '@linglongos/config'

// 使用路径别名导入组件
import { LButton, LCard } from paths.components

// 使用路径别名导入工具函数
import { formatDate } from paths.utils

// 使用路径别名导入类型
import type { User } from paths.types
```

### 使用环境配置

```typescript
import { appConfig, isDev, isProd, isTest, getApiBaseUrl } from '@linglongos/config'

// 获取当前环境
if (isDev()) {
  console.log('当前是开发环境')
} else if (isProd()) {
  console.log('当前是生产环境')
} else if (isTest()) {
  console.log('当前是测试环境')
}

// 获取API基础URL
const apiUrl = getApiBaseUrl()

// 使用应用配置
const appName = appConfig.appName
const primaryColor = appConfig.theme.primaryColor
const isDarkModeEnabled = appConfig.features.darkMode
```

## 配置项目的路径别名

在 `vite.config.ts` 文件中添加以下配置：

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@linglongos/components': resolve(__dirname, '../../packages/components/src'),
      '@linglongos/utils': resolve(__dirname, '../../packages/utils/src'),
      '@linglongos/shared-types': resolve(__dirname, '../../packages/shared-types/src'),
      '@linglongos/services': resolve(__dirname, '../../packages/services/src'),
      '@linglongos/config': resolve(__dirname, '../../packages/config/src'),
    },
  },
})
```

在 `tsconfig.json` 文件中添加以下配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@linglongos/*": ["packages/*/src"]
    }
  }
}