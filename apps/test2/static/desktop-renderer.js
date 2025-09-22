// desktop-renderer.js
// 桌面渲染模块 - 采用函数式编程范式

import { createElement, setStyles, addClass, removeClass, setAttributes } from './dom-utils.js';

/**
 * 规范化网格配置
 * @param {number|Object} grid 配置，可以是数字或对象 {width,height,gap,padding}
 * @param {number} defaultSize 默认步长
 * @param {number} defaultPadding 默认内边距
 * @returns {{width:number,height:number,gap:number,padding:number}}
 */
const normalizeGrid = (grid, defaultSize = 80, defaultPadding = 10) => {
  if (typeof grid === 'number') {
    return { width: grid, height: grid, gap: 0, padding: defaultPadding };
  }
  if (!grid || typeof grid !== 'object') {
    return { width: defaultSize, height: defaultSize, gap: 0, padding: defaultPadding };
  }
  return {
    width: Number(grid.width) || defaultSize,
    height: Number(grid.height) || defaultSize,
    gap: Number(grid.gap) || 0,
    padding: Number(grid.padding ?? defaultPadding)
  };
};

/**
 * 计算网格位置
 * @param {number} x - 相对容器的X像素坐标
 * @param {number} y - 相对容器的Y像素坐标
 * @param {number|Object} grid 配置（数字或对象）
 * @returns {Object} 网格位置对象 {gridX, gridY}
 */
const calculateGridPosition = (x, y, grid = 80) => {
  const g = normalizeGrid(grid);
  const stepX = g.width + g.gap;
  const stepY = g.height + g.gap;
  const gx = Math.round((x - g.padding) / stepX);
  const gy = Math.round((y - g.padding) / stepY);
  return { gridX: Math.max(0, gx), gridY: Math.max(0, gy) };
};

/**
 * 计算像素位置
 * @param {number} gridX - 网格X坐标（列）
 * @param {number} gridY - 网格Y坐标（行）
 * @param {number|Object} grid 配置（数字或对象）
 * @returns {Object} 像素位置对象 {x, y}
 */
const calculatePixelPosition = (gridX, gridY, grid = 80) => {
  const g = normalizeGrid(grid);
  const stepX = g.width + g.gap;
  const stepY = g.height + g.gap;
  return {
    x: g.padding + gridX * stepX,
    y: g.padding + gridY * stepY
  };
};

/**
 * 检查位置是否被占用
 * @param {number} gridX - 网格X坐标
 * @param {number} gridY - 网格Y坐标
 * @param {Array} occupiedPositions - 已占用位置数组
 * @param {string} excludeId - 排除的图标ID
 * @returns {boolean} 是否被占用
 */
const isPositionOccupied = (gridX, gridY, occupiedPositions, excludeId = null) => {
  return occupiedPositions.some(pos => 
    pos.gridX === gridX && 
    pos.gridY === gridY && 
    pos.id !== excludeId
  );
};

/**
 * 查找最近的空位置
 * @param {number} targetX - 目标X坐标（列）
 * @param {number} targetY - 目标Y坐标（行）
 * @param {Array} occupiedPositions - 已占用位置数组
 * @param {number} maxDistance - 最大搜索距离
 * @param {string} excludeId - 排除的图标ID
 * @returns {Object|null} 空位置对象或null
 */
const findNearestEmptyPosition = (targetX, targetY, occupiedPositions, maxDistance = 10, excludeId = null) => {
  for (let distance = 0; distance <= maxDistance; distance++) {
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        if (distance > 0 && Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;
        const gridX = targetX + dx;
        const gridY = targetY + dy;
        if (gridX >= 0 && gridY >= 0 && !isPositionOccupied(gridX, gridY, occupiedPositions, excludeId)) {
          return { gridX, gridY };
        }
      }
    }
  }
  return null;
};

/**
 * 创建图标元素
 * @param {Object} iconData - 图标数据 {id,name,icon,url,gridX,gridY}
 * @returns {HTMLElement} 图标DOM元素
 */
const createIconElement = (iconData) => {
  const { id, name, icon, url, gridX, gridY } = iconData;

  const iconElement = createElement('div', {
    className: 'grid-item icon-item',
    dataset: {
      id: id,
      url: url || '',
      gridX: String(gridX ?? 0),
      gridY: String(gridY ?? 0),
      row: String(gridY ?? 0),
      col: String(gridX ?? 0)
    }
  });

  const iconImg = createElement('img', {
    src: icon,
    alt: name,
    draggable: 'false'
  });

  const iconTitle = createElement('span', {}, name);

  iconElement.appendChild(iconImg);
  iconElement.appendChild(iconTitle);

  return iconElement;
};

