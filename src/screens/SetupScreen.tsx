import { useMemo } from 'react'
import { Icon } from '../components/Icon'
import { DISHES } from '../data/dishes'
import { useApp } from '../store/app'
import type { IconName } from '../components/Icon'

const LIMITS: Record<'meat' | 'veg' | 'soup' | 'people', [number, number]> = {
  meat: [0, 6],
  veg: [0, 6],
  soup: [0, 3],
  people: [1, 12],
}

/** 推荐偏好标签：按组展示（对应 PRD 的 烹饪效率 / 口味 / 其他） */
const TAG_GROUPS: { label: string; icon: IconName; tags: string[] }[] = [
  { label: '烹饪效率', icon: 'plus', tags: ['快手', '家常'] },
  { label: '口味', icon: 'leaf', tags: ['辣', '酸', '酸甜', '甜', '咸鲜', '清淡'] },
  { label: '其他', icon: 'bowl', tags: ['下饭', '高蛋白', '适合多人'] },
]

export function SetupScreen() {
  const prefs = useApp((s) => s.prefs)
  const patchPrefs = useApp((s) => s.patchPrefs)
  const setScreen = useApp((s) => s.setScreen)

  const bump = (key: 'meat' | 'veg' | 'soup' | 'people', delta: number) => {
    const [lo, hi] = LIMITS[key]
    patchPrefs({ spec: { ...prefs.spec, [key]: Math.max(lo, Math.min(hi, prefs.spec[key] + delta)) } })
  }

  const toggleTag = (tag: string) => {
    const tags = prefs.tags.includes(tag)
      ? prefs.tags.filter((t) => t !== tag)
      : [...prefs.tags, tag]
    patchPrefs({ tags })
  }

  /* 收集菜谱里所有用到的标签，未分组的放进「更多」，自定义标签单独一组 */
  const tagGroups = useMemo(() => {
    const known = new Set(TAG_GROUPS.flatMap((g) => g.tags))
    const extra = new Set<string>()
    for (const d of DISHES) {
      for (const t of d.tags) if (!known.has(t)) extra.add(t)
    }
    const groups = [...TAG_GROUPS]
    if (extra.size) groups.push({ label: '更多', icon: 'plus' as IconName, tags: [...extra] })
    if (prefs.customTags.length) {
      groups.push({ label: '自定义', icon: 'plus' as IconName, tags: [...prefs.customTags] })
    }
    return groups
  }, [prefs.customTags])

  return (
    <div className="setup-inner">
      <div className="topbar">
        <div className="back glass" onClick={() => setScreen('tab')}>
          <Icon name="chevronLeft" size={24} />
        </div>
        <div className="topbar-title">设置这一餐</div>
      </div>
      <div className="set-group">
        <div className="set-label">今天吃几道菜？</div>
        <Stepper icon="meat" label="荤菜" value={prefs.spec.meat} unit="道" onMinus={() => bump('meat', -1)} onPlus={() => bump('meat', 1)} />
        <Stepper icon="leaf" label="素菜" value={prefs.spec.veg} unit="道" onMinus={() => bump('veg', -1)} onPlus={() => bump('veg', 1)} />
        <Stepper icon="soup" label="汤" value={prefs.spec.soup} unit="道" onMinus={() => bump('soup', -1)} onPlus={() => bump('soup', 1)} />
      </div>
      <div className="set-group">
        <div className="set-label">用餐人数</div>
        <Stepper icon="users" label="几个人吃" value={prefs.spec.people} unit="人" onMinus={() => bump('people', -1)} onPlus={() => bump('people', 1)} />
      </div>
      <div className="set-group">
        <div className="set-label">推荐偏好（可多选，将影响推荐排序）</div>
        {tagGroups.map((g) => (
          <div key={g.label} className="tag-group">
            <div className="tag-group-label">{g.label}</div>
            <div className="chips">
              {g.tags.map((tag) => (
                <span
                  key={tag}
                  className={`chip${prefs.tags.includes(tag) ? ' on' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="setup-cta">
        <button className="btn btn-primary" onClick={() => setScreen('swipe')}>
          开始推荐
        </button>
      </div>
    </div>
  )
}

interface StepperProps {
  icon: 'meat' | 'leaf' | 'soup' | 'users'
  label: string
  value: number
  unit: string
  onMinus: () => void
  onPlus: () => void
}

function Stepper({ icon, label, value, unit, onMinus, onPlus }: StepperProps) {
  return (
    <div className="stepper glass">
      <span className="stepper-lab">
        <Icon name={icon} size={20} />
        {label}
      </span>
      <div className="stepper-ctrl">
        <span className="stepper-btn" onClick={onMinus}>−</span>
        <span className="stepper-val">{value}</span>
        <span className="stepper-unit">{unit}</span>
        <span className="stepper-btn" onClick={onPlus}>+</span>
      </div>
    </div>
  )
}
