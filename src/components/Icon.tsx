import type { CSSProperties } from 'react'
import dislikeIcon from '../assets/icons/dislike.png'
import meatIcon from '../assets/icons/meat.png'

/** 扁平线性图标集（源自已验收高保真原型的 SVG） */
const PATHS = {
  bowl: '<path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M3 12h18"/>',
  soup: '<path d="M4 13h16a8 8 0 0 1-16 0Z"/><path d="M3 13h18"/><path d="M9 7c0-.8.4-1.2 1-1.2s1 .4 1 1.2"/><path d="M13 7c0-.8.4-1.2 1-1.2s1 .4 1 1.2"/>',
  meat: '<ellipse cx="15" cy="10" rx="5.5" ry="4.5"/><path d="M10.5 14 6 18.5"/><circle cx="5.4" cy="19.1" r=".6"/>',
  leaf: '<path d="M5 19C5 11 10 5 19 4c-1 9-6 14-14 15Z"/><path d="M5 19c3-4 6.5-6.5 10-8"/>',
  book: '<path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4Z"/><path d="M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M17.5 15.5c2 .6 3.5 2.2 3.5 4.5"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.6A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z"/>',
  thumbDown: '<path d="M6 8v13"/><path d="M11 3h1.6A2.4 2.4 0 0 1 15 5.4V10h5.2A1.8 1.8 0 0 1 22 11.8v1.2a2 2 0 0 1-1.4 1.9l-6.2 1.8a2 2 0 0 1-.6.1H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3.4L11 3Z"/>',
  swap: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',
  chevronLeft: '<path d="M15 4l-8 8 8 8"/>',
  chevronRight: '<path d="M9 4l8 8-8 8"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
} as const

export type IconName = keyof typeof PATHS

/** 实心图标（区别于描边） */
const FILLED = new Set<IconName>(['thumbDown'])

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 24, strokeWidth = 1.8, className, style }: IconProps) {
  // 用户提供的位图图标：以 mask 方式按 currentColor 染色（透明底白色线稿）
  const mask = MASK_ICONS[name]
  if (mask) {
    const maskStyle: CSSProperties = {
      display: 'inline-block',
      width: size,
      height: size,
      background: 'currentColor',
      maskImage: `url(${mask})`,
      WebkitMaskImage: `url(${mask})`,
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      ...style,
    }
    return <span className={className} data-mask-icon style={maskStyle} aria-hidden />
  }
  const filled = FILLED.has(name)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}

/** 使用用户位图（mask 染色）的图标 */
const MASK_ICONS: Partial<Record<IconName, string>> = {
  thumbDown: dislikeIcon,
  meat: meatIcon,
}
