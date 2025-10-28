/**
 * useDesktopIconDrag 测试
 * - 通过 mock react-dnd 的 useDrag，控制 isDragging 与 dragPreview 行为
 * - 覆盖：dragPreview 调用、isDragging 变化触发 onDragStart
 */

// 在被测模块导入前完成 mock
vi.mock('react-dnd', () => {
	let isDragging = false
	const dragPreviewCalls: any[] = []

	return {
		/**
		 * 模拟 useDrag：返回可配置的 isDragging、dragRef 与 dragPreview
		 */
		useDrag: (specFactory: any, _deps: unknown[]) => {
			const spec = typeof specFactory === 'function' ? specFactory() : specFactory
			// collect 回调按需返回 isDragging
			const collected = spec.collect ? spec.collect({ isDragging: () => isDragging }) : { isDragging }
			const dragRef = (_node: any) => {}
			const dragPreview = (...args: any[]) => {
				dragPreviewCalls.push(args)
			}
			return [collected, dragRef, dragPreview]
		},
		/** 测试辅助：设置 isDragging */
		__setDragging: (v: boolean) => {
			isDragging = v
		},
		/** 测试辅助：读取 dragPreview 调用参数 */
		__getDragPreviewCalls: () => dragPreviewCalls.slice(),
		/** 测试辅助：重置状态 */
		__resetMock: () => {
			isDragging = false
			dragPreviewCalls.length = 0
		},
	}
})

vi.mock('react-dnd-html5-backend', () => {
	return {
		/**
		 * 模拟 getEmptyImage：返回可识别的占位符
		 */
		getEmptyImage: () => 'EMPTY_IMAGE',
	}
})


import { render } from '@testing-library/react'
import { useDesktopIconDrag } from '@hooks/useDesktopIconDrag'
import type { FC } from 'react'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as ReactDndMock from 'react-dnd'

const { __setDragging, __getDragPreviewCalls, __resetMock } = ReactDndMock as any

/**
 * 测试组件：调用 useDesktopIconDrag 并在渲染周期内触发效果
 */
const DragProbe: FC<{ id: string; onStart: () => void }> = ({ id, onStart }) => {
	useDesktopIconDrag(id, onStart)
	return <div />
}

describe('hooks/useDesktopIconDrag', () => {
	beforeEach(() => {
		__resetMock()
	})

	test('初始化时调用 dragPreview(getEmptyImage, { captureDraggingState: true })', () => {
		const callsBefore = __getDragPreviewCalls()
		expect(callsBefore.length).toBe(0)
		render(<DragProbe id="a1" onStart={() => {}} />)
		const calls = __getDragPreviewCalls()
		expect(calls.length).toBe(1)
		expect(calls[0][0]).toBe('EMPTY_IMAGE')
		expect(calls[0][1]).toEqual({ captureDraggingState: true })
	})

	test('isDragging 变为 true 时触发 onDragStart 回调', () => {
		let started = 0
		const onStart = () => {
			started += 1
		}
		const { rerender } = render(<DragProbe id="a1" onStart={onStart} />)
		expect(started).toBe(0)

		__setDragging(true)
		rerender(<DragProbe id="a1" onStart={onStart} />)

		expect(started).toBe(1)
	})
})
