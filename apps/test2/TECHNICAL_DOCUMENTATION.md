# 项目技术文档（/Users/bt.cn/Desktop/test2）

本文件概述项目结构，逐文件列出主要职责与函数清单（含签名/返回/简述），并给出关键业务逻辑、依赖关系与配置项说明，以及简要示例。

---
## 1. 项目结构概述
- 根目录
  - .vscode/settings.json（编辑器配置）
  - index.html（页面结构与容器）
  - script.js（传统模式：加载进度/桌面逻辑）
  - static/
    - main.js（现代模式：状态、初始化、事件、清理）
    - desktop-renderer.js（网格与图标渲染/定位/预览）
    - event-handlers.js（拖拽/点击/键盘/Resize/右键处理）
    - dom-utils.js（DOM 安全、样式/属性、事件工具）
    - config-manager.js（配置加载/合并/校验/热重载/查询）
    - loading-manager.js（加载遮罩与进度）
    - styles.css（样式）
    - json/
      - desktop-settings.json（桌面与布局配置）
      - apps-config.json（应用清单/分类/自启）

---
## 2. 文件说明与函数清单

### 2.1 static/main.js（现代中枢）
- 职责：应用状态与加载遮罩管理；加载配置并渲染桌面；绑定交互；页面卸载清理。
- 函数（签名 -> 返回：简述）
  - updateAppState(updates: Object) -> void：不可变更新全局状态。
  - getAppState() -> Object：返回状态快照。
  - localHideOverlay(els: { overlay:HTMLElement }) -> void：隐藏加载遮罩（本地）。
  - initializeLoadingProgress() -> Promise<{ init:Function, finish:Function, update:Function }>：创建加载管理器（失败时回退）。
  - computeGridObject(config: Object) -> { width:number, height:number, gap:number, padding:number }：提炼网格参数。
  - initializeDesktop(config?) -> Promise<void>：加载/合并配置、渲染、事件、隐藏遮罩。
  - renderDesktopIcons(config, container:HTMLElement) -> HTMLElement[]：批量渲染图标。
  - initializeEventHandlers(container: HTMLElement, config: Object) -> Array<()=>void>：创建并绑定交互处理器。
  - saveIconPosition(id:string, pos:{row:number,col:number}) -> void：持久化位置（实现可扩展）。
  - cleanup() -> void：移除监听与资源。
- 调用关系概览：依赖 config-manager（配置）、desktop-renderer（渲染/坐标）、event-handlers（交互）、loading-manager（遮罩）。
- 函数
  - normalizeGrid(grid:number|Object, defaultSize=80, defaultPadding=10) -> { width:number, height:number, gap:number, padding:number }
  - 参数：
    - grid：数值或包含 width/height/gap/padding 的对象。
    - defaultSize：默认网格尺寸。
    - defaultPadding：默认边距。
  - 返回：正规化网格对象，字段齐备。

- calculateGridPosition(x:number, y:number, grid=80) -> { gridX:number, gridY:number }
  - 参数：x/y 为像素坐标；grid 为网格尺寸（或从 normalizeGrid 提取的 width）。
  - 返回：网格坐标（列/行）。

- calculatePixelPosition(gridX:number, gridY:number, grid=80) -> { x:number, y:number }
  - 参数：网格坐标与网格尺寸。
  - 返回：像素坐标（左上角定位）。

- isPositionOccupied(gridX:number, gridY:number, occupied: Set<string>|Map<string,{gridX:number,gridY:number}>|((gx:number,gy:number)=>boolean), excludeId?:string) -> boolean
  - 参数：
    - occupied：占位集合/映射或检查函数；字符串键可约定为 `${gridX},${gridY}`。
    - excludeId：可选，被拖拽元素自身的 id 用于排除。
  - 返回：该网格是否已被占用。

- findNearestEmptyPosition(targetGX:number, targetGY:number, occupied: 同上, maxDistance=10, excludeId?:string) -> { gridX:number, gridY:number }
  - 参数：目标网格坐标、占位集合、最大搜索圈层距离、排除 id。
  - 返回：就近的可用网格位置；若未找到可能回退为原位或边界位置（视实现）。

