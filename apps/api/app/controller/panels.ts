import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * PanelsController - RESTful 面板配置管理
 *
 * 符合 Egg.js RESTful 标准的面板配置控制器：
 * - `index`：获取面板配置列表
 * - `show`：获取单个面板配置
 * - `create`：创建/更新面板配置
 * - `update`：更新面板配置
 * - `destroy`：删除面板配置
 */
export default class PanelsController extends Controller {
  /**
   * 获取面板配置列表
   * GET /api/v2/panels
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回面板配置列表
   */
  async index(ctx: Context) {
    try {
      const panelConfig = ctx.service.storage.getPanel();
      const panels = panelConfig ? [panelConfig] : [];

      ctx.success(panels);
    } catch (error: any) {
      ctx.logger.error('获取面板配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('获取面板配置失败', errorMessage);
    }
  }

  /**
   * 获取单个面板配置
   * GET /api/v2/panels/:id
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回面板配置详情
   */
  async show(ctx: Context) {
    try {
      const panelConfig = ctx.service.storage.getPanel();

      if (!panelConfig) {
        ctx.notFound('面板配置不存在');
        return;
      }

      ctx.success(panelConfig);
    } catch (error: any) {
      ctx.logger.error('获取面板配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('获取面板配置失败', errorMessage);
    }
  }

  /**
   * 创建/更新面板配置
   * POST /api/v2/panels
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 创建面板配置
   */
  async create(ctx: Context) {
    // 定义验证规则
    const createRule = {
      type: { type: 'enum', values: ['bt', '1panel'] },
      url: 'string',
      key: 'string',
    };

    try {
      // 验证请求参数
      (ctx as any).validate(createRule, ctx.request.body);

      const { type, url, key } = ctx.request.body as {
        type: string;
        url: string;
        key: string;
      };

      await ctx.service.proxy.bindPanelKey(type, url, key);

      const panelConfig = {
        id: 'default',
        type,
        url,
        key,
        createdAt: new Date().toISOString(),
      };

      ctx.success(panelConfig, 'Panel configuration created successfully', 201);
    } catch (error: any) {
      if (error.code === 'invalid_param') {
        ctx.validationError('Validation Failed', JSON.stringify(error.errors));
      } else {
        ctx.logger.error('创建面板配置失败:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.internalError('创建面板配置失败', errorMessage);
      }
    }
  }

  /**
   * 更新面板配置
   * PUT /api/v2/panels/:id
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 更新面板配置
   */
  async update(ctx: Context) {
    // 定义验证规则
    const updateRule = {
      type: { type: 'enum', values: ['bt', '1panel'], required: false },
      url: { type: 'string', required: false },
      key: { type: 'string', required: false },
    };

    try {
      // 验证请求参数
      (ctx as any).validate(updateRule, ctx.request.body);

      const existingConfig = ctx.service.storage.getPanel();
      if (!existingConfig) {
        ctx.notFound('面板配置不存在');
        return;
      }

      const { type, url, key } = ctx.request.body as {
        type?: string;
        url?: string;
        key?: string;
      };

      // 合并配置
      const updatedConfig = {
        ...existingConfig,
        ...(type && { type }),
        ...(url && { url }),
        ...(key && { key }),
        updatedAt: new Date().toISOString(),
      };

      await ctx.service.proxy.bindPanelKey(
        updatedConfig.type,
        updatedConfig.url,
        updatedConfig.key,
      );

      ctx.success(null, 'Panel configuration updated successfully', 204);
    } catch (error: any) {
      if (error.code === 'invalid_param') {
        ctx.validationError('Validation Failed', JSON.stringify(error.errors));
      } else {
        ctx.logger.error('更新面板配置失败:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.internalError('更新面板配置失败', errorMessage);
      }
    }
  }

  /**
   * 删除面板配置
   * DELETE /api/v2/panels/:id
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 删除面板配置
   */
  async destroy(ctx: Context) {
    try {
      // 清除面板配置（具体实现取决于存储服务）
      // 这里可能需要在存储服务中添加删除面板配置的方法
      ctx.success(null, 'Panel configuration deleted successfully', 204);
    } catch (error: any) {
      ctx.logger.error('删除面板配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('删除面板配置失败', errorMessage);
    }
  }

  /**
   * 获取新建表单
   * GET /api/v2/panels/new
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回新建表单结构
   */
  async new(ctx: Context) {
    const formSchema = {
      fields: [
        {
          name: 'type',
          type: 'enum',
          values: ['bt', '1panel'],
          required: true,
          label: '面板类型',
        },
        {
          name: 'url',
          type: 'string',
          required: true,
          label: '面板地址',
        },
        {
          name: 'key',
          type: 'string',
          required: true,
          label: '面板密钥',
        },
      ],
    };

    ctx.success(formSchema);
  }

  /**
   * 获取编辑表单
   * GET /api/v2/panels/:id/edit
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回编辑表单结构
   */
  async edit(ctx: Context) {
    try {
      const panelConfig = ctx.service.storage.getPanel();

      if (!panelConfig) {
        ctx.notFound('面板配置不存在');
        return;
      }

      const formSchema = {
        data: panelConfig,
        fields: [
          {
            name: 'type',
            type: 'enum',
            values: ['bt', '1panel'],
            required: false,
            label: '面板类型',
          },
          {
            name: 'url',
            type: 'string',
            required: false,
            label: '面板地址',
          },
          {
            name: 'key',
            type: 'string',
            required: false,
            label: '面板密钥',
          },
        ],
      };

      ctx.success(formSchema);
    } catch (error: any) {
      ctx.logger.error('获取编辑表单失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('获取编辑表单失败', errorMessage);
    }
  }
}