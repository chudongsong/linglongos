// loading-manager.js
// 加载进度管理模块 - 函数式实现（增强：真实进度与描述信息）

/**
 * 获取加载界面相关DOM元素
 * @returns {{overlay:HTMLElement, fill:HTMLElement, text:HTMLElement}} 相关元素集合
 */
const queryLoadingElements = () => {
  const overlay = document.getElementById("loadingOverlay");
  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  return { overlay, fill, text };
};

/**
 * 计算动画时长（ms）
 * @param {number} from 起始值(0-100)
 * @param {number} to 目标值(0-100)
 * @returns {number} 动画时长
 */
const calcDuration = (from, to) => {
  const delta = Math.max(0, Math.min(100, to) - Math.max(0, from));
  // 基于差值的时长，最短120ms，最长600ms
  return 120 + (delta / 100) * 480;
};

/**
 * 创建进度更新器（支持描述信息）
 * @param {{fill:HTMLElement, text:HTMLElement}} elements 进度相关元素
 * @returns {(value:number, label?:string)=>void} 进度更新函数，value范围0-100
 */
const createProgressUpdater = (elements) => {
  let lastValue = 0;
  return (value, label) => {
    const v = Math.max(0, Math.min(100, value));
    const duration = calcDuration(lastValue, v);
    if (elements?.fill) {
      elements.fill.style.transition = `width ${duration}ms ease`;
      elements.fill.style.width = `${v}%`;
    }
    if (elements?.text) {
      const pct = `${Math.round(v)}%`;
      elements.text.textContent = label ? `${label} ${pct}` : pct;
    }
    lastValue = v;
  };
};

/**
 * 平滑推进到目标进度
 * @param {(v:number,l?:string)=>void} update 进度更新函数
 * @param {number} start 起始值
 * @param {number} end 目标值
 * @param {number} steps 步数
 * @param {number} totalMs 总时长
 * @param {string} [label] 描述信息
 * @returns {Promise<void>} Promise
 */
const smoothProgress = async (
  update,
  start,
  end,
  steps = 8,
  totalMs = 400,
  label
) => {
  const s = Math.max(1, steps);
  const dt = Math.max(16, Math.floor(totalMs / s));
  for (let i = 1; i <= s; i++) {
    const v = start + ((end - start) * i) / s;
    update(v, label);
    // 使用更细腻的过渡间隔
    await new Promise((r) => setTimeout(r, dt));
  }
};

/**
 * 隐藏加载覆盖层
 * @param {{overlay:HTMLElement}} elements 元素集合
 */
const hideOverlay = (elements) => {
  if (!elements?.overlay) return;
  elements.overlay.classList.add("fade-out");
  setTimeout(() => {
    elements.overlay.style.display = "none";
  }, 350);
};

/**
 * 执行加载任务序列（保留以兼容旧用法）
 * @param {Array<()=>Promise<void>|void>} tasks 任务列表
 * @param {(v:number,l?:string)=>void} update 进度更新函数
 * @returns {Promise<void>} Promise
 */
const runTasks = async (tasks, update) => {
  const total = tasks.length || 1;
  for (let i = 0; i < tasks.length; i++) {
    try {
      const task = tasks[i];
      if (typeof task === "function") {
        await task();
      }
    } catch (e) {
      console.warn("加载任务失败，继续下一项:", e?.message || e);
    } finally {
      const target = Math.round(((i + 1) / total) * 100);
      await smoothProgress(
        update,
        Math.round((i / total) * 100),
        target,
        6,
        360
      );
    }
  }
};

/**
 * 默认加载检查任务（轻量检查）
 * @returns {Array<()=>Promise<void>>} 任务数组
 */
const defaultChecks = () => [
  async () => {
    await new Promise((r) => setTimeout(r, 80));
  }, // DOM就绪（占位）
  async () => {
    await new Promise((r) => setTimeout(r, 80));
  }, // 配置加载（占位）
  async () => {
    await new Promise((r) => setTimeout(r, 80));
  }, // 渲染预热（占位）
];

/**
 * 带进度的 fetch（读取流实现）
 * @param {string} url 资源地址
 * @param {(fraction:number)=>void} onProgress 进度回调，0-1
 * @param {RequestInit} [init] fetch配置
 * @returns {Promise<{ok:boolean,status:number,headers:Headers,text:()=>Promise<string>}>>} 响应包装
 */
