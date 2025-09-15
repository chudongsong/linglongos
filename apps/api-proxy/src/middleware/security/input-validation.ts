import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface ValidationOptions {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'ip';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  sanitize?: boolean;
}

export interface ValidationSchema {
  [field: string]: ValidationOptions;
}

/**
 * 输入验证中间件
 */
export class InputValidator {
  /**
   * 验证请求体
   */
  static validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: string[] = [];
        
        for (const [field, options] of Object.entries(schema)) {
          const value = req.body[field];
          const fieldErrors = InputValidator.validateField(field, value, options);
          errors.push(...fieldErrors);
        }
        
        if (errors.length > 0) {
          throw new AppError(400, 'Validation failed', { errors });
        }
        
        // 清理输入数据
        InputValidator.sanitizeData(req.body, schema);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * 验证查询参数
   */
  static validateQuery(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: string[] = [];
        
        for (const [field, options] of Object.entries(schema)) {
          const value = req.query[field];
          const fieldErrors = InputValidator.validateField(field, value, options);
          errors.push(...fieldErrors);
        }
        
        if (errors.length > 0) {
          throw new AppError(400, 'Validation failed', { errors });
        }
        
        // 清理输入数据
        InputValidator.sanitizeData(req.query, schema);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * 验证单个字段
   */
  private static validateField(field: string, value: any, options: ValidationOptions): string[] {
    const errors: string[] = [];
    
    // 检查必需字段
    if (options.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`);
      return errors;
    }
    
    // 如果字段不是必需的且为空，跳过验证
    if (!options.required && (value === undefined || value === null || value === '')) {
      return errors;
    }
    
    // 类型验证
    if (options.type) {
      const typeError = InputValidator.validateType(field, value, options.type);
      if (typeError) {
        errors.push(typeError);
        return errors; // 如果类型错误，不继续验证
      }
    }
    
    // 长度验证（字符串）
    if (typeof value === 'string') {
      if (options.minLength && value.length < options.minLength) {
        errors.push(`Field '${field}' must be at least ${options.minLength} characters long`);
      }
      if (options.maxLength && value.length > options.maxLength) {
        errors.push(`Field '${field}' must be no more than ${options.maxLength} characters long`);
      }
    }
    
    // 数值范围验证
    if (typeof value === 'number') {
      if (options.min !== undefined && value < options.min) {
        errors.push(`Field '${field}' must be at least ${options.min}`);
      }
      if (options.max !== undefined && value > options.max) {
        errors.push(`Field '${field}' must be no more than ${options.max}`);
      }
    }
    
    // 正则表达式验证
    if (options.pattern && typeof value === 'string') {
      if (!options.pattern.test(value)) {
        errors.push(`Field '${field}' has invalid format`);
      }
    }
    
    // 自定义验证
    if (options.custom) {
      if (!options.custom(value)) {
        errors.push(`Field '${field}' failed custom validation`);
      }
    }
    
    return errors;
  }
  
  /**
   * 验证数据类型
   */
  private static validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `Field '${field}' must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Field '${field}' must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Field '${field}' must be a boolean`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          return `Field '${field}' must be a valid email`;
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          return `Field '${field}' must be a valid URL`;
        }
        break;
      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          return `Field '${field}' must be a valid UUID`;
        }
        break;
      case 'ip':
        if (typeof value !== 'string' || !validator.isIP(value)) {
          return `Field '${field}' must be a valid IP address`;
        }
        break;
    }
    return null;
  }
  
  /**
   * 清理输入数据
   */
  private static sanitizeData(data: any, schema: ValidationSchema): void {
    for (const [field, options] of Object.entries(schema)) {
      if (options.sanitize && data[field] && typeof data[field] === 'string') {
        // 基本的XSS防护
        data[field] = validator.escape(data[field]);
        // 去除多余空格
        data[field] = data[field].trim();
      }
    }
  }
}

/**
 * SQL注入防护中间件
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    const suspiciousPatterns = [
      /('|(--)|(\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };
    
    // 检查请求体
    if (req.body && checkValue(req.body)) {
      logger.warn('SQL injection attempt detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
      });
      throw new AppError(400, 'Invalid input detected');
    }
    
    // 检查查询参数
    if (req.query && checkValue(req.query)) {
      logger.warn('SQL injection attempt detected in query', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query
      });
      throw new AppError(400, 'Invalid input detected');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * XSS防护中间件
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        let sanitized = value;
        xssPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        return validator.escape(sanitized);
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const sanitizedObj: any = {};
        for (const [key, val] of Object.entries(value)) {
          sanitizedObj[key] = sanitizeValue(val);
        }
        return sanitizedObj;
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      return value;
    };
    
    // 清理请求体
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    // 清理查询参数
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 文件上传安全检查
 */
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }
    
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
      '.jar', '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1'
    ];
    
    const checkFile = (file: any) => {
      if (!file || !file.originalname) {
        return false;
      }
      
      const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      return dangerousExtensions.includes(extension);
    };
    
    let hasDangerousFile = false;
    
    if (req.file) {
      hasDangerousFile = checkFile(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        hasDangerousFile = req.files.some(checkFile);
      } else {
        hasDangerousFile = Object.values(req.files).some((files: any) => {
          if (Array.isArray(files)) {
            return files.some(checkFile);
          }
          return checkFile(files);
        });
      }
    }
    
    if (hasDangerousFile) {
      logger.warn('Dangerous file upload attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        files: req.files
      });
      throw new AppError(400, 'Dangerous file type detected');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};