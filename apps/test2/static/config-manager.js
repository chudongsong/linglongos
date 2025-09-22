// config-manager.js
// 配置管理模块 - 采用函数式编程范式

/**
 * 默认桌面设置配置
 * @returns {Object} 默认桌面设置对象
 */
const getDefaultDesktopSettings = () => ({
  desktop: {
    gridSize: {
      small: { width: 75, height: 90, gap: 5 },
      medium: { width: 100, height: 120, gap: 5 },
      large: { width: 125, height: 150, gap: 5 }
    },
    padding: 10,
    iconSize: "medium",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      size: "cover",
      position: "center",
      repeat: "no-repeat"
    },
    theme: {
      iconTextColor: "#ffffff",
      iconTextShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
      selectionColor: "rgba(74, 144, 226, 0.3)",
      selectionBorder: "#4a90e2"
    }
  },
  layout: {
    autoArrange: true,
    snapToGrid: true,
    allowOverlap: false
  },
  hotReload: {
    enabled: false,
    interval: 1000
  }
});

/**
 * 默认应用配置
 * @returns {Object} 默认应用配置对象
 */
const getDefaultAppsConfig = () => ({
  apps: [],
  categories: {},
  startup: {
    autoStart: [],
    delay: 2000
  }
});

/**
 * 创建HTTP请求函数
 * @param {string} url - 请求URL
 * @returns {Promise<Response>} HTTP响应Promise
 */
const fetchConfig = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};

/**
 * 安全地解析JSON响应
 * @param {Response} response - HTTP响应对象
 * @returns {Promise<Object>} 解析后的JSON对象
 */
const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`JSON解析失败: ${error.message}`);
  }
};

/**
 * 加载桌面设置配置
 * @param {string} configPath - 配置文件路径
 * @returns {Promise<Object>} 桌面设置配置对象
 */
const loadDesktopSettings = async (configPath = './static/json/desktop-settings.json') => {
  try {
    const response = await fetchConfig(configPath);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('加载桌面设置失败:', error);
    return getDefaultDesktopSettings();
  }
};

/**
 * 加载应用配置
 * @param {string} configPath - 配置文件路径
 * @returns {Promise<Object>} 应用配置对象
 */
const loadAppsConfig = async (configPath = './static/json/apps-config.json') => {
  try {
    const response = await fetchConfig(configPath);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('加载应用配置失败:', error);
    return getDefaultAppsConfig();
  }
};

/**
 * 合并桌面和应用配置
 * @param {Object} desktopSettings - 桌面设置
 * @param {Object} appsConfig - 应用配置
 * @returns {Object} 合并后的配置对象
 */
const mergeConfigs = (desktopSettings, appsConfig) => ({
  desktop: desktopSettings.desktop,
  layout: desktopSettings.layout,
  hotReload: desktopSettings.hotReload,
  apps: appsConfig.apps,
  categories: appsConfig.categories,
  startup: appsConfig.startup
});

/**
 * 并行加载所有配置
 * @param {string} desktopConfigPath - 桌面配置文件路径
 * @param {string} appsConfigPath - 应用配置文件路径
 * @returns {Promise<Object>} 合并后的完整配置对象
 */
const loadAllConfigs = async (
  desktopConfigPath = './static/json/desktop-settings.json',
  appsConfigPath = './static/json/apps-config.json'
) => {
  const [desktopSettings, appsConfig] = await Promise.all([
    loadDesktopSettings(desktopConfigPath),
    loadAppsConfig(appsConfigPath)
  ]);
  
  return mergeConfigs(desktopSettings, appsConfig);
};

/**
 * 验证配置对象的完整性
 * @param {Object} config - 配置对象
 * @returns {boolean} 配置是否有效
 */
const validateConfig = (config) => {
  const requiredKeys = ['desktop', 'layout', 'apps'];
  return requiredKeys.every(key => config && typeof config[key] !== 'undefined');
};

/**
 * 获取网格尺寸配置
 * @param {Object} config - 桌面配置
 * @param {string} iconSize - 图标尺寸
 * @returns {Object} 网格尺寸对象
 */
const getGridSize = (config, iconSize = 'medium') => {
  return config?.desktop?.gridSize?.[iconSize] || {
    width: 100,
    height: 120,
    gap: 5
  };
};

/**
 * 获取桌面内边距
 * @param {Object} config - 桌面配置
 * @returns {number} 内边距值
 */
const getDesktopPadding = (config) => {
  return config?.desktop?.padding || 10;
};

