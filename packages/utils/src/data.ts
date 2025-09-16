/**
 * 数据处理工具方法
 */

/**
 * 数据类型判断
 */
export const DataType = {
	/**
	 * 判断是否为字符串
	 */
	isString: (value: unknown): value is string => typeof value === 'string',

	/**
	 * 判断是否为数字
	 */
	isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),

	/**
	 * 判断是否为布尔值
	 */
	isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',

	/**
	 * 判断是否为数组
	 */
	isArray: (value: unknown): value is unknown[] => Array.isArray(value),

	/**
	 * 判断是否为对象（不包括null和数组）
	 */
	isObject: (value: unknown): value is Record<string, unknown> =>
		value !== null && typeof value === 'object' && !Array.isArray(value),

	/**
	 * 判断是否为函数
	 */
	isFunction: (value: unknown): value is Function => typeof value === 'function',

	/**
	 * 判断是否为null
	 */
	isNull: (value: unknown): value is null => value === null,

	/**
	 * 判断是否为undefined
	 */
	isUndefined: (value: unknown): value is undefined => value === undefined,

	/**
	 * 判断是否为null或undefined
	 */
	isNullOrUndefined: (value: unknown): value is null | undefined => value === null || value === undefined,

	/**
	 * 判断是否为空值（null、undefined、空字符串、空数组、空对象）
	 */
	isEmpty: (value: unknown): boolean => {
		if (value === null || value === undefined) return true
		if (typeof value === 'string') return value.trim() === ''
		if (Array.isArray(value)) return value.length === 0
		if (typeof value === 'object') return Object.keys(value).length === 0
		return false
	},

	/**
	 * 判断是否为日期对象
	 */
	isDate: (value: unknown): value is Date => value instanceof Date && !isNaN(value.getTime()),

	/**
	 * 判断是否为正则表达式
	 */
	isRegExp: (value: unknown): value is RegExp => value instanceof RegExp,

	/**
	 * 判断是否为Promise
	 */
	isPromise: (value: unknown): value is Promise<unknown> =>
		typeof value === 'object' && value !== null && 'then' in value && typeof (value as any).then === 'function',

	/**
	 * 判断是否为整数
	 */
	isInteger: (value: unknown): value is number => typeof value === 'number' && value % 1 === 0,

	/**
	 * 判断是否为正数
	 */
	isPositive: (value: unknown): value is number => typeof value === 'number' && value > 0,

	/**
	 * 判断是否为负数
	 */
	isNegative: (value: unknown): value is number => typeof value === 'number' && value < 0,
} as const

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== 'object') {
		return obj
	}

	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T
	}

	if (obj instanceof RegExp) {
		return new RegExp(obj.source, (obj as any).flags || '') as T
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => deepClone(item)) as T
	}

	const cloned = {} as T
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			cloned[key] = deepClone(obj[key])
		}
	}

	return cloned
}

/**
 * 合并对象（深度合并）
 * @param target 目标对象
 * @param sources 源对象数组
 * @returns 合并后的对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
	if (!sources.length) return target

	const source = sources.shift()
	if (!source) return target

	if (DataType.isObject(target) && DataType.isObject(source)) {
		for (const key in source) {
			if (source[key] && DataType.isObject(source[key])) {
				if (!target[key]) target[key] = {} as any
				deepMerge(target[key] as Record<string, any>, source[key] as Record<string, any>)
			} else {
				target[key] = source[key] as any
			}
		}
	}

	return deepMerge(target, ...sources)
}

/**
 * 数组去重
 * @param arr 数组
 * @param key 对象数组时的去重键名
 * @returns 去重后的数组
 */
export function uniqueArray<T>(arr: T[], key?: keyof T): T[] {
	if (!Array.isArray(arr)) return []

	if (key) {
		const seen: any[] = []
		return arr.filter((item) => {
			const value = item[key]
			if (seen.indexOf(value) !== -1) {
				return false
			}
			seen.push(value)
			return true
		})
	}

	// 简单去重实现
	return arr.filter((item, index) => arr.indexOf(item) === index)
}

