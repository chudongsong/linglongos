// dom-utils.js
// DOM操作工具模块 - 采用函数式编程范式

/**
 * 安全地获取DOM元素
 * @param {string} selector - CSS选择器
 * @param {Document|Element} context - 查找上下文，默认为document
 * @returns {Element|null} DOM元素或null
 */
const safeQuerySelector = (selector, context = document) => {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.warn(`选择器查询失败: ${selector}`, error);
    return null;
  }
};

/**
 * 安全地获取DOM元素列表
 * @param {string} selector - CSS选择器
 * @param {Document|Element} context - 查找上下文，默认为document
 * @returns {NodeList} DOM元素列表
 */
const safeQuerySelectorAll = (selector, context = document) => {
  try {
    return context.querySelectorAll(selector);
  } catch (error) {
    console.warn(`选择器查询失败: ${selector}`, error);
    return [];
  }
};

/**
 * 创建DOM元素
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string|Array} children - 子元素内容
 * @returns {HTMLElement} 创建的DOM元素
 */
const createElement = (tagName, attributes = {}, children = []) => {
  const element = document.createElement(tagName);
  
  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key === 'style') {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        element.style[styleKey] = styleValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // 添加子元素
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });
  
  return element;
};

/**
 * 设置元素样式
 * @param {HTMLElement} element - 目标元素
 * @param {Object} styles - 样式对象
 * @returns {HTMLElement} 设置样式后的元素
 */
const setStyles = (element, styles) => {
  if (!element || !styles) return element;
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property] = value;
  });
  
  return element;
};

/**
 * 批量设置元素样式
 * @param {NodeList|Array} elements - 元素列表
 * @param {Object} styles - 样式对象
 * @returns {Array} 设置样式后的元素数组
 */
const setStylesForAll = (elements, styles) => {
  const elementArray = Array.from(elements);
  return elementArray.map(element => setStyles(element, styles));
};

/**
 * 清除元素的所有样式属性
 * @param {HTMLElement} element - 目标元素
 * @param {Array} properties - 要清除的样式属性数组
 * @returns {HTMLElement} 清除样式后的元素
 */
const clearStyles = (element, properties) => {
  if (!element || !properties) return element;
  
  properties.forEach(property => {
    element.style[property] = '';
  });
  
  return element;
};

/**
 * 添加CSS类
 * @param {HTMLElement} element - 目标元素
 * @param {string|Array} classNames - 类名或类名数组
 * @returns {HTMLElement} 添加类后的元素
 */
const addClass = (element, classNames) => {
  if (!element) return element;
  
  const classes = Array.isArray(classNames) ? classNames : [classNames];
  classes.forEach(className => {
    if (className) element.classList.add(className);
  });
  
  return element;
};

/**
 * 移除CSS类
 * @param {HTMLElement} element - 目标元素
 * @param {string|Array} classNames - 类名或类名数组
 * @returns {HTMLElement} 移除类后的元素
 */
const removeClass = (element, classNames) => {
  if (!element) return element;
  
  const classes = Array.isArray(classNames) ? classNames : [classNames];
  classes.forEach(className => {
    if (className) element.classList.remove(className);
  });
  
  return element;
};

/**
 * 切换CSS类
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @returns {boolean} 切换后是否包含该类
 */
const toggleClass = (element, className) => {
  if (!element || !className) return false;
  return element.classList.toggle(className);
};

/**
 * 检查元素是否包含指定类
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @returns {boolean} 是否包含该类
 */
const hasClass = (element, className) => {
  if (!element || !className) return false;
  return element.classList.contains(className);
};

/**
 * 设置元素属性
 * @param {HTMLElement} element - 目标元素
 * @param {Object} attributes - 属性对象
 * @returns {HTMLElement} 设置属性后的元素
 */
const setAttributes = (element, attributes) => {
  if (!element || !attributes) return element;
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  return element;
};

/**
 * 获取元素属性
 * @param {HTMLElement} element - 目标元素
 * @param {string} attributeName - 属性名
 * @returns {string|null} 属性值
 */
