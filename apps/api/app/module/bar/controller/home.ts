import { EggLogger } from 'egg';
import { Inject, HTTPController, HTTPMethod, HTTPMethodEnum } from '@eggjs/tegg';

@HTTPController({
  path: '/',
})
/**
 * HomeController
 *
 * 提供根路径 `/` 的简单文本响应。
 * 使用 `@HTTPController` 和 `@HTTPMethod` 将类方法暴露为 HTTP 路由。
 */
export class HomeController {
  @Inject()
  private logger: EggLogger;

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: '/',
  })
  /**
   * 根路径首页，返回简单文本。
   *
   * @returns {Promise<string>} - 文本响应 `hello egg`
   */
  async index() {
    this.logger.info('hello egg logger');
    return 'hello egg';
  }
}