- createIconElement(icon: { id:string, name:string, icon:string, position?:{row:number,col:number}, [k:string]:any }) -> HTMLElement
  - 参数：
    - icon：应用描述对象；icon 为图片 URL 或内置资源路径。
  - 返回：包含 .desktop-icon 与子节点（图标、标题）的元素。

- setIconPosition(el:HTMLElement, gridX:number, gridY:number, grid=80) -> void
  - 参数：目标元素、网格坐标、网格尺寸。
  - 返回：无；通过 style.transform/left/top 等定位。

- applyIconSizing(el:HTMLElement, grid=80, options?:{ textMaxWidth?:number }) -> void
  - 参数：元素、网格尺寸、可选项（例如标题最大宽度）。
  - 返回：无；应用大小相关样式。

- renderIcon(icon, container:HTMLElement, grid=80) -> HTMLElement
  - 参数：应用对象、容器、网格尺寸。
  - 返回：创建并已插入 DOM 的图标元素。

- renderIcons(icons:any[], container:HTMLElement, grid=80) -> HTMLElement[]
  - 参数：应用数组、容器、网格尺寸。
  - 返回：图标元素数组。

- updateIconPosition(el:HTMLElement, x:number, y:number, grid=80) -> void
  - 参数：元素、像素坐标、网格尺寸。
  - 返回：无；用于拖拽过程中的实时位置更新（可配合拖拽预览）。

- getIconGridPosition(el:HTMLElement) -> { gridX:number, gridY:number }
  - 参数：元素。
  - 返回：读取数据属性或计算得到的当前网格坐标。

- getAllIconPositions(els: NodeList|HTMLElement[]) -> Map<string,{ gridX:number, gridY:number }>
  - 参数：一组图标元素。
  - 返回：以元素 id 为键的网格位置映射。

- setIconSelected(el:HTMLElement, selected:boolean) -> void / clearAllIconSelection(els) -> void
  - 参数：元素（或集合）与选中布尔值。
  - 返回：无；通过类名或样式体现选中态。

- setIconDragging(el:HTMLElement, dragging:boolean) -> void
  - 参数：元素、拖拽态布尔值。
  - 返回：无；常用于添加“拖拽中”样式。

- createDragPreview(original:HTMLElement) -> HTMLElement
  - 参数：源图标元素。
  - 返回：用于拖拽的预览元素（通常为半透明克隆）。

- updateDragPreviewPosition(preview:HTMLElement, x:number, y:number) -> void / removeDragPreview(preview) -> void
  - 参数：预览元素与位置；或需要移除的预览元素。
  - 返回：无。

- calculateDesktopGridSize(container:HTMLElement, grid=80) -> { rows:number, cols:number }
  - 参数：容器与网格尺寸。
  - 返回：容器可容纳的网格行列数（向下取整）。

- isPositionInDesktop(gridX:number, gridY:number, container:HTMLElement, grid=80) -> boolean
  - 参数：网格坐标、容器与网格尺寸。
  - 返回：是否处于容器边界内。

- autoArrangeIcons(icons:any[], container:HTMLElement, grid=80) -> HTMLElement[]
  - 参数：应用数组或元素数组、容器、网格尺寸。
  - 返回：按行列依次排列后的元素数组。

- createGridBackground(container:HTMLElement, grid=80, visible=false) -> HTMLElement
  - 参数：容器、网格尺寸、是否可见。
  - 返回：网格背景元素，已插入容器。




  - 参数：元素、像素坐标、网格尺寸。
  - 返回：无；用于拖拽过程中的实时位置更新（可配合拖拽预览）。

- getIconGridPosition(el:HTMLElement) -> { gridX:number, gridY:number }
  - 参数：元素。
  - 返回：读取数据属性或计算得到的当前网格坐标。

- getAllIconPositions(els: NodeList|HTMLElement[]) -> Map<string,{ gridX:number, gridY:number }>
  - 参数：一组图标元素。
  - 返回：以元素 id 为键的网格位置映射。

