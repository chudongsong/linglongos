/**
 * 代理配置类型定义
 *
 * 定义支持的面板类型和绑定信息结构。
 */

/**
 * 支持的面板类型
 *
 * - 'bt': 宝塔面板
 * - '1panel': 1Panel 面板
 */
export type PanelType = 'bt' | '1panel';

/**
 * 面板绑定信息接口
 *
 * 包含访问面板所需的基本信息。
 */
export interface PanelBinding {
  /** 面板访问地址，包含协议、域名/IP 和端口 */
  url: string;
  /** 面板 API 密钥，用于身份验证 */
  key: string;
}
