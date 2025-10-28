import { Service } from 'egg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

type PanelType = 'bt' | '1panel';

interface StorageData {
  auth?: {
    secret: string;
    createdAt: number;
  };
  sessions: Record<string, {
    expiresAt: number;
    createdAt: number;
  }>;
  panels: Record<PanelType, {
    url: string;
    key: string;
    updatedAt: number;
  }>;
}

/**
 * FileStorageService
 *
 * 基于文件的存储服务，作为 SQLite 的临时替代方案：
 * - 使用 JSON 文件存储数据；
 * - 提供与 StorageService 相同的接口；
 * - 支持 2FA 密钥、会话和面板配置的存储。
 */
export default class FileStorageService extends Service {
  private dataPath: string;
  private data: StorageData;

  constructor(ctx: any) {
    super(ctx);
    this.dataPath = path.join(this.app.baseDir, 'data', 'storage.json');
    this.ensureDataDir();
    this.loadData();
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 加载数据文件
   */
  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf-8');
        const parsedData = JSON.parse(content);
        // 确保数据结构完整
        this.data = {
          auth: parsedData.auth,
          sessions: parsedData.sessions || {},
          panels: parsedData.panels || {} as Record<PanelType, any>,
        };
      } else {
        this.data = {
          sessions: {},
          panels: {} as Record<PanelType, any>,
        };
      }
    } catch (error) {
      this.ctx.logger.warn('加载存储文件失败，使用默认数据:', error);
      this.data = {
        sessions: {},
        panels: {} as Record<PanelType, any>,
      };
    }
  }

  /**
   * 保存数据到文件
   */
  private saveData() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      this.ctx.logger.error('保存存储文件失败:', error);
      throw error;
    }
  }

  /**
   * 设置 2FA 密钥
   */
  setTwoFASecret(secret: string) {
    this.data.auth = {
      secret,
      createdAt: Date.now(),
    };
    this.saveData();
  }

  /**
   * 获取 2FA 密钥
   */
  getTwoFASecret(): string | null {
    return this.data.auth?.secret || null;
  }

  /**
   * 创建会话
   */
  createSession(ttlMs: number): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    this.data.sessions[sessionId] = {
      expiresAt: now + ttlMs,
      createdAt: now,
    };

    // 清理过期会话
    this.cleanExpiredSessions();
    this.saveData();

    return sessionId;
  }

  /**
   * 验证会话是否有效
   */
  isValidSession(sessionId: string): boolean {
    const session = this.data.sessions[sessionId];
    if (!session) return false;

    const now = Date.now();
    if (now > session.expiresAt) {
      delete this.data.sessions[sessionId];
      this.saveData();
      return false;
    }

    return true;
  }

  /**
   * 清理过期会话
   */
  private cleanExpiredSessions() {
    const now = Date.now();
    let hasExpired = false;

    for (const [sessionId, session] of Object.entries(this.data.sessions)) {
      if (now > session.expiresAt) {
        delete this.data.sessions[sessionId];
        hasExpired = true;
      }
    }

    if (hasExpired) {
      this.saveData();
    }
  }

  /**
   * 绑定面板配置
   */
  bindPanelKey(type: PanelType, url: string, key: string) {
    this.data.panels[type] = {
      url,
      key,
      updatedAt: Date.now(),
    };
    this.saveData();
  }

  /**
   * 获取面板配置
   */
  getPanel(type?: PanelType): { url: string; key: string } | null {
    // 如果没有指定类型，返回第一个可用的面板
    if (!type) {
      const panels = Object.values(this.data.panels);
      return panels.length > 0 ? panels[0] : null;
    }

    const panel = this.data.panels[type];
    return panel ? { url: panel.url, key: panel.key } : null;
  }
}
