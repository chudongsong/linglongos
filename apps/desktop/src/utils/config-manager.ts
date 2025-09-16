import type { DesktopConfiguration, GridConfig, GridItem, DesktopApp, ExportOptions, ImportOptions } from '@/types/grid'

/**
 * 配置管理器
 * @description 负责桌面配置的加载、保存、导入导出等操作
 */
export class ConfigurationManager {
	private static instance: ConfigurationManager
	private currentConfig: DesktopConfiguration | null = null
	private readonly storageKey = 'linglongos-desktop-config'
	private readonly configUrl = '/config/desktop-config.json'

	/**
	 * 获取单例实例
	 */
	static getInstance(): ConfigurationManager {
		if (!ConfigurationManager.instance) {
			ConfigurationManager.instance = new ConfigurationManager()
		}
		return ConfigurationManager.instance
	}

	/**
	 * 加载静态JSON配置
	 */
	async loadStaticConfiguration(): Promise<DesktopConfiguration> {
		try {
			const response = await fetch(this.configUrl)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const config = await response.json()

			// 配置验证
			this.validateConfiguration(config)

			// 版本迁移
			const migratedConfig = this.migrateConfiguration(config)

			this.currentConfig = migratedConfig
			return migratedConfig
		} catch (error) {
			console.error('静态配置加载失败:', error)
			// 返回默认配置
			return this.getDefaultConfiguration()
		}
	}

	/**
	 * 从本地存储加载配置
	 */
	loadLocalConfiguration(): DesktopConfiguration | null {
		try {
			const stored = localStorage.getItem(this.storageKey)
			if (!stored) return null

			const config = JSON.parse(stored)
			this.validateConfiguration(config)

			this.currentConfig = config
			return config
		} catch (error) {
			console.error('本地配置加载失败:', error)
			return null
		}
	}

	/**
	 * 保存配置到本地存储
	 */
	saveLocalConfiguration(config: DesktopConfiguration): boolean {
		try {
			config.lastModified = Date.now()
			const configJson = JSON.stringify(config, null, 2)
			localStorage.setItem(this.storageKey, configJson)

			this.currentConfig = config
			return true
		} catch (error) {
			console.error('配置保存失败:', error)
			return false
		}
	}

	/**
	 * 导入JSON配置
	 */
	async importConfiguration(jsonString: string, options: ImportOptions = {}): Promise<boolean> {
		const { mergeMode = 'replace', validateSchema = true, autoMigrate = true } = options

		try {
			const config = JSON.parse(jsonString)

			// 1. 配置验证
			if (validateSchema) {
				this.validateConfiguration(config)
			}

			// 2. 版本兼容性检查和迁移
			let processedConfig = config
			if (autoMigrate) {
				processedConfig = this.migrateConfiguration(config)
			}

			// 3. 根据合并模式处理配置
			let finalConfig: DesktopConfiguration

			switch (mergeMode) {
				case 'merge':
					finalConfig = this.mergeConfigurations(this.currentConfig, processedConfig)
					break
				case 'append':
					finalConfig = this.appendConfiguration(this.currentConfig, processedConfig)
					break
				case 'replace':
				default:
					finalConfig = processedConfig
					break
			}

			// 4. 保存配置
			const success = this.saveLocalConfiguration(finalConfig)

			return success
		} catch (error) {
			console.error('配置导入失败:', error)
			return false
		}
	}

	/**
	 * 导出当前配置
	 */
	exportConfiguration(options: ExportOptions = {}): string {
		const { includeMetadata = true, includeTheme = true, format = 'json' } = options

		if (!this.currentConfig) {
			throw new Error('没有可导出的配置')
		}

		const exportConfig: Partial<DesktopConfiguration> = {
			version: this.currentConfig.version,
			gridConfig: this.currentConfig.gridConfig,
			apps: this.currentConfig.apps,
			items: this.currentConfig.items,
			lastModified: Date.now(),
		}

		if (includeMetadata && this.currentConfig.metadata) {
			exportConfig.metadata = {
				...this.currentConfig.metadata,
				lastModified: new Date().toISOString(),
			}
		}

		if (includeTheme) {
			exportConfig.theme = this.currentConfig.theme
		}

		switch (format) {
			case 'compressed':
				// 移除不必要的空白和注释
				return JSON.stringify(exportConfig)
			case 'json':
			default:
				return JSON.stringify(exportConfig, null, 2)
		}
	}

