import { DISHES, DISH_BY_ID } from '../data/dishes'
import type { Category, CustomDish, Dish, DishOverride } from '../types'

/** 应用用户覆盖后的内置菜（编辑内置菜后全局生效） */
export function effectiveDishes(overrides?: Record<string, DishOverride>): Dish[] {
  if (!overrides) return DISHES
  return DISHES.map((d) => {
    const o = overrides[d.id]
    return o ? { ...d, ...o } : d
  })
}

export function effectiveByCategory(
  overrides?: Record<string, DishOverride>,
): Record<Category, Dish[]> {
  const by: Record<Category, Dish[]> = { meat: [], veg: [], soup: [] }
  for (const d of effectiveDishes(overrides)) by[d.category].push(d)
  return by
}

/** 按 id 查内置菜（含覆盖） */
export function findBuiltin(id: string, overrides?: Record<string, DishOverride>): Dish | null {
  const base = DISH_BY_ID.get(id)
  if (!base) return null
  const o = overrides?.[id]
  return o ? { ...base, ...o } : base
}

/** 自定义菜转 Dish（与内置菜同构，供列表/推荐统一使用） */
export function customToDish(d: CustomDish): Dish {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    time: d.time,
    difficulty: d.difficulty,
    tags: d.tags,
    reason: '❤️ 你可能会喜欢',
    image: d.image,
    custom: true,
  }
}

export type RecipeFilterKey = 'all' | 'liked' | 'custom' | 'recent' | 'disliked'

export const RECIPE_FILTERS: { key: RecipeFilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'liked', label: '我喜欢' },
  { key: 'custom', label: '我的菜谱' },
  { key: 'recent', label: '最近吃过' },
  { key: 'disliked', label: '不喜欢' },
]

export interface RecipeEntry {
  dish: Dish
  category: Category
}

/** 全部菜品条目（内置含覆盖 + 自定义） */
export function allEntries(
  overrides: Record<string, DishOverride> | undefined,
  customDishes: CustomDish[],
): RecipeEntry[] {
  const entries: RecipeEntry[] = []
  for (const d of effectiveDishes(overrides)) entries.push({ dish: d, category: d.category })
  for (const c of customDishes) entries.push({ dish: customToDish(c), category: c.category })
  return entries
}

/** 按筛选条件过滤 */
export function filterEntries(
  entries: RecipeEntry[],
  filter: RecipeFilterKey,
  likes: string[],
  dislikes: string[],
  recentIds: string[],
): RecipeEntry[] {
  switch (filter) {
    case 'liked':
      return entries.filter((e) => likes.includes(e.dish.id))
    case 'disliked':
      return entries.filter((e) => dislikes.includes(e.dish.id))
    case 'custom':
      return entries.filter((e) => e.dish.custom)
    case 'recent':
      return recentIds.map((id) => entries.find((e) => e.dish.id === id)).filter((x): x is RecipeEntry => !!x)
    default:
      return entries
  }
}

/** 难度徽章文案 */
export function difficultyLabel(difficulty: Dish['difficulty']): string {
  return difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '普通' : '困难'
}
