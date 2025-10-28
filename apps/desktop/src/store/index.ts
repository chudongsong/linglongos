/**
 * Redux Store
 *
 * 集中管理全局状态，包含 `desktop`、`window` 与 `settings` 三个切片。
 * 暴露类型安全的 `useAppDispatch` 与 `useAppSelector` 辅助方法。
 */
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import desktopReducer from '@store/slices/desktop.slice'
import windowReducer from '@store/slices/window.slice'
import settingsReducer from '@store/slices/settings.slice'
import setupReducer from '@/features/Setup/setupSlice'

export const store = configureStore({
	reducer: {
		desktop: desktopReducer,
		window: windowReducer,
		settings: settingsReducer,
		setup: setupReducer,
	},
})

/** 根状态类型 */
export type RootState = ReturnType<typeof store.getState>
/** Dispatch 类型 */
export type AppDispatch = typeof store.dispatch

/** 获取类型安全的 dispatch Hook */
export const useAppDispatch: () => AppDispatch = useDispatch

/** 类型安全的 selector Hook */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
