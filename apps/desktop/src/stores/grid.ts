import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { cloneDeep } from 'lodash-es'
import type {
	GridConfig,
	GridItem,
	DesktopApp,
	GridPosition,
	GridSize,
	DragState,
	GridPreset,
	DesktopConfiguration,
	PositionValidation,
	GridOperationOptions,
} from '@/types/grid'

/**
 * 网格系统状态管理
 * @description 使用Pinia管理桌面网格系统的所有状态和操作
 */
export const useGridStore = defineStore('grid', () => {
	// ===== 状态定义 =====

	// 网格配置
	const currentConfig = ref<GridConfig>({
		id: 'default-medium',
		name: '中等网格',
		gridSize: 'medium',
		cellSize: 64,
		gap: 12,
		columns: 12,
		rows: 8,
		padding: { top: 20, right: 20, bottom: 20, left: 20 },
	})

	// 可用的网格预设
	const availablePresets = ref<GridPreset[]>([
		{
			size: 'small',
			cellSize: 48,
			gap: 8,
			columns: 16,
			rows: 10,
			name: '小网格',
			description: '密集排列，最大化利用空间',
		},
		{
			size: 'medium',
			cellSize: 64,
			gap: 12,
			columns: 12,
			rows: 8,
			name: '中等网格',
			description: '平衡视觉效果和空间利用',
		},
		{
			size: 'large',
			cellSize: 80,
			gap: 16,
			columns: 10,
			rows: 6,
			name: '大网格',
			description: '清晰视觉，适合触屏操作',
		},
	])

	// 可用应用列表
	const availableApps = ref<DesktopApp[]>([])

	// 网格项目（使用Map for better performance）
	const gridItems = ref<Map<string, GridItem>>(new Map())

	// 选中的项目
	const selectedItems = ref<Set<string>>(new Set())

	// 拖拽状态
	const dragState = reactive<DragState>({
		isDragging: false,
		dragItem: null,
		dragStartPosition: null,
		dropTarget: null,
	})

	// 占用位置集合（用于快速查找）
	const occupiedPositions = ref<Set<string>>(new Set())

	// ===== 计算属性 =====

	/**
	 * 获取网格项目数组
	 */
	const gridItemsArray = computed(() => Array.from(gridItems.value.values()))

	/**
	 * 获取可见的网格项目
	 */
	const visibleGridItems = computed(() => gridItemsArray.value.filter((item) => item.general.visible))

	/**
	 * 获取可用位置列表
	 */
	const availablePositions = computed<GridPosition[]>(() => {
		const positions: GridPosition[] = []
		for (let x = 0; x < currentConfig.value.columns; x++) {
			for (let y = 0; y < currentConfig.value.rows; y++) {
				const positionKey = `${x},${y}`
				if (!occupiedPositions.value.has(positionKey)) {
					positions.push({ x, y })
				}
			}
		}
		return positions
	})

	/**
	 * 检查是否有选中的项目
	 */
	const hasSelectedItems = computed(() => selectedItems.value.size > 0)

	// ===== 辅助方法 =====

	/**
	 * 生成位置键
	 */
	const getPositionKey = (position: GridPosition): string => {
		return `${position.x},${position.y}`
	}

	/**
	 * 解析位置键
	 */
	const parsePositionKey = (key: string): GridPosition => {
		const [x, y] = key.split(',').map(Number)
		return { x, y }
	}

	/**
	 * 更新占用位置集合
	 */
	const updateOccupiedPositions = (): void => {
		occupiedPositions.value.clear()
		for (const item of gridItems.value.values()) {
			if (item.general.visible) {
				const key = getPositionKey(item.position)
				occupiedPositions.value.add(key)
			}
		}
	}

	// ===== 位置验证和计算 =====

	/**
	 * 验证位置是否有效
	 */
	const validatePosition = (position: GridPosition, excludeItemId?: string): PositionValidation => {
		// 边界检查
		if (
			position.x < 0 ||
			position.x >= currentConfig.value.columns ||
			position.y < 0 ||
			position.y >= currentConfig.value.rows
		) {
			return {
				isValid: false,
				reason: '位置超出网格边界',
			}
		}

		// 碰撞检测
		const positionKey = getPositionKey(position)
		for (const item of gridItems.value.values()) {
			if (item.id !== excludeItemId && item.general.visible && getPositionKey(item.position) === positionKey) {
				const suggested = findNearestAvailablePosition(position)
				return {
					isValid: false,
					reason: '位置已被占用',
					...(suggested && { suggestedPosition: suggested }),
				}
			}
		}

		return { isValid: true }
	}

	/**
	 * 查找最近的可用位置
	 */
	const findNearestAvailablePosition = (targetPosition: GridPosition): GridPosition | undefined => {
		const maxDistance = Math.max(currentConfig.value.columns, currentConfig.value.rows)

		for (let distance = 1; distance <= maxDistance; distance++) {
			// 搜索周围的位置
			for (let dx = -distance; dx <= distance; dx++) {
				for (let dy = -distance; dy <= distance; dy++) {
					if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue

					const candidate: GridPosition = {
						x: targetPosition.x + dx,
						y: targetPosition.y + dy,
					}

					const validation = validatePosition(candidate)
					if (validation.isValid) {
						return candidate
					}
				}
			}
		}

		return undefined
	}

	// ===== 网格配置管理 =====

	/**
	 * 设置网格配置
	 */
	const setGridConfig = (config: GridConfig): void => {
		currentConfig.value = cloneDeep(config)
		updateOccupiedPositions()
	}

	/**
	 * 切换网格预设
	 */
	const switchPreset = (size: GridSize): void => {
		const preset = availablePresets.value.find((p) => p.size === size)
		if (!preset) return

		const newConfig: GridConfig = {
			id: `preset-${size}`,
			name: preset.name,
			gridSize: size,
			cellSize: preset.cellSize,
			gap: preset.gap,
			columns: preset.columns,
			rows: preset.rows,
			padding: currentConfig.value.padding,
		}

		// 调整现有项目位置以适应新网格
		adjustItemsToNewGrid(newConfig)
		setGridConfig(newConfig)
	}

	/**
	 * 调整项目到新网格
	 */
	const adjustItemsToNewGrid = (newConfig: GridConfig): void => {
		const itemsToAdjust: GridItem[] = []

		for (const item of gridItems.value.values()) {
			if (item.position.x >= newConfig.columns || item.position.y >= newConfig.rows) {
				itemsToAdjust.push(item)
			}
		}

		// 为超出边界的项目找到新位置
		for (const item of itemsToAdjust) {
			const newPosition = findNearestAvailablePosition({ x: 0, y: 0 })
			if (newPosition) {
				item.position = newPosition
			} else {
				// 如果找不到位置，隐藏项目
				item.general.visible = false
			}
		}
	}

	// ===== 项目管理 =====

	/**
	 * 添加网格项目
	 */
	const addGridItem = (item: GridItem, options: GridOperationOptions = {}): boolean => {
		const { validatePosition: shouldValidate = true, autoSave = true } = options

		if (shouldValidate) {
			const validation = validatePosition(item.position)
			if (!validation.isValid) {
				if (validation.suggestedPosition) {
					item.position = validation.suggestedPosition
				} else {
					console.warn('无法添加项目：没有可用位置')
					return false
				}
			}
		}

		gridItems.value.set(item.id, cloneDeep(item))
		updateOccupiedPositions()

		if (autoSave) {
			saveConfiguration()
		}

		return true
	}

	/**
	 * 移除网格项目
	 */
	const removeGridItem = (id: string, options: GridOperationOptions = {}): void => {
		const { autoSave = true } = options

		gridItems.value.delete(id)
		selectedItems.value.delete(id)
		updateOccupiedPositions()

		if (autoSave) {
			saveConfiguration()
		}
	}

	/**
	 * 移动网格项目
	 */
	const moveGridItem = (id: string, position: GridPosition, options: GridOperationOptions = {}): boolean => {
		const { validatePosition: shouldValidate = true, autoSave = true } = options
		const item = gridItems.value.get(id)

		if (!item) return false

		if (shouldValidate) {
			const validation = validatePosition(position, id)
			if (!validation.isValid) {
				console.warn(`无法移动项目: ${validation.reason}`)
				return false
			}
		}

		item.position = { ...position }
		updateOccupiedPositions()

		if (autoSave) {
			saveConfiguration()
		}

		return true
	}

	/**
	 * 拖拽替换项目
	 * 当拖拽到已有内容位置时，替换当前图标，被替换的图标及其后续图标向后移动
	 */
	const moveGridItemWithReplacement = (id: string, position: GridPosition, options: GridOperationOptions = {}): boolean => {
		const { autoSave = true } = options
		const draggedItem = gridItems.value.get(id)

		if (!draggedItem) return false

		// 边界检查
		if (
			position.x < 0 ||
			position.x >= currentConfig.value.columns ||
			position.y < 0 ||
			position.y >= currentConfig.value.rows
		) {
			return false
		}

		// 检查目标位置是否有其他项目
		const targetItem = findItemAtPosition(position)
		
		if (!targetItem || targetItem.id === id) {
			// 目标位置为空或是自己，直接移动
			return moveGridItem(id, position, { validatePosition: false, autoSave })
		}

		// 目标位置有其他项目，执行替换逻辑
		const originalPosition = { ...draggedItem.position }
		
		// 获取所有需要移动的项目（从目标位置开始的所有项目）
		const itemsToShift = getItemsToShiftForReplacement(position, id)
		
		// 执行替换
		draggedItem.position = { ...position }
		
		// 移动被替换的项目及其后续项目
		shiftItemsForReplacement(itemsToShift, originalPosition)

		updateOccupiedPositions()

		if (autoSave) {
			saveConfiguration()
		}

		return true
	}

	/**
	 * 查找指定位置的项目
	 */
	const findItemAtPosition = (position: GridPosition): GridItem | undefined => {
		const positionKey = getPositionKey(position)
		for (const item of gridItems.value.values()) {
			if (item.general.visible && getPositionKey(item.position) === positionKey) {
				return item
			}
		}
		return undefined
	}

	/**
	 * 获取需要移动的项目列表（用于替换操作）
	 */
	const getItemsToShiftForReplacement = (startPosition: GridPosition, excludeId: string): GridItem[] => {
		const itemsToShift: GridItem[] = []
		const { columns, rows } = currentConfig.value
		
		// 从目标位置开始，按行优先顺序收集所有后续项目
		for (let y = startPosition.y; y < rows; y++) {
			const startX = y === startPosition.y ? startPosition.x : 0
			
			for (let x = startX; x < columns; x++) {
				const item = findItemAtPosition({ x, y })
				if (item && item.id !== excludeId && item.general.visible) {
					itemsToShift.push(item)
				}
			}
		}
		
		return itemsToShift
	}

	/**
	 * 移动项目以腾出空间（用于替换操作）
	 */
	const shiftItemsForReplacement = (itemsToShift: GridItem[], startFromPosition: GridPosition): void => {
		if (itemsToShift.length === 0) return

		const { columns, rows } = currentConfig.value
		let currentPos = { ...startFromPosition }

		for (const item of itemsToShift) {
			// 找到下一个可用位置
			while (currentPos.y < rows) {
				// 检查当前位置是否可用
				const existingItem = findItemAtPosition(currentPos)
				if (!existingItem || itemsToShift.includes(existingItem)) {
					// 位置可用，移动项目
					item.position = { ...currentPos }
					
					// 移动到下一个位置
					currentPos.x++
					if (currentPos.x >= columns) {
						currentPos.x = 0
						currentPos.y++
					}
					break
				}
				
				// 当前位置不可用，移动到下一个位置
				currentPos.x++
				if (currentPos.x >= columns) {
					currentPos.x = 0
					currentPos.y++
				}
			}
			
			// 如果超出边界，隐藏项目
			if (currentPos.y >= rows) {
				item.general.visible = false
			}
		}
	}

	/**
	 * 批量移动项目
	 */
	const moveMultipleItems = (
		moves: Array<{ id: string; position: GridPosition }>,
		options: GridOperationOptions = {},
	): boolean => {
		const { autoSave = true } = options

		// 验证所有移动
		for (const move of moves) {
			const validation = validatePosition(move.position, move.id)
			if (!validation.isValid) {
				console.warn(`批量移动失败：项目 ${move.id} 的目标位置无效`)
				return false
			}
		}

		// 执行所有移动
		for (const move of moves) {
			const item = gridItems.value.get(move.id)
			if (item) {
				item.position = { ...move.position }
			}
		}

		updateOccupiedPositions()

		if (autoSave) {
			saveConfiguration()
		}

		return true
	}

	// ===== 选择管理 =====

	/**
	 * 选择项目
	 */
	const selectItem = (id: string): void => {
		selectedItems.value.add(id)
	}

	/**
	 * 取消选择项目
	 */
	const deselectItem = (id: string): void => {
		selectedItems.value.delete(id)
	}

	/**
	 * 切换项目选择状态
	 */
	const toggleItemSelection = (id: string): void => {
		if (selectedItems.value.has(id)) {
			selectedItems.value.delete(id)
		} else {
			selectedItems.value.add(id)
		}
	}

	/**
	 * 清除所有选择
	 */
	const clearSelection = (): void => {
		selectedItems.value.clear()
	}

	/**
	 * 全选可见项目
	 */
	const selectAllVisible = (): void => {
		visibleGridItems.value.forEach((item) => {
			selectedItems.value.add(item.id)
		})
	}

	// ===== 拖拽管理 =====

	/**
	 * 开始拖拽
	 */
	const startDrag = (item: GridItem): void => {
		dragState.isDragging = true
		dragState.dragItem = cloneDeep(item)
		dragState.dragStartPosition = { ...item.position }
		dragState.dropTarget = null
	}

	/**
	 * 更新拖拽目标位置
	 */
	const updateDragTarget = (position: GridPosition): void => {
		if (dragState.isDragging) {
			dragState.dropTarget = { ...position }
		}
	}

	/**
	 * 完成拖拽放置
	 */
	const finalizeDrop = (): boolean => {
		if (!dragState.isDragging || !dragState.dragItem || !dragState.dropTarget) {
			return false
		}

		const success = moveGridItem(dragState.dragItem.id, dragState.dropTarget)

		// 清理拖拽状态
		dragState.isDragging = false
		dragState.dragItem = null
		dragState.dragStartPosition = null
		dragState.dropTarget = null

		return success
	}

	/**
	 * 取消拖拽
	 */
	const cancelDrag = (): void => {
		dragState.isDragging = false
		dragState.dragItem = null
		dragState.dragStartPosition = null
		dragState.dropTarget = null
	}

	// ===== 数据加载和保存 =====

	/**
	 * 加载桌面数据
	 */
	const loadDesktopData = async (): Promise<void> => {
		try {
			// 这里将与配置管理器集成
			console.log('加载桌面数据...')
			updateOccupiedPositions()
		} catch (error) {
			console.error('加载桌面数据失败:', error)
		}
	}

	/**
	 * 保存配置
	 */
	const saveConfiguration = async (): Promise<void> => {
		try {
			// 这里将实现配置保存逻辑
			console.log('保存配置...')
		} catch (error) {
			console.error('保存配置失败:', error)
		}
	}

	/**
	 * 重置网格
	 */
	const resetGrid = (): void => {
		gridItems.value.clear()
		selectedItems.value.clear()
		occupiedPositions.value.clear()
		cancelDrag()
	}

	return {
		// 状态
		currentConfig,
		availablePresets,
		availableApps,
		gridItems,
		selectedItems,
		dragState,
		occupiedPositions,

		// 计算属性
		gridItemsArray,
		visibleGridItems,
		availablePositions,
		hasSelectedItems,

		// 配置管理
		setGridConfig,
		switchPreset,

		// 项目管理
		addGridItem,
		removeGridItem,
		moveGridItem,
		moveGridItemWithReplacement,
		moveMultipleItems,

		// 选择管理
		selectItem,
		deselectItem,
		toggleItemSelection,
		clearSelection,
		selectAllVisible,

		// 拖拽管理
		startDrag,
		updateDragTarget,
		finalizeDrop,
		cancelDrag,

		// 位置验证
		validatePosition,
		findNearestAvailablePosition,

		// 数据管理
		loadDesktopData,
		saveConfiguration,
		resetGrid,
	}
})
