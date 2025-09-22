// window-manager.js
// 窗口管理模块：提供窗口创建/销毁、焦点与 z-index 管理、基础结构与样式钩子

/**
 * 模块内状态：统一管理窗口根节点与 z-index 堆叠
 */
let winRoot = null;
let topZ = 1100; // 高于 Dock(1000)，低于开始菜单(1200)
// 新增：拖动阈值与边距、工具函数
const DRAG_THRESHOLD = 5; // 像素阈值，避免误触
const DRAG_MARGIN = 8; // 视口边缘内边距
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/**
 * 创建窗口根容器（若不存在）
 * @returns {HTMLElement} 根容器
 */
function ensureRoot() {
  if (winRoot && document.body.contains(winRoot)) return winRoot;
  const root = document.createElement('div');
  root.className = 'window-root';
  root.setAttribute('role', 'application');
  document.body.appendChild(root);
  winRoot = root;
  return winRoot;
}

/**
 * 将窗口置顶并设置焦点
 * @param {HTMLElement} winEl - 窗口元素
 * @returns {void}
 */
function focusWindow(winEl) {
  if (!winEl) return;
  // 若处于最小化状态，先恢复可见
  if (winEl.classList.contains('minimized') || winEl.style.display === 'none' || winEl.getAttribute('data-minimized') === 'true') {
    winEl.classList.remove('minimized');
    winEl.style.removeProperty('display');
    winEl.removeAttribute('data-minimized');
  }
  topZ += 1;
  winEl.style.zIndex = String(topZ);
  winEl.classList.add('active');
  // 取消其它窗口的 active 态
  const siblings = winRoot ? Array.from(winRoot.children) : [];
  siblings.forEach(el => { if (el !== winEl) el.classList.remove('active'); });
  // 聚焦标题栏按钮（可访问性）
  const title = winEl.querySelector('.window-titlebar');
  title?.focus?.();
}

/**
 * 销毁指定窗口
 * @param {string|HTMLElement} target - 窗口ID或元素
 * @returns {void}
 */
function destroyWindow(target) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/**
 * 创建一个基础窗口
 * @param {Object} options - 窗口选项
 * @param {string} options.id - 窗口唯一ID
 * @param {string} options.title - 标题
 * @param {number} [options.width=720] - 宽度
 * @param {number} [options.height=480] - 高度
 * @param {number} [options.x] - 左上角X（默认居中）
 * @param {number} [options.y] - 左上角Y（默认居中）
 * @param {string} [options.contentHTML] - 内容HTML
 * @param {string} [options.url] - 若提供则以 iframe 方式加载
 * @returns {HTMLElement} 窗口元素
 */
function createWindow(options) {
  const root = ensureRoot();
  const {
    id,
    title,
    width = 720,
    height = 480,
    x,
    y,
    contentHTML,
    url
  } = options || {};

  // 若已经存在同ID窗口，则置顶并返回（同时从最小化状态恢复）
  if (id) {
    const existing = document.getElementById(id);
    if (existing) {
      restoreWindow(existing);
      return existing;
    }
  }

  const win = document.createElement('div');
  win.className = 'window';
  if (id) win.id = id;
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-modal', 'false');
  win.style.width = width + 'px';
  win.style.height = height + 'px';
  win.style.zIndex = String(++topZ);

  // 初始位置：默认居中
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const left = typeof x === 'number' ? x : Math.max(10, Math.floor((vw - width) / 2));
  const top = typeof y === 'number' ? y : Math.max(10, Math.floor((vh - height) / 2));
  win.style.left = left + 'px';
  win.style.top = top + 'px';

  // 标题栏
  const titlebar = document.createElement('div');
  titlebar.className = 'window-titlebar';
  titlebar.tabIndex = 0; // 键盘可达

  const controls = document.createElement('div');
  controls.className = 'window-controls';

  const btnClose = document.createElement('button');
  btnClose.className = 'win-btn btn-close';
  btnClose.title = '关闭';
  btnClose.setAttribute('aria-label', '关闭窗口');

  const btnMin = document.createElement('button');
  btnMin.className = 'win-btn btn-min';
  btnMin.title = '最小化';
  btnMin.setAttribute('aria-label', '最小化窗口');

  const btnMax = document.createElement('button');
  btnMax.className = 'win-btn btn-max';
  btnMax.title = '最大化';
  btnMax.setAttribute('aria-label', '最大化窗口');

  controls.append(btnClose, btnMin, btnMax);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'window-title';
  titleSpan.textContent = title || '未命名窗口';

  titlebar.append(controls, titleSpan);

  // 内容区
  const content = document.createElement('div');
  content.className = 'window-content';
  if (url) {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('title', title || '应用窗口');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    content.appendChild(iframe);
  } else if (contentHTML) {
    content.innerHTML = contentHTML;
  } else {
    const empty = document.createElement('div');
    empty.className = 'window-empty';
    empty.innerHTML = '<p style="opacity:.7">此应用暂无可显示的内容</p>';
    content.appendChild(empty);
  }

  win.append(titlebar, content);
  root.appendChild(win);

  // 交互：按钮点击
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(win); });
  btnMin.addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(win); });
  btnMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(win); });

  // 交互：双击标题栏切换最大化
  titlebar.addEventListener('dblclick', (e) => { if (e.button === 0) toggleMaximize(win); });

  // 交互：点击置顶
  const onClickFocus = () => focusWindow(win);
  win.addEventListener('mousedown', onClickFocus);

  // 交互：标题栏拖动（含阈值与边界限制）
  // 鼠标按下后，仅当移动超过 DRAG_THRESHOLD 才认为是拖动，避免与点击/焦点冲突
  titlebar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // 仅左键
    if (win.classList.contains('maximized')) return; // 最大化时禁止拖动
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = win.getBoundingClientRect();
    const origLeft = rect.left;
    const origTop = rect.top;
    let activated = false; // 是否已进入拖动态

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!activated) {
        if (dx*dx + dy*dy < DRAG_THRESHOLD*DRAG_THRESHOLD) return;
        activated = true;
        titlebar.classList.add('dragging');
        document.body.classList.add('wm-dragging');
      }
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const maxLeft = vw - DRAG_MARGIN - win.offsetWidth;
      const maxTop = vh - DRAG_MARGIN - win.offsetHeight;
      const nextLeft = clamp(origLeft + dx, DRAG_MARGIN, Math.max(DRAG_MARGIN, maxLeft));
      const nextTop = clamp(origTop + dy, DRAG_MARGIN, Math.max(DRAG_MARGIN, maxTop));
      win.style.left = Math.round(nextLeft) + 'px';
      win.style.top = Math.round(nextTop) + 'px';
      ev.preventDefault();
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (activated) {
        titlebar.classList.remove('dragging');
        document.body.classList.remove('wm-dragging');
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // 返回窗口元素
  return win;
}

