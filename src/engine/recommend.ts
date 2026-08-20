import { DISHES_BY_CATEGORY } from '../data/dishes'
import type { Category, Dish } from '../types'

/**
 * 推荐引擎 V1：规则 + 权重 + 随机扰动（无 AI）。
 * 对应 PRD V1.1 第十八节：
 *   用户喜欢↑ / 不喜欢↓↓↓ / 选择过↑ / 最近吃过↓ / 很久没吃↑ /
 *   标签匹配↑ / 类别必须匹配 / 随机扰动防固化
 */
export interface RecommendContext {
  /** 喜欢的菜 id */
  likes: ReadonlySet<string>
  /** 不喜欢的菜 id */
  dislikes: ReadonlySet<string>
  /** 不吃的食材（按菜名或标签包含匹配，命中直接过滤） */
  avoid: readonly string[]
  /** 本餐偏好的标签 */
  prefsTags: readonly string[]
  /** 0–1，越大越倾向没吃过的菜 */
  novelty: number
  /** 最近吃过的菜 id */
  recentIds: ReadonlySet<string>
  /** 本餐内已选/已跳过的菜 id（本餐内不重复） */
  exclude: ReadonlySet<string>
  /** 随机源（测试可注入种子随机） */
  rng?: () => number
}

/** 是否命中「不吃的食材」过滤 */
export function hitsAvoid(dish: Dish, avoid: readonly string[]): boolean {
  return avoid.some(
    (a) => dish.name.includes(a) || dish.tags.some((t) => t.includes(a)),
  )
}

export function filterAllowed(dish: Dish, ctx: RecommendContext): boolean {
  if (ctx.exclude.has(dish.id)) return false
  return !hitsAvoid(dish, ctx.avoid)
}

export function scoreDish(dish: Dish, ctx: RecommendContext): number {
  let s = 100
  if (ctx.likes.has(dish.id)) s += 60
  if (ctx.dislikes.has(dish.id)) s -= 400
  for (const t of ctx.prefsTags) {
    if (dish.tags.includes(t)) s += 18
  }
  const tried =
    ctx.likes.has(dish.id) ||
    ctx.dislikes.has(dish.id) ||
    ctx.recentIds.has(dish.id)
  if (ctx.recentIds.has(dish.id)) s -= 25
  if (!tried) s += ctx.novelty * 40
  return s
}

/**
 * 为某个分类推荐 count 道菜（按得分降序）。
 * @param extra 追加的候选（用户自定义菜谱）
 * @param pool 覆盖内置候选池（含用户编辑覆盖后的菜品）；缺省用内置数据
 */
export function recommend(
  category: Category,
  ctx: RecommendContext,
  count: number,
  extra: Dish[] = [],
  pool?: Dish[],
): Dish[] {
  const rng = ctx.rng ?? Math.random
  const builtins = pool ?? DISHES_BY_CATEGORY[category]
  const candidates = [
    ...builtins.filter((d) => d.category === category),
    ...extra.filter((d) => d.category === category),
  ].filter((d) => filterAllowed(d, ctx))

  return candidates
    .map((d) => ({ d, s: scoreDish(d, ctx) + rng() * 20 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.d)
}

/** 可注入的种子随机（测试/复现用） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
