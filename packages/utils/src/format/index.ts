/**
 * 格式化工具方法
 */

/**
 * 数字格式化
 */
export const NumberFormat = {
  /**
   * 格式化数字为千分位
   * @param num 数字
   * @param decimals 小数位数
   * @returns 格式化后的字符串
   */
  toThousands: (num: number, decimals: number = 2): string => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  },

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @param decimals 小数位数
   * @returns 格式化后的字符串
   */
  formatFileSize: (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
  },

  /**
   * 格式化百分比
   * @param value 数值（0-1之间）
   * @param decimals 小数位数
   * @returns 格式化后的百分比字符串
   */
  toPercent: (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`
  },

  /**
   * 格式化货币
   * @param amount 金额
   * @param currency 货币符号
   * @param decimals 小数位数
   * @returns 格式化后的货币字符串
   */
  toCurrency: (amount: number, currency: string = '¥', decimals: number = 2): string => {
    return `${currency}${NumberFormat.toThousands(amount, decimals)}`
  },

  /**
   * 格式化数字为中文大写
   * @param num 数字
   * @returns 中文大写数字
   */
  toChineseNumber: (num: number): string => {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    const units = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿']

    if (num === 0) return '零'

    const str = num.toString()
    let result = ''

    for (let i = 0; i < str.length; i++) {
      const digit = parseInt(str[i])
      const unit = units[str.length - 1 - i]

      if (digit !== 0) {
        result += digits[digit] + unit
      } else if (result && !result.endsWith('零')) {
        result += '零'
      }
    }

    return result.replace(/零+$/, '').replace(/零+/g, '零')
  },

  /**
   * 数字转罗马数字
   * @param num 数字（1-3999）
   * @returns 罗马数字
   */
  toRoman: (num: number): string => {
    if (num < 1 || num > 3999) return ''

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']

    let result = ''

    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i]
        num -= values[i]
      }
    }

    return result
  },

  /**
   * 格式化数字范围
   * @param min 最小值
   * @param max 最大值
   * @param separator 分隔符
   * @returns 格式化后的范围字符串
   */
  formatRange: (min: number, max: number, separator: string = ' - '): string => {
    return `${NumberFormat.toThousands(min)}${separator}${NumberFormat.toThousands(max)}`
  },
} as const

/**
 * 日期时间格式化
 */
export const DateFormat = {
  /**
   * 格式化日期
   * @param date 日期对象或时间戳
   * @param format 格式字符串
   * @returns 格式化后的日期字符串
   */
  format: (date: Date | number | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
    const d = new Date(date)

    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours()
    const minute = d.getMinutes()
    const second = d.getSeconds()
    const millisecond = d.getMilliseconds()

    const formatMap: Record<string, string> = {
      YYYY: year.toString(),
      YY: year.toString().slice(-2),
      MM: month.toString().padStart(2, '0'),
      M: month.toString(),
      DD: day.toString().padStart(2, '0'),
      D: day.toString(),
      HH: hour.toString().padStart(2, '0'),
      H: hour.toString(),
      mm: minute.toString().padStart(2, '0'),
      m: minute.toString(),
      ss: second.toString().padStart(2, '0'),
      s: second.toString(),
      SSS: millisecond.toString().padStart(3, '0'),
    }

    let result = format
    Object.entries(formatMap).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value)
    })

    return result
  },

  /**
   * 格式化相对时间
   * @param date 日期对象或时间戳
   * @returns 相对时间字符串
   */
  fromNow: (date: Date | number | string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    if (diff < 0) return '未来'

    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    const month = day * 30
    const year = day * 365

    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前`
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`
    } else {
      return `${Math.floor(diff / year)}年前`
    }
  },

  /**
   * 格式化持续时间
   * @param milliseconds 毫秒数
   * @returns 持续时间字符串
   */
  formatDuration: (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天${hours % 24}小时${minutes % 60}分钟`
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  },

  /**
   * 获取友好的日期描述
   * @param date 日期对象或时间戳
   * @returns 友好的日期描述
   */
  getFriendlyDate: (date: Date | number | string): string => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      )
    }

    if (isSameDay(d, today)) {
      return '今天'
    } else if (isSameDay(d, yesterday)) {
      return '昨天'
    } else if (isSameDay(d, tomorrow)) {
      return '明天'
    } else {
      return DateFormat.format(d, 'MM-DD')
    }
  },

  /**
   * 获取星期几
   * @param date 日期对象或时间戳
   * @param format 格式（'zh' | 'en' | 'short'）
   * @returns 星期几
   */
  getWeekday: (date: Date | number | string, format: 'zh' | 'en' | 'short' = 'zh'): string => {
    const d = new Date(date)
    const weekday = d.getDay()

    const weekdays = {
      zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      short: ['日', '一', '二', '三', '四', '五', '六'],
    }

    return weekdays[format][weekday]
  },
} as const

