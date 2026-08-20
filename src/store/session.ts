import { create } from 'zustand'
import type { Category, Dish, Spec } from '../types'

/** 历史动作（供右滑撤回） */
export interface HistItem {
  type: 'select' | 'skip'
  dish: string
}

export const CATEGORY_ORDER: Category[] = ['meat', 'veg', 'soup']

export function emptyByCategory<T>(init: () => T): Record<Category, T> {
  return { meat: init(), veg: init(), soup: init() }
}

interface SessionState {
  started: boolean
  spec: Spec
  active: Category
  /** 各类别的推荐候选排名（会话开始时由推荐引擎生成一次） */
  ranked: Record<Category, Dish[]>
  /** 各类别已选菜 id */
  selected: Record<Category, string[]>
  /** 各类别候选指针 */
  pointer: Record<Category, number>
  /** 各类别历史（撤回用） */
  history: Record<Category, HistItem[]>
  start: (spec: Spec, ranked: Record<Category, Dish[]>) => void
  clear: () => void
  select: () => void
  skip: () => void
  undo: () => void
  switchCat: (c: Category) => void
  remove: (c: Category, id: string) => void
  current: () => Dish | null
  catDone: (c: Category) => boolean
  allDone: () => boolean
  countPicked: () => number
  autoAdvance: () => Category | null
}

const empty: Pick<SessionState, 'selected' | 'pointer' | 'history'> = {
  selected: emptyByCategory(() => []),
  pointer: emptyByCategory(() => 0),
  history: emptyByCategory(() => []),
}

function currentDish(s: Pick<SessionState, 'ranked' | 'active' | 'pointer'>): Dish | null {
  const list = s.ranked[s.active]
  if (!list.length) return null
  return list[s.pointer[s.active] % list.length]
}

function nextIncomplete(
  spec: Spec,
  selected: Record<Category, string[]>,
  from: Category,
): Category | null {
  const idx = CATEGORY_ORDER.indexOf(from)
  for (let k = 1; k <= CATEGORY_ORDER.length; k++) {
    const c = CATEGORY_ORDER[(idx + k) % CATEGORY_ORDER.length]
    if (selected[c].length < spec[c]) return c
  }
  return null
}

export const useSession = create<SessionState>((set, get) => ({
  started: false,
  spec: { meat: 2, veg: 2, soup: 1, people: 3 },
  active: 'meat',
  ranked: emptyByCategory(() => []),
  ...empty,

  start: (spec, ranked) => set({ started: true, spec, ranked, active: 'meat', ...empty }),

  clear: () => set({ started: false, ranked: emptyByCategory(() => []), ...empty }),

  select: () => {
    const s = get()
    const d = currentDish(s)
    if (!d) return
    const cat = s.active
    const sel = { ...s.selected, [cat]: [...s.selected[cat], d.id] }
    const ptr = { ...s.pointer, [cat]: s.pointer[cat] + 1 }
    const hist = { ...s.history, [cat]: [...s.history[cat], { type: 'select', dish: d.id }] }
    const done = sel[cat].length >= s.spec[cat]
    const active = done ? (nextIncomplete(s.spec, sel, cat) ?? cat) : cat
    set({ selected: sel, pointer: ptr, history: hist, active })
  },

  skip: () => {
    const s = get()
    const d = currentDish(s)
    if (!d) return
    const cat = s.active
    set({
      pointer: { ...s.pointer, [cat]: s.pointer[cat] + 1 },
      history: { ...s.history, [cat]: [...s.history[cat], { type: 'skip', dish: d.id }] },
    })
  },

  undo: () => {
    const s = get()
    const h = s.history[s.active]
    if (!h.length) return
    const last = h[h.length - 1]
    const cat = s.active
    set({
      pointer: { ...s.pointer, [cat]: Math.max(0, s.pointer[cat] - 1) },
      history: { ...s.history, [cat]: h.slice(0, -1) },
      selected:
        last.type === 'select'
          ? { ...s.selected, [cat]: s.selected[cat].slice(0, -1) }
          : s.selected,
    })
  },

  switchCat: (c) => {
    const s = get()
    if (s.selected[c].length >= s.spec[c]) return
    set({ active: c })
  },

  remove: (c, id) => {
    const s = get()
    set({ selected: { ...s.selected, [c]: s.selected[c].filter((x) => x !== id) } })
  },

  current: () => currentDish(get()),

  catDone: (c) => get().selected[c].length >= get().spec[c],

  allDone: () => CATEGORY_ORDER.every((c) => get().selected[c].length >= get().spec[c]),

  countPicked: () => CATEGORY_ORDER.reduce((n, c) => n + get().selected[c].length, 0),

  autoAdvance: () => nextIncomplete(get().spec, get().selected, get().active),
}))
