/**
 * ConfigService：负责加载 public/config 下的 JSON 配置并合并
 * - 提供类型安全的加载与校验
 * - 支持后续扩展热重载（基于轮询或 EventSource）
 */
import type { AppsConfig, DesktopSettings, FullConfig, AppItem } from '@/types/config'

const DESKTOP_SETTINGS_URL = '/config/desktop-settings.json'
const APPS_CONFIG_URL = '/config/apps-config.json'

/**
 * 读取 JSON 工具函数
 * @param url 配置文件路径（public 下）
 */
async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载配置失败: ${url} status=${res.status}`)
  return (await res.json()) as T
}

/**
 * 规范化图标路径（将 ./static/images/ 前缀替换为 /images/）
 */
function normalizeIcon(icon: string): string {
  if (!icon) return icon
  return icon.replace(/^\.\/static\/images\//, '/images/')
}

/**
 * 规范化应用图标路径
 */
function normalizeApps(apps: AppItem[]): AppItem[] {
  return apps.map(app => ({ ...app, icon: normalizeIcon(app.icon) }))
}

/**
 * 合并两个配置为 FullConfig
 * @param desktop 桌面设置
 * @param apps 应用配置
 */
function mergeConfig(desktop: DesktopSettings, apps: AppsConfig): FullConfig {
  return {
    desktop: desktop.desktop,
    layout: desktop.layout,
    hotReload: desktop.hotReload,
    apps: normalizeApps(apps.apps),
    categories: apps.categories,
    startup: apps.startup,
  }
}

/**
 * 加载完整配置
 */
export async function loadFullConfig(): Promise<FullConfig> {
  const [desktop, apps] = await Promise.all([
    readJson<DesktopSettings>(DESKTOP_SETTINGS_URL),
    readJson<AppsConfig>(APPS_CONFIG_URL),
  ])
  return mergeConfig(desktop, apps)
}

/**
 * 简单校验配置有效性
 */
export function validateFullConfig(cfg: FullConfig): boolean {
  return !!(cfg && cfg.desktop && cfg.layout && Array.isArray(cfg.apps))
}