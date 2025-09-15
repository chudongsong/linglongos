import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiError, ErrorCategory } from '@/types';

export class AppError extends Error {
  public statusCode: number;
  public category: ErrorCategory;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.category = category;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let category = ErrorCategory.INTERNAL;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // Handle known AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    category = error.category;
    code = error.code;
    message = error.message;
    details = error.details;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    category = ErrorCategory.AUTHENTICATION;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    category = ErrorCategory.AUTHENTICATION;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    category = ErrorCategory.VALIDATION;
    code = 'VALIDATION_ERROR';
    message = error.message;
  }
  // Handle syntax errors
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    category = ErrorCategory.VALIDATION;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }
  // Handle unknown errors
  else {
    message = error.message || message;
  }

  const errorResponse: ApiError = {
    code,
    category,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown',
  };

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error:', {
      requestId: req.requestId,
      error: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorResponse,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create specific error types
export const createAuthError = (message: string, code: string = 'AUTH_ERROR') => {
  return new AppError(message, 401, ErrorCategory.AUTHENTICATION, code);
};

export const createValidationError = (message: string, details?: any) => {
  return new AppError(message, 400, ErrorCategory.VALIDATION, 'VALIDATION_ERROR', details);
};

export const createPanelConnectionError = (message: string, endpoint?: string) => {
  return new AppError(
    message,
    502,
    ErrorCategory.PANEL_CONNECTION,
    'PANEL_CONN_ERROR',
    { endpoint }
  );
};

export const createProxyError = (message: string, details?: any) => {
  return new AppError(message, 502, ErrorCategory.PROXY_ERROR, 'PROXY_ERROR', details);
};