import { listCustomDishes, listRecent } from '../db/db'
import { DISHES_BY_CATEGORY } from '../data/dishes'
import { mulberry32, recommend } from '../engine/recommend'
import type { Category, Dish, Prefs, Spec } from '../types'

/** 把自定义菜谱转换成推荐引擎可用的 Dish */
export function customDishToDish(d: {
  id: string
  name: string
  category: Category
  time: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  image: string
}): Dish {
  return { ...d, reason: '❤️ 你可能会喜欢', custom: true }
}

/**
 * 会话开始：加载自定义菜与最近吃过，用推荐引擎为每个分类
 * 生成一次候选排名（种子随机，本会话内稳定）。
 */
export async function buildSessionRanked(
  prefs: Prefs,
): Promise<{ spec: Spec; ranked: Record<Category, Dish[]> }> {
  const [custom, recent] = await Promise.all([listCustomDishes(), listRecent()])
  const ctx = {
    likes: new Set(prefs.likes),
    dislikes: new Set(prefs.dislikes),
    avoid: prefs.avoid,
    prefsTags: prefs.tags,
    novelty: prefs.novelty,
    recentIds: new Set(recent.map((r) => r.id)),
    exclude: new Set<string>(),
    rng: mulberry32((Date.now() % 100000) + 7),
  }
  const extra = custom.map(customDishToDish)
  const ranked: Record<Category, Dish[]> = {
    meat: recommend('meat', ctx, DISHES_BY_CATEGORY.meat.length, extra),
    veg: recommend('veg', ctx, DISHES_BY_CATEGORY.veg.length, extra),
    soup: recommend('soup', ctx, DISHES_BY_CATEGORY.soup.length, extra),
  }
  return { spec: prefs.spec, ranked }
}
