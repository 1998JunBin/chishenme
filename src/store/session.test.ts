import { beforeEach, describe, expect, it } from 'vitest'
import { DISHES_BY_CATEGORY } from '../data/dishes'
import { emptyByCategory, useSession } from './session'
import type { Spec } from '../types'

const ranked = {
  meat: DISHES_BY_CATEGORY.meat,
  veg: DISHES_BY_CATEGORY.veg,
  soup: DISHES_BY_CATEGORY.soup,
}

const SPEC: Spec = { meat: 2, veg: 1, soup: 1, people: 3 }

beforeEach(() => {
  useSession.getState().clear()
  useSession.getState().start(SPEC, {
    meat: [...ranked.meat],
    veg: [...ranked.veg],
    soup: [...ranked.soup],
  })
})

describe('滑卡会话状态', () => {
  it('初始候选为当前分类的第一道', () => {
    const d = useSession.getState().current()
    expect(d).not.toBeNull()
    expect(d!.id).toBe(ranked.meat[0].id)
  })

  it('选择：加入已选、指针前进、历史记录', () => {
    const s = useSession.getState()
    const before = s.current()!
    s.select()
    const after = useSession.getState()
    expect(after.selected.meat).toEqual([before.id])
    expect(after.current()!.id).toBe(ranked.meat[1].id)
    expect(after.history.meat).toEqual([{ type: 'select', dish: before.id }])
    expect(after.countPicked()).toBe(1)
  })

  it('跳过：指针前进但不加入已选', () => {
    const s = useSession.getState()
    const before = s.current()!
    s.skip()
    const after = useSession.getState()
    expect(after.selected.meat).toEqual([])
    expect(after.current()!.id).toBe(ranked.meat[1].id)
    expect(after.history.meat).toEqual([{ type: 'skip', dish: before.id }])
  })

  it('右滑撤回跳过：回到上一道', () => {
    const s = useSession.getState()
    const before = s.current()!
    s.skip()
    useSession.getState().undo()
    expect(useSession.getState().current()!.id).toBe(before.id)
  })

  it('右滑撤回选择：移除已选', () => {
    const s = useSession.getState()
    s.select()
    expect(useSession.getState().selected.meat).toHaveLength(1)
    useSession.getState().undo()
    expect(useSession.getState().selected.meat).toHaveLength(0)
  })

  it('选满荤菜自动跳转到素菜', () => {
    const s = useSession.getState()
    s.select() // 荤 1
    s.select() // 荤 2 → 完成，自动跳素菜
    const after = useSession.getState()
    expect(after.active).toBe('veg')
    expect(after.catDone('meat')).toBe(true)
  })

  it('全部选满后 allDone 为真', () => {
    const s = useSession.getState()
    s.select()
    s.select() // 荤满 → 素
    s.select() // 素满 → 汤
    s.select() // 汤满
    const after = useSession.getState()
    expect(after.allDone()).toBe(true)
    expect(after.countPicked()).toBe(4)
  })

  it('自由切换分类，完成的分类不可再切', () => {
    useSession.getState().switchCat('soup')
    expect(useSession.getState().active).toBe('soup')
    expect(useSession.getState().current()!.id).toBe(ranked.soup[0].id)
    // 选满汤 → 自动跳荤菜
    useSession.getState().select()
    expect(useSession.getState().active).toBe('meat')
    // 选满荤菜 → 自动跳素菜
    useSession.getState().select()
    useSession.getState().select()
    expect(useSession.getState().active).toBe('veg')
    // 已完成的荤菜不可再切回
    useSession.getState().switchCat('meat')
    expect(useSession.getState().active).toBe('veg')
  })

  it('浮层删除某道已选', () => {
    const s = useSession.getState()
    s.select()
    const id = useSession.getState().selected.meat[0]
    useSession.getState().remove('meat', id)
    expect(useSession.getState().selected.meat).toHaveLength(0)
  })

  it('空历史时撤回为 no-op', () => {
    const s = useSession.getState()
    const before = s.current()!.id
    useSession.getState().undo()
    expect(useSession.getState().current()!.id).toBe(before)
  })

  it('清除会话', () => {
    useSession.getState().select()
    useSession.getState().clear()
    expect(useSession.getState().started).toBe(false)
    expect(useSession.getState().countPicked()).toBe(0)
    expect(emptyByCategory(() => 0)).toEqual({ meat: 0, veg: 0, soup: 0 })
  })
})
