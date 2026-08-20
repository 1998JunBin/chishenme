import { create } from 'zustand'

interface ToastState {
  msg: string | null
  show: (msg: string) => void
  hide: () => void
}

let timer: number | null = null

export const useToast = create<ToastState>((set) => ({
  msg: null,
  show: (msg) => {
    set({ msg })
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => set({ msg: null }), 1800)
  },
  hide: () => set({ msg: null }),
}))
