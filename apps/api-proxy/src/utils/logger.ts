import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { serverConfig } from '@/config';

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// 创建日志记录器
export const logger = winston.createLogger({
  level: serverConfig.logging.level,
  format: logFormat,
  defaultMeta: { service: 'api-proxy' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // 带轮转的文件输出
    new DailyRotateFile({
      filename: serverConfig.logging.file.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    
    // 错误文件输出
    new DailyRotateFile({
      filename: serverConfig.logging.file.replace('.log', '-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// 创建请求日志记录器函数
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl, ip } = req;
      const { statusCode } = res;
      
      const logData = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
        userAgent: req.get('User-Agent'),
      };
      
      if (statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    });
    
    next();
  };
};

export default logger;