const fetchWithProgress = async (url, onProgress, init) => {
  const resp = await fetch(url, init);
  const totalStr = resp.headers.get("content-length");
  const total = totalStr ? parseInt(totalStr, 10) : 0;

  if (!resp.body || total === 0) {
    // 无法追踪进度时，直接完成
    onProgress && onProgress(1);
    return resp;
  }

  const reader = resp.body.getReader();
  let loaded = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength || 0;
    onProgress && onProgress(Math.min(1, loaded / total));
  }
  const blob = new Blob(chunks);
  // 构造一个与原响应等价的 Response（以便后续 text()/json()）
  const newResp = new Response(blob, {
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers,
  });
  return newResp;
};

/**
 * 以进度回调加载并解析 JSON
 * @param {string} url JSON路径
 * @param {(fraction:number)=>void} onProgress 0-1
 * @returns {Promise<any>} 解析后的JSON对象
 */
const fetchJsonWithProgress = async (url, onProgress) => {
  const resp = await fetchWithProgress(url, onProgress);
  if (!resp.ok) throw new Error(`加载失败: ${url} (${resp.status})`);
  return resp.json();
};

/**
 * 等待样式表可访问（近似真实进度）
 * @param {(fraction:number)=>void} onProgress 0-1
 * @returns {Promise<void>}
 */
const waitForStylesLoaded = async (onProgress) => {
  // 如果没有样式表，直接完成
  const sheets = Array.from(document.styleSheets || []);
  if (sheets.length === 0) {
    onProgress && onProgress(1);
    return;
  }

  // 尝试读取规则，成功计为已加载
  const tryCheck = () => {
    let ok = 0;
    for (let i = 0; i < sheets.length; i++) {
      try {
        // 访问 cssRules 可能触发安全错误或尚未可用
        const rules = sheets[i].cssRules || sheets[i].rules; // eslint-disable-line no-unused-vars
        ok++;
      } catch (_) {
        // ignore
      }
    }
    const frac = Math.min(1, ok / sheets.length);
    onProgress && onProgress(frac);
    return ok === sheets.length;
  };

  // 初次尝试
  if (tryCheck()) return;

  // 轮询直到全部可访问
  await new Promise((resolve) => {
    const timer = setInterval(() => {
      if (tryCheck()) {
        clearInterval(timer);
        onProgress && onProgress(1);
        resolve();
      }
    }, 80);
  });
};

/**
 * 等待 DOM 就绪（真实事件），触发一次性进度完成
 * @param {(fraction:number)=>void} onProgress 0-1
 * @returns {Promise<void>}
 */
const waitForDOMReadyProgress = async (onProgress) => {
  if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
  ) {
    onProgress && onProgress(1);
    return;
  }
  await new Promise((resolve) => {
    const handler = () => {
      document.removeEventListener("DOMContentLoaded", handler);
      onProgress && onProgress(1);
      resolve();
    };
    document.addEventListener("DOMContentLoaded", handler);
  });
};

/**
 * 预加载图片数组
 * @param {string[]} urls 图片地址数组
 * @param {(done:number,total:number)=>void} onProgress 进度回调
 * @returns {Promise<void>}
 */
const preloadImages = async (urls, onProgress) => {
  const list = Array.from(new Set((urls || []).filter(Boolean)));
  const total = list.length;
  if (total === 0) {
    onProgress && onProgress(1, 1);
    return;
  }
  let done = 0;
  await Promise.all(
    list.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => {
            done++;
            onProgress && onProgress(done, total);
            resolve();
          };
          img.src = src;
        })
    )
  );
};

/**
 * 创建区间更新器，将 0..1 映射到 [start,end] 百分比区间
 * @param {(v:number,l?:string)=>void} update 主更新函数
 * @param {number} start 起点百分比
 * @param {number} end 终点百分比
 * @param {string} baseLabel 默认标签
 * @returns {(fraction:number,label?:string)=>void}
 */
const createScopedUpdater =
  (update, start, end, baseLabel) => (fraction, label) => {
    const f = Math.max(0, Math.min(1, fraction || 0));
    const v = start + (end - start) * f;
    update(v, label || baseLabel);
  };

