import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '../components/Icon'
import { newId } from '../db/db'
import { allEntries, findBuiltin } from '../engine/library'
import { useApp } from '../store/app'
import { useLibrary } from '../store/library'
import { DEFAULT_TAG_OPTIONS, type Category, type Difficulty } from '../types'

const CAT_OPTIONS: { key: Category; label: string }[] = [
  { key: 'meat', label: '荤菜' },
  { key: 'veg', label: '素菜' },
  { key: 'soup', label: '汤' },
]
const DIFF_OPTIONS: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '普通' },
  { key: 'hard', label: '困难' },
]

export function AddRecipeScreen() {
  const editing = useApp((s) => s.editing)
  const setEditing = useApp((s) => s.setEditing)
  const prefs = useApp((s) => s.prefs)
  const patchPrefs = useApp((s) => s.patchPrefs)
  const setTab = useApp((s) => s.setTab)
  const customDishes = useLibrary((s) => s.customDishes)
  const addDish = useLibrary((s) => s.addDish)
  const updateDish = useLibrary((s) => s.updateDish)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('meat')
  const [time, setTime] = useState(20)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [tags, setTags] = useState<string[]>(['家常'])
  const [image, setImage] = useState('')
  const [imageDirty, setImageDirty] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* 编辑模式：预填当前菜谱 */
  useEffect(() => {
    if (!editing) {
      setName('')
      setCategory('meat')
      setTime(20)
      setDifficulty('medium')
      setTags(['家常'])
      setImage('')
      setImageDirty(false)
      return
    }
    const d = editing.custom
      ? customDishes.find((x) => x.id === editing.id)
      : findBuiltin(editing.id, prefs.dishOverrides)
    if (d) {
      setName(d.name)
      setCategory(d.category)
      setTime(d.time)
      setDifficulty(d.difficulty)
      setTags([...d.tags])
      setImage(d.image || '')
      setImageDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const tagOptions = useMemo(
    () => [...new Set([...DEFAULT_TAG_OPTIONS, ...prefs.customTags, ...tags])],
    [prefs.customTags, tags],
  )

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  function onImageFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 3 * 1024 * 1024) {
      showToast('图片超过 3MB，请压缩后再上传')
      return
    }
    const r = new FileReader()
    r.onload = () => {
      setImage(String(r.result))
      setImageDirty(true)
    }
    r.readAsDataURL(f)
  }

  function addTag() {
    const v = tagInput.trim()
    if (!v) return
    if (!tags.includes(v)) setTags([...tags, v])
    if (!prefs.customTags.includes(v) && !(DEFAULT_TAG_OPTIONS as readonly string[]).includes(v)) {
      patchPrefs({ customTags: [...prefs.customTags, v] })
    }
    setTagInput('')
  }

  function save() {
    const n = name.trim()
    if (!n) {
      showToast('请填写菜名')
      return
    }
    const exists = allEntries(prefs.dishOverrides, customDishes).some(
      (e) => e.dish.name === n && (!editing || e.dish.id !== editing.id),
    )
    if (exists) {
      showToast('已经有同名菜谱了')
      return
    }
    if (editing) {
      if (editing.custom) {
        const cur = customDishes.find((x) => x.id === editing.id)
        if (cur) {
          void updateDish({
            ...cur,
            name: n,
            category,
            time,
            difficulty,
            tags,
            image: imageDirty ? image : cur.image,
          })
        }
      } else {
        patchPrefs({
          dishOverrides: {
            ...(prefs.dishOverrides ?? {}),
            [editing.id]: {
              name: n,
              category,
              time,
              difficulty,
              tags,
              ...(imageDirty ? { image } : {}),
            },
          },
        })
      }
    } else {
      void addDish({
        id: newId('dish'),
        name: n,
        category,
        time,
        difficulty,
        tags,
        image,
        createdAt: Date.now(),
      })
    }
    setEditing(null)
    setTab('recipes')
  }

  return (
    <div className="add-screen">
      <div className="topbar">
        <div
          className="back glass"
          onClick={() => {
            setEditing(null)
            setTab('recipes')
          }}
        >
          <Icon name="chevronLeft" size={24} />
        </div>
        <div className="topbar-title">{editing ? '编辑菜谱' : '添加我的菜谱'}</div>
      </div>

      <div className="set-group">
        <div className="set-label">菜名</div>
        <input
          className="field"
          value={name}
          maxLength={12}
          placeholder="例如：家常炒鸡"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="set-group">
        <div className="set-label">菜谱图片</div>
        <div className="img-row">
          <div className="img-preview">
            {image ? (
              <img src={image} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon name="bowl" size={30} />
            )}
          </div>
          <div className="img-side">
            <button className="btn btn-ghost img-btn" onClick={() => fileRef.current?.click()}>
              <Icon name="plus" size={17} /> 上传图片
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
            <div className="img-hint">不传则用分类图标</div>
          </div>
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">分类</div>
        <div className="seg3">
          {CAT_OPTIONS.map((o) => (
            <div key={o.key} className={`opt${category === o.key ? ' on' : ''}`} onClick={() => setCategory(o.key)}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">制作时间</div>
        <div className="stepper glass">
          <span className="stepper-lab">用时</span>
          <div className="stepper-ctrl">
            <span className="stepper-btn" onClick={() => setTime(Math.max(5, time - 5))}>−</span>
            <span className="stepper-val">{time}</span>
            <span className="stepper-unit">分钟</span>
            <span className="stepper-btn" onClick={() => setTime(Math.min(180, time + 5))}>+</span>
          </div>
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">难度</div>
        <div className="seg3">
          {DIFF_OPTIONS.map((o) => (
            <div key={o.key} className={`opt${difficulty === o.key ? ' on' : ''}`} onClick={() => setDifficulty(o.key)}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">标签（可多选）</div>
        <div className="chips">
          {tagOptions.map((t) => (
            <span
              key={t}
              className={`chip${tags.includes(t) ? ' on' : ''}`}
              onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="add-row">
          <input
            className="field"
            value={tagInput}
            maxLength={8}
            placeholder="自定义标签，如：妈妈的味道"
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag()
            }}
          />
          <button className="btn btn-primary add-row-btn" onClick={addTag}>
            <Icon name="plus" size={17} />
          </button>
        </div>
      </div>

      <div className="setup-cta">
        <button className="btn btn-primary" onClick={save}>
          保存菜谱
        </button>
      </div>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
