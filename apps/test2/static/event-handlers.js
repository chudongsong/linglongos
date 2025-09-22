// event-handlers.js
// 事件处理模块 - 采用函数式编程范式

import { 
  addEventListener, 
  addEventListenerToAll, 
  safeQuerySelector, 
  safeQuerySelectorAll,
  getBoundingRect 
} from './dom-utils.js';

import {
  calculateGridPosition,
  isPositionOccupied,
  findNearestEmptyPosition,
  setIconPosition,
  setIconSelected,
  clearAllIconSelection,
  setIconDragging,
  createDragPreview,
  updateDragPreviewPosition,
  removeDragPreview,
  getAllIconPositions,
  isPositionInDesktop
} from './desktop-renderer.js';

/**
 * 创建拖拽状态对象
 * @param {HTMLElement} element - 拖拽元素
 * @param {number} startX - 起始X坐标
 * @param {number} startY - 起始Y坐标
 * @param {number} offsetX - 偏移X坐标
 * @param {number} offsetY - 偏移Y坐标
 * @returns {Object} 拖拽状态对象
 */
const createDragState = (element, startX, startY, offsetX, offsetY) => {
  return {
    element,
    startX,
    startY,
    offsetX,
    offsetY,
    isDragging: false,
    preview: null,
    originalPosition: {
      gridX: parseInt(element.dataset.gridX ?? element.dataset.col, 10),
      gridY: parseInt(element.dataset.gridY ?? element.dataset.row, 10)
    }
  };
};

/**
 * 更新拖拽状态
 * @param {Object} dragState - 当前拖拽状态
 * @param {Object} updates - 更新对象
 * @returns {Object} 新的拖拽状态
 */
const updateDragState = (dragState, updates) => {
  return { ...dragState, ...updates };
};

/**
 * 计算鼠标相对于元素的偏移
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} element - 目标元素
 * @returns {Object} 偏移对象 {offsetX, offsetY}
 */
