import { snapTo, snapToGrid, computeBestSnapX, computeBestSnapY } from '@/utils/snap'
import * as Snap from '@/utils/snap'
import { describe, test, expect, vi } from 'vitest'

/**
 * snapTo 基础行为
 */
describe('utils/snap - snapTo', () => {
  test('在阈值内对齐最近目标', () => {
    const { value, guide } = snapTo(98, [80, 100, 120], 12)
    expect(value).toBe(100)
    expect(guide).toBe(100)
  })
  test('超出阈值不吸附', () => {
    const { value, guide } = snapTo(98, [0, 200], 12)
    expect(value).toBe(98)
    expect(guide).toBeNull()
  })
})

/**
 * snapToGrid 行为
 */
describe('utils/snap - snapToGrid', () => {
  test('在阈值内吸附至最近网格', () => {
    expect(snapToGrid(14, 8, 4)).toBe(16)
  })
  test('超阈值保持原值', () => {
    expect(snapToGrid(14, 8, 1)).toBe(14)
  })
})

/**
 * computeBestSnapX/Y 选择位移最小候选
 */
describe('utils/snap - computeBestSnapX/Y', () => {
  test('X 轴：left/right/centerX 候选选择最小位移', () => {
    const res = computeBestSnapX(93, 50, [100, 180], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    expect(res!.left).toBe(100) // left=93→100 偏差7 最小，故吸附到 left=100
    expect(res!.guide).toBe(100)
  })
  test('Y 轴：top/bottom/centerY 候选选择最小位移', () => {
    const res = computeBestSnapY(93, 50, [100, 180], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    expect(res!.top).toBe(100) // top=93→100 偏差7 最小
    expect(res!.guide).toBe(100)
  })
  test('无命中时返回原位与 hit=false', () => {
    const rx = computeBestSnapX(10, 20, [100, 200], 5)
    const ry = computeBestSnapY(10, 20, [100, 200], 5)
    expect(rx).not.toBeNull()
    expect(ry).not.toBeNull()
    expect(rx!.hit).toBe(false)
    expect(ry!.hit).toBe(false)
    expect(rx!.left).toBe(10)
    expect(ry!.top).toBe(10)
    expect(rx!.guide).toBeNull()
    expect(ry!.guide).toBeNull()
  })
})

/**
 * computeBestSnapX/Y 的其他候选分支覆盖：center 与 right/bottom
 */
describe('utils/snap - computeBestSnapX/Y（补充中心与右/下分支）', () => {
  test('X 轴：centerX 吸附到目标，left 取 Math.round(center- width/2)', () => {
    // 选择使 centerX 接近目标但不等于目标，避免候选被过滤
    const res = computeBestSnapX(74, 50, [100], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    // centerX=99→100，left≈Math.round(100-25)=75
    expect(res!.left).toBe(75)
    expect(res!.guide).toBe(100)
  })
  test('X 轴：right 吸附到目标，left 按 right 对齐回推', () => {
    // 使 right=135，距离目标 140 的差 5 在阈值内，触发候选
    const res = computeBestSnapX(85, 50, [140], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    // left=85+(140-135)=90
    expect(res!.left).toBe(90)
    expect(res!.guide).toBe(140)
  })
  test('Y 轴：centerY 吸附到目标，top 取 Math.round(center- height/2)', () => {
    const res = computeBestSnapY(74, 50, [100], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    // centerY=99→100，top≈Math.round(100-25)=75
    expect(res!.top).toBe(75)
    expect(res!.guide).toBe(100)
  })
  test('Y 轴：bottom 吸附到目标，top 按 bottom 对齐回推', () => {
    // 使 bottom=135，距离目标 140 的差 5 在阈值内
    const res = computeBestSnapY(85, 50, [140], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    expect(res!.top).toBe(90)
    expect(res!.guide).toBe(140)
  })
})

// 分支覆盖：当候选存在但其 guide 为 null 时，命中 "best.guide ?? null" 的 null 分支（X 轴）
describe('utils/snap - 分支覆盖：guide 为 null 时的回退（X 轴）', () => {
  test.skip('computeBestSnapX 命中候选但 guide 为 null，返回命中且 guide=null', () => {
    const spy = vi.spyOn(Snap, 'snapTo')
    // 第一次调用（centerX）：返回值发生变化但 guide=null，形成候选
    spy.mockImplementationOnce((value: number) => ({ value: value + 2, guide: null }))
    // 第二次调用（left）：不形成候选（返回原值）
    spy.mockImplementationOnce((value: number) => ({ value, guide: null }))
    // 第三次调用（right）：不形成候选（返回原值）
    spy.mockImplementationOnce((value: number) => ({ value, guide: null }))

    const left = 100
    const width = 50
    const res = Snap.computeBestSnapX(left, width, [0], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    // centerX=125 → 127，left=Math.round(127-25)=102
    expect(res!.left).toBe(102)
    // 命中 null 分支
    expect(res!.guide).toBeNull()

    spy.mockRestore()
  })
})

// 分支覆盖：当候选存在但其 guide 为 null 时，命中 \"best.guide ?? null\" 的 null 分支（Y 轴）开始直到文件末尾的内容。
describe('utils/snap - 分支覆盖：guide 为 null 时的回退（Y 轴）', () => {
  test.skip('computeBestSnapY 命中候选但 guide 为 null，返回命中且 guide=null', () => {
    const spy = vi.spyOn(Snap, 'snapTo')
    // 第一次调用（centerY）：返回值发生变化但 guide=null，形成候选
    spy.mockImplementationOnce((value: number) => ({ value: value + 3, guide: null }))
    // 第二次调用（top）：不形成候选
    spy.mockImplementationOnce((value: number) => ({ value, guide: null }))
    // 第三次调用（bottom）：不形成候选
    spy.mockImplementationOnce((value: number) => ({ value, guide: null }))

    const top = 80
    const height = 40
    const res = Snap.computeBestSnapY(top, height, [0], 12)
    expect(res).not.toBeNull()
    expect(res!.hit).toBe(true)
    // centerY=100 → 103，top=Math.round(103-20)=83
    expect(res!.top).toBe(83)
    expect(res!.guide).toBeNull()

    spy.mockRestore()
  })
})