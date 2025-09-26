import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 使用 Node.js 环境进行测试
    environment: 'node',
    
    // 启用全局测试 API（describe, it, expect 等）
    globals: true,
    
    // 测试设置文件
    setupFiles: ['./src/test/setup.ts'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      
      // 覆盖率阈值
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },
      
      // 包含的文件
      include: ['src/**/*.{ts,js}'],
      
      // 排除的文件
      exclude: [
        'src/**/*.test.{ts,js}',
        'src/**/*.spec.{ts,js}',
        'src/test/**',
        'src/docs/**',
        'src/app.ts', // 应用入口文件
        'src/types/**', // 类型定义文件
      ]
    },
    
    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{ts,js}'],
    
    // 排除的文件
    exclude: [
      'node_modules',
      'dist',
      'coverage'
    ],
    
    // 测试超时时间（毫秒）
    testTimeout: 10000,
    
    // 钩子超时时间（毫秒）
    hookTimeout: 10000,
    
    // 并发运行测试
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    }
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
})