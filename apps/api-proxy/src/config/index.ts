import dotenv from 'dotenv';
import { ServerConfig, AuthConfig, PanelConfig } from '@/types';

// Load environment variables
dotenv.config();

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  encryption: {
    masterKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me',
    algorithm: 'aes-256-gcm',
  },
  database: {
    type: (process.env.DATABASE_TYPE as 'sqlite') || 'sqlite',
    connectionString: process.env.DATABASE_PATH || './data/api-proxy.db',
  },
  logging: {
    level: (process.env.LOG_LEVEL as 'info') || 'info',
    file: process.env.LOG_FILE || './logs/api-proxy.log',
  },
};

export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  tokenExpiry: process.env.JWT_EXPIRES_IN || '24h',
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export const panelConfig: PanelConfig = {
  onePanel: {
    defaultTimeout: parseInt(process.env.ONEPANEL_TIMEOUT || '5000', 10),
    retryAttempts: 3,
    pathPrefix: '/api/v1',
    supportedVersions: ['1.0', '1.1', '1.2'],
  },
  baota: {
    defaultTimeout: parseInt(process.env.BAOTA_TIMEOUT || '5000', 10),
    signatureRequired: true,
    pathPrefix: '/api',
    supportedVersions: ['7.0', '7.1', '7.2'],
  },
};

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Validation function for required environment variables
export function validateConfig(): void {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
}