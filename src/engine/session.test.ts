import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/db', () => ({
  loadPrefs: async () => ({}),
  savePrefs: async () => {},
  listCustomDishes: async () => [
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
  ],
  addCustomDish: async () => {},
  updateCustomDish: async () => {},
  deleteCustomDish: async () => {},
  listCombos: async () => [],
  addCombo: async () => {},
  deleteCombo: async () => {},
  listRecent: async () => [{ id: 'm01', eatenAt: Date.now() }],
  recordRecent: async () => {},
  clearRecent: async () => {},
  newId: () => 'id_test',
}))

import { buildSessionRanked } from './session'
import type { Prefs } from '../types'

const prefs: Prefs = {
  id: 'main',
  spec: { meat: 2, veg: 2, soup: 1, people: 3 },
  tags: ['辣'],
  likes: [],
  dislikes: [],
  avoid: ['牛'],
  taste: '微辣',
  novelty: 0.64,
  customTags: [],
  hintSeen: true,
  dishOverrides: {},
}

describe('会话候选排名构建（推荐引擎集成）', () => {
  it('自定义菜进入候选池', async () => {
    const { ranked } = await buildSessionRanked(prefs)
    expect(ranked.meat.some((d) => d.id === 'c1')).toBe(true)
  })

  it('忌口食材被过滤', async () => {
    const { ranked } = await buildSessionRanked(prefs)
    expect(ranked.meat.every((d) => !d.name.includes('牛'))).toBe(true)
  })

  it('每类候选数不为空且分类正确', async () => {
    const { ranked } = await buildSessionRanked(prefs)
    for (const cat of ['meat', 'veg', 'soup'] as const) {
      expect(ranked[cat].length).toBeGreaterThan(0)
      expect(ranked[cat].every((d) => d.category === cat)).toBe(true)
    }
  })
})