const calculateMouseOffset = (event, element) => {
  const rect = getBoundingRect(element);
  if (!rect) return { offsetX: 0, offsetY: 0 };
  
  return {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
};

/**
 * 处理鼠标按下事件
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} iconElement - 图标元素
 * @param {Function} onDragStart - 拖拽开始回调
 * @returns {Object|null} 拖拽状态对象或null
 */
const handleMouseDown = (event, iconElement, onDragStart) => {
  if (!iconElement || event.button !== 0) return null;
  
  event.preventDefault();
  
  const { offsetX, offsetY } = calculateMouseOffset(event, iconElement);
  const dragState = createDragState(
    iconElement,
    event.clientX,
    event.clientY,
    offsetX,
    offsetY
  );
  
  // 设置图标为选中状态
  setIconSelected(iconElement, true);
  
  if (onDragStart) {
    onDragStart(dragState);
  }
  
  return dragState;
};

/**
 * 处理鼠标移动事件
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} dragState - 拖拽状态
 * @param {Function} onDragMove - 拖拽移动回调
 * @param {number} threshold - 拖拽阈值
 * @returns {Object} 更新后的拖拽状态
 */
const handleMouseMove = (event, dragState, onDragMove, threshold = 5) => {
  if (!dragState || !dragState.element) return dragState;
  
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  let newDragState = dragState;
  
  // 检查是否开始拖拽
  if (!dragState.isDragging && distance > threshold) {
    newDragState = updateDragState(dragState, { isDragging: true });
    
    // 创建拖拽预览
    const preview = createDragPreview(dragState.element);
    if (preview) {
      document.body.appendChild(preview);
      newDragState = updateDragState(newDragState, { preview });
    }
    
    // 设置原始元素为拖拽状态
    setIconDragging(dragState.element, true);
  }
  
  // 更新拖拽预览位置
  if (newDragState.isDragging && newDragState.preview) {
    updateDragPreviewPosition(newDragState.preview, event.clientX, event.clientY);
    
    if (onDragMove) {
      onDragMove(newDragState, event);
    }
  }
  
  return newDragState;
};

/**
 * 处理鼠标释放事件
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} dragState - 拖拽状态
 * @param {HTMLElement} desktopContainer - 桌面容器
 * @param {Function} onDragEnd - 拖拽结束回调
 * @param {number|Object} grid - 网格配置
 * @returns {Object|null} 拖拽结果或null
 */
const handleMouseUp = (event, dragState, desktopContainer, onDragEnd, grid = 80) => {
  if (!dragState || !dragState.element) return null;
  
  let result = null;
  
  if (dragState.isDragging) {
    // 计算目标位置
    const containerRect = getBoundingRect(desktopContainer);
    if (containerRect) {
      const relativeX = event.clientX - containerRect.left - dragState.offsetX + 40; // 对齐中心感更自然
      const relativeY = event.clientY - containerRect.top - dragState.offsetY + 40;
      const { gridX, gridY } = calculateGridPosition(relativeX, relativeY, grid);
      
      // 检查位置是否有效
      if (isPositionInDesktop(gridX, gridY, desktopContainer, grid)) {
        const allPositions = getAllIconPositions(
          safeQuerySelectorAll('.icon-item', desktopContainer)
        );
        
        let targetPosition = { gridX, gridY };
        
        // 如果位置被占用，查找最近的空位置
        if (isPositionOccupied(gridX, gridY, allPositions, dragState.element.dataset.id)) {
          const emptyPosition = findNearestEmptyPosition(
            gridX, 
            gridY, 
            allPositions, 
            10, 
            dragState.element.dataset.id
          );
          
          if (emptyPosition) {
            targetPosition = emptyPosition;
          } else {
            // 如果找不到空位置，恢复原位置
            targetPosition = dragState.originalPosition;
          }
        }
        
        // 更新图标位置
        setIconPosition(dragState.element, targetPosition.gridX, targetPosition.gridY, grid);
        
        result = {
          element: dragState.element,
          oldPosition: dragState.originalPosition,
          newPosition: targetPosition,
          moved: (
            targetPosition.gridX !== dragState.originalPosition.gridX ||
            targetPosition.gridY !== dragState.originalPosition.gridY
          )
        };
      } else {
        // 位置无效，恢复原位置
        setIconPosition(
          dragState.element, 
          dragState.originalPosition.gridX, 
          dragState.originalPosition.gridY, 
          grid
        );
      }
    }
    
    // 清理拖拽状态
    setIconDragging(dragState.element, false);
    
    if (dragState.preview) {
      removeDragPreview(dragState.preview);
    }
  }
  
  if (onDragEnd) {
    onDragEnd(result);
  }
  
  return result;
};

/**
 * 处理图标点击事件
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} iconElement - 图标元素
 * @param {Function} onIconClick - 点击回调
 * @returns {void}
 */
const handleIconClick = (event, iconElement, onIconClick) => {
  if (!iconElement) return;
  
  event.stopPropagation();
  
  // 清除其他图标的选中状态（在容器上下文中）
  const container = iconElement.closest('.desktop-container') || document;
  const allIcons = safeQuerySelectorAll('.icon-item', container);
  clearAllIconSelection(allIcons);
  
  // 设置当前图标为选中状态
  setIconSelected(iconElement, true);
  
  if (onIconClick) {
    onIconClick(iconElement, event);
  }
};

/**
 * 处理图标双击事件
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} iconElement - 图标元素
 * @param {Function} onIconDoubleClick - 双击回调
 * @returns {void}
 */
const handleIconDoubleClick = (event, iconElement, onIconDoubleClick) => {
  if (!iconElement) return;
  
  event.stopPropagation();
  
  const url = iconElement.dataset.url;
  if (url) {
    if (onIconDoubleClick) {
      onIconDoubleClick(iconElement, url, event);
    } else {
      // 默认行为：打开链接
      window.open(url, '_blank');
    }
  }
};

/**
 * 处理桌面点击事件（空白区域）
 * @param {MouseEvent} event - 鼠标事件
 * @param {Function} onDesktopClick - 桌面点击回调
 * @returns {void}
 */
const handleDesktopClick = (event, onDesktopClick) => {
  // 若点击不在图标内，则视为点击桌面空白
  if (!event.target.closest('.icon-item')) {
    const container = event.currentTarget || document;
    const allIcons = safeQuerySelectorAll('.icon-item', container);
    clearAllIconSelection(allIcons);
    if (onDesktopClick) onDesktopClick(event);
  }
};

/**
 * 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件
 * @param {Function} onKeyPress - 按键回调
 * @returns {void}
 */
const handleKeyPress = (event, onKeyPress) => {
  if (onKeyPress) {
    onKeyPress(event);
  }
  
  // 处理常见快捷键
  switch (event.key) {
    case 'Escape': {
      const allIcons = safeQuerySelectorAll('.icon-item');
      clearAllIconSelection(allIcons);
      break;
    }
    case 'Delete':
    case 'Backspace':
      // 可以在这里处理删除选中图标的逻辑
      break;
    case 'F5':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault();
      }
      break;
  }
};

/**
 * 创建选择框元素
 * @param {HTMLElement} container - 桌面容器
 * @returns {HTMLElement} 选择框元素
 */
