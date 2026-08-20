import { useMemo, useState } from 'react'
import { CAT_ICON } from '../components/DishImage'
import { Icon } from '../components/Icon'
import { findBuiltin } from '../engine/library'
import { useApp } from '../store/app'
import { useLibrary } from '../store/library'
import { useSession } from '../store/session'
import { DEFAULT_PREFS, TASTE_OPTIONS } from '../types'
import type { CustomDish } from '../types'

export function ProfileScreen() {
  const prefs = useApp((s) => s.prefs)
  const patchPrefs = useApp((s) => s.patchPrefs)
  const setTab = useApp((s) => s.setTab)
  const customDishes = useLibrary((s) => s.customDishes)
  const combos = useLibrary((s) => s.combos)
  const removeCombo = useLibrary((s) => s.removeCombo)
  const clearAll = useLibrary((s) => s.clearAll)

  const [sheet, setSheet] = useState<'liked' | 'disliked' | 'avoid' | 'taste' | 'combos' | null>(null)
  const [avoidInput, setAvoidInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const dishNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const d of customDishes) m.set(d.id, d.name)
    return m
  }, [customDishes])

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  function toggleLike(id: string) {
    patchPrefs({
      likes: prefs.likes.includes(id)
        ? prefs.likes.filter((x) => x !== id)
        : [...prefs.likes, id],
    })
  }
  function toggleDislike(id: string) {
    patchPrefs({
      dislikes: prefs.dislikes.includes(id)
        ? prefs.dislikes.filter((x) => x !== id)
        : [...prefs.dislikes, id],
    })
  }
  function addAvoid() {
    const v = avoidInput.trim()
    if (!v) return
    if (prefs.avoid.includes(v)) {
      showToast('已经在列表里了')
      return
    }
    patchPrefs({ avoid: [...prefs.avoid, v] })
    setAvoidInput('')
  }

  function resetAll() {
    patchPrefs({ ...DEFAULT_PREFS })
    useSession.getState().clear()
    void clearAll()
    setSheet(null)
    setTab('home')
    showToast('已重置演示数据')
  }

  function nameOf(id: string): string {
    return dishNames.get(id) ?? findBuiltin(id, prefs.dishOverrides)?.name ?? id
  }

  function setNoveltyFromEvent(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    patchPrefs({ novelty: v })
  }

  return (
    <div className="profile-screen">
      <div className="list-head">
        <h1 className="list-title">我的</h1>
      </div>
      <div className="group">
        <div className="row-line glass" onClick={() => setSheet('liked')}>
          <span className="row-l"><Icon name="heart" size={19} />我的喜欢</span>
          <span className="row-v">{prefs.likes.length} 道</span>
        </div>
        <div className="row-line glass" onClick={() => setSheet('disliked')}>
          <span className="row-l"><Icon name="thumbDown" size={19} />我的不喜欢</span>
          <span className="row-v">{prefs.dislikes.length} 道</span>
        </div>
        <div className="row-line glass" onClick={() => setSheet('avoid')}>
          <span className="row-l"><Icon name="x" size={19} />不吃的食材</span>
          <span className="row-v">{prefs.avoid.length ? prefs.avoid.join('、') : '无'}</span>
        </div>
        <div className="row-line glass" onClick={() => setSheet('taste')}>
          <span className="row-l"><Icon name="leaf" size={19} />口味偏好</span>
          <span className="row-v">{prefs.taste}</span>
        </div>
        <div className="row-line glass" onClick={() => setSheet('combos')}>
          <span className="row-l"><Icon name="book" size={19} />我的搭配</span>
          <span className="row-v">{combos.length ? `${combos.length} 套` : '无'}</span>
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">推荐偏好</div>
        <div className="glass novelty-card">
          <div className="novelty-labels">
            <span>熟悉菜</span>
            <span>新菜</span>
          </div>
          <div
            className="slider"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setNoveltyFromEvent(e)
            }}
            onPointerMove={(e) => {
              if (e.buttons & 1) setNoveltyFromEvent(e)
            }}
          >
            <i style={{ left: `${Math.round(prefs.novelty * 100)}%` }} />
          </div>
          <div className="slider-labels">
            <span>更想吃熟悉的</span>
            <span>想试试新的</span>
          </div>
        </div>
      </div>

      <div className="note">
        这些偏好会参与后续推荐排序：喜欢/不喜欢影响长期权重，不吃的食材会被过滤。
      </div>
      <div className="reset-wrap">
        <button className="btn btn-ghost" onClick={resetAll}>重置演示数据</button>
      </div>

      {/* 偏好浮层 */}
      <div className={`scrim${sheet ? ' show' : ''}`} onClick={() => setSheet(null)} />
      <div className={`sheet${sheet ? ' show' : ''}`}>
        <div className="grab" />
        {sheet === 'liked' && (
          <>
            <h3>我的喜欢</h3>
            <p className="sheet-sub">{prefs.likes.length ? `共 ${prefs.likes.length} 道 · 点 × 移除` : ''}</p>
            {prefs.likes.length === 0 && <div className="list-note">还没有喜欢的菜，去卡片上点 ♡ 标记</div>}
            {prefs.likes.map((id) => (
              <div key={id} className="sheet-item">
                <span className="nm">{nameOf(id)}</span>
                <span className="sheet-x" onClick={() => toggleLike(id)}><Icon name="x" size={15} /></span>
              </div>
            ))}
          </>
        )}
        {sheet === 'disliked' && (
          <>
            <h3>我的不喜欢</h3>
            <p className="sheet-sub">{prefs.dislikes.length ? `共 ${prefs.dislikes.length} 道 · 点 × 移除` : ''}</p>
            {prefs.dislikes.length === 0 && <div className="list-note">还没有不喜欢的菜</div>}
            {prefs.dislikes.map((id) => (
              <div key={id} className="sheet-item">
                <span className="nm">{nameOf(id)}</span>
                <span className="sheet-x" onClick={() => toggleDislike(id)}><Icon name="x" size={15} /></span>
              </div>
            ))}
          </>
        )}
        {sheet === 'avoid' && (
          <>
            <h3>不吃的食材</h3>
            <p className="sheet-sub">推荐时会过滤这些食材</p>
            <div className="avoid-chips">
              {prefs.avoid.map((a) => (
                <span key={a} className="avoid-chip" onClick={() => patchPrefs({ avoid: prefs.avoid.filter((x) => x !== a) })}>
                  {a}
                  <span className="x">×</span>
                </span>
              ))}
              {prefs.avoid.length === 0 && <span className="list-note" style={{ padding: 10 }}>还没有设置</span>}
            </div>
            <div className="add-row">
              <input
                className="field"
                value={avoidInput}
                maxLength={6}
                placeholder="添加食材，如：香菜"
                onChange={(e) => setAvoidInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addAvoid()
                }}
              />
              <button className="btn btn-primary add-row-btn" onClick={addAvoid}>添加</button>
            </div>
          </>
        )}
        {sheet === 'taste' && (
          <>
            <h3>口味偏好</h3>
            <p className="sheet-sub">选择你常吃的口味</p>
            <div className="chips">
              {TASTE_OPTIONS.map((t) => (
                <span
                  key={t}
                  className={`chip${prefs.taste === t ? ' on' : ''}`}
                  onClick={() => patchPrefs({ taste: t })}
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
        {sheet === 'combos' && (
          <>
            <h3>我的搭配</h3>
            <p className="sheet-sub">{combos.length ? `共 ${combos.length} 套` : ''}</p>
            {combos.length === 0 && <div className="list-note">还没有保存的搭配，去确认页点「保存到我的搭配」</div>}
            {combos.map((cb) => (
              <div key={cb.id} className="combo-card">
                <div className="combo-head">
                  <span className="combo-title">{`${cb.spec.people}人 · ${cb.spec.meat}荤${cb.spec.veg}素${cb.spec.soup}汤`}</span>
                  <span className="combo-date">{formatDate(cb.createdAt)}</span>
                  <span className="combo-del" onClick={() => void removeCombo(cb.id)}>
                    <Icon name="x" size={15} />
                  </span>
                </div>
                {cb.dishes.map((d) => (
                  <div key={d.id} className="combo-item">
                    <ComboThumb custom={customDishes.find((x) => x.id === d.id)} category={d.category} />
                    <span className="combo-nm">{d.name}</span>
                    <span className="combo-tm">{d.time}分钟</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function ComboThumb({ custom, category }: { custom: CustomDish | undefined; category: 'meat' | 'veg' | 'soup' }) {
  const [failed, setFailed] = useState(false)
  if (failed || !custom?.image) {
    return (
      <span className="ic">
        <Icon name={CAT_ICON[category]} size={18} />
      </span>
    )
  }
  return (
    <span className="ic">
      <img
        src={custom.image}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  )
}
