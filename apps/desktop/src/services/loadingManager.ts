/**
 * LoadingManager
 *
 * 提供与测试环境一致的“加载遮罩与进度”行为，适配 React/Vite 架构：
 * - 应用启动时执行基础预检（样式可访问、DOM 就绪）并更新进度
 * - 配置完成加载后，预加载背景与应用图标资源，完成后淡出遮罩
 * - 所有 DOM 查询与更新基于 `index.html` 中的遮罩结构
 */

import type { FullConfig } from '@/types/config'

/**
 * 查询加载界面相关元素
 * - overlay: 最外层遮罩
 * - fill: 进度条填充
 * - text: 进度描述文案
 */
function queryLoadingElements() {
	const overlay = document.getElementById('loadingOverlay') as HTMLElement | null
	const fill = document.getElementById('progressFill') as HTMLElement | null
	const text = document.getElementById('progressText') as HTMLElement | null
	return { overlay, fill, text }
}

/**
 * 创建进度更新器
 * - 将 0-100 的整数进度映射为进度条宽度与文案
 */
function createProgressUpdater(elements: { fill: HTMLElement | null; text: HTMLElement | null }) {
	const BASE_LABEL = '正在启动桌面...'
	/**
	 * 将整数进度同步到遮罩 UI
	 * @param value 当前进度（0-100）
	 * @param label 可选文案（若提供则优先显示）
	 */
	return (value: number, label?: string) => {
		const v = Math.max(0, Math.min(100, Math.round(value)))
		if (elements.fill) elements.fill.style.width = `${v}%`
		if (elements.text) elements.text.textContent = `${label ?? BASE_LABEL} ${v}%`
	}
}

/**
 * 平滑推进进度（由 from -> to）
 * - 使用定时器分步推进，提升观感
 */
async function smoothProgress(
	update: (v: number, l?: string) => void,
	from: number,
	to: number,
	steps = 6,
	duration = 360,
	label?: string,
) {
	const start = Math.max(0, Math.min(100, Math.round(from)))
	const end = Math.max(start, Math.min(100, Math.round(to)))
	const total = Math.max(1, steps)
	const step = (end - start) / total
	const wait = Math.max(16, Math.floor(duration / total))
	for (let i = 1; i <= total; i++) {
		await new Promise((r) => setTimeout(r, wait))
		update(start + step * i, label)
	}
}
export { smoothProgress }

/**
 * 隐藏遮罩层（带过渡）
 */
function hideOverlay(elements: { overlay: HTMLElement | null }) {
	if (!elements?.overlay) return
	elements.overlay.classList.add('fade-out')
	setTimeout(() => {
		if (elements.overlay) elements.overlay.style.display = 'none'
	}, 350)
}

/**
 * 等待样式表可访问（尝试访问 cssRules）
 * - 对同源 CSS 生效；跨域或尚未加载的样式表会抛异常，采用轮询重试
 */
async function waitForStylesLoaded(onProgress?: (fraction: number) => void) {
	const sheets = Array.from(document.styleSheets || [])
	if (sheets.length === 0) {
		if (onProgress) onProgress(1)
		return
	}
	const tryCheck = () => {
		let ok = 0
		for (let i = 0; i < sheets.length; i++) {
			try {
				// 访问 cssRules 可能触发安全错误；加载完成后可访问
				const cssRules = (sheets[i] as CSSStyleSheet).cssRules
				if (cssRules && cssRules.length >= 0) {
					// 仅用于触发访问，避免未使用变量报错
				}
				ok++
			} catch {
				// ignore
			}
		}
		const frac = Math.min(1, ok / sheets.length)
		if (onProgress) onProgress(frac)
		return ok === sheets.length
	}
	if (tryCheck()) return
	await new Promise<void>((resolve) => {
		const timer = setInterval(() => {
			if (tryCheck()) {
				clearInterval(timer)
				if (onProgress) onProgress(1)
				resolve()
			}
		}, 80)
	})
}

/**
 * 预加载图片资源
 * @param urls 图片 URL 列表
 * @param onProgress 进度回调（完成数量/总数）
 */
async function preloadImages(urls: string[], onProgress?: (done: number, total: number) => void) {
	const uniq = Array.from(new Set(urls.filter(Boolean)))
	const total = uniq.length
	if (total === 0) {
		if (onProgress) onProgress(1, 1)
		return
	}
	let done = 0
	await Promise.all(
		uniq.map(
			(url) =>
				new Promise<void>((resolve) => {
					const img = new Image()
					img.onload = img.onerror = () => {
						done += 1
						if (onProgress) onProgress(done, total)
						resolve()
					}
					img.src = url
				}),
		),
	)
}

