/** 菜品分类 */
export type Category = 'meat' | 'veg' | 'soup'

/** 制作难度 */
export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  medium: '普通',
  hard: '困难',
}

/** 菜品（内置 + 自定义） */
export interface Dish {
  id: string
  name: string
  category: Category
  /** 制作时间（分钟） */
  time: number
  difficulty: Difficulty
  tags: string[]
  /** 推荐理由（展示用短文案） */
  reason: string
  /** 菜品图片 URL；为空时用分类图标兜底 */
  image: string
  /** 是否用户自定义 */
  custom?: boolean
}

/** 本餐规格 */
export interface Spec {
  meat: number
  veg: number
  soup: number
  people: number
}

export const DEFAULT_SPEC: Spec = { meat: 2, veg: 2, soup: 1, people: 3 }

/** 口味偏好 */
export const TASTE_OPTIONS = ['微辣', '中辣', '重辣', '清淡', '酸甜', '咸鲜'] as const

/** 预置推荐标签 */
export const DEFAULT_TAG_OPTIONS = [
  '快手',
  '辣',
  '清淡',
  '下饭',
  '家常',
  '酸甜',
  '高蛋白',
  '适合多人',
] as const

/** 用户偏好（IndexedDB 单条记录） */
export interface Prefs {
  id: 'main'
  spec: Spec
  tags: string[]
  likes: string[]
  dislikes: string[]
  avoid: string[]
  taste: string
  /** 0–1，越大越倾向尝试新菜 */
  novelty: number
  customTags: string[]
}

export const DEFAULT_PREFS: Prefs = {
  id: 'main',
  spec: { ...DEFAULT_SPEC },
  tags: ['快手', '辣'],
  likes: [],
  dislikes: [],
  avoid: ['香菜', '苦瓜'],
  taste: '微辣',
  novelty: 0.64,
  customTags: [],
}

/** 用户自定义菜谱 */
export interface CustomDish {
  id: string
  name: string
  category: Category
  time: number
  difficulty: Difficulty
  tags: string[]
  /** 用户上传的图片（dataURL）；为空则用分类图标 */
  image: string
  createdAt: number
}

/** 保存的一桌搭配 */
export interface SavedCombo {
  id: string
  createdAt: number
  spec: Spec
  dishes: { id: string; name: string; category: Category; time: number }[]
}

/** 最近吃过记录 */
export interface RecentRecord {
  id: string
  eatenAt: number
}
