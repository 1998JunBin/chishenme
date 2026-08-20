import { useEffect, useMemo, useRef, useState } from 'react'
import { DishImage } from '../components/DishImage'
import { CAT_ICON, CAT_NAME } from '../components/categories'
import { Icon } from '../components/Icon'
import { SheetOverlay } from '../components/Sheet'
import { recordRecent } from '../db/db'
import { buildSessionRanked } from '../engine/session'
import { useApp } from '../store/app'
import { useLibrary } from '../store/library'
import { CATEGORY_ORDER, useSession } from '../store/session'
import type { Category, Dish } from '../types'

type FlyKind = 'select' | 'skip' | 'undo'

export function SwipeScreen() {
  const session = useSession()
  const prefs = useApp((s) => s.prefs)
  const patchPrefs = useApp((s) => s.patchPrefs)
  const setScreen = useApp((s) => s.setScreen)

  const [seq, setSeq] = useState(0)
  const [popIn, setPopIn] = useState(false)
  const [flipCat, setFlipCat] = useState<Category | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [stamp, setStamp] = useState<{ kind: 'skip' | 'back'; opacity: number } | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ sx: 0, sy: 0, dx: 0, dy: 0, active: false })
  const pendingRef = useRef(false)

  /* 会话初始化：按偏好生成各类别候选排名 */
  useEffect(() => {
    if (!session.started) {
      void buildSessionRanked(prefs)
        .then(({ spec, ranked }) => session.start(spec, ranked))
        .catch(() => {
          /* 本地存储不可用时静默降级，页面保持加载态 */
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = session.current()
  const active = session.active
  const ranked = session.ranked[active]
  const next1 = ranked[(session.pointer[active] + 1) % Math.max(1, ranked.length)]
  const next2 = ranked[(session.pointer[active] + 2) % Math.max(1, ranked.length)]

  const liked = current ? prefs.likes.includes(current.id) : false
  const disliked = current ? prefs.dislikes.includes(current.id) : false

  function markHint() {
    if (!prefs.hintSeen) patchPrefs({ hintSeen: true })
  }

  /** 卡片本体直接飞出，飞出结束后再更新状态（与验收原型一致，避免“重复”感） */
  function flyCard(kind: FlyKind, after: () => void) {
    if (pendingRef.current) return
    pendingRef.current = true
    const el = cardRef.current
    if (!el) {
      after()
      pendingRef.current = false
      return
    }
    if (kind === 'select') {
      el.style.transition = 'transform .45s cubic-bezier(.4,.05,.5,1), opacity .45s'
      el.style.transform = 'translateY(-130%) rotate(-6deg) scale(.92)'
      el.style.opacity = '0'
    } else if (kind === 'skip') {
      el.style.transition = 'transform .4s cubic-bezier(.5,.1,.7,.4), opacity .4s'
      el.style.transform = 'translateX(-150%) rotate(-18deg)'
      el.style.opacity = '0'
    } else {
      el.style.transition = 'transform .4s cubic-bezier(.5,.1,.7,.4), opacity .4s'
      el.style.transform = 'translateX(150%) rotate(18deg)'
      el.style.opacity = '0'
    }
    window.setTimeout(() => {
      after()
      pendingRef.current = false
    }, kind === 'select' ? 460 : 410)
  }

  function doSelect() {
    if (!current) return
    const cat = active
    const dishId = current.id
    markHint()
    flyCard('select', () => {
      session.select()
      setSeq((n) => n + 1)
      setFlipCat(cat)
      window.setTimeout(() => setFlipCat(null), 600)
      void recordRecent(dishId).catch(() => {})
      useLibrary.getState().noteRecent(dishId)
      if (useSession.getState().allDone()) {
        window.setTimeout(() => setScreen('done'), 320)
      }
    })
  }

  function doSkip() {
    if (!current) return
    markHint()
    flyCard('skip', () => {
      session.skip()
      setSeq((n) => n + 1)
    })
  }

  function doUndo() {
    if (!current || !session.history[active].length) return
    markHint()
    flyCard('undo', () => {
      session.undo()
      setSeq((n) => n + 1)
    })
  }

  function toggleLike() {
    if (!current) return
    const likes = prefs.likes.includes(current.id)
      ? prefs.likes.filter((x) => x !== current.id)
      : [...prefs.likes, current.id]
    patchPrefs({ likes, dislikes: prefs.dislikes.filter((x) => x !== current.id) })
  }

  function toggleDislike() {
    if (!current) return
    const dislikes = prefs.dislikes.includes(current.id)
      ? prefs.dislikes.filter((x) => x !== current.id)
      : [...prefs.dislikes, current.id]
    patchPrefs({ dislikes, likes: prefs.likes.filter((x) => x !== current.id) })
  }

  /* ---------- 手势 ---------- */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, active: true }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d.active) return
    d.dx = e.clientX - d.sx
    d.dy = e.clientY - d.sy
    const el = cardRef.current
    if (el) {
      const rot = Math.max(-14, Math.min(14, d.dx / 16))
      const sc = Math.max(0.96, 1 - Math.min(60, Math.abs(d.dx) + Math.abs(d.dy)) / 2200)
      el.style.transform = `translate(${d.dx}px, ${d.dy}px) rotate(${rot}deg) scale(${sc})`
    }
    if (d.dx < -8) setStamp({ kind: 'skip', opacity: Math.min(1, -d.dx / 110) })
    else if (d.dx > 8) setStamp({ kind: 'back', opacity: Math.min(1, d.dx / 110) })
    else setStamp(null)
  }
  function onPointerUp() {
    const d = drag.current
    if (!d.active) return
    d.active = false
    setStamp(null)
    const el = cardRef.current
    const T = 90
    if (d.dy < -T && Math.abs(d.dy) > Math.abs(d.dx)) doSelect()
    else if (d.dx < -T && Math.abs(d.dx) > Math.abs(d.dy)) doSkip()
    else if (d.dx > T && Math.abs(d.dx) > Math.abs(d.dy)) doUndo()
    else if (el) {
      el.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)'
      el.style.transform = ''
      window.setTimeout(() => {
        el.style.transition = ''
      }, 360)
    }
  }

  if (!session.started || !current) {
    return (
      <div className="placeholder-screen">
        <div className="placeholder-body">
          <Icon name="bowl" size={56} />
          <h2>正在准备菜谱…</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="swipe-screen">
      <div className="swipe-top">
        <div className="swipe-nav">
          <div className="back glass" onClick={() => setScreen('tab')}>
            <Icon name="chevronLeft" size={22} />
          </div>
          <div className="swipe-ttl">今晚吃什么？</div>
          <div className="swipe-dots">⋯</div>
        </div>
        <div className="statusbar3">
          {CATEGORY_ORDER.map((c) => {
            const sel = session.selected[c].length
            const total = session.spec[c]
            const done = sel >= total
            return (
              <div
                key={c}
                className={`sseg${c === active ? ' cur' : ''}${done ? ' done' : ''}`}
                onClick={() => {
                  if (c !== active && !done) {
                    session.switchCat(c)
                    setSeq((n) => n + 1)
                    setPopIn(true)
                    window.setTimeout(() => setPopIn(false), 400)
                  }
                }}
              >
                <div className="sseg-n">
                  <Icon name={CAT_ICON[c]} size={14} /> {CAT_NAME[c]}
                </div>
                <div className={`sseg-c${flipCat === c ? ' flip' : ''}`}>
                  {done ? `✓ ${sel}/${total}` : `${sel} / ${total}`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="swipe-stage">
        <div className="deck">
          {next2 && (
            <div key={`c3-${next2.id}`} className="card peek peek-in" id="card3">
              <CardView dish={next2} category={active} liked={prefs.likes.includes(next2.id)} disliked={prefs.dislikes.includes(next2.id)} />
            </div>
          )}
          {next1 && (
            <div key={`c2-${next1.id}`} className="card peek" id="card2">
              <CardView dish={next1} category={active} liked={prefs.likes.includes(next1.id)} disliked={prefs.dislikes.includes(next1.id)} />
            </div>
          )}
          <div
            key={`front-${seq}`}
            ref={cardRef}
            className={`card${popIn ? ' pop' : ''}`}
            id="card"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <CardView
              dish={current}
              category={active}
              liked={liked}
              disliked={disliked}
              interactive
              onLike={toggleLike}
              onDislike={toggleDislike}
            />
            {stamp?.kind === 'skip' && (
              <div className="stamp stamp-skip" style={{ opacity: stamp.opacity }}>✕ 跳过</div>
            )}
            {stamp?.kind === 'back' && (
              <div className="stamp stamp-back" style={{ opacity: stamp.opacity }}>↩ 返回</div>
            )}
          </div>

          {!prefs.hintSeen && (
            <div className="hint">
              <div className="hint-up">↑</div>
              <div className="hint-txt">上滑选 · 左滑跳过 · 右滑返回上一道</div>
            </div>
          )}
        </div>
      </div>

      <div className="swipe-actions">
        <div className="swipe-btns">
          <div className="side-btn" onClick={doUndo}>
            <Icon name="chevronLeft" size={17} /> 上一道
          </div>
          <button className="btn btn-primary select-main" onClick={doSelect}>
            就它了
          </button>
          <div className="side-btn" onClick={doSkip}>
            下一道 <Icon name="chevronRight" size={17} />
          </div>
        </div>
        <div className="picked-pill glass" onClick={() => setSheetOpen(true)}>
          <Icon name="bowl" size={19} /> 本餐已选 <span className="badge">{session.countPicked()} 道</span>
        </div>
      </div>

      <SelectedSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

/* ---------- 卡片内容 ---------- */
interface CardViewProps {
  dish: Dish
  category: Category
  liked: boolean
  disliked: boolean
  interactive?: boolean
  onLike?: () => void
  onDislike?: () => void
}

function CardView({ dish, category, liked, disliked, interactive, onLike, onDislike }: CardViewProps) {
  return (
    <>
      <div className="card-img">
        <span className="fb">
          <Icon name={CAT_ICON[category]} size={64} />
        </span>
        <DishImage dish={dish} className="card-img-img" iconSize={64} />
        <div className="card-shade" />
        <div className="card-acts">
          <div
            className={`mini${liked ? ' liked' : ''}`}
            onClick={interactive ? onLike : undefined}
          >
            <Icon name="heart" size={21} />
          </div>
          <div
            className={`mini${disliked ? ' disliked' : ''}`}
            onClick={interactive ? onDislike : undefined}
          >
            <Icon name="thumbDown" size={21} />
          </div>
        </div>
        <div className="reason">
          <span className="dot" />
          <span>{dish.reason}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="card-meta">
          {CAT_NAME[category]} · {dish.time}分钟
        </div>
        <div className="card-name">{dish.name}</div>
        <div className="card-tags">
          {dish.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

/* ---------- 已选浮层 ---------- */
function SelectedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useSession()
  const dishById = useMemo(() => {
    const m = new Map<string, Dish>()
    for (const c of CATEGORY_ORDER) {
      for (const d of session.ranked[c]) m.set(d.id, d)
    }
    return m
  }, [session.ranked])

  return (
    <SheetOverlay open={open} onClose={onClose}>
      <div className="grab" />
      <h3>本餐已选菜单</h3>
      <p className="sheet-sub">已选 {session.countPicked()} 道</p>
        <div>
          {CATEGORY_ORDER.map((c) =>
            session.selected[c].map((id) => {
              const dish = dishById.get(id)
              if (!dish) return null
              return (
                <div key={id} className="sheet-item">
                  <DishImageThumb dish={dish} />
                  <div className="sheet-nm">{dish.name}</div>
                  <span className="sheet-ct">{CAT_NAME[c]}</span>
                  <span className="sheet-x" onClick={() => session.remove(c, id)}>
                    <Icon name="x" size={15} />
                  </span>
                </div>
              )
            }),
          )}
          {session.countPicked() === 0 && <div className="list-note">还没有选菜，去滑一滑</div>}
        </div>
        <div className="remain">
          {CATEGORY_ORDER.map((c) => {
            const sel = session.selected[c].length
            const total = session.spec[c]
            return (
              <div key={c} className="remain-r">
                <span>{CAT_NAME[c]}</span>
                {sel >= total ? <span className="ok">已完成</span> : <b>还差 {total - sel} 道</b>}
              </div>
            )
          })}
        </div>
        <div className="sheet-cta">
          <button className="btn btn-primary" onClick={onClose}>
            继续选菜
          </button>
        </div>
    </SheetOverlay>
  )
}

function DishImageThumb({ dish }: { dish: Dish }) {
  const [failed, setFailed] = useState(false)
  if (failed || !dish.image) {
    return (
      <span className="ic">
        <Icon name={CAT_ICON[dish.category]} size={22} />
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
