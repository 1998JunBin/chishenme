import { describe, expect, it } from 'vitest'
import { DISHES, DISHES_BY_CATEGORY } from '../data/dishes'
import {
  hitsAvoid,
  mulberry32,
  recommend,
  type RecommendContext,
} from './recommend'
import type { Category, Dish } from '../types'

const base: RecommendContext = {
  likes: new Set(),
  dislikes: new Set(),
  avoid: [],
  prefsTags: [],
  novelty: 0,
  recentIds: new Set(),
  exclude: new Set(),
  rng: mulberry32(1),
}

describe('菜谱数据集', () => {
  it('至少 100 道菜，荤/素/汤齐全', () => {
    expect(DISHES.length).toBeGreaterThanOrEqual(100)
    for (const cat of ['meat', 'veg', 'soup'] as Category[]) {
      expect(DISHES_BY_CATEGORY[cat].length).toBeGreaterThanOrEqual(20)
    }
  })

  it('id 全局唯一，分类内菜名唯一', () => {
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(DISHES.length)
    for (const cat of ['meat', 'veg', 'soup'] as Category[]) {
      const names = DISHES_BY_CATEGORY[cat].map((d) => d.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('每条数据字段完整且合法', () => {
    for (const d of DISHES) {
      expect(d.name.length).toBeGreaterThan(0)
      expect(d.time).toBeGreaterThan(0)
      expect(d.tags.length).toBeGreaterThan(0)
      expect(d.image.startsWith('https://')).toBe(true)
      expect(d.reason.length).toBeGreaterThan(0)
      const exp = d.time <= 15 ? 'easy' : d.time <= 45 ? 'medium' : 'hard'
      expect(d.difficulty).toBe(exp)
    }
  })
})

describe('推荐引擎', () => {
  it('返回数量与分类正确', () => {
    const r = recommend('meat', { ...base, rng: mulberry32(1) }, 5)
    expect(r).toHaveLength(5)
    expect(r.every((d) => d.category === 'meat')).toBe(true)
  })

  it('种子随机可复现', () => {
    const a = recommend('meat', { ...base, rng: mulberry32(1) }, 5).map((d) => d.id)
    const b = recommend('meat', { ...base, rng: mulberry32(1) }, 5).map((d) => d.id)
    expect(a).toEqual(b)
  })

  it('喜欢的菜排名第一，不喜欢的菜垫底', () => {
    const liked = DISHES_BY_CATEGORY.veg[5]
    const r = recommend('veg', { ...base, likes: new Set([liked.id]), rng: mulberry32(1) }, 48)
    expect(r[0].id).toBe(liked.id)

    const disliked = DISHES_BY_CATEGORY.meat[3]
    const r2 = recommend(
      'meat',
      { ...base, dislikes: new Set([disliked.id]), rng: mulberry32(1) },
      48,
    )
    expect(r2[r2.length - 1].id).toBe(disliked.id)
  })

  it('不吃的食材被过滤', () => {
    const r = recommend('meat', { ...base, avoid: ['牛'], rng: mulberry32(1) }, 48)
    expect(r.every((d) => !hitsAvoid(d, ['牛']))).toBe(true)
    expect(r.length).toBeLessThan(48)
  })

  it('本餐已选/已跳过的菜被排除', () => {
    const excluded = DISHES_BY_CATEGORY.meat[0]
    const r = recommend(
      'meat',
      { ...base, exclude: new Set([excluded.id]), rng: mulberry32(1) },
      10,
    )
    expect(r.some((d) => d.id === excluded.id)).toBe(false)
  })

  it('自定义菜参与推荐', () => {
    const custom: Dish = {
      id: 'c_test',
      name: '家常炒鸡',
      category: 'meat',
      time: 20,
      difficulty: 'medium',
      tags: ['快手', '家常'],
      reason: '❤️ 你可能会喜欢',
      image: '',
      custom: true,
    }
    const r = recommend('meat', { ...base, rng: mulberry32(1) }, 48, [custom])
    expect(r.some((d) => d.id === 'c_test')).toBe(true)
  })

  it('标签偏好提升排名（无扰动）', () => {
    const r = recommend('meat', { ...base, prefsTags: ['辣'], rng: () => 0 }, 48)
    expect(r[0].tags).toContain('辣')
  })
})