function createSelectionRect(container) {
  const rect = document.createElement('div');
  rect.className = 'selection-rectangle';
  rect.style.position = 'absolute';
  rect.style.left = '0px';
  rect.style.top = '0px';
  rect.style.width = '0px';
  rect.style.height = '0px';
  rect.style.pointerEvents = 'none';
  rect.style.zIndex = '9998';
  container.appendChild(rect);
  return rect;
}

/**
 * 判断两个矩形是否相交（使用客户端坐标）
 * @param {{left:number, top:number, right:number, bottom:number}} a - 矩形A
 * @param {{left:number, top:number, right:number, bottom:number}} b - 矩形B
 * @returns {boolean} 是否相交
 */
function isRectIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

/**
 * 根据选择框高亮选中图标
 * @param {HTMLElement} container - 桌面容器
 * @param {{left:number, top:number, right:number, bottom:number}} selectionRect - 客户端坐标的选择框
 * @returns {void}
 */
function selectIconsWithin(container, selectionRect) {
  const icons = safeQuerySelectorAll('.icon-item', container);
  Array.from(icons).forEach(icon => {
    const r = getBoundingRect(icon);
    const intersect = r ? isRectIntersect(selectionRect, { left: r.left, top: r.top, right: r.right, bottom: r.bottom }) : false;
    setIconSelected(icon, !!intersect);
  });
}

/**
 * 创建拖拽事件处理器
 * - 扩展：支持在桌面空白处拖拽形成选择框（橡皮筋选择）
 * @param {HTMLElement} desktopContainer - 桌面容器
 * @param {Object} callbacks - 回调函数对象
 * @param {number|Object} grid - 网格配置
 * @returns {Function} 移除事件监听器的函数
 */