- setIconSelected(el:HTMLElement, selected:boolean) -> void / clearAllIconSelection(els) -> void
  - 参数：元素（或集合）与选中布尔值。
  - 返回：无；通过类名或样式体现选中态。

- setIconDragging(el:HTMLElement, dragging:boolean) -> void
  - 参数：元素、拖拽态布尔值。
  - 返回：无；常用于添加“拖拽中”样式。

- createDragPreview(original:HTMLElement) -> HTMLElement
  - 参数：源图标元素。
  - 返回：用于拖拽的预览元素（通常为半透明克隆）。

- updateDragPreviewPosition(preview:HTMLElement, x:number, y:number) -> void / removeDragPreview(preview) -> void
  - 参数：预览元素与位置；或需要移除的预览元素。
  - 返回：无。

- calculateDesktopGridSize(container:HTMLElement, grid=80) -> { rows:number, cols:number }
  - 参数：容器与网格尺寸。
  - 返回：容器可容纳的网格行列数（向下取整）。

- isPositionInDesktop(gridX:number, gridY:number, container:HTMLElement, grid=80) -> boolean
  - 参数：网格坐标、容器与网格尺寸。
  - 返回：是否处于容器边界内。

- autoArrangeIcons(icons:any[], container:HTMLElement, grid=80) -> HTMLElement[]
  - 参数：应用数组或元素数组、容器、网格尺寸。
  - 返回：按行列依次排列后的元素数组。

- createGridBackground(container:HTMLElement, grid=80, visible=false) -> HTMLElement
  - 参数：容器、网格尺寸、是否可见。
  - 返回：网格背景元素，已插入容器。

- createDragState(el:HTMLElement, startX:number, startY:number, offsetX:number, offsetY:number) -> DragState
  - 参数：源元素、按下时指针坐标、指针相对元素偏移。
  - 返回：拖拽状态对象，如 { el,startX,startY,offsetX,offsetY,isDragging:false,... }。

- updateDragState(state:DragState, updates:Object) -> DragState
  - 参数：现有状态、增量更新。
  - 返回：新的状态对象（不可变）。

- calculateMouseOffset(evt:MouseEvent, el:HTMLElement) -> { offsetX:number, offsetY:number }
  - 参数：鼠标事件与元素。
  - 返回：事件指针相对元素左上角的偏移量。

- handleMouseDown(evt:MouseEvent, iconEl:HTMLElement, onDragStart:(state:DragState)=>void) -> DragState
  - 参数：
    - evt：mousedown 事件。
    - iconEl：目标图标元素。
    - onDragStart：回调，于即将开始拖拽时触发。
  - 返回：初始 DragState。

- handleMouseMove(evt:MouseEvent, dragState:DragState, onDragMove:(state:DragState, evt:MouseEvent)=>void, threshold=5) -> DragState
  - 参数：
    - threshold：拖拽识别阈值（像素）。
  - 返回：更新后的 DragState；超过阈值后置 isDragging=true 并持续触发 onDragMove。

- handleMouseUp(evt:MouseEvent, dragState:DragState, container:HTMLElement, onDragEnd:(result:{gridX:number,gridY:number,state:DragState,moved?:boolean,element?:HTMLElement,oldPosition?:any,newPosition?:any})=>void, grid:number|{width:number,height:number,gap:number,padding:number}=80) -> Object|null
  - 参数：
    - container：用于边界与网格计算的容器。
    - onDragEnd：释放时回调，通常返回最终网格位置与状态。
    - grid：可为单一数字（表示网格尺寸）或网格对象（width/height/gap/padding）。
  - 返回：拖拽结果对象或 null；内部会调用 onDragEnd(result)。

- handleIconClick(evt:MouseEvent, iconEl:HTMLElement, onIconClick:(el:HTMLElement, evt:MouseEvent)=>void) -> void
- handleIconDoubleClick(evt:MouseEvent, iconEl:HTMLElement, onIconDoubleClick:(el:HTMLElement, url?:string, evt:MouseEvent)=>void) -> void
- handleDesktopClick(evt:MouseEvent, onDesktopClick:(evt:MouseEvent)=>void) -> void
- handleKeyPress(evt:KeyboardEvent, onKeyPress:(evt:KeyboardEvent)=>void) -> void
  - 参数：事件、目标元素与对应回调。
  - 返回：无。

