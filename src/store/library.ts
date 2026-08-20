import { create } from 'zustand'
import {
  addCombo as dbAddCombo,
  addCustomDish,
  clearRecent,
  deleteCombo as dbDeleteCombo,
  deleteCustomDish,
  listCombos,
  listCustomDishes,
  listRecent,
  updateCustomDish,
} from '../db/db'
import type { CustomDish, RecentRecord, SavedCombo } from '../types'

interface LibraryState {
  customDishes: CustomDish[]
  combos: SavedCombo[]
  recent: RecentRecord[]
  ready: boolean
  refresh: () => Promise<void>
  noteRecent: (id: string) => void
  addDish: (d: CustomDish) => Promise<void>
  updateDish: (d: CustomDish) => Promise<void>
  removeDish: (id: string) => Promise<void>
  addCombo: (c: SavedCombo) => Promise<void>
  removeCombo: (id: string) => Promise<void>
  clearAll: () => Promise<void>
}

export const useLibrary = create<LibraryState>((set, get) => ({
  customDishes: [],
  combos: [],
  recent: [],
  ready: false,

  refresh: async () => {
    try {
      const [customDishes, combos, recent] = await Promise.all([
        listCustomDishes(),
        listCombos(),
        listRecent(),
      ])
      set({ customDishes, combos, recent, ready: true })
    } catch {
      set({ ready: true })
    }
  },

  noteRecent: (id) => {
    const now = Date.now()
    set({ recent: [{ id, eatenAt: now }, ...get().recent.filter((r) => r.id !== id)].slice(0, 30) })
  },

  addDish: async (d) => {
    try {
      await addCustomDish(d)
      set({ customDishes: [...get().customDishes, d] })
    } catch {
      set({ customDishes: [...get().customDishes, d] })
    }
  },

  updateDish: async (d) => {
    try {
      await updateCustomDish(d)
      set({ customDishes: get().customDishes.map((x) => (x.id === d.id ? d : x)) })
    } catch {
      set({ customDishes: get().customDishes.map((x) => (x.id === d.id ? d : x)) })
    }
  },

  removeDish: async (id) => {
    try {
      await deleteCustomDish(id)
    } catch {
      /* ignore */
    }
    set({ customDishes: get().customDishes.filter((x) => x.id !== id) })
  },

  addCombo: async (c) => {
    try {
      await dbAddCombo(c)
    } catch {
      /* ignore */
    }
    set({ combos: [c, ...get().combos] })
  },

  removeCombo: async (id) => {
    try {
      await dbDeleteCombo(id)
    } catch {
      /* ignore */
    }
    set({ combos: get().combos.filter((x) => x.id !== id) })
  },

  clearAll: async () => {
    try {
      await Promise.all(get().customDishes.map((d) => deleteCustomDish(d.id)))
      await Promise.all(get().combos.map((c) => dbDeleteCombo(c.id)))
      await clearRecent()
    } catch {
      /* ignore */
    }
    set({ customDishes: [], combos: [], recent: [] })
  },
}))
