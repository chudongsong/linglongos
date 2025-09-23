/**
 * Redux store：集中管理全局状态
 */
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import desktopReducer from '@store/slices/desktop.slice'
import windowReducer from '@store/slices/window.slice'

export const store = configureStore({
  reducer: {
    desktop: desktopReducer,
    window: windowReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

/**
 * 获取类型安全的 dispatch
 */
export const useAppDispatch: () => AppDispatch = useDispatch

/**
 * 类型安全的 selector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector