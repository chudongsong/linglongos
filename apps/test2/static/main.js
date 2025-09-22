// main.js
// 主入口文件 - 使用函数组合协调各模块

import {
  createLoadingManager,
  queryLoadingElements,
  createProgressUpdater
} from "./loading-manager.js";

import {
  loadAllConfigs,
  validateConfig,
  getGridSize,
  getDesktopPadding,
  isAutoArrangeEnabled,
  createConfigWatcher,
} from "./config-manager.js";

import {
  safeQuerySelector,
  waitForDOMReady,
  clearContainer,
  setStyles,
} from "./dom-utils.js";

import {
  renderIcons,
  autoArrangeIcons,
  createGridBackground,
  calculateDesktopGridSize,
} from "./desktop-renderer.js";

import {
  createDragHandler,
  createKeyboardHandler,
  createResizeHandler,
  createContextMenuHandler,
} from "./event-handlers.js";
import { createContextMenuManager } from "./context-menu.js";
// 新增：引入 Dock 渲染与交互初始化
import { initDockInteractions, renderDockFromConfig } from "./dock.js";
import { initStartMenu, rerenderStartMenu, destroyStartMenu } from "./start-menu.js";
import { initWindowManager, openAppWindow, minimizeWindow, restoreWindow, focusWindow } from "./window-manager.js";

/**
 * 应用状态管理
 */
let appState = {
  config: null,
  icons: [],
  isLoaded: false,
  eventCleanupFunctions: [],
};

/**
 * 更新应用状态
 * @param {Object} updates - 状态更新对象
 * @returns {Object} 新的应用状态
 */
const updateAppState = (updates) => {
  appState = { ...appState, ...updates };
  return appState;
};

/**
 * 获取应用状态
 * @returns {Object} 当前应用状态
 */
const getAppState = () => ({ ...appState });

/**
 * 本地回退：隐藏加载覆盖层
 * @param {{overlay:HTMLElement}} elements - 加载UI元素集合
 */
const localHideOverlay = (elements) => {
  if (!elements?.overlay) return;
  elements.overlay.classList.add('fade-out');
  setTimeout(() => {
    elements.overlay.style.display = 'none';
  }, 350);
};

/**
 * 初始化加载进度（新版）：创建并初始化加载管理器，必要时回退到简化实现
 * @returns {Promise<{init:Function, finish:Function, update:Function}>}
 */
const initializeLoadingProgress = async () => {
  try {
    if (typeof createLoadingManager === 'function') {
      const manager = createLoadingManager();
      if (manager && typeof manager.init === 'function') {
        await manager.init();
        return manager;
      }
    }
  } catch (e) {
    console.debug('加载管理器初始化失败，使用回退方案:', e?.message || e);
  }

  // 回退方案：最小化进度与隐藏
  const elements = queryLoadingElements();
  const update = createProgressUpdater(elements);
  update(95);
  return {
    /** 回退 init，无动作 */
    init: async () => {},
    /** 回退 finish：推进到100并隐藏遮罩 */
    finish: () => { update(100); localHideOverlay(elements); },
    /** 回退 update：直接委派 */
    update,
  };
};

/**
 * 加载应用配置（新版）
 * 使用配置管理器并验证配置
 * @returns {Promise<Object>} 配置对象
 */
const loadAppConfiguration = async () => {
  try {
    const config = await loadAllConfigs();

    if (!validateConfig(config)) {
      throw new Error("配置文件验证失败");
    }

    updateAppState({ config });
    return config;
  } catch (error) {
    console.warn("加载配置失败:", error);
    throw error;
  }
};

/**
 * 基于配置计算网格对象
 * @param {Object} config - 完整配置对象
 * @returns {{width:number,height:number,gap:number,padding:number}} 网格对象
 */
const computeGridObject = (config) => {
  const iconSize = config?.desktop?.iconSize || "medium";
  const base = getGridSize(config, iconSize);
  const padding = getDesktopPadding(config);
  return { ...base, padding };
};

/**
 * 解析与修复图标网格位置
 * - 优先使用 apps-config.json 中的 position(row/col)
 * - 若缺失、无效或与已占用位置冲突，则按桌面网格的行优先顺序补位
 * - 确保所有图标拥有唯一的 gridX/gridY 坐标并尽量落于桌面范围内
 * @param {Array<{id:string,name:string,icon:string,url?:string,gridX?:number,gridY?:number}>} iconsData 初始图标数据
 * @param {HTMLElement} container 桌面容器
 * @param {{width:number,height:number,gap:number,padding:number}} grid 网格参数
 * @returns {Array} 位置修复后的图标数据
 */
const resolveIconPositions = (iconsData, container, grid) => {
  const { cols, rows } = calculateDesktopGridSize(container, grid);
  const total = Math.max(cols * rows, iconsData.length);

  // 生成候选位置列表（行优先），最少覆盖当前桌面容量，若图标更多则继续向下扩展行数
  const candidates = [];
  const ensureRowCount = Math.ceil(total / Math.max(1, cols));
  for (let gy = 0; gy < ensureRowCount; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      candidates.push(`${gx},${gy}`);
    }
  }

  const taken = new Set();
  const result = iconsData.map(icon => ({ ...icon }));

  // 第一遍：占用有效且不冲突的位置
  result.forEach((icon, idx) => {
    const gx = Number.isFinite(icon.gridX) ? icon.gridX : null;
    const gy = Number.isFinite(icon.gridY) ? icon.gridY : null;
    const key = `${gx},${gy}`;
    const inBounds = gx !== null && gy !== null && gx >= 0 && gy >= 0 && gx < cols && gy < rows;
    if (inBounds && !taken.has(key)) {
      taken.add(key);
    } else {
      // 标记为需要分配
      result[idx].gridX = null;
      result[idx].gridY = null;
    }
  });

  // 第二遍：为未分配的图标寻找第一个可用候选
  let candIndex = 0;
  result.forEach((icon) => {
    if (icon.gridX === null || icon.gridY === null) {
      // 找到下一个未被占用的候选
      while (candIndex < candidates.length && taken.has(candidates[candIndex])) {
        candIndex++;
      }
      if (candIndex >= candidates.length) {
        // 若候选用尽，按列数继续扩展新行
        const gy = Math.floor(candIndex / Math.max(1, cols));
        const gx = candIndex % Math.max(1, cols);
        icon.gridX = gx;
        icon.gridY = gy;
        candIndex++;
      } else {
        const [gxStr, gyStr] = candidates[candIndex].split(',');
        icon.gridX = parseInt(gxStr, 10);
        icon.gridY = parseInt(gyStr, 10);
        taken.add(candidates[candIndex]);
        candIndex++;
      }
    }
  });

  return result;
};

/**
 * 初始化桌面环境
 * @param {Object} config - 配置对象
 * @returns {HTMLElement} 桌面容器元素
 */
const initializeDesktop = (config) => {
  const desktopContainer = safeQuerySelector(".desktop-container");
  if (!desktopContainer) {
    throw new Error("桌面容器未找到");
  }

  // 清空桌面容器
  clearContainer(desktopContainer);

  // 计算网格对象
  const grid = computeGridObject(config);

  // 新增：将网格参数同步到容器 CSS 变量，驱动纯 CSS 尺寸联动
  const size = (config?.desktop?.iconSize || 'medium').toLowerCase();
  desktopContainer.style.setProperty('--grid-width', `${grid.width}px`);
  desktopContainer.style.setProperty('--grid-height', `${grid.height}px`);
  desktopContainer.style.setProperty('--grid-gap', `${grid.gap}px`);
  desktopContainer.style.setProperty('--grid-padding', `${grid.padding}px`);

  // 设置尺寸类（便于在 CSS 中按档位微调比例）
  desktopContainer.classList.remove('size-small', 'size-medium', 'size-large');
  if (size === 'small') desktopContainer.classList.add('size-small');
  else if (size === 'large') desktopContainer.classList.add('size-large');
  else desktopContainer.classList.add('size-medium');

  // 创建/更新网格背景（不强制显示网格线）
  createGridBackground(desktopContainer, grid, false);

  return desktopContainer;
};

