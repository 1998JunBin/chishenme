import { Icon, type IconName } from '../components/Icon'
import { useApp } from '../store/app'
import type { Spec } from '../types'

const CELLS: { key: keyof Spec; unit: string; label: string; icon: IconName; bg: string; fg: string }[] = [
  { key: 'meat', unit: '道', label: '荤菜', icon: 'meat', bg: '#FFE3D3', fg: '#FF7A3C' },
  { key: 'veg', unit: '道', label: '素菜', icon: 'leaf', bg: '#E9EFE2', fg: '#7E8F6E' },
  { key: 'soup', unit: '道', label: '汤', icon: 'soup', bg: '#FFE9D6', fg: '#FF7A3C' },
  { key: 'people', unit: '人', label: '用餐', icon: 'users', bg: '#E3EDF8', fg: '#6E93C9' },
]

export function HomeScreen() {
  const prefs = useApp((s) => s.prefs)
  const setScreen = useApp((s) => s.setScreen)
  const spec = prefs.spec

  return (
    <div className="home-new">
      <div className="home-top">
        <h1 className="home-title">
          今天
          <br />
          <span>吃什么？</span>
        </h1>
        <p className="home-sub">规格都设好了，直接开选，或者点进去再调调。</p>
      </div>
      <div className="meal-card2 glass" onClick={() => setScreen('setup')}>
        <div className="mc2-head">
          <span className="mc2-title">今天的这一餐</span>
          <span className="mc2-meta">{`${spec.meat}荤 ${spec.veg}素 ${spec.soup}汤 · ${spec.people}人`}</span>
        </div>
        <div className="mc2-grid">
          {CELLS.map((c) => (
            <div className="mc2-cell" key={c.key}>
              <span className="ci" style={{ background: c.bg, color: c.fg }}>
                <Icon name={c.icon} size={22} />
              </span>
              <div>
                <div className="numline">
                  <span className="num">{spec[c.key]}</span>
                  <span className="unit">{c.unit}</span>
                </div>
                <div className="lab">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="home-cta">
        <button className="btn btn-primary" onClick={() => setScreen('swipe')}>
          开始选今天吃什么
        </button>
      </div>
    </div>
  )
}
