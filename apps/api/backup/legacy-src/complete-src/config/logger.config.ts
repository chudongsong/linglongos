import winston from 'winston'
import path from 'path'
import type { LogLevel, LoggerConfig } from '../types/index.js'

/**
 * 获取当前环境的日志配置
 * 
 * @returns 日志配置对象
 */
function getLoggerConfig(): LoggerConfig {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info'),
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE !== 'false',
    logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    maxFiles: Number(process.env.LOG_MAX_FILES) || 14, // 保留14天的日志
    maxSize: process.env.LOG_MAX_SIZE || '20m', // 单个文件最大20MB
  }
}

/**
 * 自定义日志格式化器
 * 
 * 开发环境：彩色输出，包含时间戳和标签
 * 生产环境：JSON 格式，便于日志收集和分析
 */
const createLogFormat = (isDevelopment: boolean) => {
  const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  )

  if (isDevelopment) {
    return winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        const metaStr = metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0 
          ? ` ${JSON.stringify(metadata)}` 
          : ''
        return `${timestamp} [${level}]: ${message}${metaStr}`
      })
    )
  }

  return winston.format.combine(
    baseFormat,
    winston.format.json()
  )
}

/**
 * 创建 Winston Logger 实例
 * 
 * @returns 配置好的 Winston Logger 实例
 */
export function createLogger(): winston.Logger {
  const config = getLoggerConfig()
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  const transports: winston.transport[] = []

  // 控制台输出
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: config.level,
        format: createLogFormat(isDevelopment),
      })
    )
  }

  // 文件输出
  if (config.enableFile) {
    // 错误日志文件
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        maxFiles: config.maxFiles,
        maxsize: parseInt(config.maxSize.replace(/[^\d]/g, '')) * 1024 * 1024, // 转换为字节
      })
    )

    // 综合日志文件
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDir, 'combined.log'),
        level: config.level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        maxFiles: config.maxFiles,
        maxsize: parseInt(config.maxSize.replace(/[^\d]/g, '')) * 1024 * 1024, // 转换为字节
      })
    )
  }

  return winston.createLogger({
    level: config.level,
    transports,
    // 处理未捕获的异常
    exceptionHandlers: config.enableFile ? [
      new winston.transports.File({
        filename: path.join(config.logDir, 'exceptions.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    ] : [],
    // 处理未处理的 Promise 拒绝
    rejectionHandlers: config.enableFile ? [
      new winston.transports.File({
        filename: path.join(config.logDir, 'rejections.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    ] : [],
  })
}

/**
 * 默认导出的 Logger 实例
 */
export const logger = createLogger()

/**
 * 日志工具函数
 */
export const logUtils = {
  /**
   * 记录 HTTP 请求信息
   * 
   * @param method HTTP 方法
   * @param url 请求 URL
   * @param statusCode 响应状态码
   * @param responseTime 响应时间（毫秒）
   * @param userAgent 用户代理
   * @param ip 客户端 IP
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    ip?: string
  ) {
    logger.http('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent,
      ip,
    })
  },

  /**
   * 记录业务操作日志
   * 
   * @param action 操作名称
   * @param userId 用户 ID（可选）
   * @param details 操作详情
   */
  logBusinessAction(action: string, userId?: string, details?: Record<string, unknown>) {
    logger.info('Business Action', {
      action,
      userId,
      ...details,
    })
  },

  /**
   * 记录错误日志
   * 
   * @param error 错误对象或错误消息
   * @param context 错误上下文信息
   */
  logError(error: Error | string, context?: Record<string, unknown>) {
    if (error instanceof Error) {
      logger.error(error.message, {
        stack: error.stack,
        name: error.name,
        ...context,
      })
    } else {
      logger.error(error, context)
    }
  },

  /**
   * 记录性能指标
   * 
   * @param metric 指标名称
   * @param value 指标值
   * @param unit 单位
   * @param tags 标签
   */
  logMetric(metric: string, value: number, unit: string, tags?: Record<string, string>) {
    logger.info('Performance Metric', {
      metric,
      value,
      unit,
      tags,
    })
  },
}