/**
 * 从配置中收集需要预加载的图片URL
 * @param {any} desktopSettings 桌面配置
 * @param {any} appsConfig 应用配置
 * @returns {string[]} 图片URL列表
 */
const collectImageUrls = (desktopSettings, appsConfig) => {
  const urls = [];
  try {
    const bg = desktopSettings?.desktop?.background;
    if (bg && bg.type === "image" && bg.value) urls.push(bg.value);
  } catch (_) {}
  try {
    const apps = Array.isArray(appsConfig?.apps) ? appsConfig.apps : [];
    apps.forEach((app) => {
      if (app?.icon) urls.push(app.icon);
    });
  } catch (_) {}
  return urls;
};

/**
 * 创建加载管理器（真实预加载流程）
 * @param {Array<Function>} [tasks] 兼容旧版：自定义任务列表（若提供则优先生效）
 * @returns {{init:Function, finish:Function, update:Function, getPreloadedConfig:Function}} 管理器API
 */
const createLoadingManager = (tasks) => {
  const elements = queryLoadingElements();
  const update = createProgressUpdater(elements);

  // 内部状态：用于对外提供预加载结果
  const state = { preloaded: { desktopSettings: null, appsConfig: null } };

  /**
   * 初始化：执行真实预加载（样式/DOM/配置/图片）或回退到任务序列
   * @returns {Promise<void>}
   */
  const init = async () => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      // 兼容旧版的外部任务
      await runTasks(tasks, update);
      update(95, "加载完成");
      return;
    }

    // 真实预加载流程
    try {
      update(2, "初始化加载器");

      // 1) 样式可用 2% -> 12%
      const styleScope = createScopedUpdater(update, 2, 12, "加载样式");
      await waitForStylesLoaded(styleScope);

      // 2) DOM 就绪 12% -> 20%
      const domScope = createScopedUpdater(update, 12, 20, "等待DOM就绪");
      await waitForDOMReadyProgress(domScope);

      // 3) 配置加载（桌面）20% -> 40%
      const deskScope = createScopedUpdater(update, 20, 40, "加载桌面配置");
      const desktopSettings = await fetchJsonWithProgress(
        "./static/json/desktop-settings.json",
        (f) => deskScope(f)
      );

      // 4) 配置加载（应用）40% -> 60%
      const appsScope = createScopedUpdater(update, 40, 60, "加载应用清单");
      const appsConfig = await fetchJsonWithProgress(
        "./static/json/apps-config.json",
        (f) => appsScope(f)
      );

      // 5) 预加载资源（图片）60% -> 95%
      const urls = collectImageUrls(desktopSettings, appsConfig);
      const imgScope = createScopedUpdater(update, 60, 95, "预加载资源");
      await preloadImages(urls, (done, total) => {
        const frac = total ? done / total : 1;
        imgScope(frac, `预加载资源(${done}/${total || 0})`);
      });

      // 保存结果，供后续按需获取
      state.preloaded.desktopSettings = desktopSettings;
      state.preloaded.appsConfig = appsConfig;

      update(95, "准备完成");
    } catch (e) {
      console.warn("预加载过程出现问题：", e?.message || e);
      // 出错后尽可能推进，交由后续流程继续
      update(90, "预加载遇到问题，继续启动");
    }
  };

  /**
   * 结束加载并隐藏遮罩
   */
  const finish = () => {
    update(100, "启动完成");
    hideOverlay(elements);
  };

  /**
   * 获取预加载到的配置（若可用）
   * @returns {{desktopSettings:any, appsConfig:any}}
   */
  const getPreloadedConfig = () => ({
    desktopSettings: state.preloaded.desktopSettings,
    appsConfig: state.preloaded.appsConfig,
  });

  return { init, finish, update, getPreloadedConfig };
};

export {
  queryLoadingElements,
  createProgressUpdater,
  smoothProgress,
  hideOverlay,
  runTasks,
  defaultChecks,
  fetchWithProgress,
  fetchJsonWithProgress,
  waitForStylesLoaded,
  waitForDOMReadyProgress,
  preloadImages,
  createScopedUpdater,
  collectImageUrls,
  createLoadingManager,
};
