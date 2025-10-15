import { EggAppConfig, PowerPartial } from 'egg';

/**
 * 单元测试环境配置覆盖。
 *
 * @returns {PowerPartial<EggAppConfig>} - 覆盖配置（当前为空，按需添加）
 */
export default () => {
  const config = {} as PowerPartial<EggAppConfig>;
  return config;
};
