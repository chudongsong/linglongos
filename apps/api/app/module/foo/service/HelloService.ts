import { EggLogger } from 'egg';
import { SingletonProto, AccessLevel, Inject } from '@eggjs/tegg';

@SingletonProto({
  // 如果需要在上层使用，需要把 accessLevel 显示声明为 public
  accessLevel: AccessLevel.PUBLIC,
})
/**
 * HelloService
 *
 * 提供基础问候语的业务能力。
 * - 通过 `@SingletonProto` 声明为可复用的单例服务；
 * - `AccessLevel.PUBLIC` 允许在模块外部被使用；
 * - 依赖注入 `EggLogger` 记录调用日志。
 */
export class HelloService {
  // 注入一个 logger
  @Inject()
  private logger: EggLogger;

  /**
   * 返回问候语。
   *
   * @param {string} userId - 用户标识
   * @returns {Promise<string>} - 问候语，如 `hello, <userId>`
   */
  async hello(userId: string): Promise<string> {
    const result = { userId, handledBy: 'foo module' };
    this.logger.info('[hello] get result: %j', result);
    return `hello, ${result.userId}`;
  }
}
