// context-menu.js
// 可自定义右键菜单库 - 提供多级菜单、权限控制与完整事件链路

/**
 * 创建右键菜单管理器
 *
 * API:
 * const cm = createContextMenuManager(options)
 * - options.getUserRoles: () => string[] 返回当前用户角色列表
 * - options.permissionMode: 'hide' | 'disable' 无权限项处理方式，默认 'hide'
 * - options.zIndex: number 菜单层级，默认 20000
 * - options.offset: {x:number, y:number} 菜单相对光标偏移，默认 {x:8,y:8}
 * - options.classNames: 自定义类名映射（可选）
 *
 * cm.show(eventOrPos, items, context)
 * - eventOrPos: MouseEvent 或 {x:number,y:number}
 * - items: MenuItem[] 菜单项数组（支持 children 多级）
 * - context: any 传入动作回调的上下文数据，例如 { type:'icon', target:HTMLElement, data:any }
 *
 * cm.hide() 隐藏菜单
 * cm.destroy() 销毁菜单（移除DOM与监听）
 * cm.updateOptions(partialOptions) 动态更新配置
 *
 * MenuItem 结构：
 * - id?: string
 * - label?: string
 * - icon?: string(svg或文本)
 * - shortcut?: string 右侧快捷提示
 * - roles?: string[] 有权限的角色
 * - disabled?: boolean 是否禁用
 * - divider?: boolean 是否分隔线
 * - confirm?: {message: string}
 * - children?: MenuItem[] 子菜单
 * - action?: (payload:{event:MouseEvent|null, target?:HTMLElement, data?:any, item:MenuItem}) => void
 */