/**
 * 数组分组
 * @param arr 数组
 * @param key 分组键名或分组函数
 * @returns 分组后的对象
 */
export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => string | number)): Record<string, T[]> {
	if (!Array.isArray(arr)) return {}

	return arr.reduce(
		(groups, item) => {
			const groupKey = typeof key === 'function' ? key(item) : item[key]
			const groupName = String(groupKey)

			if (!groups[groupName]) {
				groups[groupName] = []
			}
			groups[groupName].push(item)

			return groups
		},
		{} as Record<string, T[]>,
	)
}

/**
 * 数组排序
 * @param arr 数组
 * @param key 排序键名或排序函数
 * @param order 排序顺序，'asc' 升序，'desc' 降序
 * @returns 排序后的数组
 */
export function sortBy<T>(arr: T[], key: keyof T | ((item: T) => any), order: 'asc' | 'desc' = 'asc'): T[] {
	if (!Array.isArray(arr)) return []

	return [...arr].sort((a, b) => {
		const aValue = typeof key === 'function' ? key(a) : a[key]
		const bValue = typeof key === 'function' ? key(b) : b[key]

		if (aValue < bValue) return order === 'asc' ? -1 : 1
		if (aValue > bValue) return order === 'asc' ? 1 : -1
		return 0
	})
}

/**
 * 数组分页
 * @param arr 数组
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @returns 分页结果
 */
export function paginate<T>(arr: T[], page: number, pageSize: number) {
	if (!Array.isArray(arr)) return { data: [], total: 0, page: 1, pageSize, totalPages: 0 }

	const total = arr.length
	const totalPages = Math.ceil(total / pageSize)
	const currentPage = Math.max(1, Math.min(page, totalPages))
	const startIndex = (currentPage - 1) * pageSize
	const endIndex = startIndex + pageSize
	const data = arr.slice(startIndex, endIndex)

	return {
		data,
		total,
		page: currentPage,
		pageSize,
		totalPages,
	}
}

/**
 * 扁平化数组
 * @param arr 多维数组
 * @param depth 扁平化深度，默认为1
 * @returns 扁平化后的数组
 */
export function flattenArray<T>(arr: any[], depth: number = 1): T[] {
	if (!Array.isArray(arr)) return []

	return depth > 0
		? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flattenArray(val, depth - 1) : val), [])
		: arr.slice()
}

/**
 * 树形数据扁平化
 * @param tree 树形数据
 * @param childrenKey 子节点键名，默认为 'children'
 * @returns 扁平化后的数组
 */
export function flattenTree<T extends Record<string, any>>(tree: T[], childrenKey: string = 'children'): T[] {
	const result: T[] = []

	function traverse(nodes: T[]) {
		for (const node of nodes) {
			const { [childrenKey]: children, ...rest } = node
			result.push(rest as T)

			if (Array.isArray(children) && children.length > 0) {
				traverse(children)
			}
		}
	}

	traverse(tree)
	return result
}

/**
 * 数组转树形结构
 * @param arr 扁平数组
 * @param options 配置选项
 * @returns 树形结构数组
 */
export function arrayToTree<T extends Record<string, any>>(
	arr: T[],
	options: {
		idKey?: string
		parentIdKey?: string
		childrenKey?: string
		rootValue?: any
	} = {},
): T[] {
	const { idKey = 'id', parentIdKey = 'parentId', childrenKey = 'children', rootValue = null } = options

	const tree: T[] = []
	const map: Record<string, T> = {}

	// 创建映射
	for (const item of arr) {
		map[item[idKey]] = { ...item, [childrenKey]: [] }
	}

	// 构建树形结构
	for (const item of arr) {
		const node = map[item[idKey]]
		const parentId = item[parentIdKey]

		if (node) {
			if (parentId === rootValue) {
				tree.push(node)
			} else {
				const parent = map[parentId]
				if (parent) {
					parent[childrenKey].push(node)
				}
			}
		}
	}

	return tree
}