/**
 * 创建作用域更新器：将 0-1 的分数映射到 [start,end] 百分比区间
 */
// 删除 createScopedUpdater 函数以消除未使用错误

/**
 * 规范化资源 URL：将 "./static/images/" 前缀替换为 "/images/"
 * - 适配本项目 public/images 下的静态资源路径
 */
function normalizeAssetUrl(url?: string): string | undefined {
	if (!url) return url
	return url.replace(/^\.\/static\/images\//, '/images/')
}

/**
 * 从配置中收集需要预加载的图片 URL
 * - 背景图片（若为 image 类型）
 * - 应用图标
 */
function collectImageUrlsFromConfig(config: FullConfig | null | undefined): string[] {
	if (!config) return []
	const urls: string[] = []
	const bg = config.desktop?.background
	if (bg?.type === 'image' && typeof bg.value === 'string') {
		const normalized = normalizeAssetUrl(bg.value)
		if (normalized) urls.push(normalized)
	}
	const apps = Array.isArray(config.apps) ? config.apps : []
	for (const app of apps) {
		if (app?.icon) {
			const normalized = normalizeAssetUrl(app.icon)
			if (normalized) urls.push(normalized)
		}
	}
	// 去重：避免重复资源被预加载多次
	return Array.from(new Set(urls))
}
/**
 * 单例：加载管理器
 * - init(): 执行样式/DOM 预检查并推进至 40%
 * - finishWithConfig(config): 依据配置预加载资源（60%->95%），最后 100% 并隐藏遮罩
 */
/**
 * 加载管理器单例，负责进度计算与遮罩的显示/隐藏。
 */
class LoadingManager {
	private elements = queryLoadingElements()
	private update = createProgressUpdater(this.elements)
	private inited = false
	private finished = false

	/** 阶段进度（0-1）与权重（总和=1），用于合并综合进度显示 */
	private stageFractions: Record<'styles' | 'dom' | 'config' | 'preload', number> = {
		styles: 0,
		dom: 0,
		config: 0,
		preload: 0,
	}
	private weights: Record<'styles' | 'dom' | 'config' | 'preload', number> = {
		styles: 0.1,
		dom: 0.15,
		config: 0.25,
		preload: 0.5,
	}
	private lastPercent = 0

	/** RAF 平滑动画：目标进度、帧循环ID、上次帧时间戳与最大增速（%/s） */
	private targetPercent = 0
	private rafId: number | null = null
	private lastAnimTs = 0
	private readonly maxRatePerSec = 38 // 基础推进速率：更稳重（但允许按需提速以赶上截止时间）

	/** 最短展示与启动时刻（ms） */
	private readonly minDisplayMs = 300
	private startTs = 0

	/** 配置完成后的收尾补齐：在该时长内线性补齐到 100%（ms） */
	private readonly postConfigRampMs = 160
	private rampStartTs = 0
	private rampMode = false

	/**
	 * 设置某阶段的完成度（0-1），并更新综合进度目标
	 */
	private setStage(stage: 'styles' | 'dom' | 'config' | 'preload', fraction: number) {
		const v = Math.max(0, Math.min(1, fraction || 0))
		this.stageFractions[stage] = v
		this.updateComposite()
	}

	/**
	 * 计算综合进度（加权求和 -> 百分数），保证非递减，采用 RAF 平滑推进
	 */
	private updateComposite() {
		const { styles, dom, config, preload } = this.stageFractions
		const sum =
			styles * this.weights.styles +
			dom * this.weights.dom +
			config * this.weights.config +
			preload * this.weights.preload
		const target = Math.max(this.targetPercent, Math.min(100, Math.round(sum * 100)))
		this.targetPercent = target
		if (this.rafId == null) {
			this.lastAnimTs = performance.now()
			this.rafId = requestAnimationFrame(this.animateStep)
		}
	}

	/**
	 * RAF 动画帧：在基础最大速率限制下前进；若处于收尾补齐阶段，则按截止时间动态提速以保证可在 postConfigRampMs 内完成。
	 */
	private animateStep = (now: number) => {
		const dt = Math.max(0, now - this.lastAnimTs)
		this.lastAnimTs = now

		const needed = Math.max(0, this.targetPercent - this.lastPercent)
		if (needed <= 0.0001) {
			// 已达目标，停止动画
			if (this.rafId != null) cancelAnimationFrame(this.rafId)
			this.rafId = null
			return
		}

		// 基础速率步长（按帧）
		const baseStep = (this.maxRatePerSec / 100) * dt

		// 收尾补齐：根据剩余时间计算“为赶上截止时间所需的线性步长”
		let step = baseStep
		if (this.rampMode) {
			const elapsed = now - this.rampStartTs
			const remainMs = Math.max(0, this.postConfigRampMs - elapsed)
			if (remainMs > 0) {
				const stepByDeadline = (needed / remainMs) * dt
				// 取“为赶上截止时间所需的步长”与“基础步长”中的较大值，既保证稳态推进，也保证不超时
				step = Math.min(needed, Math.max(baseStep, stepByDeadline))
			} else {
				// 截止时间已到，直接补齐
				step = needed
				this.rampMode = false
			}
		} else {
			step = Math.min(needed, baseStep)
		}

		this.lastPercent = Math.min(100, this.lastPercent + step)
		this.update(Math.round(this.lastPercent))
		this.rafId = requestAnimationFrame(this.animateStep)
	}

	/**
	 * 初始化加载器：样式就绪与（模拟）DOM 准备，推进综合进度
	 */
	async init() {
		try {
			if (this.inited) return
			this.inited = true
			this.startTs = performance.now()
			// 样式加载进度（0-1）
			await waitForStylesLoaded((frac) => this.setStage('styles', frac))
			// DOM 阶段：平滑推进至 1（平衡稳重与速度）
			for (let i = 1; i <= 6; i++) {
				await new Promise((r) => setTimeout(r, 50))
				this.setStage('dom', Math.min(1, i / 6))
			}
		} catch {
			// 出错时也推进到一个合理的初始进度
			this.setStage('styles', 1)
			this.setStage('dom', 1)
		}
	}

	/**
	 * 小工具：等待直到条件达成或超时（默认 240ms），避免死等
	 */
	private waitUntil(cond: () => boolean, timeoutMs = 240): Promise<void> {
		return new Promise((resolve) => {
			const start = performance.now()
			const tick = () => {
				if (cond()) return resolve()
				if (performance.now() - start >= timeoutMs) return resolve()
				setTimeout(tick, 16)
			}
			tick()
		})
	}

	/**
	 * 依据配置预加载资源并隐藏遮罩（更稳版）
	 * - 标记配置阶段完成（正式加载状态）
	 * - 预加载后台进行（不阻塞 UI）
	 * - 以受控时间线性补齐到 100%，再根据最短展示时长淡出
	 */
	async finishWithConfig(config: FullConfig | null | undefined) {
		if (this.finished) return
		this.finished = true
		try {
			// 配置阶段完成（满足“正式加载状态”）
			this.setStage('config', 1)
			// 预加载阶段：后台进行，不阻塞 UI 收尾
			const urls = collectImageUrlsFromConfig(config)
			void preloadImages(urls, (done, total) => {
				const frac = total ? done / total : 1
				this.setStage('preload', frac)
			}).catch(() => {})
			// 启动“收尾补齐”模式：规定在 postConfigRampMs 内把可见进度线性补齐至 100
			this.rampMode = true
			this.rampStartTs = performance.now()
			this.targetPercent = 100
			if (this.rafId == null) {
				this.lastAnimTs = performance.now()
				this.rafId = requestAnimationFrame(this.animateStep)
			}
			// 等待最短展示时长达到
			const remain = Math.max(0, this.minDisplayMs - (performance.now() - this.startTs))
			await new Promise<void>((resolve) => setTimeout(resolve, remain))
			// 再等待“收尾补齐”完成（或最多等待 postConfigRampMs），保证观感更稳
			await this.waitUntil(() => this.lastPercent >= 100, this.postConfigRampMs)
			hideOverlay(this.elements)
		} catch {
			// 异常情况下也保证：尽快补齐至 100%（走收尾模式）并遵循最短展示时长
			this.rampMode = true
			this.rampStartTs = performance.now()
			this.targetPercent = 100
			if (this.rafId == null) {
				this.lastAnimTs = performance.now()
				this.rafId = requestAnimationFrame(this.animateStep)
			}
			const remain = Math.max(0, this.minDisplayMs - (performance.now() - this.startTs))
			await new Promise<void>((resolve) => setTimeout(resolve, remain))
			await this.waitUntil(() => this.lastPercent >= 100, this.postConfigRampMs)
			hideOverlay(this.elements)
		}
	}
}

/** 导出单例实例 */
export const loadingManager = new LoadingManager()

/** 完整配置类型导出（供外部类型标注使用） */
export type { FullConfig }

/** 额外导出纯函数，便于单元测试覆盖 */
export { normalizeAssetUrl, collectImageUrlsFromConfig }
