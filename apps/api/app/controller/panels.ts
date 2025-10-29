import { Controller } from 'egg'
import type { Context } from 'egg'

/**
 * PanelsController - 代理面板设置
 *
 * 专门用于设置代理面板配置的控制器：
 * - `create`：设置代理面板配置
 * @controller Panels
 */
export default class PanelsController extends Controller {
	/**
	 * 设置代理面板配置
	 * @summary 设置代理面板配置
	 * @description 设置代理面板的配置信息，包括面板类型、地址和密钥
	 * @router post /api/v1/panels/set_proxy_panel
	 */
	async create(ctx: Context) {
		// 定义验证规则
		const createRule = {
			type: { type: 'enum', values: ['bt', '1panel'] },
			url: 'string',
			key: 'string',
		}

		try {
			// 验证请求参数
			;(ctx as any).validate(createRule, ctx.request.body)

			const { type, url, key } = ctx.request.body as {
				type: string
				url: string
				key: string
			}

			await ctx.service.proxy.bindPanelKey(type, url, key)

			const panelConfig = {
				id: 'default',
				type,
				url,
				key,
				createdAt: new Date().toISOString(),
			}

			ctx.success(panelConfig, '代理面板配置设置成功', 201)
		} catch (error: any) {
			if (error.code === 'invalid_param') {
				ctx.validationError('参数验证失败', JSON.stringify(error.errors))
			} else {
				ctx.logger.error('设置代理面板配置失败:', error)
				const errorMessage = error instanceof Error ? error.message : String(error)
				ctx.internalError('设置代理面板配置失败', errorMessage)
			}
		}
	}
}