/**
 * 设置图标位置
 * @param {HTMLElement} iconElement - 图标元素
 * @param {number} gridX - 网格X坐标
 * @param {number} gridY - 网格Y坐标
 * @param {number|Object} grid - 网格配置
 * @returns {HTMLElement} 设置位置后的图标元素
 */
const setIconPosition = (iconElement, gridX, gridY, grid = 80) => {
  if (!iconElement) return iconElement;
  const { x, y } = calculatePixelPosition(gridX, gridY, grid);
  setStyles(iconElement, {
    left: `${x}px`,
    top: `${y}px`
  });
  setAttributes(iconElement, {
    dataset: {
      gridX: String(gridX),
      gridY: String(gridY),
      row: String(gridY),
      col: String(gridX)
    }
  });
  return iconElement;
};

/**
 * 按网格配置应用图标容器与图片尺寸，确保视觉一致
 * - 容器尺寸：使用 grid.width / grid.height，含兜底
 * - 图片尺寸：按容器尺寸比例缩放，含最小像素兜底，同时保持等比显示
 * @param {HTMLElement} iconElement - 图标容器元素（包含 img 和标题）
 * @param {number|Object} grid - 网格配置对象或步长
 * @param {Object} [options] - 可选项 { imgScale?: number, fallbackWidth?: number, fallbackHeight?: number }
 * @returns {HTMLElement} 设置尺寸后的图标元素
 */
const applyIconSizing = (iconElement, grid = 80, options = {}) => {
  if (!iconElement) return iconElement;
  const g = normalizeGrid(grid);
  const fallbackW = Number(options.fallbackWidth) || 100;
  const fallbackH = Number(options.fallbackHeight) || 120;
  const containerW = Number(g.width) || fallbackW;
  const containerH = Number(g.height) || fallbackH;

  // 设置容器固定尺寸，避免不同图片本身尺寸导致抖动
  setStyles(iconElement, {
    width: `${containerW}px`,
    height: `${containerH}px`,
  });

  // 设置图片尺寸（按比例），保持等比显示
  const img = iconElement.querySelector('img');
  if (img) {
    const ratio = (typeof options.imgScale === 'number' && options.imgScale > 0 && options.imgScale <= 1)
      ? options.imgScale
      : 0.64; // 默认图片占容器 64%
    const imgW = Math.max(24, Math.round(containerW * ratio));
    const imgH = Math.max(24, Math.round(containerH * ratio));

    setStyles(img, {
      width: `${imgW}px`,
      height: `${imgH}px`,
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'block',
    });

    img.setAttribute('width', String(imgW));
    img.setAttribute('height', String(imgH));
    img.setAttribute('decoding', 'async');
  }

  // 设置标题字号随档位联动（基于容器高度），并进行最小/最大值夹逼
  const title = iconElement.querySelector('span');
  if (title) {
    // 默认标题占容器高度约 16%，可通过 options.titleScale 调整
    const tRatio = (typeof options.titleScale === 'number' && options.titleScale > 0 && options.titleScale <= 1)
      ? options.titleScale
      : 0.16;
    const rawSize = Math.round(containerH * tRatio);
    const fontSize = Math.max(11, Math.min(18, rawSize)); // 夹逼到 11px ~ 18px

    setStyles(title, {
      fontSize: `${fontSize}px`,
      lineHeight: '1.2',
      maxWidth: '100%',
      textAlign: 'center',
      wordBreak: 'break-word',
      overflow: 'hidden',
      display: 'block',
    });
  }

  return iconElement;
};

/**
 * 渲染单个图标
 * @param {Object} iconData - 图标数据
 * @param {HTMLElement} container - 容器元素
 * @param {number|Object} grid - 网格配置
 * @returns {HTMLElement} 渲染的图标元素
 */
const renderIcon = (iconData, container, grid = 80) => {
  if (!iconData || !container) return null;
  const iconElement = createIconElement(iconData);
  // 基于 CSS 变量与尺寸类控制视觉尺寸，不再在此处写入内联尺寸
  setIconPosition(iconElement, iconData.gridX, iconData.gridY, grid);
  container.appendChild(iconElement);
  return iconElement;
};

/**
 * 批量渲染图标
 * @param {Array} iconsData - 图标数据数组
 * @param {HTMLElement} container - 容器元素
 * @param {number|Object} grid - 网格配置
 * @returns {Array} 渲染的图标元素数组
 */
const renderIcons = (iconsData, container, grid = 80) => {
  if (!Array.isArray(iconsData) || !container) return [];
  return iconsData.map(iconData => renderIcon(iconData, container, grid)).filter(Boolean);
};

