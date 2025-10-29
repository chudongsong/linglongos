import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import * as path from 'path';

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
   * 全局中间件顺序：`requestId` → `errorHandler` → `common` → `staticAuth` → `staticFiles` → `auth` → `bt`
   *
   * - `requestId`：请求ID生成中间件（用于日志追踪和响应标识）；
   * - `errorHandler`：全局错误处理中间件；
   * - `staticAuth`：静态页面会话验证中间件（在静态文件服务之前）；
   * - `staticFiles`：静态资源服务中间件；
   * - `auth.ignore`：忽略认证的路由（正则形式）；
   * - `bt.match`：限定 BT 中间件仅在代理请求路由生效；
   * - `common`：通用中间件（当前为空配置）。
   */
  config.middleware = [ 'requestId', 'errorHandler', 'common', 'staticAuth', 'staticFiles', 'auth', 'bt' ];
  (config as any).staticAuth = {
    // 静态页面会话验证中间件配置
    // 该中间件会在静态文件服务之前运行，对HTML页面进行会话验证
  };
  (config as any).staticFiles = {
    root: path.join(appInfo.baseDir, 'app/public'),
    allowedExtensions: [
      '.html', '.htm', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.md',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.woff', '.woff2', '.ttf', '.eot',
      '.pdf', '.zip', '.tar', '.gz',
    ],
    maxAge: 86400, // 1天缓存
    gzip: true,
    etag: true,
    match: [/^\/public\//, /^\/static\//], // 只处理 /public/ 和 /static/ 路径的静态资源请求
  };
  (config as any).auth = {
    ignore: [/^\/api\/v1\/auth\//, /^\/public\//, /^\/ui$/, /^\/api\/v1\/docs\//, /^\/.*\.(css|js|html|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf|zip|tar|gz|json|xml|txt|md)$/],
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
   * CORS 配置：允许跨域请求
   */
  (config as any).cors = {
    origin: '*', // 允许所有域名，生产环境应该限制为具体域名
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    credentials: true, // 允许携带凭证
  };

  /**
   * Swagger API 文档配置
   */
  (config as any).swaggerdoc = {
    dirScanner: './app/controller',
    apiInfo: {
      title: 'LinglongOS API',
      description: '统一面板代理与认证服务 API - 符合动词+宾语命名规范',
      version: '1.0.0',
      termsOfService: '',
      contact: {
        email: 'api@linglongos.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Bearer token for authentication',
      },
    },
    enableSecurity: true,
    routerMap: true,
    enable: true,
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
