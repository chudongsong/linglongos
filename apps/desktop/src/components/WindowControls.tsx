import { useCallback } from 'react'
import { useAppDispatch } from '@store/index'
import { toggleMinimize, toggleMaximize, closeWindow } from '@store/slices/window.slice'

type Props = {
  id: string
  isMaximized: boolean
}

/**
 * WindowControls：现代化窗口控制按钮（最小化/最大化/关闭）
 * - 清晰的视觉反馈：默认、悬停、点击（按压）、聚焦状态
 * - 无障碍：ARIA 标签、可通过键盘聚焦
 * - 保持与现有深色标题栏风格一致（半透明白背景，图标中性灰）
 */
export function WindowControls({ id, isMaximized }: Props) {
  const dispatch = useAppDispatch()

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dispatch(toggleMinimize(id))
    },
    [dispatch, id],
  )

  const handleToggleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dispatch(toggleMaximize(id))
    },
    [dispatch, id],
  )

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dispatch(closeWindow(id))
    },
    [dispatch, id],
  )

  // 键盘激活支持：Enter 或 Space 触发对应操作
  const handleMinimizeKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        dispatch(toggleMinimize(id))
      }
    },
    [dispatch, id],
  )
  const handleToggleMaximizeKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        dispatch(toggleMaximize(id))
      }
    },
    [dispatch, id],
  )
  const handleCloseKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        dispatch(closeWindow(id))
      }
    },
    [dispatch, id],
  )

  const baseBtn =
    'group relative w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-200 hover:text-white transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]'

  const overlay =
    'absolute inset-0 rounded-md bg-white/0 group-hover:bg-white/15 group-active:bg-white/25 transition-colors'

  const icon = 'relative z-10 w-5 h-5'

  return (
    <div className="window-controls flex items-center gap-1.5 px-2">
      {/* 最小化 */}
      <div
        className={baseBtn}
        onClick={handleMinimize}
        aria-label="最小化窗口"
        title="最小化"
        role="button"
        tabIndex={0}
        onKeyDown={handleMinimizeKey}
      >
        <span className={overlay} />
        <svg className={icon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      </div>

      {/* 最大化/还原 */}
      <div
        className={baseBtn}
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
        title={isMaximized ? '还原' : '最大化'}
        role="button"
        tabIndex={0}
        onKeyDown={handleToggleMaximizeKey}
      >
        <span className={overlay} />
        {isMaximized ? (
          <svg className={icon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
          </svg>
        ) : (
          <svg className={icon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 5.5h13v13h-13z" />
          </svg>
        )}
      </div>

      {/* 关闭（危险态：更强的悬停提示） */}
      <div
        className={baseBtn + ' text-gray-200 hover:text-white'}
        onClick={handleClose}
        aria-label="关闭窗口"
        title="关闭"
        role="button"
        tabIndex={0}
        onKeyDown={handleCloseKey}
      >
        <span className={overlay + ' group-hover:bg-red-500/25 group-active:bg-red-500/35'} />
        <svg className={icon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </div>
    </div>
  )
}

export default WindowControls