/**
 * 渲染桌面图标（新版）
 * 从 apps 映射到渲染所需数据
 * @param {Object} config - 配置对象
 * @param {HTMLElement} desktopContainer - 桌面容器
 * @returns {Array} 渲染的图标元素数组
 */
const renderDesktopIcons = (config, desktopContainer) => {
  const apps = Array.isArray(config?.apps) ? config.apps : [];
  const grid = computeGridObject(config);

  let iconsData = apps.map((app) => {
    const row = parseInt(app?.position?.row ?? 0, 10);
    const col = parseInt(app?.position?.col ?? 0, 10);
    const action = app?.action || {};
    const url = typeof action?.url === "string" ? action.url : "";
    return {
      id: app.id,
      name: app.name,
      icon: app.icon,
      url,
      gridX: Number.isFinite(col) ? col : null,
      gridY: Number.isFinite(row) ? row : null,
    };
  });

  // 自动排列（仅在启用且所有应用都未显式提供 position 时触发）
  const hasAnyExplicitPosition = apps.some((app) => {
    const r = parseInt(app?.position?.row, 10);
    const c = parseInt(app?.position?.col, 10);
    return Number.isFinite(r) && Number.isFinite(c);
  });
  if (isAutoArrangeEnabled(config) && !hasAnyExplicitPosition) {
    iconsData = autoArrangeIcons(iconsData, desktopContainer, grid);
  } else {
    // 解析与修复位置，避免缺失/冲突
    iconsData = resolveIconPositions(iconsData, desktopContainer, grid);
  }

  // 渲染图标
  const iconElements = renderIcons(iconsData, desktopContainer, grid);

  updateAppState({ icons: iconsData });

  return iconElements;
};

/**
 * 初始化事件处理
 * @param {HTMLElement} desktopContainer - 桌面容器
 * @param {Object} config - 配置对象
 * @returns {Array} 事件清理函数数组
 */
