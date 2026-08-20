import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  DEFAULT_PREFS,
  type CustomDish,
  type Prefs,
  type RecentRecord,
  type SavedCombo,
} from '../types'

/**
 * 本地持久化层（IndexedDB）。
 * 本地优先 MVP：无后端、无账号，所有数据保存在设备本地。
 */
interface ChishenmeDB extends DBSchema {
  prefs: { key: string; value: Prefs }
  customDishes: { key: string; value: CustomDish }
  combos: { key: string; value: SavedCombo }
  recent: { key: string; value: RecentRecord }
}

let dbPromise: Promise<IDBPDatabase<ChishenmeDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ChishenmeDB>('chishenme', 1, {
      upgrade(db) {
        db.createObjectStore('prefs', { keyPath: 'id' })
        db.createObjectStore('customDishes', { keyPath: 'id' })
        db.createObjectStore('combos', { keyPath: 'id' })
        db.createObjectStore('recent', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

/* ---------- 偏好 ---------- */
export async function loadPrefs(): Promise<Prefs> {
  const db = await getDB()
  const stored = await db.get('prefs', 'main')
  return stored ?? { ...DEFAULT_PREFS }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  const db = await getDB()
  await db.put('prefs', prefs)
}

/* ---------- 自定义菜谱 ---------- */
export async function listCustomDishes(): Promise<CustomDish[]> {
  const db = await getDB()
  const all = await db.getAll('customDishes')
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function addCustomDish(dish: CustomDish): Promise<void> {
  const db = await getDB()
  await db.put('customDishes', dish)
}

export async function updateCustomDish(dish: CustomDish): Promise<void> {
  const db = await getDB()
  await db.put('customDishes', dish)
}

export async function deleteCustomDish(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('customDishes', id)
}

/* ---------- 我的搭配 ---------- */
export async function listCombos(): Promise<SavedCombo[]> {
  const db = await getDB()
  const all = await db.getAll('combos')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function addCombo(combo: SavedCombo): Promise<void> {
  const db = await getDB()
  await db.put('combos', combo)
}

export async function deleteCombo(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('combos', id)
}

/* ---------- 最近吃过 ---------- */
export async function listRecent(limit = 30): Promise<RecentRecord[]> {
  const db = await getDB()
  const all = await db.getAll('recent')
  return all.sort((a, b) => b.eatenAt - a.eatenAt).slice(0, limit)
}

export async function recordRecent(id: string): Promise<void> {
  const db = await getDB()
  await db.put('recent', { id, eatenAt: Date.now() })
}

/* ---------- 工具 ---------- */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
