import { Inject, HTTPController, HTTPMethod, HTTPMethodEnum, HTTPQuery } from '@eggjs/tegg';
import { HelloService } from '@/module/foo';

@HTTPController({
  path: '/bar',
})
/**
 * UserController
 *
 * 提供 `/bar/user` 路由，读取查询参数 `userId` 并返回问候语。
 * 依赖 `HelloService` 完成业务逻辑，示例化 tegg 模块间调用。
 */
export class UserController {
  @Inject()
  private helloService: HelloService;

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: 'user',
  })
  /**
   * 根据 `userId` 返回问候语。
   *
   * @param {string} userId - 用户标识（来自查询参数）
   * @returns {Promise<string>} - 问候语，如 `hello, <userId>`
   */
  async user(@HTTPQuery({ name: 'userId' }) userId: string) {
    return await this.helloService.hello(userId);
  }
}