- createDragHandler(container:HTMLElement, callbacks:{ onDragStart?, onDragMove?, onDragEnd?, onIconClick?, onIconDoubleClick?, onDesktopClick? }={}, grid:number|{width:number,height:number,gap:number,padding:number}=80) -> ()=>void
  - 参数：
    - callbacks：
      - onDragStart(state:DragState)
      - onDragMove(state:DragState, evt:MouseEvent)
      - onDragEnd(result:{gridX:number,gridY:number,state:DragState,moved?:boolean,element?:HTMLElement,oldPosition?:any,newPosition?:any})
      - onIconClick(iconEl:HTMLElement, evt:MouseEvent)
      - onIconDoubleClick(iconEl:HTMLElement, url?:string, evt:MouseEvent)
      - onDesktopClick(evt:MouseEvent)
    - grid：同上，支持数字或网格对象。
  - 返回：清理函数；调用后会移除所有相关事件监听并清理临时状态（拖拽预览、选择框）。

- createKeyboardHandler(onKeyPress:(evt:KeyboardEvent)=>void) -> ()=>void
- createResizeHandler(onResize:(size?:{width:number,height:number})=>void, debounceMs=250) -> ()=>void
- createContextMenuHandler(container:HTMLElement, onContextMenu:(evt:MouseEvent, iconEl:HTMLElement|null)=>void) -> ()=>void



### 2.2 static/desktop-renderer.js（网格与渲染）
- 职责：网格规范化/换算、图标 DOM 创建与渲染、状态样式、拖拽预览、自动排列、网格背景。
- 函数
  - normalizeGrid(grid:number|Object, defaultSize=80, defaultPadding=10) -> { width:number, height:number, gap:number, padding:number }
  - 参数：
    - grid：数值或包含 width/height/gap/padding 的对象。
    - defaultSize：默认网格尺寸。
    - defaultPadding：默认边距。
  - 返回：正规化网格对象，字段齐备。

- calculateGridPosition(x:number, y:number, grid=80) -> { gridX:number, gridY:number }
  - 参数：x/y 为像素坐标；grid 为网格尺寸（或从 normalizeGrid 提取的 width）。
  - 返回：网格坐标（列/行）。

- calculatePixelPosition(gridX:number, gridY:number, grid=80) -> { x:number, y:number }
  - 参数：网格坐标与网格尺寸。
  - 返回：像素坐标（左上角定位）。

- isPositionOccupied(gridX:number, gridY:number, occupied: Set<string>|Map<string,{gridX:number,gridY:number}>|((gx:number,gy:number)=>boolean), excludeId?:string) -> boolean
  - 参数：
    - occupied：占位集合/映射或检查函数；字符串键可约定为 `${gridX},${gridY}`。
    - excludeId：可选，被拖拽元素自身的 id 用于排除。
  - 返回：该网格是否已被占用。

- findNearestEmptyPosition(targetGX:number, targetGY:number, occupied: 同上, maxDistance=10, excludeId?:string) -> { gridX:number, gridY:number }
  - 参数：目标网格坐标、占位集合、最大搜索圈层距离、排除 id。
  - 返回：就近的可用网格位置；若未找到可能回退为原位或边界位置（视实现）。

- createIconElement(icon: { id:string, name:string, icon:string, position?:{row:number,col:number}, [k:string]:any }) -> HTMLElement
  - 参数：
    - icon：应用描述对象；icon 为图片 URL 或内置资源路径。
  - 返回：包含 .desktop-icon 与子节点（图标、标题）的元素。

- setIconPosition(el:HTMLElement, gridX:number, gridY:number, grid=80) -> void
  - 参数：目标元素、网格坐标、网格尺寸。
  - 返回：无；通过 style.transform/left/top 等定位。

