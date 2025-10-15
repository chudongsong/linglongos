/**
 * desktop.slice
 *
 * 管理桌面相关的全局状态（完整配置、加载状态、错误、图标尺寸与网格尺寸）。
 * 提供异步配置加载与基于配置推导的网格计算逻辑。
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { FullConfig, GridSize } from '@/types/config'
import { loadFullConfig, validateFullConfig } from '@/services/config.service'

/** 桌面状态对象 */
export interface DesktopState {
	config: FullConfig | null
	loading: boolean
	error: string | null
	iconSize: 'small' | 'medium' | 'large'
	grid: GridSize
}

/**
 * 初始化状态
 */
const initialState: DesktopState = {
	config: null,
	loading: false,
	error: null,
	iconSize: 'medium',
	grid: { width: 100, height: 120, gap: 5 },
}

/**
 * 异步：加载完整配置
 *
 * 从远端加载桌面与应用配置，校验通过后写入状态。
 * @returns Promise<FullConfig> 完整配置
 */
export const fetchConfig = createAsyncThunk('desktop/fetchConfig', async () => {
	const cfg = await loadFullConfig()
	if (!validateFullConfig(cfg)) throw new Error('配置校验失败')
	return cfg
})

/**
 * 计算当前网格尺寸
 *
 * 根据配置与图标尺寸档位，返回对应的网格宽高与间距。
 * @param cfg 完整配置对象
 * @param size 图标尺寸档位（small|medium|large）
 * @returns 网格尺寸对象
 */
function computeGrid(cfg: FullConfig | null, size: 'small' | 'medium' | 'large'): GridSize {
	const fallback = { width: 100, height: 120, gap: 5 }
	if (!cfg) return fallback
	return cfg.desktop.gridSize[size] || fallback
}

/**
 * 规范化图标尺寸字段
 *
 * 仅允许 small|medium|large，其它值将回退为 medium。
 * @param raw 原始 iconSize 字段
 * @returns 规范化后的图标尺寸
 */
function normalizeIconSize(raw?: string): 'small' | 'medium' | 'large' {
	if (raw === 'small' || raw === 'medium' || raw === 'large') return raw
	return 'medium'
}

const desktopSlice = createSlice({
	name: 'desktop',
	initialState,
	reducers: {
		/** 切换图标尺寸并更新网格尺寸 */
		setIconSize(state, action: PayloadAction<'small' | 'medium' | 'large'>) {
			state.iconSize = action.payload
			state.grid = computeGrid(state.config, action.payload)
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchConfig.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchConfig.fulfilled, (state, action) => {
				state.loading = false
				state.config = action.payload
				// 从配置中的 iconSize 派生初始尺寸，并据此计算网格尺寸
				const size = normalizeIconSize(state.config?.desktop?.iconSize as string | undefined)
				state.iconSize = size
				state.grid = computeGrid(action.payload, size)
			})
			.addCase(fetchConfig.rejected, (state, action) => {
				state.loading = false
				state.error = action.error?.message || '配置加载失败'
			})
	},
})

export const { setIconSize } = desktopSlice.actions
export default desktopSlice.reducer
