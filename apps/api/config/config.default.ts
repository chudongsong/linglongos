import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

/**
 * 默认环境配置
 *
 * @param {EggAppInfo} appInfo - Egg 应用信息（包含 `baseDir` 等）
 * @returns {PowerPartial<EggAppConfig> & { bizConfig: { sourceUrl: string } }} - 合并后的配置对象
 */
export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  /**
   * Cookie 签名密钥（请在生产环境替换为安全随机值）。
   */
  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1760359306254_6249';

  // add your egg config in here
  /**
   * 全局中间件顺序：`common` → `auth` → `bt`
   *
   * - `auth.ignore`：忽略认证的路由（正则形式）；
   * - `bt.match`：限定 BT 中间件仅在代理请求路由生效；
   * - `common`：通用中间件（当前为空配置）。
   */
  config.middleware = [ 'common', 'auth', 'bt' ];
  (config as any).auth = {
    ignore: [/^\/api\/v1\/auth\//, /^\/public\//, /^\/ui$/, /^\/api\/v1\/docs\//],
  };
  (config as any).bt = {
    match: [/^\/api\/v1\/proxy\/request/],
  };
  (config as any).common = {};

  /**
   * 安全配置：关闭 CSRF（典型 API 场景）。
   */
  (config as any).security = {
    csrf: { enable: false },
  };

  /**
   * SQLite 数据库路径。
   */
  (config as any).sqlite = {
    path: `${appInfo.baseDir}/data/api.db`,
  };

  // change multipart mode to file
  // @see https://github.com/eggjs/multipart/blob/master/src/config/config.default.ts#L104
  /**
   * 多文件上传模式。
   */
  config.multipart = {
    mode: 'file',
  };

  // add your special config in here
  // Usage: `app.config.bizConfig.sourceUrl`
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    bizConfig,
  };
};
