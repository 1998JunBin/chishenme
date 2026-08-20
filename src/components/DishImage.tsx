import { useState } from 'react'
import { Icon, type IconName } from './Icon'
import type { Category, Dish } from '../types'

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

interface DishImageProps {
  dish: Dish
  className?: string
  /** 图片加载失败时兜底图标的尺寸 */
  iconSize?: number
}

/** 菜品图片：加载失败自动降级为分类线性图标 */
export function DishImage({ dish, className, iconSize = 24 }: DishImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed || !dish.image) {
    return (
      <span className={className}>
        <Icon name={CAT_ICON[dish.category]} size={iconSize} />
      </span>
    )
  }
  return (
    <img className={className} src={dish.image} alt={dish.name} onError={() => setFailed(true)} />
  )
}

/** 菜品缩略图（列表/浮层用的小方图） */
export function DishThumb({ dish, iconSize = 22 }: { dish: Dish; iconSize?: number }) {
  const [failed, setFailed] = useState(false)

  if (failed || !dish.image) {
    return (
      <span className="ic">
        <Icon name={CAT_ICON[dish.category]} size={iconSize} />
      </span>
    )
  }
  return (
    <span className="ic">
      <img
        src={dish.image}
        alt={dish.name}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  )
}