export function createContextMenuManager(userOptions = {}) {
  // 默认配置
  const defaults = {
    getUserRoles: () => ["user"],
    permissionMode: "hide", // 'hide' | 'disable'
    zIndex: 20000,
    offset: { x: 8, y: 8 },
    classNames: {
      root: "ctx-menu",
      item: "ctx-item",
      label: "ctx-label",
      icon: "ctx-icon",
      shortcut: "ctx-shortcut",
      divider: "ctx-divider",
      submenu: "ctx-submenu",
      itemHasChildren: "has-children",
      itemDisabled: "is-disabled",
      openRight: "open-right",
      openLeft: "open-left",
    },
  };

  /** 当前配置（可更新） */
  let options = { ...defaults, ...userOptions, classNames: { ...defaults.classNames, ...(userOptions.classNames || {}) } };

  /** 菜单容器引用 */
  let rootMenuEl = null;
  /** 当前打开的子菜单映射：父 <li> -> 子 <ul> */
  const openSubmenus = new Map();
  /** 悬停关闭的定时器：父 <li> -> timeoutId */
  const hoverTimers = new Map();
  /** 绑定的全局监听清理函数 */
  const cleanups = [];
  /** 记录最近一次 show 的上下文 */
  let lastContext = null;

  // 注入基础样式（仅一次）
  injectBaseStyles(options);

  /**
   * 更新配置
   * @param {Object} partialOptions - 局部更新
   */
  function updateOptions(partialOptions = {}) {
    options = { ...options, ...partialOptions, classNames: { ...options.classNames, ...(partialOptions.classNames || {}) } };
  }

  /**
   * 显示菜单
   * @param {MouseEvent|{x:number,y:number}} eventOrPos - 鼠标事件或坐标
   * @param {Array} items - 菜单项
   * @param {any} context - 自定义上下文
   */
  function show(eventOrPos, items = [], context = null) {
    hide(); // 确保只存在一个菜单

    const point = getPoint(eventOrPos, options.offset);
    lastContext = context;

    // 过滤/标记权限
    const normalized = normalizeItems(items, options);

    rootMenuEl = buildMenu(normalized, options, /*isSub*/ false);
    document.body.appendChild(rootMenuEl);

    // 初始定位
    placeMenu(rootMenuEl, point.x, point.y);

    // 全局监听：点击外部、滚动、窗口尺寸变化、Escape
    bindGlobalDismiss();
  }

  /** 隐藏菜单 */
  function hide() {
    // 关闭所有子菜单
    for (const [, sub] of openSubmenus) {
      sub.remove();
    }
    openSubmenus.clear();

    if (rootMenuEl && rootMenuEl.parentNode) {
      rootMenuEl.parentNode.removeChild(rootMenuEl);
    }
    rootMenuEl = null;

    // 移除全局事件
    while (cleanups.length) {
      try { cleanups.pop()(); } catch (_) {}
    }
  }

  /** 销毁菜单（与 hide 类似，但保留对外 API 不可用的语义） */
  function destroy() {
    hide();
    lastContext = null;
  }

  // 工具函数实现

  /**
   * 根据权限与模式规范化菜单项
   * @param {Array} items
   * @param {Object} opts
   * @returns {Array}
   */
  function normalizeItems(items, opts) {
    const roles = safeArray(opts.getUserRoles && opts.getUserRoles());
    const mode = opts.permissionMode === "disable" ? "disable" : "hide";

    const travel = (arr) => arr
      .map((it) => {
        if (it.divider) return { divider: true };
        const clone = { ...it };
        const needRole = safeArray(clone.roles);
        const allowed = needRole.length === 0 || needRole.some(r => roles.includes(r));

        if (!allowed) {
          if (mode === "hide") return null; // 直接隐藏
          clone.disabled = true; // 或禁用
        }

        if (Array.isArray(clone.children) && clone.children.length) {
          clone.children = travel(clone.children).filter(Boolean);
          // 若子项全被隐藏且自身无动作，可考虑隐藏此父项
          if (mode === "hide" && (!clone.children.length) && !clone.action && !clone.disabled) {
            return null;
          }
        }
        return clone;
      })
      .filter(Boolean);

    // 去除连续分隔线与首尾分隔线
    const pruned = [];
    let prevDivider = true; // 开头不允许分隔线
    for (const it of travel(items)) {
      if (it.divider) {
        if (!prevDivider) {
          pruned.push(it);
          prevDivider = true;
        }
      } else {
        pruned.push(it);
        prevDivider = false;
      }
    }
    // 末尾若是分隔线则移除
    if (pruned.length && pruned[pruned.length - 1].divider) pruned.pop();

    return pruned;
  }

  /**
   * 构建菜单DOM
   * @param {Array} items
   * @param {Object} opts
   * @param {boolean} isSub 是否子菜单
   * @returns {HTMLElement}
   */
  function buildMenu(items, opts, isSub) {
    const cls = opts.classNames;
    const ul = document.createElement('ul');
    ul.className = isSub ? `${cls.root} ${cls.submenu}` : cls.root;
    ul.style.zIndex = String(opts.zIndex);
    ul.setAttribute('role', 'menu');

    items.forEach((item) => {
      if (item.divider) {
        const li = document.createElement('li');
        li.className = cls.divider;
        li.setAttribute('role', 'separator');
        ul.appendChild(li);
        return;
      }

      const li = document.createElement('li');
      li.className = cls.item + (Array.isArray(item.children) && item.children.length ? ` ${cls.itemHasChildren}` : '');
      li.setAttribute('role', 'menuitem');

      if (item.disabled) {
        li.classList.add(cls.itemDisabled);
        li.setAttribute('aria-disabled', 'true');
      }

      // 图标
      if (item.icon) {
        const iconEl = document.createElement('span');
        iconEl.className = cls.icon;
        iconEl.innerHTML = item.icon;
        li.appendChild(iconEl);
      }

      // 文字
      const labelEl = document.createElement('span');
      labelEl.className = cls.label;
      labelEl.textContent = item.label || '';
      li.appendChild(labelEl);

      // 快捷提示
      if (item.shortcut) {
        const sc = document.createElement('span');
        sc.className = cls.shortcut;
        sc.textContent = item.shortcut;
        li.appendChild(sc);
      }

      // 子菜单箭头占位
      let childMenu = null;
      if (Array.isArray(item.children) && item.children.length) {
        // 构建但不挂载，hover 时再挂载
        childMenu = buildMenu(item.children, opts, true);

        // 清除延迟关闭
        const clearCloseTimer = () => {
          const t = hoverTimers.get(li);
          if (t) {
            clearTimeout(t);
            hoverTimers.delete(li);
          }
        };

        li.addEventListener('mouseenter', () => {
          clearCloseTimer();
          openSubmenuFor(li, childMenu, opts);
        });
        li.addEventListener('mouseleave', (ev) => {
          const sub = openSubmenus.get(li);
          const toEl = ev.relatedTarget;
          // 如果正在移动到子菜单，则不关闭
          if (sub && (sub === toEl || (toEl && sub.contains(toEl)))) return;
          // 延迟关闭，允许从父项移动到子菜单
          const tid = setTimeout(() => {
            const stillHoverParent = li.matches(':hover');
            const stillHoverSub = sub && sub.matches(':hover');
            if (!stillHoverParent && !stillHoverSub) {
              closeSubmenuFor(li);
            }
            hoverTimers.delete(li);
          }, 200);
          hoverTimers.set(li, tid);
        });

        // 子菜单进入/离开时控制关闭逻辑
        childMenu.addEventListener('mouseenter', () => {
          clearCloseTimer();
        });
        childMenu.addEventListener('mouseleave', () => {
          const sub = openSubmenus.get(li);
          const tid = setTimeout(() => {
            const stillHoverParent = li.matches(':hover');
            const stillHoverSub = sub && sub.matches(':hover');
            if (!stillHoverParent && !stillHoverSub) {
              closeSubmenuFor(li);
            }
            hoverTimers.delete(li);
          }, 200);
          hoverTimers.set(li, tid);
        });
      }

      // 点击事件
      li.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (item.disabled) return;
        if (item.children && item.children.length) return; // 有子菜单时不直接触发
        if (item.confirm && item.confirm.message) {
          if (!window.confirm(item.confirm.message)) return;
        }
        try {
          if (typeof item.action === 'function') {
            item.action({ event: ev instanceof MouseEvent ? ev : null, target: lastContext?.target, data: lastContext?.data, item });
          }
        } finally {
          hide();
        }
      });

      ul.appendChild(li);
    });

    return ul;
  }

  /**
   * 打开某个子菜单并定位（相对父 <li>）
   */
  function openSubmenuFor(li, submenuEl, opts) {
    closeSubmenuFor(li); // 先关闭旧的

    document.body.appendChild(submenuEl);
    const rect = li.getBoundingClientRect();
    const { x, y } = placeSubmenu(submenuEl, rect.right, rect.top, rect.height);

    // 标记打开
    openSubmenus.set(li, submenuEl);

    // 根据方向设置类名（用于三角箭头方向等样式）
    const cls = opts.classNames;
    submenuEl.classList.remove(cls.openLeft, cls.openRight);
    const prefersLeft = x < rect.right; // 如果放置到左侧
    submenuEl.classList.add(prefersLeft ? cls.openLeft : cls.openRight);
  }

  /** 关闭某个父项的子菜单 */
  function closeSubmenuFor(li) {
    const sub = openSubmenus.get(li);
    if (sub) {
      sub.remove();
      openSubmenus.delete(li);
    }
  }

  /**
   * 将菜单放置在视口内合适位置
   */
  function placeMenu(menuEl, x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = measure(menuEl);

    let left = x;
    let top = y;

    // 避免越界
    if (left + rect.w > vw) left = Math.max(0, vw - rect.w - 4);
    if (top + rect.h > vh) top = Math.max(0, vh - rect.h - 4);

    menuEl.style.left = left + 'px';
    menuEl.style.top = top + 'px';
  }

  /**
   * 将子菜单靠近父项右侧（或左侧）显示
   */
  function placeSubmenu(menuEl, preferX, topY, parentHeight) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = measure(menuEl);

    let x = preferX;
    let y = topY;

    // 垂直对齐：尽量贴合父项顶部，若下溢则向上收
    if (y + rect.h > vh) y = Math.max(0, vh - rect.h - 4);

    // 水平方向：优先右侧，溢出则左侧
    if (x + rect.w > vw) {
      x = Math.max(0, preferX - rect.w - (parentHeight || 0));
    }

    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';

    return { x, y };
  }

  /** 绑定全局隐藏逻辑 */
  function bindGlobalDismiss() {
    const onDocClick = (e) => {
      if (!rootMenuEl) return;
      if (rootMenuEl.contains(e.target)) return;
      hide();
    };
    const onScroll = () => hide();
    const onResize = () => hide();
    const onKeydown = (e) => { if (e.key === 'Escape') hide(); };

    document.addEventListener('mousedown', onDocClick, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize, true);
    window.addEventListener('keydown', onKeydown, true);

    cleanups.push(() => document.removeEventListener('mousedown', onDocClick, true));
    cleanups.push(() => window.removeEventListener('scroll', onScroll, true));
    cleanups.push(() => window.removeEventListener('resize', onResize, true));
    cleanups.push(() => window.removeEventListener('keydown', onKeydown, true));
  }

  /** 获取事件或坐标点 */
  function getPoint(eventOrPos, offset) {
    if (eventOrPos && typeof eventOrPos.clientX === 'number') {
      const ev = eventOrPos;
      return { x: ev.clientX + (offset?.x || 0), y: ev.clientY + (offset?.y || 0) };
    }
    const x = Number(eventOrPos?.x) || 0;
    const y = Number(eventOrPos?.y) || 0;
    return { x: x + (offset?.x || 0), y: y + (offset?.y || 0) };
  }

  /** 测量元素尺寸（提前脱离布局以避免闪烁） */
  function measure(el) {
    if (!el.parentNode) {
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const rect = el.getBoundingClientRect();
      el.remove();
      return { w: rect.width, h: rect.height };
    }
    const rect = el.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

  function safeArray(arr) {
    return Array.isArray(arr) ? arr : [];
  }

  return { show, hide, destroy, updateOptions };
}