const initializeEventHandlers = (desktopContainer, config) => {
  const grid = computeGridObject(config);

  const cleanupFunctions = [];

  /**
   * 新建桌面图标并将其按点击位置落点到最近的空网格
   * - 自动生成唯一ID
   * - 基于点击事件定位目标网格，并在容器范围内寻找最近的空位
   * - 立即渲染到DOM，并更新应用状态 appState.icons
   * @param {('folder'|'shortcut'|'text')} type 新建类型
   * @param {MouseEvent} clickEvent 触发菜单的鼠标事件，用于定位
   * @returns {void}
   */
  function createNewDesktopIcon(type, clickEvent) {
    try {
      const rect = desktopContainer.getBoundingClientRect();
      const relX = (clickEvent?.clientX ?? (rect.left + rect.width / 2)) - rect.left;
      const relY = (clickEvent?.clientY ?? (rect.top + rect.height / 2)) - rect.top;

      // 计算目标网格位置并限制在容器范围内
      const target = calculateGridPosition(relX, relY, grid);
      const { cols, rows } = calculateDesktopGridSize(desktopContainer, grid);
      let gx = Math.max(0, Math.min(target.gridX, Math.max(0, cols - 1)));
      let gy = Math.max(0, Math.min(target.gridY, Math.max(0, rows - 1)));

      // 现有占用位置
      const occupied = getAllIconPositions(desktopContainer.querySelectorAll('.icon-item'));
      const isOcc = (x, y) => occupied.some(p => p.gridX === x && p.gridY === y);

      // 若被占用则在容器范围内做菱形扩散查找最近空位
      if (isOcc(gx, gy)) {
        let found = false;
        const maxD = Math.max(cols, rows) + 2;
        for (let d = 1; d <= maxD && !found; d++) {
          for (let dx = -d; dx <= d && !found; dx++) {
            for (let dy = -d; dy <= d; dy++) {
              if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue; // 只检查菱形边缘
              const x = gx + dx;
              const y = gy + dy;
              if (x >= 0 && y >= 0 && x < cols && y < rows && !isOcc(x, y)) {
                gx = x; gy = y; found = true; break;
              }
            }
          }
        }
        if (!found) {
          // 兜底：顺序扫描首个空位
          outer: for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              if (!isOcc(x, y)) { gx = x; gy = y; break outer; }
            }
          }
        }
      }

      // 生成不同类型的默认名称与图标（使用内联SVG Data URI，避免新增静态资源文件）
      const uid = `icon_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
      let defName = '新建项目';
      let defUrl = '';
      let defSvg = '';
      if (type === 'folder') {
        defName = '新建文件夹';
        defSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4a1.5 1.5 0 0 1 1.2.6l.6.8c.19.26.5.41.82.41H19.5A1.5 1.5 0 0 1 21 8.3V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" fill="#f0c14b" stroke="#caa032"/></svg>';
      } else if (type === 'shortcut') {
        defName = '新建快捷方式';
        defUrl = 'about:blank';
        defSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none"><path d="M12 4l8 8-8 8" stroke="#62afff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h16" stroke="#62afff" stroke-width="2" stroke-linecap="round"/></svg>';
      } else if (type === 'text') {
        defName = '新建文本文档';
        defSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" fill="#ffffff" stroke="#d0d7de"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#8c959f" stroke-width="1.6" stroke-linecap="round"/></svg>';
      }
      const iconSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(defSvg);

      const finalName = window.prompt('请输入名称', defName) || defName;
      const newIcon = { id: uid, name: finalName, icon: iconSrc, url: defUrl, gridX: gx, gridY: gy };

      // 渲染并更新状态
      renderIcon(newIcon, desktopContainer, grid);
      const state = getAppState();
      updateAppState({ icons: [...state.icons, newIcon] });
      console.log('已新建图标:', newIcon);
    } catch (e) {
      console.warn('新建图标失败:', e);
    }
  }

  // 创建右键菜单管理器（示例：基于角色的权限控制）
  /**
   * 右键菜单管理器实例
   * - getUserRoles: 返回当前用户角色数组
   * - permissionMode: 无权限项处理方式（hide|disable）
   */
  const contextMenu = createContextMenuManager({
    getUserRoles: () => (config?.currentUser?.roles || ["user"]) ,
    permissionMode: "hide",
  });
  cleanupFunctions.push(() => contextMenu.destroy());

  // 拖拽事件处理
  const dragCleanup = createDragHandler(
    desktopContainer,
    {
      /**
       * 拖拽开始回调
       */
      onDragStart: (dragState) => {
        console.log("开始拖拽:", dragState.element.dataset.id);
      },
      /**
       * 拖拽移动回调
       */
      onDragMove: (dragState, event) => {
        // 可添加拖拽过程中的逻辑
      },
      /**
       * 拖拽结束回调
       */
      onDragEnd: (result) => {
        if (result && result.moved) {
          console.log("图标位置已更新:", {
            id: result.element.dataset.id,
            from: result.oldPosition,
            to: result.newPosition,
          });

          // 保存位置变化
          saveIconPosition(result.element.dataset.id, result.newPosition);
        }
      },
      /**
       * 图标双击回调
       */
      onIconDoubleClick: (iconElement, url, event) => {
        // 使用窗口管理器打开窗口，统一体验
        const iconId = iconElement.dataset.id;
        const state = getAppState();
        const icon = state.icons.find(i => i.id === iconId);
        const name = icon?.name || iconElement.querySelector('span')?.textContent || iconId;
        const finalUrl = url || icon?.url;
        if (finalUrl) {
          openAppWindow({ id: `desk-${iconId}`, name, url: finalUrl });
        } else {
          console.log("图标被双击，没有可用的URL:", iconId);
        }
      },
      /**
       * 桌面空白点击
       */
      onDesktopClick: (event) => {
        console.log("桌面空白区域被点击");
      },
    },
    grid
  );

  cleanupFunctions.push(dragCleanup);

  // 键盘事件处理
  const keyboardCleanup = createKeyboardHandler((event) => {
    console.log("按键事件:", event.key);

    // 处理特殊按键
    if (event.key === "F5" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      refreshDesktop();
    }
  });

  cleanupFunctions.push(keyboardCleanup);

  // 窗口大小变化事件处理
  const resizeCleanup = createResizeHandler(() => {
    console.log("窗口大小已变化");
    // 可在此重新计算布局
  });

  cleanupFunctions.push(resizeCleanup);

  // 右键菜单事件处理
  const contextMenuCleanup = createContextMenuHandler(
    desktopContainer,
    (event, iconElement) => {
      const state = getAppState();
      // 构造菜单项（演示：多级菜单 + 权限 + 动态禁用）
      if (iconElement) {
        const iconId = iconElement.dataset.id;
        const app = state.icons.find(i => i.id === iconId);
        const hasUrl = !!app?.url;

        const items = [
          { id: "open", label: "打开", roles: ["user"], disabled: !hasUrl, action: ({target, data}) => { if (hasUrl) openAppWindow({ id: `desk-${iconId}`, name: app?.name || iconId, url: app.url }); } },
          { id: "openWith", label: "打开方式", roles: ["user"], children: [
            { id: "open-browser", label: "浏览器", action: () => { if (hasUrl) window.open(app.url, "_blank"); } },
            { id: "copy-link", label: "复制链接", action: async () => { try { await navigator.clipboard.writeText(app.url || ""); } catch(e){ console.warn("复制失败", e);} } },
          ]},
          { divider: true },
          { id: "rename", label: "重命名", roles: ["admin"], action: ({target}) => { const name = prompt("请输入新的名称", app?.name || ""); if (name) { target.querySelector("span").textContent = name; } } },
          { id: "delete", label: "删除", roles: ["admin"], confirm: {message: "确定删除该图标？"}, action: ({target}) => { target.remove(); } },
        ];

        contextMenu.show(event, items, { type: "icon", target: iconElement, data: app });
      } else {
        const items = [
          { id: "new", label: "新建", roles: ["user"], children: [
            { id: "new-folder", label: "文件夹", roles: ["user"], action: ({ event }) => createNewDesktopIcon('folder', event) },
            { id: "new-shortcut", label: "快捷方式", roles: ["user"], action: ({ event }) => createNewDesktopIcon('shortcut', event) },
            { id: "new-text", label: "文本文档", roles: ["user"], action: ({ event }) => createNewDesktopIcon('text', event) },
          ]},
          { divider: true },
          { id: "refresh", label: "刷新", roles: ["user"], action: () => refreshDesktop() },
          { id: "view", label: "查看", roles: ["user"], children: [
            { id: "view-small", label: "小图标", action: () => { desktopContainer.classList.add("size-small"); desktopContainer.classList.remove("size-medium","size-large"); } },
            { id: "view-medium", label: "中图标", action: () => { desktopContainer.classList.add("size-medium"); desktopContainer.classList.remove("size-small","size-large"); } },
            { id: "view-large", label: "大图标", action: () => { desktopContainer.classList.add("size-large"); desktopContainer.classList.remove("size-small","size-medium"); } },
          ]},
          { divider: true },
          { id: "settings", label: "桌面设置", roles: ["admin"], action: () => alert("打开设置面板（示例）") },
        ];
        contextMenu.show(event, items, { type: "desktop", target: desktopContainer });
      }
    }
  );

  cleanupFunctions.push(contextMenuCleanup);

  updateAppState({ eventCleanupFunctions: cleanupFunctions });

  return cleanupFunctions;
};

/**
 * 保存图标位置
 * @param {string} iconId - 图标ID
 * @param {Object} position - 位置对象
 * @returns {void}
 */
const saveIconPosition = (iconId, position) => {
  const currentState = getAppState();
  const updatedIcons = currentState.icons.map((icon) => {
    if (icon.id === iconId) {
      return { ...icon, gridX: position.gridX, gridY: position.gridY };
    }
    return icon;
  });

  updateAppState({ icons: updatedIcons });

  // 这里可以添加保存到服务器或本地存储的逻辑
  console.log("图标位置已保存:", { iconId, position });
};

/**
 * 刷新桌面
 * @returns {Promise<void>}
 */
const refreshDesktop = async () => {
  console.log("刷新桌面...");

  try {
    // 清理现有事件监听器
    const currentState = getAppState();
    currentState.eventCleanupFunctions.forEach((cleanup) => cleanup());

    // 重新加载配置
    const config = await loadAppConfiguration();

    // 重新渲染 Dock（基于配置统一的显示与排序）
    renderDockFromConfig(config);

    // 确保任务栏存在（避免刷新后丢失 DOM）
    ensureTaskbarRoot();

    // 开始菜单：依据最新配置重渲染（不重复绑定事件）
    rerenderStartMenu(config);

    // 重新初始化桌面
    const desktopContainer = initializeDesktop(config);
    renderDesktopIcons(config, desktopContainer);

    // 重新初始化事件处理
    const cleanupFunctions = initializeEventHandlers(desktopContainer, config);

    // 重新初始化 Dock 交互（事件委托，防重入）
    const dockCleanup = initDockInteractions();

    // 重新注册任务栏联动
    const taskbarCleanup = registerTaskbar();

    // 合并清理函数，确保下次刷新能正确清理
    updateAppState({ eventCleanupFunctions: [...cleanupFunctions, dockCleanup, taskbarCleanup] });

    console.log("桌面刷新完成");
  } catch (error) {
    console.error("刷新桌面失败:", error);
  }
};

/**
 * 清理应用资源
 * @returns {void}
 */
const cleanup = () => {
  const currentState = getAppState();

  // 清理所有事件监听器
  currentState.eventCleanupFunctions.forEach((cleanup) => cleanup());

  // 重置应用状态
  updateAppState({
    config: null,
    icons: [],
    isLoaded: false,
    eventCleanupFunctions: [],
  });

  console.log("应用资源已清理");
};

/**
 * 主初始化函数
 * @returns {Promise<void>}
 */
const initializeApp = async () => {
  try {
    console.log("开始初始化桌面应用...");

    // 等待DOM准备就绪
    await waitForDOMReady();

    // 初始化加载进度（获取管理器以便后续 finish）
    const loader = await initializeLoadingProgress();

    // 加载配置
    const config = await loadAppConfiguration();

    // 依据配置渲染 Dock（统一显示与排序）
    renderDockFromConfig(config);

    // 确保任务栏存在（StartMenu 可自动接管 start-button）
    ensureTaskbarRoot();

    // 初始化桌面
    const desktopContainer = initializeDesktop(config);

    // 渲染图标
    renderDesktopIcons(config, desktopContainer);

    // 初始化事件处理
    const cleanups = initializeEventHandlers(desktopContainer, config);

    // 新增：初始化 Dock 交互（方案A基础）
    const dockCleanup = initDockInteractions();

    // 新增：窗口系统初始化
    const windowManagerCleanup = initWindowManager();

    // 注册任务栏交互与联动，返回清理函数
    const taskbarCleanup = registerTaskbar();

    // 启动配置热重载（如果启用）
    const stopWatcher = createConfigWatcher(config?.hotReload, async (newConfig) => {
      try {
        updateAppState({ config: newConfig });
        const container = initializeDesktop(newConfig);
        renderDesktopIcons(newConfig, container);
        initializeEventHandlers(container, newConfig);
        console.log("配置更新，桌面已重载");
      } catch (e) {
        console.warn("热重载更新失败:", e);
      }
    });

    // 初始化开始菜单（首次绑定事件与渲染）
    const startMenuCleanup = initStartMenu(config);

    // 记录清理函数（包含 StartMenu/Dock/Watcher/Taskbar/WM）
    updateAppState({ eventCleanupFunctions: [...cleanups, stopWatcher, dockCleanup, startMenuCleanup, windowManagerCleanup, taskbarCleanup] });

    // 标记应用已加载
    updateAppState({ isLoaded: true });

    // 结束加载并隐藏遮罩
    loader.finish();

    console.log("桌面应用初始化完成");
  } catch (error) {
    console.error("初始化失败:", error);

    // 显示错误信息
    const errorContainer = safeQuerySelector("#error-container");
    if (errorContainer) {
      errorContainer.textContent = `初始化失败: ${error.message}`;
      setStyles(errorContainer, { display: "block" });
    }
  }
};

/**
 * 页面卸载时的清理
 */
window.addEventListener("beforeunload", cleanup);

// 导出主要函数
export {
  initializeApp,
  refreshDesktop,
  cleanup,
  getAppState,
  updateAppState,
  saveIconPosition,
};

// 自动初始化（如果作为主模块加载）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// 事件联动：Dock 点击打开/切换窗口（捕获阶段拦截，避免默认 active 切换干扰）
document.addEventListener('click', (e) => {
  const link = e.target.closest?.('.dock-link');
  if (!link) return;
  const appId = link.dataset.appId;
  const cfg = getAppState().config;
  const app = (cfg?.apps || []).find(a => a.id === appId);
  if (!app) return;

  e.preventDefault();
  e.stopPropagation();

  const setLinkActive = (active) => {
    link.classList.toggle('active', !!active);
    link.setAttribute('aria-pressed', active ? 'true' : 'false');
  };
  // 启动轻微动画反馈
  link.classList.add('launching');
  link.addEventListener('animationend', () => link.classList.remove('launching'), { once: true });

  const winId = `win-${appId}`;
  const win = document.getElementById(winId);
  if (win) {
    // 若已最小化则恢复；若已激活则最小化；否则置顶
    const isMin = win.getAttribute('data-minimized') === 'true' || win.style.display === 'none' || win.classList.contains('minimized');
    const isActive = win.classList.contains('active');
    if (isMin) {
      restoreWindow(win);
      setLinkActive(true);
    } else if (isActive) {
      minimizeWindow(win);
      setLinkActive(false);
    } else {
      focusWindow(win);
      setLinkActive(true);
    }
  } else {
    openAppWindow(app);
    setLinkActive(true);
  }
}, true);

// Dock 指示同步：根据窗口生命周期事件更新对应 app 的 active 态
(function registerDockWindowSync() {
  const byAppId = (appId) => document.querySelector(`.dock-link[data-app-id="${appId}"]`);
  const winIdToAppId = (id) => (id && id.startsWith('win-')) ? id.slice(4) : id;
  const setActive = (appId, active) => {
    const link = byAppId(appId);
    if (link) {
      link.classList.toggle('active', !!active);
      link.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  };
  const onMin = (e) => setActive(winIdToAppId(e?.detail?.id), false);
  const onClose = (e) => setActive(winIdToAppId(e?.detail?.id), false);
  const onRestore = (e) => setActive(winIdToAppId(e?.detail?.id), true);
  const onMax = (e) => setActive(winIdToAppId(e?.detail?.id), e?.detail?.state === 'max' ? true : true);
  document.addEventListener('wm:minimized', onMin);
  document.addEventListener('wm:closed', onClose);
  document.addEventListener('wm:restored', onRestore);
  document.addEventListener('wm:maximized', onMax);
})();

// 事件联动：开始菜单选择打开窗口
document.addEventListener('startmenu:select', (e) => {
  const appId = e?.detail?.appId;
  const cfg = getAppState().config;
  const app = (cfg?.apps || []).find(a => a.id === appId);
  if (app) {
    openAppWindow(app);
  }
});