- applyIconSizing(el:HTMLElement, grid=80, options?:{ textMaxWidth?:number }) -> void
  - 参数：元素、网格尺寸、可选项（例如标题最大宽度）。
  - 返回：无；应用大小相关样式。

- renderIcon(icon, container:HTMLElement, grid=80) -> HTMLElement
  - 参数：应用对象、容器、网格尺寸。
  - 返回：创建并已插入 DOM 的图标元素。

- renderIcons(icons:any[], container:HTMLElement, grid=80) -> HTMLElement[]
  - 参数：应用数组、容器、网格尺寸。
  - 返回：图标元素数组。

- updateIconPosition(el:HTMLElement, x:number, y:number, grid=80) -> void
  - 参数：元素、像素坐标、网格尺寸。
  - 返回：无；用于拖拽过程中的实时位置更新（可配合拖拽预览）。

- getIconGridPosition(el:HTMLElement) -> { gridX:number, gridY:number }
  - 参数：元素。
  - 返回：读取数据属性或计算得到的当前网格坐标。

- getAllIconPositions(els: NodeList|HTMLElement[]) -> Map<string,{ gridX:number, gridY:number }>
  - 参数：一组图标元素。
  - 返回：以元素 id 为键的网格位置映射。

- setIconSelected(el:HTMLElement, selected:boolean) -> void / clearAllIconSelection(els) -> void
  - 参数：元素（或集合）与选中布尔值。
  - 返回：无；通过类名或样式体现选中态。

- setIconDragging(el:HTMLElement, dragging:boolean) -> void
  - 参数：元素、拖拽态布尔值。
  - 返回：无；常用于添加“拖拽中”样式。

- createDragPreview(original:HTMLElement) -> HTMLElement
  - 参数：源图标元素。
  - 返回：用于拖拽的预览元素（通常为半透明克隆）。

- updateDragPreviewPosition(preview:HTMLElement, x:number, y:number) -> void / removeDragPreview(preview) -> void
  - 参数：预览元素与位置；或需要移除的预览元素。
  - 返回：无。

- calculateDesktopGridSize(container:HTMLElement, grid=80) -> { rows:number, cols:number }
  - 参数：容器与网格尺寸。
  - 返回：容器可容纳的网格行列数（向下取整）。

- isPositionInDesktop(gridX:number, gridY:number, container:HTMLElement, grid=80) -> boolean
  - 参数：网格坐标、容器与网格尺寸。
  - 返回：是否处于容器边界内。

- autoArrangeIcons(icons:any[], container:HTMLElement, grid=80) -> HTMLElement[]
  - 参数：应用数组或元素数组、容器、网格尺寸。
  - 返回：按行列依次排列后的元素数组。

- createGridBackground(container:HTMLElement, grid=80, visible=false) -> HTMLElement
  - 参数：容器、网格尺寸、是否可见。
  - 返回：网格背景元素，已插入容器。


### 2.3 static/event-handlers.js
- 职责：安全查询/创建、样式与属性批量设置、事件工具、视口判断、等待工具。
- 函数
  - safeQuerySelector(selector, context=document) -> Element|null
  - safeQuerySelectorAll(selector, context=document) -> NodeList
  - createElement(tagName, attributes={}, children=[]) -> HTMLElement
  - setStyles(el:HTMLElement, styles:Object) -> void
  - setStylesForAll(els, styles) -> void
  - clearStyles(el, properties?) -> void
  - addClass(el, classNames) / removeClass(el, classNames) / toggleClass(el, className) / hasClass(el, className)
  - setAttributes(el, attributes) / getAttribute(el, name)
  - removeElement(el) / removeElements(els) / clearContainer(container)
  - addEventListener(el, type, handler, options?) / addEventListenerToAll(els, type, handler, options?)
  - getBoundingRect(el) -> DOMRect|null / isElementInViewport(el) -> boolean
  - scrollToElement(el, options?) -> void / createDocumentFragment(els=[]) -> DocumentFragment
  - waitForDOMReady() -> Promise<void> / waitForElement(selector, timeout=5000, context=document) -> Promise<Element>

