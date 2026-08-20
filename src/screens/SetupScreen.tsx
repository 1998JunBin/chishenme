import { Icon } from '../components/Icon'
import { useApp } from '../store/app'
import { DEFAULT_TAG_OPTIONS } from '../types'

const LIMITS: Record<'meat' | 'veg' | 'soup' | 'people', [number, number]> = {
  meat: [0, 6],
  veg: [0, 6],
  soup: [0, 3],
  people: [1, 12],
}

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

  const tagOptions = [...new Set([...DEFAULT_TAG_OPTIONS, ...prefs.customTags])]

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
        <div className="set-label">推荐偏好（可多选）</div>
        <div className="chips">
          {tagOptions.map((tag) => (
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
