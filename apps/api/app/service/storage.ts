import { Service } from 'egg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';

type PanelType = 'bt' | '1panel';

interface StorageData {
  auth: Record<string, string>;
  sessions: Record<string, { expiresAt: number; createdAt: number }>;
  panels: Record<string, { url: string; key: string }>;
}

/**
 * StorageService
 *
 * 提供应用的数据持久化能力（文件系统）：
 * - 存取 2FA 密钥；
 * - 创建与校验用户会话；
 * - 绑定并读取面板配置（地址与密钥）。
 */
export default class StorageService extends Service {
  private dataPath: string;

  constructor(ctx: any) {
    super(ctx);
    this.dataPath = path.join(this.app.baseDir, 'data', 'storage.json');
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   */
  private ensureDataFile(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.dataPath)) {
      const initialData: StorageData = {
        auth: {},
        sessions: {},
        panels: {},
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(initialData, null, 2));
    }
  }

  /**
   * 读取存储数据
   */
  private readData(): StorageData {
    try {
      const content = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {
        auth: {},
        sessions: {},
        panels: {},
      };
    }
  }

  /**
   * 写入存储数据
   */
  private writeData(data: StorageData): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  /**
   * 设置 2FA 密钥
   */
  setTwoFASecret(secret: string): void {
    const data = this.readData();
    data.auth.twofa_secret = secret;
    this.writeData(data);
  }

  /**
   * 获取 2FA 密钥
   */
  getTwoFASecret(): string | null {
    const data = this.readData();
    return data.auth.twofa_secret || null;
  }

  /**
   * 创建用户会话
   */
  createSession(ttlMs: number): string {
    const data = this.readData();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    data.sessions[sessionId] = {
      expiresAt: now + ttlMs,
      createdAt: now,
    };

    this.writeData(data);
    return sessionId;
  }

  /**
   * 验证会话是否有效
   */
  isValidSession(sessionId: string): boolean {
    if (!sessionId) return false;

    const data = this.readData();
    const session = data.sessions[sessionId];

    if (!session) return false;
    if (session.expiresAt <= Date.now()) {
      // 清理过期会话
      delete data.sessions[sessionId];
      this.writeData(data);
      return false;
    }

    return true;
  }

  /**
   * 绑定面板密钥
   */
  bindPanelKey(type: PanelType, url: string, key: string): void {
    const data = this.readData();
    data.panels[type] = { url, key };
    this.writeData(data);
  }

  /**
   * 获取面板配置
   */
  getPanel(type: PanelType): { url: string; key: string } | null {
    const data = this.readData();
    return data.panels[type] || null;
  }
}