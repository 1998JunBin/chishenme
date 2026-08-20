import type { IconName } from './Icon'
import type { Category } from '../types'

export const CAT_ICON: Record<Category, IconName> = {
  meat: 'meat',
  veg: 'leaf',
  soup: 'soup',
}

export const CAT_NAME: Record<Category, string> = {
  meat: '荤菜',
  veg: '素菜',
  soup: '汤',
}