### 2.4 static/dom-utils.js（DOM 工具）
- 职责：安全查询/创建、样式与属性批量设置、事件工具、视口判断、等待工具。
- 函数
  - safeQuerySelector(selector, context=document) -> Element|null
  - safeQuerySelectorAll(selector, context=document) -> NodeList
  - createElement(tagName, attributes={}, children=[]) -> HTMLElement
  - setStyles(el:HTMLElement, styles:Object) -> void
  - setStylesForAll(els, styles) -> void
  - clearStyles(el, properties?) -> void
  - addClass(el, classNames) / removeClass(el, classNames) / toggleClass(el, className) / hasClass(el, className)
  - setAttributes(el, attributes) / getAttribute(el, name)
  - removeElement(el) / removeElements(els) / clearContainer(container)
  - addEventListener(el, type, handler, options?) / addEventListenerToAll(els, type, handler, options?)
  - getBoundingRect(el) -> DOMRect|null / isElementInViewport(el) -> boolean
  - scrollToElement(el, options?) -> void / createDocumentFragment(els=[]) -> DocumentFragment
  - waitForDOMReady() -> Promise<void> / waitForElement(selector, timeout=5000, context=document) -> Promise<Element)

### 2.5 static/config-manager.js（配置管理）
- 职责：加载/合并桌面与应用配置，提供查询 API 与热重载。
- 函数
  - getDefaultDesktopSettings() / getDefaultAppsConfig() -> Object
  - fetchConfig(url) -> Promise<Response>
  - parseJsonResponse(resp) -> Promise<any>
  - loadDesktopSettings(path='./static/json/desktop-settings.json') -> Promise<Object>
  - loadAppsConfig(path='./static/json/apps-config.json') -> Promise<Object>
  - mergeConfigs(desktopSettings, appsConfig) -> {desktop,layout,hotReload,apps,categories,startup}
  - loadAllConfigs(desktopConfigPath?, appsConfigPath?) -> Promise<Config>
  - validateConfig(config) -> boolean
  - getGridSize(config, iconSize='medium') -> {width,height,gap,padding?}
  - getDesktopPadding(config) -> number
  - isAutoArrangeEnabled(config) -> boolean
  - getAutoStartApps(config) -> string[]
  - getStartupDelay(config) -> number
  - createConfigWatcher(hotReloadConfig, onUpdate) -> ()=>void
  - findAppById(config, appId) -> Object|null
  - sortAppsByPosition(apps) -> apps[]
  - createConfigManager(desktopConfigPath?, appsConfigPath?) -> {load,get,startWatching}

### 2.6 static/loading-manager.js（加载遮罩与进度）
- 职责：查询遮罩元素、平滑更新进度、执行预加载（样式/DOM/配置/图片）并最终隐藏遮罩。
- 函数
  - queryLoadingElements() -> { overlay:HTMLElement, fill:HTMLElement, text:HTMLElement }
  - calcDuration(from:number,to:number) -> number
  - createProgressUpdater(elements:{fill:HTMLElement,text:HTMLElement}) -> (value:number,label?:string)=>void
  - hideOverlay(elements:{overlay:HTMLElement}) -> void
  - defaultChecks() -> Array<()=>Promise<void>>
  - createLoadingManager(tasks?:Array<()=>Promise<void>>) -> { init:()=>Promise<void>, finish:()=>void, update:(v:number,l?:string)=>void, getPreloadedConfig:()=>{desktopSettings:any,appsConfig:any} }

+ <!-- 旧版 API 列表已移除，以下为当前实现的接口；避免歧义。 -->
+ 说明：以上为当前实现的完整接口；旧版 API 描述已移除以避免歧义。

### 2.7 script.js（传统/Legacy 模式）
- 职责：在无模块环境下完成加载进度、配置加载、图标渲染与拖拽/选中等。
- 顶层函数
  - initializeLegacyMode()：入口，挂到 window。
  - initializeLoadingProgress() 及 smoothUpdateProgress/animate/checkStylesLoaded/checkImagesLoaded/checkDOMReady：进度与遮罩。
  - legacyDesktopInit()：核心初始化，内部定义：
    - loadDesktopSettings()/loadAppsConfig()（fetch+fallback）
    - applyDesktopBackground()/applyDesktopTheme()
    - handleAutoStartApps()/setupHotReload()
    - renderDesktopIcons()/getGridDef()/createIconElement()/positionIcons()
    - selectIcon()/deselectIcon()/bindIconEvents()

