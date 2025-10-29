import { EggPlugin } from 'egg'

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
		package: '@eggjs/tegg-plugin', // 开启 Tegg 插件，提供模块化、控制器、定时任务、事件总线、AOP 等能力
	},
	teggConfig: {
		enable: true,
		package: '@eggjs/tegg-config', // 开启 Tegg 配置插件，提供配置中心、环境变量、加密解密等能力
	},
	teggController: {
		enable: true,
		package: '@eggjs/tegg-controller-plugin', // 开启 Tegg 控制器插件，提供路由、参数校验、异常处理等能力
	},
	teggSchedule: {
		enable: true,
		package: '@eggjs/tegg-schedule-plugin', // 开启 Tegg 定时任务插件，提供定时任务调度、日志记录等能力
	},
	eventbusModule: {
		enable: true,
		package: '@eggjs/tegg-eventbus-plugin', // 开启 Tegg 事件总线插件，提供事件发布、订阅、路由等能力
	},
	aopModule: {
		enable: true,
		package: '@eggjs/tegg-aop-plugin', // 开启 Tegg AOP 插件，提供切面编程、动态代理等能力
	},
	tracer: {
		enable: true,
		package: '@eggjs/tracer', // 开启链路追踪插件，提供请求上下文、日志记录等能力
	},
	cors: {
		enable: true,
		package: 'egg-cors', // 开启跨域资源共享插件，允许跨域请求
	},
	validate: {
		enable: true,
		package: 'egg-validate', // 开启参数校验插件，提供参数校验功能
	},
	swaggerdoc: {
		enable: true,
		package: 'egg-swagger-doc', // 开启 Swagger 文档插件，提供 API 文档生成功能
	},
}

export default plugin