/**
 * 字符串格式化
 */
export const StringFormat = {
  /**
   * 模板字符串替换
   * @param template 模板字符串
   * @param data 数据对象
   * @returns 替换后的字符串
   */
  template: (template: string, data: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match
    })
  },

  /**
   * 截断字符串
   * @param str 字符串
   * @param length 最大长度
   * @param suffix 后缀
   * @returns 截断后的字符串
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str
    return str.slice(0, length - suffix.length) + suffix
  },

  /**
   * 填充字符串
   * @param str 字符串
   * @param length 目标长度
   * @param char 填充字符
   * @param position 填充位置
   * @returns 填充后的字符串
   */
  pad: (
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
  },

  /**
   * 格式化JSON
   * @param obj 对象
   * @param indent 缩进空格数
   * @returns 格式化后的JSON字符串
   */
  formatJson: (obj: any, indent: number = 2): string => {
    try {
      return JSON.stringify(obj, null, indent)
    } catch (error) {
      return String(obj)
    }
  },

  /**
   * 转换为标题格式
   * @param str 字符串
   * @returns 标题格式字符串
   */
  toTitle: (str: string): string => {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
  },

  /**
   * 移除字符串中的空白字符
   * @param str 字符串
   * @param type 移除类型
   * @returns 处理后的字符串
   */
  removeWhitespace: (str: string, type: 'all' | 'start' | 'end' | 'both' = 'both'): string => {
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
  },
} as const

/**
 * 颜色格式化
 */
export const ColorFormat = {
  /**
   * HEX转RGB
   * @param hex HEX颜色值
   * @returns RGB对象
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  },

  /**
   * RGB转HEX
   * @param r 红色值
   * @param g 绿色值
   * @param b 蓝色值
   * @returns HEX颜色值
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return (
      '#' +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        })
        .join('')
    )
  },

  /**
   * HSL转RGB
   * @param h 色相
   * @param s 饱和度
   * @param l 亮度
   * @returns RGB对象
   */
  hslToRgb: (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    }
  },

  /**
   * 获取随机颜色
   * @param format 颜色格式
   * @returns 随机颜色
   */
  randomColor: (format: 'hex' | 'rgb' | 'hsl' = 'hex'): string => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)

    switch (format) {
      case 'hex':
        return ColorFormat.rgbToHex(r, g, b)
      case 'rgb':
        return `rgb(${r}, ${g}, ${b})`
      case 'hsl':
        // 简化的RGB到HSL转换
        const max = Math.max(r, g, b) / 255
        const min = Math.min(r, g, b) / 255
        const l = (max + min) / 2
        const s =
          max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
        let h = 0
        if (max !== min) {
          switch (max) {
            case r / 255:
              h = (g - b) / 255 / (max - min) + (g < b ? 6 : 0)
              break
            case g / 255:
              h = (b - r) / 255 / (max - min) + 2
              break
            case b / 255:
              h = (r - g) / 255 / (max - min) + 4
              break
          }
          h /= 6
        }
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
      default:
        return ColorFormat.rgbToHex(r, g, b)
    }
  },
} as const
