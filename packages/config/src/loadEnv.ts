/**
 * 环境变量加载工具
 * 用于加载和处理环境变量
 */

import fs from 'fs'
import path from 'path'
import { EnvType } from './env'

/**
 * 环境变量配置选项
 */
export interface EnvOptions {
  // 环境类型
  mode?: EnvType
  // 环境变量文件目录
  dir?: string
  // 环境变量前缀
  prefix?: string
  // 是否加载所有环境变量
  loadAll?: boolean
}

/**
 * 加载环境变量
 * @param options 配置选项
 * @returns 环境变量对象
 */
export function loadEnv(options: EnvOptions = {}): Record<string, string> {
  const {
    mode = (process.env.NODE_ENV as EnvType) || 'development',
    dir = process.cwd(),
    prefix = 'VITE_',
    loadAll = false,
  } = options

  // 环境变量对象
  const env: Record<string, string> = {}

  // 加载.env文件
  const loadEnvFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    lines.forEach(line => {
      // 忽略注释和空行
      if (!line || line.startsWith('#')) return

      const [key, ...valueParts] = line.split('=')
      if (!key) return

      const value = valueParts.join('=').trim()
      if (!value) return

      // 移除引号
      const trimmedValue = value.replace(/^['"]|['"]$/g, '')

      // 只加载指定前缀的环境变量
      if (loadAll || key.startsWith(prefix)) {
        env[key] = trimmedValue
      }
    })
  }

  // 加载顺序：.env -> .env.local -> .env.[mode] -> .env.[mode].local
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]

  envFiles.forEach(file => {
    loadEnvFile(path.resolve(dir, file))
  })

  return env
}

/**
 * 扩展环境变量
 * @param env 环境变量对象
 * @returns 扩展后的环境变量对象
 */
export function expandEnv(env: Record<string, string>): Record<string, string> {
  const expanded: Record<string, string> = { ...env }

  // 替换环境变量中的引用
  Object.keys(expanded).forEach(key => {
    expanded[key] = expanded[key].replace(/\${([^}]+)}/g, (_, name) => {
      return expanded[name] || process.env[name] || ''
    })
  })

  return expanded
}

/**
 * 加载并扩展环境变量
 * @param options 配置选项
 * @returns 环境变量对象
 */
export function loadAndExpandEnv(options: EnvOptions = {}): Record<string, string> {
  const env = loadEnv(options)
  return expandEnv(env)
}

export default loadAndExpandEnv