/**
 * 更新图标位置
 * @param {HTMLElement} iconElement - 图标元素
 * @param {number} newGridX - 新的网格X坐标
 * @param {number} newGridY - 新的网格Y坐标
 * @param {number|Object} grid - 网格配置
 * @returns {HTMLElement} 更新位置后的图标元素
 */
const updateIconPosition = (iconElement, newGridX, newGridY, grid = 80) => {
  if (!iconElement) return iconElement;
  return setIconPosition(iconElement, newGridX, newGridY, grid);
};

/**
 * 获取图标的网格位置
 * @param {HTMLElement} iconElement - 图标元素
 * @returns {Object|null} 网格位置对象或null
 */
const getIconGridPosition = (iconElement) => {
  if (!iconElement || !iconElement.dataset) return null;
  const gridX = parseInt(iconElement.dataset.gridX ?? iconElement.dataset.col, 10);
  const gridY = parseInt(iconElement.dataset.gridY ?? iconElement.dataset.row, 10);
  if (isNaN(gridX) || isNaN(gridY)) return null;
  return { gridX, gridY };
};

/**
 * 获取所有图标的位置信息
 * @param {NodeList|Array} iconElements - 图标元素列表
 * @returns {Array} 位置信息数组
 */
const getAllIconPositions = (iconElements) => {
  const elements = Array.from(iconElements);
  return elements.map(element => {
    const position = getIconGridPosition(element);
    if (!position) return null;
    return {
      id: element.dataset.id,
      gridX: position.gridX,
      gridY: position.gridY
    };
  }).filter(Boolean);
};

/**
 * 设置图标选中状态
 * @param {HTMLElement} iconElement - 图标元素
 * @param {boolean} selected - 是否选中
 * @returns {HTMLElement} 设置状态后的图标元素
 */
const setIconSelected = (iconElement, selected) => {
  if (!iconElement) return iconElement;
  if (selected) {
    addClass(iconElement, 'selected');
  } else {
    removeClass(iconElement, 'selected');
  }
  return iconElement;
};

/**
 * 清除所有图标的选中状态
 * @param {NodeList|Array} iconElements - 图标元素列表
 * @returns {Array} 清除状态后的图标元素数组
 */
const clearAllIconSelection = (iconElements) => {
  const elements = Array.from(iconElements);
  return elements.map(element => setIconSelected(element, false));
};

/**
 * 设置图标拖拽状态
 * @param {HTMLElement} iconElement - 图标元素
 * @param {boolean} dragging - 是否正在拖拽
 * @returns {HTMLElement} 设置状态后的图标元素
 */
const setIconDragging = (iconElement, dragging) => {
  if (!iconElement) return iconElement;
  if (dragging) {
    addClass(iconElement, 'dragging');
  } else {
    removeClass(iconElement, 'dragging');
  }
  return iconElement;
};

/**
 * 创建拖拽预览元素
 * @param {HTMLElement} originalIcon - 原始图标元素
 * @returns {HTMLElement} 拖拽预览元素
 */
const createDragPreview = (originalIcon) => {
  if (!originalIcon) return null;
  const preview = originalIcon.cloneNode(true);
  addClass(preview, 'drag-preview');

  // 读取原始图标的实际渲染尺寸，锁定预览的宽高，避免脱离容器后被其他样式放大
  const iconRect = originalIcon.getBoundingClientRect();
  const origImg = originalIcon.querySelector('img');
  const origTitle = originalIcon.querySelector('span');
  const imgRect = origImg ? origImg.getBoundingClientRect() : null;
  const titleStyles = origTitle ? window.getComputedStyle(origTitle) : null;

  // 预览容器样式：固定宽高，禁用过渡与变换，悬浮层不阻挡指针事件
  setStyles(preview, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.8',
    width: `${Math.round(iconRect.width)}px`,
    height: `${Math.round(iconRect.height)}px`,
    transform: 'none',
    transition: 'none',
    left: '0px',
    top: '0px'
  });

  // 同步内部图片与标题的实际尺寸，确保等比例且不受外部选择器影响
  const previewImg = preview.querySelector('img');
  if (previewImg && imgRect) {
    setStyles(previewImg, {
      width: `${Math.round(imgRect.width)}px`,
      height: `${Math.round(imgRect.height)}px`,
      objectFit: 'contain'
    });
  }
  const previewTitle = preview.querySelector('span');
  if (previewTitle && titleStyles) {
    setStyles(previewTitle, {
      fontSize: titleStyles.fontSize,
      lineHeight: titleStyles.lineHeight
    });
  }

  // 保存尺寸用于移动时居中定位
  preview.dataset.pw = `${Math.round(iconRect.width)}`;
  preview.dataset.ph = `${Math.round(iconRect.height)}`;

  return preview;
};