/**
 * 根据应用配置打开窗口（若存在则置顶）
 * @param {Object} app - 应用配置（含 id/name/icon/url 等）
 * @returns {HTMLElement|null} 窗口元素
 */
function openAppWindow(app) {
  if (!app) return null;
  const id = `win-${app.id}`;
  const title = app.name || app.id || '应用';
  return createWindow({ id, title, url: app.url });
}

/**
 * 初始化窗口管理器（目前为确保根容器存在）
 * @returns {Function} cleanup - 清理函数
 */
function initWindowManager() {
  ensureRoot();
  // 将来可在此注册全局事件（比如对 ESC 的统一处理等）
  return () => {
    if (winRoot && winRoot.parentNode) {
      winRoot.parentNode.removeChild(winRoot);
    }
    winRoot = null;
  };
}

/**
 * 关闭窗口
 * @param {HTMLElement} win - 窗口元素
 * @returns {void}
 */
function closeWindow(win) {
  if (!win) return;
  const id = win.id;
  // 钩子事件（供外部监听）
  win.dispatchEvent(new CustomEvent('wm:beforeClose', { detail: { id } }));
  destroyWindow(win);
  document.dispatchEvent(new CustomEvent('wm:closed', { detail: { id } }));
}

/**
 * 最小化窗口：隐藏窗口并标记状态
 * @param {HTMLElement} win - 窗口元素
 * @returns {void}
 */
function minimizeWindow(win) {
  if (!win) return;
  const id = win.id;
  win.classList.add('minimized');
  win.setAttribute('data-minimized', 'true');
  win.style.display = 'none'; // 占位样式基础上，直接隐藏
  win.classList.remove('active');
  win.dispatchEvent(new CustomEvent('wm:minimized', { detail: { id } }));
  document.dispatchEvent(new CustomEvent('wm:minimized', { detail: { id } }));
}

/**
 * 还原窗口：从最小化或最大化状态恢复
 * @param {HTMLElement} win - 窗口元素
 * @returns {void}
 */
function restoreWindow(win) {
  if (!win) return;
  const id = win.id;
  // 恢复最小化
  if (win.getAttribute('data-minimized') === 'true' || win.style.display === 'none') {
    win.classList.remove('minimized');
    win.style.removeProperty('display');
    win.removeAttribute('data-minimized');
  }
  // 恢复最大化前的尺寸与位置
  if (win.classList.contains('maximized')) {
    const l = win.getAttribute('data-restore-left');
    const t = win.getAttribute('data-restore-top');
    const w = win.getAttribute('data-restore-width');
    const h = win.getAttribute('data-restore-height');
    if (l && t && w && h) {
      win.style.left = l + 'px';
      win.style.top = t + 'px';
      win.style.width = w + 'px';
      win.style.height = h + 'px';
    }
    win.classList.remove('maximized');
  }
  focusWindow(win);
  win.dispatchEvent(new CustomEvent('wm:restored', { detail: { id } }));
  document.dispatchEvent(new CustomEvent('wm:restored', { detail: { id } }));
}

/**
 * 切换最大化：若已最大化则还原，否则记录尺寸后最大化
 * @param {HTMLElement} win - 窗口元素
 * @returns {void}
 */
function toggleMaximize(win) {
  if (!win) return;
  const id = win.id;
  if (!win.classList.contains('maximized')) {
    const rect = win.getBoundingClientRect();
    win.setAttribute('data-restore-left', String(Math.round(rect.left)));
    win.setAttribute('data-restore-top', String(Math.round(rect.top)));
    win.setAttribute('data-restore-width', String(Math.round(rect.width)));
    win.setAttribute('data-restore-height', String(Math.round(rect.height)));
    win.classList.add('maximized');
    win.dispatchEvent(new CustomEvent('wm:maximized', { detail: { id, state: 'max' } }));
    document.dispatchEvent(new CustomEvent('wm:maximized', { detail: { id, state: 'max' } }));
  } else {
    restoreWindow(win);
    win.dispatchEvent(new CustomEvent('wm:maximized', { detail: { id, state: 'restore' } }));
    document.dispatchEvent(new CustomEvent('wm:maximized', { detail: { id, state: 'restore' } }));
  }
}

export {
  initWindowManager,
  createWindow,
  destroyWindow,
  focusWindow,
  openAppWindow,
  // 新增导出：供外部控制或测试
  closeWindow,
  minimizeWindow,
  toggleMaximize,
  restoreWindow,
};