/**
 * 检查是否启用自动排列
 * @param {Object} config - 桌面配置
 * @returns {boolean} 是否启用自动排列
 */
const isAutoArrangeEnabled = (config) => {
  return config?.layout?.autoArrange || false;
};

/**
 * 获取自动启动应用列表
 * @param {Object} config - 桌面配置
 * @returns {Array} 自动启动应用ID数组
 */
const getAutoStartApps = (config) => {
  return config?.startup?.autoStart || [];
};

/**
 * 获取启动延迟时间
 * @param {Object} config - 桌面配置
 * @returns {number} 延迟时间(毫秒)
 */
const getStartupDelay = (config) => {
  return config?.startup?.delay || 2000;
};

/**
 * 创建配置更新检查器
 * @param {Object} hotReloadConfig - 热重载配置
 * @param {Function} onConfigUpdate - 配置更新回调函数
 * @returns {Function} 停止检查的函数
 */
const createConfigWatcher = (hotReloadConfig, onConfigUpdate) => {
  if (!hotReloadConfig?.enabled) {
    return () => {}; // 返回空函数
  }

  let lastModified = {
    desktop: null,
    apps: null
  };

  const checkForUpdates = async () => {
    try {
      const [desktopResponse, appsResponse] = await Promise.all([
        fetch('./static/json/desktop-settings.json').catch(() => null),
        fetch('./static/json/apps-config.json').catch(() => null)
      ]);

      if (desktopResponse?.ok && appsResponse?.ok) {
        const desktopLastModified = desktopResponse.headers.get('Last-Modified');
        const appsLastModified = appsResponse.headers.get('Last-Modified');

        if ((lastModified.desktop && lastModified.desktop !== desktopLastModified) ||
            (lastModified.apps && lastModified.apps !== appsLastModified)) {
          console.log('检测到配置文件更新，重新加载...');
          const newConfig = await loadAllConfigs();
          onConfigUpdate(newConfig);
        }

        lastModified.desktop = desktopLastModified;
        lastModified.apps = appsLastModified;
      }
    } catch (error) {
      console.debug('热重载检查:', error.message);
    }
  };

  const intervalId = setInterval(checkForUpdates, hotReloadConfig.interval || 1000);
  console.log(`配置热重载已启用，检查间隔: ${hotReloadConfig.interval || 1000}ms`);

  // 返回停止函数
  return () => clearInterval(intervalId);
};

/**
 * 根据ID查找应用
 * @param {Object} config - 配置对象
 * @param {string} appId - 应用ID
 * @returns {Object|null} 应用对象
 */
const findAppById = (config, appId) => {
  if (!config?.apps) return null;
  return config.apps.find(app => app.id === appId) || null;
};

/**
 * 根据 position 排序应用
 * @param {Array} apps - 应用数组
 * @returns {Array} 排序后的应用数组
 */
const sortAppsByPosition = (apps) => {
  if (!Array.isArray(apps)) return [];
  return [...apps].sort((a, b) => {
    if (a.position?.row !== b.position?.row) return (a.position?.row || 0) - (b.position?.row || 0);
    return (a.position?.col || 0) - (b.position?.col || 0);
  });
};

/**
 * 创建配置管理器
 * @param {string} desktopConfigPath - 桌面配置文件路径
 * @param {string} appsConfigPath - 应用配置文件路径
 * @returns {Object} 配置管理器对象
 */
const createConfigManager = (
  desktopConfigPath = './static/json/desktop-settings.json',
  appsConfigPath = './static/json/apps-config.json'
) => {
  let currentConfig = null;
  let stopWatcher = () => {};

  const load = async () => {
    currentConfig = await loadAllConfigs(desktopConfigPath, appsConfigPath);
    return currentConfig;
  };

  const startWatching = (hotReloadConfig, onUpdate) => {
    stopWatcher();
    stopWatcher = createConfigWatcher(hotReloadConfig, (newConfig) => {
      currentConfig = newConfig;
      if (onUpdate) onUpdate(newConfig);
    });
    return stopWatcher;
  };

  const get = () => currentConfig;

  return { load, get, startWatching };
};

export {
  getDefaultDesktopSettings,
  getDefaultAppsConfig,
  fetchConfig,
  parseJsonResponse,
  loadDesktopSettings,
  loadAppsConfig,
  mergeConfigs,
  loadAllConfigs,
  validateConfig,
  getGridSize,
  getDesktopPadding,
  isAutoArrangeEnabled,
  getAutoStartApps,
  getStartupDelay,
  createConfigWatcher,
  findAppById,
  sortAppsByPosition,
  createConfigManager
};