import { Service } from 'egg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';

/** 面板类型定义 */
type PanelType = 'bt' | '1panel';

/** 会话信息接口 */
interface SessionInfo {
  expiresAt: number;
  createdAt: number;
}

/** 面板配置接口 */
interface PanelConfig {
  url: string;
  key: string;
}

/** 存储数据结构接口 */
interface StorageData {
  auth: Record<string, string>;
  sessions: Record<string, SessionInfo>;
  panels: Record<string, PanelConfig>;
}

/**
 * 存储服务类
 *
 * 提供应用的数据持久化能力（文件系统）：
 * - 存取 2FA 密钥
 * - 创建与校验用户会话
 * - 绑定并读取面板配置（地址与密钥）
 */
export default class StorageService extends Service {
  /** 会话ID长度（字节） */
  private static readonly SESSION_ID_BYTES = 32;

  /** 2FA密钥存储键名 */
  private static readonly TWOFA_SECRET_KEY = 'twofa_secret';

  /** 数据文件相对路径 */
  private static readonly DATA_FILE_PATH = 'data/storage.json';

  /** JSON格式化缩进 */
  private static readonly JSON_INDENT = 2;

  private readonly dataPath: string;

  constructor(ctx: any) {
    super(ctx);
    this.dataPath = path.join(this.app.baseDir, StorageService.DATA_FILE_PATH);
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   *
   * @private
   */
  private ensureDataFile(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.dataPath)) {
      const initialData: StorageData = this.createInitialData();
      this.writeDataSync(initialData);
    }
  }

  /**
   * 创建初始数据结构
   *
   * @private
   * @returns {StorageData} 初始数据结构
   */
  private createInitialData(): StorageData {
    return {
      auth: {},
      sessions: {},
      panels: {},
    };
  }

  /**
   * 读取存储数据
   *
   * @private
   * @returns {StorageData} 存储数据，读取失败时返回初始数据
   */
  private readData(): StorageData {
    try {
      const content = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // 读取失败时返回初始数据结构
      return this.createInitialData();
    }
  }

  /**
   * 写入存储数据
   *
   * @private
   * @param {StorageData} data 要写入的数据
   */
  private writeData(data: StorageData): void {
    this.writeDataSync(data);
  }

  /**
   * 同步写入存储数据
   *
   * @private
   * @param {StorageData} data 要写入的数据
   */
  private writeDataSync(data: StorageData): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, StorageService.JSON_INDENT));
  }

  /**
   * 设置 2FA 密钥
   *
   * @param {string} secret 2FA密钥
   */
  setTwoFASecret(secret: string): void {
    const data = this.readData();
    data.auth[StorageService.TWOFA_SECRET_KEY] = secret;
    this.writeData(data);
  }

  /**
   * 获取 2FA 密钥
   *
   * @returns {string | null} 2FA密钥，不存在时返回null
   */
  getTwoFASecret(): string | null {
    const data = this.readData();
    return data.auth[StorageService.TWOFA_SECRET_KEY] || null;
  }

  /**
   * 创建用户会话
   *
   * @param {number} ttlMs 会话生存时间（毫秒）
   * @returns {string} 会话ID
   */
  createSession(ttlMs: number): string {
    const data = this.readData();
    const sessionId = this.generateSessionId();
    const now = Date.now();

    data.sessions[sessionId] = {
      expiresAt: now + ttlMs,
      createdAt: now,
    };

    this.writeData(data);
    return sessionId;
  }

  /**
   * 生成会话ID
   *
   * @private
   * @returns {string} 随机生成的会话ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(StorageService.SESSION_ID_BYTES).toString('hex');
  }

  /**
   * 验证会话是否有效
   *
   * @param {string} sessionId 会话ID
   * @returns {boolean} 会话是否有效
   */
  isValidSession(sessionId: string): boolean {
    if (!sessionId) {
      return false;
    }

    const data = this.readData();
    const session = data.sessions[sessionId];

    if (!session) {
      return false;
    }

    if (this.isSessionExpired(session)) {
      // 清理过期会话
      this.removeExpiredSession(sessionId, data);
      return false;
    }

    return true;
  }

  /**
   * 检查会话是否过期
   *
   * @private
   * @param {SessionInfo} session 会话信息
   * @returns {boolean} 是否过期
   */
  private isSessionExpired(session: SessionInfo): boolean {
    return session.expiresAt <= Date.now();
  }

  /**
   * 移除过期会话
   *
   * @private
   * @param {string} sessionId 会话ID
   * @param {StorageData} data 存储数据
   */
  private removeExpiredSession(sessionId: string, data: StorageData): void {
    delete data.sessions[sessionId];
    this.writeData(data);
  }

  /**
   * 绑定面板密钥
   *
   * @param {PanelType} type 面板类型
   * @param {string} url 面板地址
   * @param {string} key 面板密钥
   */
  bindPanelKey(type: PanelType, url: string, key: string): void {
    const data = this.readData();
    data.panels[type] = { url, key };
    this.writeData(data);
  }

  /**
   * 获取面板配置
   *
   * @param {PanelType} type 面板类型
   * @returns {PanelConfig | null} 面板配置，不存在时返回null
   */
  getPanel(type: PanelType): PanelConfig | null {
    const data = this.readData();
    return data.panels[type] || null;
  }

  /**
   * 清理所有过期会话
   *
   * @returns {number} 清理的会话数量
   */
  cleanupExpiredSessions(): number {
    const data = this.readData();
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of Object.entries(data.sessions)) {
      if (session.expiresAt <= now) {
        delete data.sessions[sessionId];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.writeData(data);
    }

    return cleanedCount;
  }
}