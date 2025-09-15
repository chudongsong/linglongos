import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { serverConfig } from '@/config';
import { logger } from '@/utils/logger';
import { EncryptedData } from '@/services/crypto.service';

export interface User {
  id: number;
  user_id: string;
  username: string;
  email?: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PanelConfig {
  id: number;
  user_id: string;
  name: string;
  panel_type: 'onePanel' | 'baota';
  endpoint: string;
  api_key_encrypted: string;
  api_key_iv: string;
  api_key_tag: string;
  is_active: boolean;
  last_health_check?: string;
  health_status?: 'healthy' | 'unhealthy' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface ApiLog {
  id: number;
  user_id: string;
  panel_config_id?: number;
  request_id: string;
  method: string;
  path: string;
  status_code: number;
  response_time: number;
  error_message?: string;
  created_at: string;
}

export interface UserSession {
  id: number;
  user_id: string;
  session_token: string;
  refresh_token?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = serverConfig.database.connectionString;
  }

  /**
   * Initialize database connection and create tables
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info('Created database directory', { path: dbDir });
      }

      // Open database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign key constraints
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
      logger.info('Database initialized successfully', { path: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Panel configurations table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS panel_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        panel_type TEXT NOT NULL CHECK (panel_type IN ('onePanel', 'baota')),
        endpoint TEXT NOT NULL,
        api_key_encrypted TEXT NOT NULL,
        api_key_iv TEXT NOT NULL,
        api_key_tag TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        last_health_check DATETIME,
        health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
      )
    `);

    // API logs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        panel_config_id INTEGER,
        request_id TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
        FOREIGN KEY (panel_config_id) REFERENCES panel_configs (id) ON DELETE SET NULL
      )
    `);

    // User sessions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_user_id ON users (user_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_panel_configs_user_id ON panel_configs (user_id);
      CREATE INDEX IF NOT EXISTS idx_panel_configs_is_active ON panel_configs (is_active);
      CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs (created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions (session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions (is_active);
    `);

    // Create triggers to update updated_at timestamp
    await this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at
        AFTER UPDATE ON users
        FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_panel_configs_updated_at
        AFTER UPDATE ON panel_configs
        FOR EACH ROW
      BEGIN
        UPDATE panel_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_user_sessions_updated_at
        AFTER UPDATE ON user_sessions
        FOR EACH ROW
      BEGIN
        UPDATE user_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    logger.info('Database tables created successfully');
  }

  /**
   * Get database instance
   */
  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  /**
   * Check if database is connected
   */
  public isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(callback: (db: Database) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.exec('BEGIN TRANSACTION');
    
    try {
      const result = await callback(this.db);
      await this.db.exec('COMMIT');
      return result;
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Health check for database
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }

      const result = await this.db.get('SELECT 1 as test');
      return result?.test === 1;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const [userCount, configCount, logCount, sessionCount] = await Promise.all([
        this.db.get('SELECT COUNT(*) as count FROM users'),
        this.db.get('SELECT COUNT(*) as count FROM panel_configs'),
        this.db.get('SELECT COUNT(*) as count FROM api_logs'),
        this.db.get('SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1'),
      ]);

      return {
        users: userCount?.count || 0,
        panelConfigs: configCount?.count || 0,
        apiLogs: logCount?.count || 0,
        activeSessions: sessionCount?.count || 0,
        dbPath: this.dbPath,
        connected: this.isConnected(),
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old records
   */
  public async cleanup(options: {
    logRetentionDays?: number;
    inactiveSessionDays?: number;
  } = {}): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const logRetentionDays = options.logRetentionDays || 30;
    const inactiveSessionDays = options.inactiveSessionDays || 7;

    try {
      await this.transaction(async (db) => {
        // Clean up old API logs
        const logResult = await db.run(
          'DELETE FROM api_logs WHERE created_at < datetime("now", "-" || ? || " days")',
          [logRetentionDays]
        );

        // Clean up inactive sessions
        const sessionResult = await db.run(
          'DELETE FROM user_sessions WHERE is_active = 0 AND updated_at < datetime("now", "-" || ? || " days")',
          [inactiveSessionDays]
        );

        // Clean up expired active sessions
        const expiredResult = await db.run(
          'UPDATE user_sessions SET is_active = 0 WHERE expires_at < datetime("now")'
        );

        logger.info('Database cleanup completed', {
          logsDeleted: logResult.changes || 0,
          inactiveSessionsDeleted: sessionResult.changes || 0,
          expiredSessionsDeactivated: expiredResult.changes || 0,
        });
      });
    } catch (error) {
      logger.error('Database cleanup failed:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
