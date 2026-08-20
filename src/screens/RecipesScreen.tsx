import { useMemo, useState } from 'react'
import { CAT_ICON, CAT_NAME } from '../components/categories'
import { Icon, type IconName } from '../components/Icon'
import { SheetOverlay } from '../components/Sheet'
import {
  allEntries,
  difficultyLabel,
  filterEntries,
  RECIPE_FILTERS,
  type RecipeEntry,
  type RecipeFilterKey,
} from '../engine/library'
import { useApp } from '../store/app'
import { useLibrary } from '../store/library'
import type { Category } from '../types'

export function RecipesScreen() {
  const prefs = useApp((s) => s.prefs)
  const patchPrefs = useApp((s) => s.patchPrefs)
  const setScreen = useApp((s) => s.setScreen)
  const setEditing = useApp((s) => s.setEditing)
  const customDishes = useLibrary((s) => s.customDishes)
  const recent = useLibrary((s) => s.recent)
  const removeDish = useLibrary((s) => s.removeDish)

  const [filter, setFilter] = useState<RecipeFilterKey>('all')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [detail, setDetail] = useState<RecipeEntry | null>(null)

  const entries = useMemo(
    () => allEntries(prefs.dishOverrides, customDishes),
    [prefs.dishOverrides, customDishes],
  )
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return filterEntries(
      entries,
      filter,
      prefs.likes,
      prefs.dislikes,
      recent.map((r) => r.id),
    )
      .filter((e) => category === 'all' || e.category === category)
      .filter(
        (e) =>
          !q ||
          e.dish.name.toLowerCase().includes(q) ||
          e.dish.tags.some((t) => t.toLowerCase().includes(q)),
      )
  }, [entries, filter, prefs.likes, prefs.dislikes, recent, category, query])

  function toggleLike(id: string) {
    const likes = prefs.likes.includes(id)
      ? prefs.likes.filter((x) => x !== id)
      : [...prefs.likes, id]
    patchPrefs({ likes, dislikes: prefs.dislikes.filter((x) => x !== id) })
  }

  function toggleDislike(id: string) {
    const dislikes = prefs.dislikes.includes(id)
      ? prefs.dislikes.filter((x) => x !== id)
      : [...prefs.dislikes, id]
    patchPrefs({ dislikes, likes: prefs.likes.filter((x) => x !== id) })
  }

  function editDish(e: RecipeEntry) {
    setEditing({ id: e.dish.id, custom: !!e.dish.custom })
    setDetail(null)
    setScreen('addrecipe')
  }

  function deleteDish(e: RecipeEntry) {
    if (!e.dish.custom) return
    void removeDish(e.dish.id)
    // 同时清理喜欢/不喜欢里的引用
    patchPrefs({
      likes: prefs.likes.filter((x) => x !== e.dish.id),
      dislikes: prefs.dislikes.filter((x) => x !== e.dish.id),
    })
    setDetail(null)
  }

  return (
    <div className="recipes-screen">
      <div className="list-head row">
        <h1 className="list-title">菜谱</h1>
        <div className="head-actions">
          <button
            className={`btn btn-ghost head-btn${searchOpen ? ' on' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon />
          </button>
          <button className="btn btn-primary btn-add" onClick={() => { setEditing(null); setScreen('addrecipe') }}>
            <Icon name="plus" size={18} /> 添加
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="search-bar">
          <SearchIcon />
          <input
            className="field"
            autoFocus
            placeholder="搜索菜名或标签，如：辣、牛肉…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      <div className="seg2">
        {RECIPE_FILTERS.map((f) => (
          <span
            key={f.key}
            className={`chip${filter === f.key ? ' on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </span>
        ))}
      </div>
      <div className="cat-row">
        {(
          [
            ['all', '全部', null],
            ['meat', '荤菜', 'meat' as const],
            ['veg', '素菜', 'leaf' as const],
            ['soup', '汤', 'soup' as const],
          ] as [string, string, IconName | null][]
        ).map(([key, label, icn]) => (
          <span
            key={key}
            className={`cat-tab${category === key ? ' on' : ''}`}
            onClick={() => setCategory(key as 'all' | Category)}
          >
            {icn && <Icon name={icn} size={15} />}
            {label}
          </span>
        ))}
      </div>
      <div className="recipe-list">
        {shown.length === 0 && (
          <div className="list-note">
            {query.trim()
              ? '没有找到匹配的菜'
              : filter === 'liked'
                ? '还没有喜欢的菜，去卡片上点 ♡ 标记吧'
                : filter === 'disliked'
                  ? '还没有不喜欢的菜'
                  : filter === 'custom'
                    ? '还没有自定义菜谱，点右上角「添加」'
                    : filter === 'recent'
                      ? '还没选过菜，先去「吃什么」滑几道'
                      : '暂无菜谱'}
          </div>
        )}
        {shown.map((e) => (
          <div key={e.dish.id} className="dish-row" onClick={() => setDetail(e)}>
            <Thumb dish={e.dish} />
            <div className="dish-info">
              <div className="dish-n">
                {e.dish.name}
                <span className="badge-diff">{difficultyLabel(e.dish.difficulty)}</span>
                {e.dish.custom && <span className="badge-custom">我的</span>}
              </div>
              <div className="dish-m">
                {e.dish.tags.join(' · ')} · {e.dish.time}分钟
              </div>
            </div>
            <span className="dish-chev">›</span>
          </div>
        ))}
      </div>

      {/* 详情浮层（Portal 到底层） */}
      <SheetOverlay open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="grab" />
            <div className="dish-head">
              <Thumb dish={detail.dish} big />
              <div className="dish-head-info">
                <h4>{detail.dish.name}</h4>
                <div className="dish-head-meta">
                  {CAT_NAME[detail.category]} · {detail.dish.time}分钟 · {difficultyLabel(detail.dish.difficulty)}
                  {detail.dish.custom && <span className="badge-custom">我的菜谱</span>}
                </div>
              </div>
            </div>
            <div className="dish-tags">
              {detail.dish.tags.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
            <div className="dish-actions">
              <button
                className={`btn ${prefs.likes.includes(detail.dish.id) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleLike(detail.dish.id)}
              >
                <Icon name="heart" size={18} /> {prefs.likes.includes(detail.dish.id) ? '已喜欢' : '喜欢'}
              </button>
              <button
                className={`btn ${prefs.dislikes.includes(detail.dish.id) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleDislike(detail.dish.id)}
              >
                <Icon name="thumbDown" size={18} /> {prefs.dislikes.includes(detail.dish.id) ? '已不喜欢' : '不喜欢'}
              </button>
            </div>
            <div className="dish-actions">
              <button className="btn btn-ghost" onClick={() => editDish(detail)}>
                <Icon name="plus" size={18} /> 编辑
              </button>
              {detail.dish.custom && (
                <button className="btn btn-ghost" style={{ color: '#c0392b' }} onClick={() => deleteDish(detail)}>
                  <Icon name="x" size={18} /> 删除
                </button>
              )}
            </div>
          </>
        )}
      </SheetOverlay>
    </div>
  )
}

function Thumb({ dish, big }: { dish: { image: string; category: 'meat' | 'veg' | 'soup'; name: string }; big?: boolean }) {
  const [failed, setFailed] = useState(false)
  const cls = big ? 'ph' : 'thumb'
  if (failed || !dish.image) {
    return (
      <span className={cls}>
        <Icon name={CAT_ICON[dish.category]} size={big ? 38 : 24} />
      </span>
    )
  }
  return (
    <span className={cls}>
      <img
        src={dish.image}
        alt={dish.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  )
}

function SearchIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
