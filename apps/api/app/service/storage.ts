import { Service } from 'egg';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

type PanelType = 'bt' | '1panel';

/**
 * StorageService
 *
 * 提供应用的数据持久化能力（SQLite）：
 * - 初始化与维护数据库连接及表结构；
 * - 存取 2FA 密钥；
 * - 创建与校验用户会话；
 * - 绑定并读取面板配置（地址与密钥）。
 */
export default class StorageService extends Service {
  private db?: Database.Database;

  /**
   * 确保数据库已创建并初始化。
   *
   * @returns {Database.Database} - SQLite 数据库连接实例
   */
  private ensureDb() {
    if (!this.db) {
      const dbPath = (this.app.config as any).sqlite?.path || `${this.app.baseDir}/data/api.db`;
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      this.db = new Database(dbPath);
      this.initSchema();
    }
    return this.db!;
  }

  /**
   * 初始化数据库表结构（幂等）。
   *
   * 表：
   * - `auth(id, secret, created_at)`：存储 2FA 密钥；
   * - `session(session_id, expires_at, created_at)`：用户会话；
   * - `panel(type, url, key, updated_at)`：面板配置。
   *
   * @returns {void}
   */
  private initSchema() {
    const db = this.db!;
    db.prepare(
      'CREATE TABLE IF NOT EXISTS auth (id INTEGER PRIMARY KEY, secret TEXT, created_at INTEGER)'
    ).run();
    db.prepare(
      'CREATE TABLE IF NOT EXISTS session (session_id TEXT PRIMARY KEY, expires_at INTEGER, created_at INTEGER)'
    ).run();
    db.prepare(
      'CREATE TABLE IF NOT EXISTS panel (type TEXT PRIMARY KEY, url TEXT, key TEXT, updated_at INTEGER)'
    ).run();
  }

  /**
   * 保存（插入或更新）2FA base32 密钥。
   *
   * @param {string} secret - TOTP base32 密钥
   * @returns {void}
   */
  setTwoFASecret(secret: string) {
    const db = this.ensureDb();
    const now = Date.now();
    const exists = db.prepare('SELECT id FROM auth WHERE id = 1').get();
    if (exists) {
      db.prepare('UPDATE auth SET secret = ?, created_at = ? WHERE id = 1').run(secret, now);
    } else {
      db.prepare('INSERT INTO auth (id, secret, created_at) VALUES (1, ?, ?)').run(secret, now);
    }
  }

  /**
   * 读取 2FA 密钥。
   *
   * @returns {string|null} - 若存在返回 base32 密钥，否则 `null`
   */
  getTwoFASecret(): string | null {
    const db = this.ensureDb();
    const row = db.prepare('SELECT secret FROM auth WHERE id = 1').get() as { secret?: string } | undefined;
    return row?.secret || null;
  }

  /**
   * 创建用户会话并返回会话 ID。
   *
   * @param {number} ttlMs - 会话有效期（毫秒）
   * @returns {string} - 新创建的会话 ID
   */
  createSession(ttlMs: number): string {
    const db = this.ensureDb();
    const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();
    const expiresAt = now + ttlMs;
    db.prepare('INSERT INTO session (session_id, expires_at, created_at) VALUES (?, ?, ?)').run(
      sessionId,
      expiresAt,
      now
    );
    return sessionId;
  }

  /**
   * 校验会话是否未过期。
   *
   * @param {string} sessionId - 会话 ID
   * @returns {boolean} - 会话存在且未过期返回 `true`，否则 `false`
   */
  isValidSession(sessionId: string): boolean {
    if (!sessionId) return false;
    const db = this.ensureDb();
    const row = db
      .prepare('SELECT expires_at FROM session WHERE session_id = ?')
      .get(sessionId) as { expires_at?: number } | undefined;
    if (!row?.expires_at) return false;
    return row.expires_at > Date.now();
  }

  /**
   * 绑定或更新面板配置。
   *
   * @param {('bt'|'1panel')} type - 面板类型
   * @param {string} url - 面板基础地址
   * @param {string} key - 访问密钥
   * @returns {void}
   */
  bindPanelKey(type: PanelType, url: string, key: string) {
    const db = this.ensureDb();
    const now = Date.now();
    db.prepare('INSERT OR REPLACE INTO panel (type, url, key, updated_at) VALUES (?, ?, ?, ?)').run(
      type,
      url,
      key,
      now
    );
  }

  /**
   * 读取面板配置。
   *
   * @param {('bt'|'1panel')} type - 面板类型
   * @returns {{ url: string; key: string } | null} - 面板配置，若未配置返回 `null`
   */
  getPanel(type: PanelType): { url: string; key: string } | null {
    const db = this.ensureDb();
    const row = db
      .prepare('SELECT url, key FROM panel WHERE type = ?')
      .get(type) as { url?: string; key?: string } | undefined;
    if (!row?.url || !row?.key) return null;
    return { url: row.url, key: row.key };
  }
}