const createDragHandler = (desktopContainer, callbacks = {}, grid = 80) => {
  let currentDragState = null;
  // 选择框状态
  let selectionState = null;
  // 抑制选择结束后的下一次 click 清除
  let suppressNextClick = false;
  
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    onIconClick,
    onIconDoubleClick,
    onDesktopClick
  } = callbacks;

  /**
   * 取消正在进行的拖拽与框选（用于鼠标移出窗口、窗口失焦等场景）
   * @param {string} reason - 取消原因，仅用于调试/日志
   * @returns {void}
   */
  const cancelDragAndSelection = (reason = 'unknown') => {
    // 终止图标拖拽并清理预览
    if (currentDragState) {
      try {
        if (currentDragState.isDragging) {
          setIconDragging(currentDragState.element, false);
        }
        if (currentDragState.preview) {
          removeDragPreview(currentDragState.preview);
        }
      } finally {
        currentDragState = null;
      }
    }

    // 移除选择框
    if (selectionState) {
      try {
        if (selectionState.rectEl && selectionState.rectEl.parentNode) {
          selectionState.rectEl.parentNode.removeChild(selectionState.rectEl);
        }
      } finally {
        selectionState = null;
      }
    }
    // 避免紧随其后的 click 清空已有选择（例如用户立即点击回到窗口）
    suppressNextClick = true;
    setTimeout(() => { suppressNextClick = false; }, 0);
  };

  /**
   * 处理鼠标离开文档事件（大多数浏览器在离开窗口边界时会触发）
   * @param {MouseEvent} event
   */
  const handleWindowLeaveEvent = (event) => {
    cancelDragAndSelection('document-mouseleave');
  };

  /**
   * 处理 mouseout：当 relatedTarget/toElement 为 null，表示指针离开了窗口
   * @param {MouseEvent} event
   */
  const handleWindowOutEvent = (event) => {
    const to = event.relatedTarget || event.toElement;
    if (!to) {
      cancelDragAndSelection('document-mouseout-null');
    }
  };

  /**
   * 指针被系统取消（如触摸中断、系统手势），需要中止拖拽/框选
   * @param {PointerEvent} event
   */
  const handlePointerCancelEvent = (event) => {
    cancelDragAndSelection('pointer-cancel');
  };

  /**
   * 指针移出窗口（pointer 事件模型），relatedTarget 为 null 时判定为离开
   * @param {PointerEvent} event
   */
  const handlePointerOutEvent = (event) => {
    const to = event.relatedTarget || event.toElement;
    if (!to) {
      cancelDragAndSelection('pointer-out-null');
    }
  };

  /**
   * 页面可见性变化：当页面隐藏时（例如切换标签页/最小化），立即中止拖拽/框选
   * @returns {void}
   */
  const handleVisibilityChangeEvent = () => {
    if (document.hidden) {
      cancelDragAndSelection('visibilitychange-hidden');
    }
  };

  /**
   * 当鼠标离开 html 根元素（部分浏览器更可靠的离开信号）
   * @returns {void}
   */
  const handleHtmlMouseLeaveEvent = () => {
    cancelDragAndSelection('html-mouseleave');
  };

  /**
   * 指针离开 HTML 根元素（部分浏览器在窗口边缘离开时更可靠）
   * @param {PointerEvent} event
   */
  const handlePointerLeaveHtmlEvent = (event) => {
    cancelDragAndSelection('html-pointerleave');
  };

  /**
   * 指针离开窗口（Window 级别）
   * @param {PointerEvent} event
   */
  const handlePointerLeaveWindowEvent = (event) => {
    cancelDragAndSelection('window-pointerleave');
  };

  /**
   * 鼠标离开 <body>（有些浏览器比 document 更容易触发）
   * @param {MouseEvent} event
   */
  const handleBodyMouseLeaveEvent = (event) => {
    cancelDragAndSelection('body-mouseleave');
  };

  /**
   * 处理窗口失焦（例如切到其他应用或系统菜单），应立即终止拖拽/框选
   * @param {FocusEvent} event
   */
  const handleWindowBlurEvent = (event) => {
    cancelDragAndSelection('window-blur');
  };

  // 鼠标按下事件
  const handleMouseDownEvent = (event) => {
    if (event.button !== 0) return; // 仅处理左键
    const iconElement = event.target.closest('.icon-item');
    if (iconElement) {
      currentDragState = handleMouseDown(event, iconElement, onDragStart);
    } else {
      // 在空白区域开始框选
      const containerRect = getBoundingRect(desktopContainer);
      if (!containerRect) return;

      // 清空现有选中
      const allIcons = safeQuerySelectorAll('.icon-item', desktopContainer);
      clearAllIconSelection(allIcons);

      const rectEl = createSelectionRect(desktopContainer);
      selectionState = {
        startX: event.clientX,
        startY: event.clientY,
        rectEl,
        containerRect
      };

      // 初始化位置
      const x = event.clientX - containerRect.left;
      const y = event.clientY - containerRect.top;
      rectEl.style.left = `${x}px`;
      rectEl.style.top = `${y}px`;
      rectEl.style.width = '0px';
      rectEl.style.height = '0px';

      // 阻止默认选中文本行为，增强跨浏览器一致性
      event.preventDefault();
    }
  };
  
  // 鼠标移动事件
  const handleMouseMoveEvent = (event) => {
    if (currentDragState) {
      currentDragState = handleMouseMove(event, currentDragState, onDragMove);
    } else if (selectionState && selectionState.rectEl) {
      const { startX, startY, rectEl, containerRect } = selectionState;

      // 计算选择框在容器坐标中的 left/top/width/height
      const curX = event.clientX;
      const curY = event.clientY;
      const x1 = Math.min(startX, curX);
      const y1 = Math.min(startY, curY);
      const x2 = Math.max(startX, curX);
      const y2 = Math.max(startY, curY);

      rectEl.style.left = `${x1 - containerRect.left}px`;
      rectEl.style.top = `${y1 - containerRect.top}px`;
      rectEl.style.width = `${Math.max(0, x2 - x1)}px`;
      rectEl.style.height = `${Math.max(0, y2 - y1)}px`;

      // 实时高亮相交图标
      selectIconsWithin(desktopContainer, { left: x1, top: y1, right: x2, bottom: y2 });
    }
  };
  
  // 鼠标释放事件
  const handleMouseUpEvent = (event) => {
    if (currentDragState) {
      handleMouseUp(event, currentDragState, desktopContainer, onDragEnd, grid);
      currentDragState = null;
    } else if (selectionState) {
      // 结束框选
      if (selectionState.rectEl && selectionState.rectEl.parentNode) {
        selectionState.rectEl.parentNode.removeChild(selectionState.rectEl);
      }
      selectionState = null;
      // 抑制紧随其后的 click 清空行为
      suppressNextClick = true;
      setTimeout(() => { suppressNextClick = false; }, 0);
    }
  };
  
  // 点击事件
  const handleClickEvent = (event) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    const iconElement = event.target.closest('.icon-item');
    if (iconElement) {
      handleIconClick(event, iconElement, onIconClick);
    } else {
      handleDesktopClick(event, onDesktopClick);
    }
  };
  
  // 双击事件
  const handleDoubleClickEvent = (event) => {
    const iconElement = event.target.closest('.icon-item');
    if (iconElement) {
      handleIconDoubleClick(event, iconElement, onIconDoubleClick);
    }
  };
  
  // 添加事件监听器
  const removeMouseDown = addEventListener(desktopContainer, 'mousedown', handleMouseDownEvent);
  const removeMouseMove = addEventListener(document, 'mousemove', handleMouseMoveEvent);
  const removeMouseUp = addEventListener(document, 'mouseup', handleMouseUpEvent);
  const removeClick = addEventListener(desktopContainer, 'click', handleClickEvent);
  const removeDoubleClick = addEventListener(desktopContainer, 'dblclick', handleDoubleClickEvent);
  // 当鼠标离开窗口或窗口失焦，立即取消拖拽/框选
  const removeMouseLeave = addEventListener(document, 'mouseleave', handleWindowLeaveEvent);
  const removeMouseOut = addEventListener(document, 'mouseout', handleWindowOutEvent, { capture: true });
  const removeWindowBlur = addEventListener(window, 'blur', handleWindowBlurEvent);
  const removePointerOut = addEventListener(document, 'pointerout', handlePointerOutEvent, { capture: true });
  const removePointerCancel = addEventListener(document, 'pointercancel', handlePointerCancelEvent);
  const removeVisibility = addEventListener(document, 'visibilitychange', handleVisibilityChangeEvent);
  const removeHtmlMouseLeave = addEventListener(document.documentElement, 'mouseleave', handleHtmlMouseLeaveEvent);
  // 进一步增强跨浏览器检测
  const removeWindowMouseOut = addEventListener(window, 'mouseout', handleWindowOutEvent, { capture: true });
  const removeBodyMouseLeave = addEventListener(document.body, 'mouseleave', handleBodyMouseLeaveEvent);
  const removePointerLeaveHtml = addEventListener(document.documentElement, 'pointerleave', handlePointerLeaveHtmlEvent);
  const removePointerLeaveWindow = addEventListener(window, 'pointerleave', handlePointerLeaveWindowEvent);
  
  // 返回清理函数
  return () => {
    removeMouseDown();
    removeMouseMove();
    removeMouseUp();
    removeClick();
    removeDoubleClick();
    removeMouseLeave();
    removeMouseOut();
    removeWindowBlur();
    removePointerOut();
    removePointerCancel();
    removeVisibility();
    removeHtmlMouseLeave();
    removeWindowMouseOut();
    removeBodyMouseLeave();
    removePointerLeaveHtml();
    removePointerLeaveWindow();
    
    // 清理当前拖拽状态
    if (currentDragState && currentDragState.preview) {
      removeDragPreview(currentDragState.preview);
    }
    currentDragState = null;

    // 清理选择框
    if (selectionState && selectionState.rectEl && selectionState.rectEl.parentNode) {
      selectionState.rectEl.parentNode.removeChild(selectionState.rectEl);
    }
    selectionState = null;
  };
};

