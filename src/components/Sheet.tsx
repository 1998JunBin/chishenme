import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface SheetOverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 底部浮层（遮罩 + 面板）。
 * 通过 Portal 挂到手机壳层，与页面滚动/动画完全解耦，
 * 保证在任何屏幕上都是「固定底部弹出的二级菜单」。
 */
export function SheetOverlay({ open, onClose, children }: SheetOverlayProps) {
  const phone = document.querySelector('.phone')
  if (!phone) return null
  return createPortal(
    <>
      <div className={`scrim${open ? ' show' : ''}`} onClick={onClose} />
      <div className={`sheet${open ? ' show' : ''}`}>{children}</div>
    </>,
    phone,
  )
}
