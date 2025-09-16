import { describe, it, expect } from 'vitest'
import {
	DataType,
	deepClone,
	deepMerge,
	uniqueArray,
	groupBy,
	sortBy,
	paginate,
	flattenArray,
	flattenTree,
	arrayToTree,
} from '../src/data'

describe('数据处理工具测试', () => {
	describe('DataType - 数据类型判断', () => {
		describe('isString', () => {
			it('应该正确判断字符串类型', () => {
				expect(DataType.isString('hello')).toBe(true)
				expect(DataType.isString('')).toBe(true)
				expect(DataType.isString('123')).toBe(true)
				expect(DataType.isString(123)).toBe(false)
				expect(DataType.isString(null)).toBe(false)
				expect(DataType.isString(undefined)).toBe(false)
				expect(DataType.isString([])).toBe(false)
				expect(DataType.isString({})).toBe(false)
			})
		})

		describe('isNumber', () => {
			it('应该正确判断数字类型', () => {
				expect(DataType.isNumber(123)).toBe(true)
				expect(DataType.isNumber(0)).toBe(true)
				expect(DataType.isNumber(-123)).toBe(true)
				expect(DataType.isNumber(3.14)).toBe(true)
				expect(DataType.isNumber(NaN)).toBe(false)
				expect(DataType.isNumber('123')).toBe(false)
				expect(DataType.isNumber(null)).toBe(false)
				expect(DataType.isNumber(undefined)).toBe(false)
			})
		})

		describe('isBoolean', () => {
			it('应该正确判断布尔类型', () => {
				expect(DataType.isBoolean(true)).toBe(true)
				expect(DataType.isBoolean(false)).toBe(true)
				expect(DataType.isBoolean(1)).toBe(false)
				expect(DataType.isBoolean(0)).toBe(false)
				expect(DataType.isBoolean('true')).toBe(false)
				expect(DataType.isBoolean(null)).toBe(false)
			})
		})

		describe('isArray', () => {
			it('应该正确判断数组类型', () => {
				expect(DataType.isArray([])).toBe(true)
				expect(DataType.isArray([1, 2, 3])).toBe(true)
				expect(DataType.isArray(new Array())).toBe(true)
				expect(DataType.isArray({})).toBe(false)
				expect(DataType.isArray('array')).toBe(false)
				expect(DataType.isArray(null)).toBe(false)
			})
		})

		describe('isObject', () => {
			it('应该正确判断对象类型', () => {
				expect(DataType.isObject({})).toBe(true)
				expect(DataType.isObject({ a: 1 })).toBe(true)
				expect(DataType.isObject([])).toBe(false)
				expect(DataType.isObject(null)).toBe(false)
				expect(DataType.isObject('object')).toBe(false)
				expect(DataType.isObject(123)).toBe(false)
			})
		})

		describe('isFunction', () => {
			it('应该正确判断函数类型', () => {
				expect(DataType.isFunction(() => {})).toBe(true)
				expect(DataType.isFunction(function () {})).toBe(true)
				expect(DataType.isFunction(console.log)).toBe(true)
				expect(DataType.isFunction('function')).toBe(false)
				expect(DataType.isFunction(null)).toBe(false)
			})
		})

		describe('isNull', () => {
			it('应该正确判断null类型', () => {
				expect(DataType.isNull(null)).toBe(true)
				expect(DataType.isNull(undefined)).toBe(false)
				expect(DataType.isNull(0)).toBe(false)
				expect(DataType.isNull('')).toBe(false)
				expect(DataType.isNull(false)).toBe(false)
			})
		})

		describe('isUndefined', () => {
			it('应该正确判断undefined类型', () => {
				expect(DataType.isUndefined(undefined)).toBe(true)
				expect(DataType.isUndefined(null)).toBe(false)
				expect(DataType.isUndefined(0)).toBe(false)
				expect(DataType.isUndefined('')).toBe(false)
				expect(DataType.isUndefined(false)).toBe(false)
			})
		})

		describe('isNullOrUndefined', () => {
			it('应该正确判断null或undefined类型', () => {
				expect(DataType.isNullOrUndefined(null)).toBe(true)
				expect(DataType.isNullOrUndefined(undefined)).toBe(true)
				expect(DataType.isNullOrUndefined(0)).toBe(false)
				expect(DataType.isNullOrUndefined('')).toBe(false)
				expect(DataType.isNullOrUndefined(false)).toBe(false)
			})
		})

		describe('isEmpty', () => {
			it('应该正确判断空值', () => {
				expect(DataType.isEmpty(null)).toBe(true)
				expect(DataType.isEmpty(undefined)).toBe(true)
				expect(DataType.isEmpty('')).toBe(true)
				expect(DataType.isEmpty('   ')).toBe(true)
				expect(DataType.isEmpty([])).toBe(true)
				expect(DataType.isEmpty({})).toBe(true)
				expect(DataType.isEmpty('hello')).toBe(false)
				expect(DataType.isEmpty([1])).toBe(false)
				expect(DataType.isEmpty({ a: 1 })).toBe(false)
				expect(DataType.isEmpty(0)).toBe(false)
				expect(DataType.isEmpty(false)).toBe(false)
			})
		})

		describe('isDate', () => {
			it('应该正确判断日期类型', () => {
				expect(DataType.isDate(new Date())).toBe(true)
				expect(DataType.isDate(new Date('2023-01-01'))).toBe(true)
				expect(DataType.isDate(new Date('invalid'))).toBe(false)
				expect(DataType.isDate('2023-01-01')).toBe(false)
				expect(DataType.isDate(123456789)).toBe(false)
			})
		})

		describe('isRegExp', () => {
			it('应该正确判断正则表达式类型', () => {
				expect(DataType.isRegExp(/test/)).toBe(true)
				expect(DataType.isRegExp(new RegExp('test'))).toBe(true)
				expect(DataType.isRegExp('/test/')).toBe(false)
				expect(DataType.isRegExp('test')).toBe(false)
			})
		})

		describe('isPromise', () => {
			it('应该正确判断Promise类型', () => {
				expect(DataType.isPromise(Promise.resolve())).toBe(true)
				expect(DataType.isPromise(new Promise(() => {}))).toBe(true)
				expect(DataType.isPromise({ then: () => {} })).toBe(true)
				expect(DataType.isPromise({})).toBe(false)
				expect(DataType.isPromise('promise')).toBe(false)
			})
		})

		describe('isInteger', () => {
			it('应该正确判断整数类型', () => {
				expect(DataType.isInteger(1)).toBe(true)
				expect(DataType.isInteger(0)).toBe(true)
				expect(DataType.isInteger(-1)).toBe(true)
				expect(DataType.isInteger(1.0)).toBe(true)
				expect(DataType.isInteger(1.1)).toBe(false)
				expect(DataType.isInteger('1')).toBe(false)
			})
		})

		describe('isPositive', () => {
			it('应该正确判断正数', () => {
				expect(DataType.isPositive(1)).toBe(true)
				expect(DataType.isPositive(0.1)).toBe(true)
				expect(DataType.isPositive(0)).toBe(false)
				expect(DataType.isPositive(-1)).toBe(false)
				expect(DataType.isPositive('1')).toBe(false)
			})
		})

		describe('isNegative', () => {
			it('应该正确判断负数', () => {
				expect(DataType.isNegative(-1)).toBe(true)
				expect(DataType.isNegative(-0.1)).toBe(true)
				expect(DataType.isNegative(0)).toBe(false)
				expect(DataType.isNegative(1)).toBe(false)
				expect(DataType.isNegative('-1')).toBe(false)
			})
		})
	})

	describe('deepClone - 深拷贝', () => {
		it('应该深拷贝基本类型', () => {
			expect(deepClone(1)).toBe(1)
			expect(deepClone('hello')).toBe('hello')
			expect(deepClone(true)).toBe(true)
			expect(deepClone(null)).toBe(null)
			expect(deepClone(undefined)).toBe(undefined)
		})

		it('应该深拷贝数组', () => {
			const arr = [1, 2, [3, 4]]
			const cloned = deepClone(arr)
			expect(cloned).toEqual(arr)
			expect(cloned).not.toBe(arr)
			expect(cloned[2]).not.toBe(arr[2])
		})

		it('应该深拷贝对象', () => {
			const obj = { a: 1, b: { c: 2 } }
			const cloned = deepClone(obj)
			expect(cloned).toEqual(obj)
			expect(cloned).not.toBe(obj)
			expect(cloned.b).not.toBe(obj.b)
		})

		it('应该深拷贝日期对象', () => {
			const date = new Date('2023-01-01')
			const cloned = deepClone(date)
			expect(cloned).toEqual(date)
			expect(cloned).not.toBe(date)
			expect(cloned.getTime()).toBe(date.getTime())
		})

		it('应该深拷贝正则表达式', () => {
			const regex = /test/gi
			const cloned = deepClone(regex)
			expect(cloned.source).toBe(regex.source)
			expect(cloned.flags).toBe(regex.flags)
			expect(cloned).not.toBe(regex)
		})
	})

	describe('deepMerge - 深度合并', () => {
		it('应该合并简单对象', () => {
			const target = { a: 1, b: 2 }
			const source = { b: 3, c: 4 }
			const result = deepMerge(target, source)
			expect(result).toEqual({ a: 1, b: 3, c: 4 })
		})

		it('应该深度合并嵌套对象', () => {
			const target = { a: { x: 1, y: 2 }, b: 3 }
			const source = { a: { y: 4, z: 5 }, c: 6 }
			const result = deepMerge(target, source as any)
			expect(result).toEqual({
				a: { x: 1, y: 4, z: 5 },
				b: 3,
				c: 6,
			})
		})

		it('应该合并多个源对象', () => {
			const target = { a: 1 }
			const source1 = { b: 2 }
			const source2 = { c: 3 }
			const result = deepMerge(target, source1 as any, source2 as any)
			expect(result).toEqual({ a: 1, b: 2, c: 3 })
		})
	})

	describe('uniqueArray - 数组去重', () => {
		it('应该去重基本类型数组', () => {
			expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
			expect(uniqueArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
			expect(uniqueArray([true, false, true])).toEqual([true, false])
		})

		it('应该根据键去重对象数组', () => {
			const arr = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 1, name: 'Charlie' },
			]
			const result = uniqueArray(arr, 'id')
			expect(result).toEqual([
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
			])
		})

		it('应该处理空数组', () => {
			expect(uniqueArray([])).toEqual([])
		})

		it('应该处理非数组输入', () => {
			expect(uniqueArray('not array' as any)).toEqual([])
		})
	})

	describe('groupBy - 数组分组', () => {
		it('应该根据键名分组', () => {
			const arr = [
				{ type: 'fruit', name: 'apple' },
				{ type: 'vegetable', name: 'carrot' },
				{ type: 'fruit', name: 'banana' },
			]
			const result = groupBy(arr, 'type')
			expect(result).toEqual({
				fruit: [
					{ type: 'fruit', name: 'apple' },
					{ type: 'fruit', name: 'banana' },
				],
				vegetable: [{ type: 'vegetable', name: 'carrot' }],
			})
		})

		it('应该根据函数分组', () => {
			const arr = [1, 2, 3, 4, 5, 6]
			const result = groupBy(arr, (num) => (num % 2 === 0 ? 'even' : 'odd'))
			expect(result).toEqual({
				odd: [1, 3, 5],
				even: [2, 4, 6],
			})
		})

		it('应该处理空数组', () => {
			expect(groupBy([], 'key')).toEqual({})
		})
	})

	describe('sortBy - 数组排序', () => {
		it('应该根据键名排序', () => {
			const arr = [{ age: 30 }, { age: 20 }, { age: 25 }]
			const result = sortBy(arr, 'age')
			expect(result).toEqual([{ age: 20 }, { age: 25 }, { age: 30 }])
		})

		it('应该降序排序', () => {
			const arr = [{ age: 20 }, { age: 30 }, { age: 25 }]
			const result = sortBy(arr, 'age', 'desc')
			expect(result).toEqual([{ age: 30 }, { age: 25 }, { age: 20 }])
		})

		it('应该根据函数排序', () => {
			const arr = ['apple', 'pie', 'washington']
			const result = sortBy(arr, (str) => str.length)
			expect(result).toEqual(['pie', 'apple', 'washington'])
		})

		it('应该处理空数组', () => {
			expect(sortBy([], 'key')).toEqual([])
		})
	})

	describe('paginate - 数组分页', () => {
		const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

		it('应该正确分页', () => {
			const result = paginate(arr, 1, 3)
			expect(result).toEqual({
				data: [1, 2, 3],
				total: 10,
				page: 1,
				pageSize: 3,
				totalPages: 4,
			})

			const result2 = paginate(arr, 2, 3)
			expect(result2.data).toEqual([4, 5, 6])
		})

		it('应该处理超出范围的页码', () => {
			const result = paginate(arr, 10, 3)
			expect(result.page).toBe(4)
			expect(result.data).toEqual([10])
		})

		it('应该处理空数组', () => {
			const result = paginate([], 1, 5)
			expect(result).toEqual({
				data: [],
				total: 0,
				page: 1,
				pageSize: 5,
				totalPages: 0,
			})
		})
	})

	describe('flattenArray - 扁平化数组', () => {
		it('应该扁平化一层', () => {
			const arr = [1, [2, 3], [4, [5, 6]]]
			const result = flattenArray(arr, 1)
			expect(result).toEqual([1, 2, 3, 4, [5, 6]])
		})

		it('应该扁平化多层', () => {
			const arr = [1, [2, [3, [4, 5]]]]
			const result = flattenArray(arr, 3)
			expect(result).toEqual([1, 2, 3, 4, 5])
		})

		it('应该处理非数组输入', () => {
			expect(flattenArray('not array' as any)).toEqual([])
		})
	})

	describe('flattenTree - 树形数据扁平化', () => {
		it('应该扁平化树形结构', () => {
			const tree = [
				{
					id: 1,
					name: 'root',
					children: [
						{ id: 2, name: 'child1', children: [] },
						{ id: 3, name: 'child2', children: [{ id: 4, name: 'grandchild' }] },
					],
				},
			]
			const result = flattenTree(tree)
			expect(result).toEqual([
				{ id: 1, name: 'root' },
				{ id: 2, name: 'child1' },
				{ id: 3, name: 'child2' },
				{ id: 4, name: 'grandchild' },
			])
		})

		it('应该使用自定义子节点键名', () => {
			const tree = [
				{
					id: 1,
					name: 'root',
					items: [{ id: 2, name: 'child', items: [] }],
				},
			]
			const result = flattenTree(tree, 'items')
			expect(result).toEqual([
				{ id: 1, name: 'root' },
				{ id: 2, name: 'child' },
			])
		})
	})

	describe('arrayToTree - 数组转树形结构', () => {
		it('应该将扁平数组转换为树形结构', () => {
			const arr = [
				{ id: 1, name: 'root', parentId: null },
				{ id: 2, name: 'child1', parentId: 1 },
				{ id: 3, name: 'child2', parentId: 1 },
				{ id: 4, name: 'grandchild', parentId: 2 },
			]
			const result = arrayToTree(arr)
			expect(result).toEqual([
				{
					id: 1,
					name: 'root',
					parentId: null,
					children: [
						{
							id: 2,
							name: 'child1',
							parentId: 1,
							children: [
								{
									id: 4,
									name: 'grandchild',
									parentId: 2,
									children: [],
								},
							],
						},
						{
							id: 3,
							name: 'child2',
							parentId: 1,
							children: [],
						},
					],
				},
			])
		})

		it('应该使用自定义配置', () => {
			const arr = [
				{ code: 1, title: 'root', parent: 0 },
				{ code: 2, title: 'child', parent: 1 },
			]
			const result = arrayToTree(arr, {
				idKey: 'code',
				parentIdKey: 'parent',
				childrenKey: 'items',
				rootValue: 0,
			})
			expect(result[0]).toMatchObject({
				code: 1,
				title: 'root',
				parent: 0,
				items: [
					{
						code: 2,
						title: 'child',
						parent: 1,
						items: [],
					},
				],
			})
		})
	})
})
