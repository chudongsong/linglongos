/**
 * 路径工具
 * 提供项目路径相关的工具函数
 */

import path from 'path'
import fs from 'fs'

/**
 * 获取项目根目录
 * @returns 项目根目录路径
 */
export function getProjectRoot(): string {
  // 从当前目录向上查找包含package.json的目录
  let currentDir = process.cwd()

  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      // 已经到达根目录，仍未找到package.json
      return process.cwd()
    }
    currentDir = parentDir
  }

  return currentDir
}

/**
 * 获取工作区根目录
 * @returns 工作区根目录路径
 */
export function getWorkspaceRoot(): string {
  // 从当前目录向上查找包含pnpm-workspace.yaml的目录
  let currentDir = process.cwd()

  while (!fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      // 已经到达根目录，仍未找到pnpm-workspace.yaml
      return getProjectRoot()
    }
    currentDir = parentDir
  }

  return currentDir
}

/**
 * 获取应用目录
 * @returns 应用目录路径
 */
export function getAppsDir(): string {
  return path.join(getWorkspaceRoot(), 'apps')
}

/**
 * 获取包目录
 * @returns 包目录路径
 */
export function getPackagesDir(): string {
  return path.join(getWorkspaceRoot(), 'packages')
}

/**
 * 获取配置模板目录
 * @returns 配置模板目录路径
 */
export function getTemplatesDir(): string {
  return path.join(__dirname, '../templates')
}

/**
 * 解析相对于项目根目录的路径
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export function resolveProjectPath(relativePath: string): string {
  return path.resolve(getProjectRoot(), relativePath)
}

/**
 * 解析相对于工作区根目录的路径
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export function resolveWorkspacePath(relativePath: string): string {
  return path.resolve(getWorkspaceRoot(), relativePath)
}

/**
 * 解析相对于应用目录的路径
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export function resolveAppsPath(relativePath: string): string {
  return path.resolve(getAppsDir(), relativePath)
}

/**
 * 解析相对于包目录的路径
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export function resolvePackagesPath(relativePath: string): string {
  return path.resolve(getPackagesDir(), relativePath)
}

/**
 * 解析相对于配置模板目录的路径
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export function resolveTemplatePath(relativePath: string): string {
  return path.resolve(getTemplatesDir(), relativePath)
}

/**
 * 路径工具集合
 */
export const Paths = {
  getProjectRoot,
  getWorkspaceRoot,
  getAppsDir,
  getPackagesDir,
  getTemplatesDir,
  resolveProjectPath,
  resolveWorkspacePath,
  resolveAppsPath,
  resolvePackagesPath,
  resolveTemplatePath,
}

export default Paths