/**
 * 创建键盘事件处理器
 * @param {Function} onKeyPress - 按键回调
 * @returns {Function} 移除事件监听器的函数
 */
const createKeyboardHandler = (onKeyPress) => {
  const handleKeyPressEvent = (event) => {
    handleKeyPress(event, onKeyPress);
  };
  
  return addEventListener(document, 'keydown', handleKeyPressEvent);
};

/**
 * 创建窗口大小变化事件处理器
 * @param {Function} onResize - 大小变化回调
 * @param {number} debounceMs - 防抖延迟
 * @returns {Function} 移除事件监听器的函数
 */
const createResizeHandler = (onResize, debounceMs = 250) => {
  let timeoutId = null;
  
  const handleResizeEvent = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (onResize) {
        onResize();
      }
    }, debounceMs);
  };
  
  return addEventListener(window, 'resize', handleResizeEvent);
};

/**
 * 创建上下文菜单事件处理器
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onContextMenu - 右键菜单回调
 * @returns {Function} 移除事件监听器的函数
 */
const createContextMenuHandler = (container, onContextMenu) => {
  const handleContextMenuEvent = (event) => {
    event.preventDefault();
    
    const iconElement = event.target.closest('.icon-item');
    
    if (onContextMenu) {
      onContextMenu(event, iconElement);
    }
  };
  
  return addEventListener(container, 'contextmenu', handleContextMenuEvent);
};

// 导出模块
export {
  createDragState,
  updateDragState,
  calculateMouseOffset,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleIconClick,
  handleIconDoubleClick,
  handleDesktopClick,
  handleKeyPress,
  createDragHandler,
  createKeyboardHandler,
  createResizeHandler,
  createContextMenuHandler
};