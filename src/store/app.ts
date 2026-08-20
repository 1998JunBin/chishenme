import { create } from 'zustand'
import { loadPrefs, savePrefs } from '../db/db'
import { DEFAULT_PREFS, type Prefs } from '../types'

/** 一级 tab */
export type Tab = 'home' | 'recipes' | 'profile'

/** 页面（tab 之上可压入流程页） */
export type Screen = 'tab' | 'setup' | 'swipe' | 'addrecipe' | 'done'

interface AppState {
  tab: Tab
  screen: Screen
  prefs: Prefs
  ready: boolean
  setTab: (t: Tab) => void
  setScreen: (s: Screen) => void
  patchPrefs: (p: Partial<Prefs>) => void
  init: () => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  tab: 'home',
  screen: 'tab',
  prefs: { ...DEFAULT_PREFS },
  ready: false,
  setTab: (tab) => set({ tab, screen: 'tab' }),
  setScreen: (screen) => set({ screen }),
  patchPrefs: (p) => {
    const prefs = { ...get().prefs, ...p }
    set({ prefs })
    void savePrefs(prefs).catch(() => {
      /* IndexedDB 不可用时忽略持久化失败 */
    })
  },
  init: async () => {
    try {
      const prefs = await loadPrefs()
      set({ prefs, ready: true })
    } catch {
      // IndexedDB 不可用（隐私模式等）时保持默认值继续运行
      set({ ready: true })
    }
  },
}))
