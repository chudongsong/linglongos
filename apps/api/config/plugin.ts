import { EggPlugin } from 'egg';

/**
 * Egg 插件配置
 *
 * 启用 Tegg 系列插件与 tracer：
 * - `@eggjs/tegg-*`：模块化、控制器、定时任务、事件总线、AOP 等能力；
 * - `@eggjs/tracer`：链路追踪。
 *
 * @type {EggPlugin}
 */
const plugin: EggPlugin = {
  tegg: {
    enable: true,
    package: '@eggjs/tegg-plugin',
  },
  teggConfig: {
    enable: true,
    package: '@eggjs/tegg-config',
  },
  teggController: {
    enable: true,
    package: '@eggjs/tegg-controller-plugin',
  },
  teggSchedule: {
    enable: true,
    package: '@eggjs/tegg-schedule-plugin',
  },
  eventbusModule: {
    enable: true,
    package: '@eggjs/tegg-eventbus-plugin',
  },
  aopModule: {
    enable: true,
    package: '@eggjs/tegg-aop-plugin',
  },
  tracer: {
    enable: true,
    package: '@eggjs/tracer',
  },
};

export default plugin;
