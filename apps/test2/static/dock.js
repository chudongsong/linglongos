// dock.js
// 提供 Dock 的活跃态指示、键盘可访问性和轻量交互

/**
 * 初始化 Dock 交互
 * - 为 Dock 图标提供：点击切换活跃态指示点、启动轻微弹跳动效
 * - 提供键盘可达性：左右导航、Enter/Space 触发、Esc 清除全部活跃态
 * - 防重入：二次调用会被忽略（通过 data-initialized 标记）
 * @returns {Function} cleanup 清理函数，用于移除事件监听
 */
export function initDockInteractions() {
  const dock = document.querySelector('.dock');
  if (!dock) return () => {};
  if (dock.dataset.initialized === '1') return () => {};

  const links = Array.from(dock.querySelectorAll('.dock-link'));
  if (links.length === 0) return () => {};

  dock.dataset.initialized = '1';

  // 设置可达性属性
  links.forEach(el => {
    if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', el.classList.contains('active') ? 'true' : 'false');
  });

  // 状态：当前键盘聚焦索引（不影响活跃态，可多选）
  let focusIndex = -1;

  // 事件处理器集合，便于清理
  const disposers = [];

  // 点击：切换 active + 指示点，触发一次轻微“启动”动画
  links.forEach((el, i) => {
    const onClick = (e) => {
      e.preventDefault();
      const nowActive = !el.classList.contains('active');
      el.classList.toggle('active', nowActive);
      el.setAttribute('aria-pressed', nowActive ? 'true' : 'false');

      // 轻微弹跳动画（与 hover 不冲突，短暂提升可见性）
      el.classList.add('launching');
      const removeAnim = () => {
        el.classList.remove('launching');
        el.removeEventListener('animationend', removeAnim);
      };
      el.addEventListener('animationend', removeAnim);

      // 同步键盘焦点
      focusIndex = i;
      el.focus();
    };
    el.addEventListener('click', onClick);
    disposers.push(() => el.removeEventListener('click', onClick));
  });

  // 键盘导航：左右切换聚焦；Enter/Space 触发；Esc 清空所有 active
  const onKeyDown = (e) => {
    if (links.length === 0) return;
    const { key } = e;
    if (key === 'ArrowRight') {
      e.preventDefault();
      focusIndex = focusIndex < 0 ? 0 : (focusIndex + 1) % links.length;
      links[focusIndex].focus();
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      focusIndex = focusIndex < 0 ? links.length - 1 : (focusIndex - 1 + links.length) % links.length;
      links[focusIndex].focus();
    } else if (key === 'Enter' || key === ' ') {
      if (document.activeElement && links.includes(document.activeElement)) {
        e.preventDefault();
        document.activeElement.click();
      }
    } else if (key === 'Escape') {
      e.preventDefault();
      links.forEach(el => { el.classList.remove('active'); el.setAttribute('aria-pressed', 'false'); });
      focusIndex = -1;
      links[0].blur();
    }
  };
  dock.addEventListener('keydown', onKeyDown);
  disposers.push(() => dock.removeEventListener('keydown', onKeyDown));

  // 返回清理函数
  return () => {
    disposers.forEach(fn => fn());
    delete dock.dataset.initialized;
  };
}