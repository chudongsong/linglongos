/**
 * 字符串工具方法
 */

/**
 * 截断字符串
 * @param str 字符串
 * @param length 最大长度
 * @param suffix 后缀
 * @returns 截断后的字符串
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str
  return str.slice(0, length - suffix.length) + suffix
}

/**
 * 填充字符串
 * @param str 字符串
 * @param length 目标长度
 * @param char 填充字符
 * @param position 填充位置
 * @returns 填充后的字符串
 */
export const pad = (
  str: string,
  length: number,
  char: string = ' ',
  position: 'start' | 'end' | 'both' = 'start'
): string => {
  if (str.length >= length) return str

  const padLength = length - str.length

  switch (position) {
    case 'start':
      return char.repeat(padLength) + str
    case 'end':
      return str + char.repeat(padLength)
    case 'both':
      const leftPad = Math.floor(padLength / 2)
      const rightPad = padLength - leftPad
      return char.repeat(leftPad) + str + char.repeat(rightPad)
    default:
      return str
  }
}

/**
 * 转换为驼峰命名
 * @param str 字符串
 * @returns 驼峰命名字符串
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, c => c.toLowerCase())
}

/**
 * 转换为帕斯卡命名
 * @param str 字符串
 * @returns 帕斯卡命名字符串
 */
export const toPascalCase = (str: string): string => {
  const camelCase = toCamelCase(str)
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

/**
 * 转换为短横线命名
 * @param str 字符串
 * @returns 短横线命名字符串
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 转换为下划线命名
 * @param str 字符串
 * @returns 下划线命名字符串
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * 转换为标题命名
 * @param str 字符串
 * @returns 标题命名字符串
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 移除字符串中的空白字符
 * @param str 字符串
 * @param type 移除类型
 * @returns 处理后的字符串
 */
export const removeWhitespace = (
  str: string,
  type: 'all' | 'start' | 'end' | 'both' = 'both'
): string => {
  switch (type) {
    case 'all':
      return str.replace(/\s/g, '')
    case 'start':
      return str.replace(/^\s+/, '')
    case 'end':
      return str.replace(/\s+$/, '')
    case 'both':
      return str.trim()
    default:
      return str
  }
}

/**
 * 模板字符串替换
 * @param template 模板字符串
 * @param data 数据对象
 * @returns 替换后的字符串
 */
export const template = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

/**
 * 格式化JSON
 * @param obj 对象
 * @param indent 缩进空格数
 * @returns 格式化后的JSON字符串
 */
export const formatJson = (obj: any, indent: number = 2): string => {
  try {
    return JSON.stringify(obj, null, indent)
  } catch (error) {
    return String(obj)
  }
}

/**
 * 字符串工具集合
 */
export const StringUtils = {
  truncate,
  pad,
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  toTitleCase,
  removeWhitespace,
  template,
  formatJson,
}

export default StringUtils