/**
 * 更新拖拽预览位置
 * @param {HTMLElement} previewElement - 预览元素
 * @param {number} x - X坐标（通常为鼠标clientX）
 * @param {number} y - Y坐标（通常为鼠标clientY）
 * @returns {HTMLElement} 更新位置后的预览元素
 */
const updateDragPreviewPosition = (previewElement, x, y) => {
  if (!previewElement) return previewElement;
  const pw = parseFloat(previewElement.dataset.pw || '80');
  const ph = parseFloat(previewElement.dataset.ph || '80');
  setStyles(previewElement, {
    left: `${x - pw / 2}px`,
    top: `${y - ph / 2}px`
  });
  return previewElement;
};

/**
 * 移除拖拽预览元素
 * @param {HTMLElement} previewElement - 预览元素
 * @returns {void}
 */
const removeDragPreview = (previewElement) => {
  if (previewElement && previewElement.parentNode) {
    previewElement.parentNode.removeChild(previewElement);
  }
};

/**
 * 计算桌面容器的网格尺寸
 * @param {HTMLElement} container - 桌面容器
 * @param {number|Object} grid - 网格配置
 * @returns {Object} 网格尺寸对象 {cols, rows}
 */
const calculateDesktopGridSize = (container, grid = 80) => {
  if (!container) return { cols: 0, rows: 0 };
  const g = normalizeGrid(grid);
  const rect = container.getBoundingClientRect();
  const usableW = Math.max(0, rect.width - g.padding * 2);
  const usableH = Math.max(0, rect.height - g.padding * 2);
  const stepX = g.width + g.gap;
  const stepY = g.height + g.gap;
  return {
    cols: Math.max(1, Math.floor((usableW + g.gap) / stepX)),
    rows: Math.max(1, Math.floor((usableH + g.gap) / stepY))
  };
};

/**
 * 验证位置是否在桌面范围内
 * @param {number} gridX - 网格X坐标
 * @param {number} gridY - 网格Y坐标
 * @param {HTMLElement} container - 桌面容器
 * @param {number|Object} grid - 网格配置
 * @returns {boolean} 是否在范围内
 */
const isPositionInDesktop = (gridX, gridY, container, grid = 80) => {
  if (gridX < 0 || gridY < 0) return false;
  const { cols, rows } = calculateDesktopGridSize(container, grid);
  return gridX < cols && gridY < rows;
};

/**
 * 自动排列图标
 * @param {Array} iconsData - 图标数据数组
 * @param {HTMLElement} container - 桌面容器
 * @param {number|Object} grid - 网格配置
 * @returns {Array} 排列后的图标数据数组
 */
const autoArrangeIcons = (iconsData, container, grid = 80) => {
  if (!Array.isArray(iconsData) || !container) return iconsData;
  const { cols } = calculateDesktopGridSize(container, grid);
  if (cols === 0) return iconsData;
  return iconsData.map((iconData, index) => {
    const gridX = index % cols;
    const gridY = Math.floor(index / cols);
    return { ...iconData, gridX, gridY };
  });
};

/**
 * 创建或更新网格背景
 * @param {HTMLElement} container - 容器元素
 * @param {number|Object} grid - 网格配置
 * @param {boolean} visible - 是否可见
 * @returns {HTMLElement|null} 网格背景元素
 */
const createGridBackground = (container, grid = 80, visible = false) => {
  if (!container) return null;
  const g = normalizeGrid(grid);
  const stepX = g.width + g.gap;
  const stepY = g.height + g.gap;

  let gridElement = container.querySelector('.desktop-grid');
  if (!gridElement) {
    gridElement = createElement('div', { className: 'desktop-grid' });
    container.appendChild(gridElement);
  }

  setStyles(gridElement, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
      `,
    backgroundSize: `${stepX}px ${stepY}px`,
    pointerEvents: 'none',
    opacity: visible ? '1' : '0',
    transition: 'opacity 0.3s ease'
  });

  return gridElement;
};

// 导出模块
export {
  calculateGridPosition,
  calculatePixelPosition,
  isPositionOccupied,
  findNearestEmptyPosition,
  createIconElement,
  setIconPosition,
  renderIcon,
  renderIcons,
  updateIconPosition,
  getIconGridPosition,
  getAllIconPositions,
  setIconSelected,
  clearAllIconSelection,
  setIconDragging,
  createDragPreview,
  updateDragPreviewPosition,
  removeDragPreview,
  calculateDesktopGridSize,
  isPositionInDesktop,
  autoArrangeIcons,
  createGridBackground
};