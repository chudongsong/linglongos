/**
 * ConfigService：负责加载 public/config 下的 JSON 配置并合并
 * - 提供类型安全的加载与校验
 * - 统一改用 Axios 实例（services/api.ts）进行请求
 * - 规范化资源路径，避免静态路径前缀差异导致的 404
 */
import { getJson } from '@services/api'
import type { AppsConfig, DesktopSettings, FullConfig, AppItem } from '@/types/config'

const DESKTOP_SETTINGS_URL = '/config/desktop-settings.json'
const APPS_CONFIG_URL = '/config/apps-config.json'

/**
 * normalizeIcon - 规范化应用图标 URL
 *
 * @param icon 原始图标路径
 * @returns 替换 ./static/images/ 前缀为 /images/ 的结果
 */
function normalizeIcon(icon: string): string {
	if (!icon) return icon
	return icon.replace(/^\.\/static\/images\//, '/images/')
}

/**
 * normalizeApps - 批量规范化应用图标 URL
 *
 * @param apps 应用列表
 * @returns 处理后的应用列表
 */
function normalizeApps(apps: AppItem[]): AppItem[] {
	return apps.map((app) => ({ ...app, icon: normalizeIcon(app.icon) }))
}

/**
 * mergeConfig - 合并两个配置为 FullConfig
 *
 * @param desktop 桌面设置
 * @param apps 应用配置
 * @returns 合并后的完整配置对象
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
 * loadFullConfig - 加载完整配置（桌面设置 + 应用列表）
 *
 * @returns Promise<FullConfig> 完整合并后的配置
 */
export async function loadFullConfig(): Promise<FullConfig> {
	const [desktop, apps] = await Promise.all([
		getJson<DesktopSettings>(DESKTOP_SETTINGS_URL),
		getJson<AppsConfig>(APPS_CONFIG_URL),
	])
	return mergeConfig(desktop, apps)
}

/**
 * validateFullConfig - 简单校验配置有效性
 *
 * @param cfg 待校验的配置对象
 * @returns boolean 是否有效
 */
export function validateFullConfig(cfg: FullConfig): boolean {
	return !!(cfg && cfg.desktop && cfg.layout && Array.isArray(cfg.apps))
}