### 2.8 index.html 与 static/styles.css
- index.html：提供加载遮罩与 .desktop-container 容器，脚本与样式引入。
- styles.css：桌面背景、图标项尺寸与文字样式、选中/拖拽态、遮罩动画与隐藏。

---
## 3. 关键业务逻辑
- 网格与定位：像素↔网格换算；占用检测；最近空位搜索；自动排列；边界与吸附。
- 拖拽交互：mousedown/mousemove/mouseup 生命周期；5px 阈值防抖；拖拽预览（可选）；释放后校验占位并更新网格位置。
- 加载遮罩：默认检查（样式/图片/DOM 就绪）+ 平滑动画；完成后隐藏遮罩。
- 配置热重载：周期轮询 Last-Modified 或自定义 watcher；检测变更后重新加载/渲染。

---
## 4. 依赖关系
- 模块内依赖：
  - main.js ⇢ config-manager、desktop-renderer、event-handlers、loading-manager、dom-utils
  - desktop-renderer.js ⇢ dom-utils
  - event-handlers.js ⇢ desktop-renderer、dom-utils
  - config-manager.js ⇢ fetch/JSON
  - loading-manager.js ⇢ DOM/RAF
  - script.js（自包含，不依赖 static/*.js）
- 第三方库：无；全部基于浏览器原生 API。

---
## 5. 配置项说明（static/json）
### 5.1 desktop-settings.json
- desktop.gridSize：small|medium|large 的 {width,height,gap}
- desktop.padding：桌面边距(px)
- desktop.iconSize：默认图标尺寸
- desktop.background：{type:'image'|'gradient'|'color', value, options?, fallback?}
- desktop.theme：{iconTextColor, iconTextShadow, selectionColor, selectionBorder}
- layout：{autoArrange, snapToGrid, allowOverlap}
- hotReload：{enabled, interval}

### 5.2 apps-config.json
- apps[]：{id,name,icon,position:{row,col},type,category,action:{type,target,params?},metadata}
- categories：{key:{name,color}}
- startup：{autoStart:string[], delay:number}

- updateAppState(updates: Object) -> void
  - 参数：
    - updates：部分状态对象，键值会与现有全局状态做浅合并；例如 { loading:false }。
  - 返回：无。
  - 备注：为不可变更新，避免直接修改内部状态对象。

- getAppState() -> Object
  - 参数：无。
  - 返回：状态快照对象；请勿直接修改返回对象（如需修改请使用 updateAppState）。

- localHideOverlay(els: { overlay:HTMLElement }) -> void
  - 参数：
    - els：由 loading-manager 提供的遮罩元素集合，仅需要 overlay。
  - 返回：无。

- computeGridObject(config: Object) -> { width:number, height:number, gap:number, padding:number }
  - 参数：
    - config：完整合并后的配置对象（见 config-manager）。
  - 返回：网格配置提要：
    - width/height：网格单元宽高。
    - gap：单元间距。
    - padding：桌面边距。

- initializeDesktop(config?: Object) -> Promise<void>
  - 参数：
    - config（可选）：外部传入的配置；若缺省则内部通过 config-manager 加载 json。
  - 返回：Promise<void>，初始化流程包括：加载配置、渲染图标、绑定事件、隐藏遮罩。
  - 失败：配置加载失败、验证失败或必要 DOM 容器缺失。

- renderDesktopIcons(config: Object, container: HTMLElement) -> HTMLElement[]
  - 参数：
    - config：包含 apps 列表与布局参数。
    - container：桌面容器元素。
  - 返回：创建的图标元素数组，顺序与渲染顺序一致。




---
## 3. 关键业务逻辑
- 网格与定位：像素↔网格换算；占用检测；最近空位搜索；自动排列；边界与吸附。
- 拖拽交互：mousedown/mousemove/mouseup 生命周期；5px 阈值防抖；拖拽预览（可选）；释放后校验占位并更新网格位置。
- 加载遮罩：默认检查（样式/图片/DOM 就绪）+ 平滑动画；完成后隐藏遮罩。
- 配置热重载：周期轮询 Last-Modified 或自定义 watcher；检测变更后重新加载/渲染。

---
## 4. 依赖关系
- 模块内依赖：
  - main.js ⇢ config-manager、desktop-renderer、event-handlers、loading-manager、dom-utils
  - desktop-renderer.js ⇢ dom-utils
  - event-handlers.js ⇢ desktop-renderer、dom-utils
  - config-manager.js ⇢ fetch/JSON
  - loading-manager.js ⇢ DOM/RAF
  - script.js（自包含，不依赖 static/*.js）
- 第三方库：无；全部基于浏览器原生 API。

---
## 5. 配置项说明（static/json）
### 5.1 desktop-settings.json
- desktop.gridSize：small|medium|large 的 {width,height,gap}
- desktop.padding：桌面边距(px)
- desktop.iconSize：默认图标尺寸
- desktop.background：{type:'image'|'gradient'|'color', value, options?, fallback?}
- desktop.theme：{iconTextColor, iconTextShadow, selectionColor, selectionBorder}
- layout：{autoArrange, snapToGrid, allowOverlap}
- hotReload：{enabled, interval}

### 5.2 apps-config.json
- apps[]：{id,name,icon,position:{row,col},type,category,action:{type,target,params?},metadata}
- categories：{key:{name,color}}
- startup：{autoStart:string[], delay:number}



---
## 6. 示例
- 拖拽占位：释放时计算网格；若被占用则按距离在可视网格内搜索最近空位并放置。
- 新增应用：向 apps 增加 {id,name,icon,position,...}；若 autoArrange=true 将按 row/col 排列。
- 背景主题：background.type=image 时建议提供 fallback；theme 可调 icon 文本与选区样式。

---
## 7. 函数参数与返回详解

说明：以下为各模块公共函数的更细粒度参数与返回值说明。若源代码中存在默认值与可选项，本文均予以标注。除非特别说明，数值单位均为像素(px)，Promise 失败场景通常包含网络错误、JSON 解析错误或 DOM 未就绪等。

### 7.1 static/main.js
- updateAppState(updates: Object) -> void
  - 参数：
    - updates：部分状态对象，键值会与现有全局状态做浅合并；例如 { loading:false }。
  - 返回：无。
  - 备注：为不可变更新，避免直接修改内部状态对象。

- getAppState() -> Object
  - 参数：无。
  - 返回：状态快照对象；请勿直接修改返回对象（如需修改请使用 updateAppState）。

- localHideOverlay(els: { overlay:HTMLElement, progressBar:HTMLElement, progressText:HTMLElement }) -> void
  - 参数：
    - els：由 loading-manager 提供的遮罩元素集合。
  - 返回：无。

- computeGridObject(config: Object) -> { size:number, padding:number, snap:boolean, allowOverlap:boolean }
  - 参数：
    - config：完整合并后的配置对象（见 config-manager）。
  - 返回：网格配置提要：
    - size：网格尺寸（图标步进尺寸）。
    - padding：桌面边距。
    - snap：是否吸附到网格。
    - allowOverlap：是否允许图标重叠。

- initializeDesktop(config?: Object) -> Promise<void>
  - 参数：
    - config（可选）：外部传入的配置；若缺省则内部通过 config-manager 加载 json。
  - 返回：Promise<void>，初始化流程包括：加载配置、渲染图标、绑定事件、隐藏遮罩。
  - 失败：配置加载失败、验证失败或必要 DOM 容器缺失。

- renderDesktopIcons(config: Object, container: HTMLElement) -> HTMLElement[]
  - 参数：
    - config：包含 apps 列表与布局参数。
    - container：桌面容器元素。
  - 返回：创建的图标元素数组，顺序与渲染顺序一致。