const getAttribute = (element, attributeName) => {
  if (!element || !attributeName) return null;
  return element.getAttribute(attributeName);
};

/**
 * 移除元素
 * @param {HTMLElement} element - 要移除的元素
 * @returns {HTMLElement|null} 被移除的元素
 */
const removeElement = (element) => {
  if (!element || !element.parentNode) return null;
  return element.parentNode.removeChild(element);
};

/**
 * 批量移除元素
 * @param {NodeList|Array} elements - 要移除的元素列表
 * @returns {Array} 被移除的元素数组
 */
const removeElements = (elements) => {
  const elementArray = Array.from(elements);
  return elementArray.map(removeElement).filter(Boolean);
};

/**
 * 清空容器内容
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement} 清空后的容器
 */
const clearContainer = (container) => {
  if (!container) return container;
  
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  return container;
};

/**
 * 添加事件监听器
 * @param {HTMLElement} element - 目标元素
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 * @returns {Function} 移除事件监听器的函数
 */
const addEventListener = (element, eventType, handler, options = {}) => {
  if (!element || !eventType || !handler) {
    return () => {};
  }
  
  element.addEventListener(eventType, handler, options);
  
  // 返回移除监听器的函数
  return () => element.removeEventListener(eventType, handler, options);
};

/**
 * 批量添加事件监听器
 * @param {NodeList|Array} elements - 元素列表
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 * @returns {Function} 移除所有事件监听器的函数
 */
const addEventListenerToAll = (elements, eventType, handler, options = {}) => {
  const elementArray = Array.from(elements);
  const removeListeners = elementArray.map(element => 
    addEventListener(element, eventType, handler, options)
  );
  
  // 返回移除所有监听器的函数
  return () => removeListeners.forEach(remove => remove());
};

/**
 * 获取元素的边界矩形
 * @param {HTMLElement} element - 目标元素
 * @returns {DOMRect|null} 边界矩形对象
 */
const getBoundingRect = (element) => {
  if (!element) return null;
  return element.getBoundingClientRect();
};

/**
 * 检查元素是否在视口内
 * @param {HTMLElement} element - 目标元素
 * @returns {boolean} 是否在视口内
 */
const isElementInViewport = (element) => {
  if (!element) return false;
  
  const rect = getBoundingRect(element);
  if (!rect) return false;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * 平滑滚动到元素
 * @param {HTMLElement} element - 目标元素
 * @param {Object} options - 滚动选项
 * @returns {void}
 */
const scrollToElement = (element, options = {}) => {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * 创建文档片段
 * @param {Array} elements - 元素数组
 * @returns {DocumentFragment} 文档片段
 */
const createDocumentFragment = (elements = []) => {
  const fragment = document.createDocumentFragment();
  
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      fragment.appendChild(element);
    }
  });
  
  return fragment;
};

/**
 * 等待DOM准备就绪
 * @returns {Promise<void>} DOM准备就绪的Promise
 */
const waitForDOMReady = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
      resolve();
    }
  });
};

/**
 * 等待元素出现
 * @param {string} selector - CSS选择器
 * @param {number} timeout - 超时时间(毫秒)
 * @param {Document|Element} context - 查找上下文
 * @returns {Promise<Element>} 元素出现的Promise
 */
const waitForElement = (selector, timeout = 5000, context = document) => {
  return new Promise((resolve, reject) => {
    const element = safeQuerySelector(selector, context);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = safeQuerySelector(selector, context);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });
    
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`元素 ${selector} 在 ${timeout}ms 内未出现`));
    }, timeout);
    
    observer.observe(context, {
      childList: true,
      subtree: true
    });
  });
};

// 导出模块
export {
  safeQuerySelector,
  safeQuerySelectorAll,
  createElement,
  setStyles,
  setStylesForAll,
  clearStyles,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setAttributes,
  getAttribute,
  removeElement,
  removeElements,
  clearContainer,
  addEventListener,
  addEventListenerToAll,
  getBoundingRect,
  isElementInViewport,
  scrollToElement,
  createDocumentFragment,
  waitForDOMReady,
  waitForElement
};