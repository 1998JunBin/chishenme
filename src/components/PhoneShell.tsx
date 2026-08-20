import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { useApp, type Tab } from '../store/app'

/** 手机壳：桌面居中展示手机边框，移动端全屏 */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="stage">
      <div className="phone">
        <div className="ambient">
          <div className="blob a" />
          <div className="blob b" />
          <div className="blob c" />
        </div>
        <div className="screens">{children}</div>
        <TabBar />
      </div>
      <div className="caption">吃什么 · V1</div>
    </div>
  )
}

const TABS: { key: Tab; icon: IconName; label: string }[] = [
  { key: 'home', icon: 'bowl', label: '吃什么' },
  { key: 'recipes', icon: 'book', label: '菜谱' },
  { key: 'profile', icon: 'user', label: '我的' },
]

function TabBar() {
  const tab = useApp((s) => s.tab)
  const screen = useApp((s) => s.screen)
  const setTab = useApp((s) => s.setTab)

  if (screen !== 'tab') return null

  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <div key={t.key} className={`tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
          <span className="tab-ico">
            <Icon name={t.icon} size={26} />
          </span>
          <span>{t.label}</span>
        </div>
      ))}
    </nav>
  )
}