/**
 * 向页面注入基础样式（如已存在则跳过）
 */
function injectBaseStyles(opts) {
  const STYLE_ID = 'ctx-menu-base-style';
  if (document.getElementById(STYLE_ID)) return;

  const css = `
  .${opts.classNames.root} { position: fixed; min-width: 180px; max-width: 320px; padding: 6px; margin: 0; list-style: none; background: rgba(30,30,30,0.96); color: #fff; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; box-shadow: 0 12px 24px rgba(0,0,0,0.35); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .${opts.classNames.item} { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; user-select: none; }
  .${opts.classNames.item}:hover { background: rgba(255,255,255,0.08); }
  .${opts.classNames.item}.${opts.classNames.itemDisabled} { opacity: 0.5; cursor: not-allowed; }
  .${opts.classNames.icon} { width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; opacity: 0.9; }
  .${opts.classNames.label} { flex: 1; white-space: nowrap; }
  .${opts.classNames.shortcut} { color: rgba(255,255,255,0.6); margin-left: 12px; font-size: 12px; }
  .${opts.classNames.divider} { height: 1px; margin: 6px 4px; background: rgba(255,255,255,0.12); }
  .${opts.classNames.submenu} { position: fixed; min-width: 180px; max-width: 320px; padding: 6px; margin: 0; list-style: none; background: rgba(30,30,30,0.96); color: #fff; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; box-shadow: 0 12px 24px rgba(0,0,0,0.35); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}