	/**
	 * 获取默认配置
	 */
	private getDefaultConfiguration(): DesktopConfiguration {
		return {
			version: 1,
			metadata: {
				name: '默认配置',
				description: '系统默认桌面配置',
				author: 'system',
				createdAt: new Date().toISOString(),
				lastModified: new Date().toISOString(),
			},
			gridConfig: {
				id: 'default-medium',
				name: '中等网格',
				gridSize: 'medium',
				cellSize: 64,
				gap: 12,
				columns: 12,
				rows: 8,
				padding: { top: 20, right: 20, bottom: 20, left: 20 },
			},
			apps: [],
			items: [],
			theme: {
				mode: 'light',
				accentColor: '#3b82f6',
			},
			lastModified: Date.now(),
		}
	}

	/**
	 * 验证配置结构
	 */
	private validateConfiguration(config: any): void {
		if (!config || typeof config !== 'object') {
			throw new Error('配置必须是一个对象')
		}

		// 验证必需字段
		const requiredFields = ['version', 'gridConfig', 'apps', 'items', 'theme']
		for (const field of requiredFields) {
			if (!(field in config)) {
				throw new Error(`缺少必需字段: ${field}`)
			}
		}

		// 验证网格配置
		const gridConfig = config.gridConfig
		if (!gridConfig.id || !gridConfig.gridSize || !gridConfig.cellSize) {
			throw new Error('网格配置无效')
		}

		// 验证数组字段
		if (!Array.isArray(config.apps)) {
			throw new Error('apps 必须是数组')
		}

		if (!Array.isArray(config.items)) {
			throw new Error('items 必须是数组')
		}

		// 验证项目位置
		for (const item of config.items) {
			if (!item.position || typeof item.position.x !== 'number' || typeof item.position.y !== 'number') {
				throw new Error(`项目 ${item.id} 的位置配置无效`)
			}
		}
	}

	/**
	 * 配置版本迁移
	 */
	private migrateConfiguration(config: any): DesktopConfiguration {
		// 当前只有版本1，未来可以在这里添加版本迁移逻辑
		if (config.version === 1) {
			return config as DesktopConfiguration
		}

		// 默认升级到最新版本
		console.warn(`未知配置版本 ${config.version}，尝试使用默认迁移`)
		return {
			...config,
			version: 1,
		} as DesktopConfiguration
	}

	/**
	 * 合并配置
	 */
	private mergeConfigurations(base: DesktopConfiguration | null, incoming: DesktopConfiguration): DesktopConfiguration {
		if (!base) return incoming

		// 合并应用列表（去重）
		const mergedApps = [...base.apps]
		for (const app of incoming.apps) {
			if (!mergedApps.find((existing) => existing.id === app.id)) {
				mergedApps.push(app)
			}
		}

		// 合并网格项目（incoming覆盖base中的同ID项目）
		const mergedItems = [...base.items]
		for (const item of incoming.items) {
			const existingIndex = mergedItems.findIndex((existing) => existing.id === item.id)
			if (existingIndex >= 0) {
				mergedItems[existingIndex] = item
			} else {
				mergedItems.push(item)
			}
		}

		return {
			...incoming,
			apps: mergedApps,
			items: mergedItems,
			metadata: {
				...base.metadata,
				...incoming.metadata,
				lastModified: new Date().toISOString(),
			},
		}
	}

	/**
	 * 追加配置
	 */
	private appendConfiguration(base: DesktopConfiguration | null, incoming: DesktopConfiguration): DesktopConfiguration {
		if (!base) return incoming

		return {
			...base,
			apps: [...base.apps, ...incoming.apps],
			items: [...base.items, ...incoming.items],
			lastModified: Date.now(),
		}
	}

	/**
	 * 清除本地配置
	 */
	clearLocalConfiguration(): void {
		localStorage.removeItem(this.storageKey)
		this.currentConfig = null
	}

	/**
	 * 获取当前配置
	 */
	getCurrentConfiguration(): DesktopConfiguration | null {
		return this.currentConfig
	}

	/**
	 * 检查配置是否存在本地修改
	 */
	hasLocalModifications(): boolean {
		return localStorage.getItem(this.storageKey) !== null
	}

	/**
	 * 重置到默认配置
	 */
	resetToDefault(): DesktopConfiguration {
		const defaultConfig = this.getDefaultConfiguration()
		this.saveLocalConfiguration(defaultConfig)
		return defaultConfig
	}
}

// 导出单例实例
export const configManager = ConfigurationManager.getInstance()
