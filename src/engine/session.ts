import { listCustomDishes, listRecent } from '../db/db'
import { effectiveByCategory } from './library'
import { mulberry32, recommend } from './recommend'
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
 * 内置候选应用用户编辑覆盖（dishOverrides）。
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
  const pool = effectiveByCategory(prefs.dishOverrides)
  const ranked: Record<Category, Dish[]> = {
    meat: recommend('meat', ctx, pool.meat.length, extra, pool.meat),
    veg: recommend('veg', ctx, pool.veg.length, extra, pool.veg),
    soup: recommend('soup', ctx, pool.soup.length, extra, pool.soup),
  }
  return { spec: prefs.spec, ranked }
}
