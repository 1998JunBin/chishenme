import { describe, expect, it } from 'vitest'
import { DISHES_BY_CATEGORY } from '../data/dishes'
import { allEntries, effectiveByCategory, filterEntries } from './library'
import type { CustomDish } from '../types'

const customDishes: CustomDish[] = [
  {
    id: 'c1',
    name: '家常炒鸡',
    category: 'meat',
    time: 20,
    difficulty: 'medium',
    tags: ['快手', '家常'],
    image: '',
    createdAt: 1,
  },
  {
    id: 'c2',
    name: '妈妈的红烧鱼',
    category: 'soup',
    time: 40,
    difficulty: 'medium',
    tags: ['咸鲜'],
    image: 'data:image/png;base64,AAAA',
    createdAt: 2,
  },
]

describe('菜谱库（覆盖与筛选）', () => {
  it('编辑覆盖：改名/改时间/改分类后全局生效', () => {
    const first = DISHES_BY_CATEGORY.meat[0]
    const by = effectiveByCategory({
      [first.id]: { name: '我的青椒牛肉', time: 10, difficulty: 'easy', category: 'soup' },
    })
    const moved = by.soup.find((d) => d.id === first.id)
    expect(moved).toBeDefined()
    expect(moved!.name).toBe('我的青椒牛肉')
    expect(moved!.time).toBe(10)
    expect(moved!.difficulty).toBe('easy')
    expect(by.meat.some((d) => d.id === first.id)).toBe(false)
  })

  it('全部条目 = 内置（含覆盖）+ 自定义', () => {
    const entries = allEntries(undefined, customDishes)
    const builtinCount = Object.values(DISHES_BY_CATEGORY).reduce((n, l) => n + l.length, 0)
    expect(entries.length).toBe(builtinCount + 2)
    expect(entries.some((e) => e.dish.id === 'c1')).toBe(true)
    expect(entries.find((e) => e.dish.id === 'c1')!.dish.custom).toBe(true)
  })

  it('按筛选条件过滤', () => {
    const entries = allEntries(undefined, customDishes)
    const liked = [DISHES_BY_CATEGORY.veg[0].id, 'c1']
    const disliked = [DISHES_BY_CATEGORY.meat[1].id]

    expect(filterEntries(entries, 'liked', liked, disliked, [])).toHaveLength(2)
    expect(filterEntries(entries, 'disliked', liked, disliked, [])).toHaveLength(1)
    expect(filterEntries(entries, 'custom', liked, disliked, [])).toHaveLength(2)

    const recent = filterEntries(entries, 'recent', liked, disliked, [DISHES_BY_CATEGORY.soup[2].id])
    expect(recent).toHaveLength(1)
    expect(recent[0].dish.id).toBe(DISHES_BY_CATEGORY.soup[2].id)
  })
})
